const quotationService = require('../services/quotation.service');
const quotationRepository = require('../repositories/quotation.repository');
const inquiryService = require('../services/inquiry.service');
const db = require('../config/db');
const crypto = require('crypto');
const { logAction } = require('../services/audit.service');
const { emitCompanyRoleNotification, emitUserNotification, broadcastPipelineUpdate } = require('../services/socket.service');

class QuotationController {
  /** POST /quotations — Create a quotation (internal sales rep) */
  async create(req, res) {
    const { customerId, customerName, customerEmail, lines, inquiryId } = req.body;
    const companyId = req.companyId || req.user?.companyId || 'c1';
    const salesRepId = req.user?.userId || req.user?.id || 'u4';
    const result = await quotationService.createQuotation(
      companyId,
      salesRepId,
      { customerId, customerName, customerEmail },
      lines,
      inquiryId || null
    );

    // If linked to an inquiry, mark it in_progress
    if (inquiryId) {
      await inquiryService.markInProgress(inquiryId);
    }

    return res.status(201).json({ success: true, ...result });
  }

  /** POST /quotations/customer-request — Marketplace inquiry and quotation creation */
  async createCustomerRequest(req, res) {
    const { productId, quantity, customerEmail, customerName } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);

    // Fetch Product details
    const prodRes = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = prodRes.rows[0];
    const companyId = product.company_id || 'c1';

    // 1. Determine customer identity safely
    let customerId = null;
    if (req.user && req.user.role === 'customer') {
      // Authenticated customer: strictly bind to their own authenticated ID to prevent IDOR
      customerId = req.user.customerId || req.user.id;
    } else if (req.user && req.body.customerId) {
      // Internal staff (sales rep / admin) creating request on behalf of a specific customer
      const custCheck = await db.query('SELECT id FROM customers WHERE id = $1', [req.body.customerId]);
      if (custCheck.rows.length > 0) {
        customerId = custCheck.rows[0].id;
      }
    }

    const emailToUse = customerEmail || req.user?.email || null;
    const nameToUse = customerName || req.user?.name || (emailToUse ? emailToUse.split('@')[0] : 'Customer');

    // 2. If no authenticated customer ID, resolve or register guest via email
    if (!customerId && emailToUse) {
      const emailCheck = await db.query('SELECT id FROM customers WHERE LOWER(email) = LOWER($1)', [emailToUse.trim()]);
      if (emailCheck.rows.length > 0) {
        customerId = emailCheck.rows[0].id;
      } else {
        const newCustId = 'cust_' + crypto.randomUUID().substring(0, 8);
        await db.query(
          'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
          [newCustId, nameToUse, emailToUse.trim().toLowerCase(), 'guest']
        );
        customerId = newCustId;
      }
    }

    // 3. Reject if no valid customer identity or email is available (Never fall back to arbitrary DB customer)
    if (!customerId) {
      return res.status(400).json({ error: 'A valid authenticated customer identity or contact email is required to submit an inquiry.' });
    }

    // 4. Create inquiry — notifies sales team
    const inquiryResult = await inquiryService.createInquiry(companyId, customerId, productId, qty);
    const inquiry = inquiryResult.inquiry;

    // 5. Select active sales rep for this company to assign the quotation to
    const repRes = await db.query(
      "SELECT id FROM users WHERE company_id = $1 AND role = 'sales_rep' ORDER BY created_at ASC LIMIT 1",
      [companyId]
    );
    let salesRepId = repRes.rows[0]?.id;
    if (!salesRepId) {
      const anyUserRes = await db.query(
        "SELECT id FROM users WHERE company_id = $1 LIMIT 1",
        [companyId]
      );
      salesRepId = anyUserRes.rows[0]?.id || 'u4';
    }

    // 6. Create live Quotation in database
    const lineType = (product.category?.toLowerCase() === 'services' || (product.unit && product.unit.toLowerCase().includes('month')))
      ? 'recurring'
      : 'one_time';

    const quoteResult = await quotationService.createQuotation(
      companyId,
      salesRepId,
      { customerId, customerName: nameToUse, customerEmail: emailToUse },
      [{
        productId: product.id,
        quantity: qty,
        unitPrice: parseFloat(product.base_price),
        discountPercent: 0,
        lineType
      }],
      inquiry.id
    );

    // 7. Retrieve full quotation detail to return to customer
    const quotation = await quotationRepository.findDetailById(quoteResult.quotationId);

    return res.status(201).json({
      success: true,
      quotation,
      inquiry,
      message: `Quotation #${quotation.id} ${quotation.discount} created for ${product.name} (Qty: ${qty}) and assigned to your dedicated sales rep.`
    });
  }

  async createQuotation(req, res) {
    
  }
  /** POST /quotations/validate-discount — Real-time discount validation for QuotationBuilder UI */
  async validateDiscount(req, res) {
    const companyId = req.companyId;
    const userId = req.user?.userId || req.user?.id;
    const { lines } = req.body;

    if (!lines || !Array.isArray(lines)) {
      return res.status(400).json({ error: 'lines array is required' });
    }

    const result = await quotationService.validateDiscountLive(companyId, userId, lines);
    return res.json(result);
  }

  /** PUT /quotations/:id/submit */
  async submit(req, res) {
    const quotationId = req.params.id;
    const userId = req.user?.userId || req.user?.id;
    const result = await quotationService.submitQuotation(req.companyId, quotationId, userId);
    return res.json({ success: true, ...result });
  }

  /** GET /quotations */
  async getCompanyQuotations(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    // Explicit filter by customerId
    if (req.query.customerId) {
      const customerQuotes = await quotationRepository.findByCustomer(req.query.customerId, null, null, limit, offset);
      res.set('X-Total-Count', customerQuotes ? customerQuotes.totalCount : 0);
      return res.json(customerQuotes ? customerQuotes.data : []);
    }

    // Customer: only see their own quotations
    if (req.user && req.user.role === 'customer') {
      const customerId = req.user.customerId || req.user.id;
      let customerEmail = req.user.email || null;
      let customerName = req.user.name || null;
      if ((!customerEmail || !customerName) && customerId) {
        try {
          const cRes = await db.query('SELECT name, email FROM customers WHERE id = $1', [customerId]);
          if (cRes.rows.length > 0) {
            if (!customerEmail) customerEmail = cRes.rows[0].email;
            if (!customerName) customerName = cRes.rows[0].name;
          }
        } catch (e) {
          // ignore error
        }
      }
      if (!customerId && !customerEmail && !customerName) {
        res.set('X-Total-Count', 0);
        return res.json([]);
      }
      const customerQuotes = await quotationRepository.findByCustomer(customerId, customerEmail, customerName, limit, offset);
      res.set('X-Total-Count', customerQuotes ? customerQuotes.totalCount : 0);
      return res.json(customerQuotes ? customerQuotes.data : []);
    }

    // Sales Rep: only see their own assigned quotations
    if (req.user && req.user.role === 'sales_rep') {
      const repId = req.user.userId || req.user.id;
      const quotations = await quotationRepository.findByCompanyAndSalesRep(req.companyId, repId, limit, offset);
      res.set('X-Total-Count', quotations.totalCount);
      return res.json(quotations.data);
    }

    // Super Admin across all companies if no specific company context
    if (req.user && req.user.role === 'super_admin' && !req.companyId) {
      const quotations = await quotationRepository.findAllQuotations(limit, offset);
      res.set('X-Total-Count', quotations.totalCount);
      return res.json(quotations.data);
    }

    // Sales Manager, Finance Manager, Admin: company quotations
    const quotations = await quotationRepository.findByCompany(req.companyId, limit, offset);
    res.set('X-Total-Count', quotations.totalCount);
    return res.json(quotations.data);
  }

  /** GET /quotations/latest */
  async getLatestQuotation(req, res) {
    const customerId = req.user?.customerId || req.user?.id || req.query.customerId;
    const companyId = req.companyId || req.user?.companyId;

    let targetQuoteId = null;

    if (customerId) {
      let custEmail = req.user?.email || null;
      let custName = req.user?.name || null;
      try {
        const cRes = await db.query('SELECT name, email FROM customers WHERE id = $1', [customerId]);
        if (cRes.rows.length > 0) {
          if (!custEmail) custEmail = cRes.rows[0].email;
          if (!custName) custName = cRes.rows[0].name;
        }
      } catch (e) {}

      const custQuotes = await quotationRepository.findByCustomer(customerId, custEmail, custName, 1, 0);
      if (custQuotes?.data?.length > 0) {
        targetQuoteId = custQuotes.data[0].id;
      }
    }

    if (!targetQuoteId && companyId) {
      const compRes = await db.query(
        'SELECT id FROM quotations WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1',
        [companyId]
      );
      if (compRes.rows.length > 0) {
        targetQuoteId = compRes.rows[0].id;
      }
    }

    if (!targetQuoteId) {
      const anyRes = await db.query(
        'SELECT id FROM quotations ORDER BY created_at DESC LIMIT 1'
      );
      if (anyRes.rows.length > 0) {
        targetQuoteId = anyRes.rows[0].id;
      }
    }

    if (!targetQuoteId) {
      return res.status(404).json({ error: 'No quotation found in the system.' });
    }

    const quote = await quotationRepository.findDetailById(targetQuoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Latest quotation not found' });
    }
    return res.json(quote);
  }

  /** GET /quotations/:id */
  async getQuotationById(req, res) {
    if (req.params.id === 'latest') {
      return this.getLatestQuotation(req, res);
    }
    const quote = await quotationRepository.findDetailById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    return res.json(quote);
  }

  /** GET /quotations/:id/discount or /quotations/:id/latest-discount */
  async getLatestDiscount(req, res) {
    let quotationId = req.params.id;
    if (quotationId === 'latest') {
      const customerId = req.user?.customerId || req.user?.id || req.query.customerId;
      if (customerId) {
        const custRes = await db.query(
          'SELECT id FROM quotations WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
          [customerId]
        );
        if (custRes.rows.length > 0) {
          quotationId = custRes.rows[0].id;
        }
      }
      if (!quotationId || quotationId === 'latest') {
        const anyRes = await db.query(
          'SELECT id FROM quotations ORDER BY created_at DESC LIMIT 1'
        );
        if (anyRes.rows.length > 0) {
          quotationId = anyRes.rows[0].id;
        }
      }
    }
    const quote = await quotationRepository.findDetailById(quotationId);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const lines = quote.lines || [];
    let baseSubtotal = 0;
    let netPayable = 0;

    const detailedLines = lines.map(line => {
      const unitPrice = parseFloat(line.unit_price) || 0;
      const quantity = parseInt(line.quantity, 10) || 1;
      const discountPercent = parseFloat(line.discount_percent) || 0;
      const grossLine = unitPrice * quantity;
      const netUnitPrice = unitPrice * (1 - discountPercent / 100);
      const lineTotal = netUnitPrice * quantity;
      const discountAmount = grossLine - lineTotal;

      baseSubtotal += grossLine;
      netPayable += lineTotal;

      return {
        id: line.id,
        productId: line.product_id,
        productName: line.product_name,
        category: line.category,
        lineType: line.line_type,
        quantity,
        unitPrice: parseFloat(unitPrice.toFixed(2)),
        discountPercent: parseFloat(discountPercent.toFixed(2)),
        netUnitPrice: parseFloat(netUnitPrice.toFixed(2)),
        lineTotal: parseFloat(lineTotal.toFixed(2)),
        discountAmount: parseFloat(discountAmount.toFixed(2))
      };
    });

    const totalDiscount = Math.max(0, baseSubtotal - netPayable);
    const effectiveDiscountPercent = baseSubtotal > 0 ? ((totalDiscount / baseSubtotal) * 100) : 0;

    // Check if there are any negotiation messages with counter discounts
    const messages = await quotationRepository.getNegotiationMessages(quotationId);
    const latestNegotiation = messages && messages.length > 0 ? messages[messages.length - 1] : null;

    return res.json({
      success: true,
      quotationId,
      status: quote.status,
      baseSubtotal: parseFloat(baseSubtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      discountPercent: parseFloat(effectiveDiscountPercent.toFixed(2)),
      netPayable: parseFloat(netPayable.toFixed(2)),
      latestCounterDiscount: latestNegotiation?.counter_discount ? parseFloat(latestNegotiation.counter_discount) : null,
      lines: detailedLines,
      calculatedAt: new Date().toISOString()
    });
  }

  /** PUT /quotations/:id/approve */
  async approve(req, res) {
    const quotationId = req.params.id;
    const userId = req.user?.userId || req.user?.id;
    const { modifiedLines } = req.body;
    const result = await quotationService.approveQuotation(
      req.companyId, quotationId, req.user.role, userId, modifiedLines || null
    );
    return res.json({ success: true, ...result });
  }

  /** PUT /quotations/:id/reject */
  async reject(req, res) {
    const quotationId = req.params.id;
    const userId = req.user?.userId || req.user?.id;
    const { reason } = req.body;
    const result = await quotationService.rejectQuotation(
      req.companyId, quotationId, req.user.role, userId, reason || ''
    );
    return res.json({ success: true, ...result });
  }

  /** PUT /quotations/:id/confirm — Customer accepts quotation */
  async confirm(req, res) {
    const quotationId = req.params.id;
    const { paymentMethod, paymentType, amount, transactionResult } = req.body;
    const result = await quotationService.confirmQuotation(req.companyId, quotationId, { paymentMethod, paymentType, amount, transactionResult });
    return res.json({ success: true, ...result });
  }

  /** PUT /quotations/:id/status */
  async updateStatus(req, res) {
    const quotationId = req.params.id;
    const { status } = req.body;
    if (status === 'confirmed') {
      const result = await quotationService.confirmQuotation(req.companyId, quotationId);
      return res.json({ success: true, ...result });
    }
    const updated = await quotationRepository.updateQuotationStatusAndScore(quotationId, status, 0.00);

    const quote = await quotationRepository.findDetailById(quotationId);
    const companyId = req.companyId || quote?.company_id;

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: status });

    if (quote) {
      emitCompanyRoleNotification(companyId, ['admin', 'sales_manager'], {
        type: 'info',
        title: 'Pipeline Stage Updated',
        message: `Quote #${quotationId} moved to stage: ${status.replace(/_/g, ' ')}.`,
        link: `/app/pipeline`
      });
      emitUserNotification(quote.sales_rep_id, {
        type: 'info',
        title: 'Pipeline Stage Updated',
        message: `Quote #${quotationId} was moved to ${status.replace(/_/g, ' ')}.`,
        link: `/app/quote/${quotationId}`
      });
    }

    return res.json({ success: true, quotation: updated });
  }

  /** PUT /quotations/:id/counter — Customer counter offer */
  async counterOffer(req, res) {
    const quotationId = req.params.id;
    const { lines, status = 'pending_approval' } = req.body;
    if (lines && Array.isArray(lines)) {
      for (const l of lines) {
        const discount = Math.min(100, Math.max(0, parseFloat(l.discountPercent) || 0));
        const qty = Math.max(1, parseInt(l.quantity, 10) || 1);
        if (l.quantity !== undefined) {
          await db.query(
            'UPDATE quotation_lines SET discount_percent = $1, quantity = $2 WHERE id = $3 AND quotation_id = $4',
            [discount, qty, l.id, quotationId]
          );
        } else {
          await db.query(
            'UPDATE quotation_lines SET discount_percent = $1 WHERE id = $2 AND quotation_id = $3',
            [discount, l.id, quotationId]
          );
        }
      }
    }
    const quote = await quotationRepository.findDetailById(quotationId);
    const updated = await quotationRepository.updateQuotationStatusAndScore(quotationId, status, 15.00);

    const companyId = req.companyId || quote?.company_id;
    broadcastPipelineUpdate(companyId, { quotationId, newStatus: status });

    if (quote) {
      emitUserNotification(quote.sales_rep_id, {
        type: 'warning',
        title: '💬 Counter Offer Submitted',
        message: `Customer requested counter offer on Quote #${quotationId}.`,
        link: `/app/quote/${quotationId}`
      });
      emitCompanyRoleNotification(companyId, ['admin', 'sales_manager'], {
        type: 'warning',
        title: '💬 Counter Offer Received',
        message: `Counter offer submitted for Quote #${quotationId}.`,
        link: `/app/approvals`
      });
    }

    return res.json({ success: true, quotation: updated });
  }

  /** GET /quotations/:id/messages */
  async getMessages(req, res) {
    const quotationId = req.params.id;
    const messages = await quotationRepository.getNegotiationMessages(quotationId);
    return res.json(messages || []);
  }

  /** POST /quotations/:id/messages */
  async postMessage(req, res) {
    const quotationId = req.params.id;
    const { content, message, sender_type, counter_discount } = req.body;
    const msgText = content || message;
    if (!msgText || !msgText.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const senderType = sender_type || (req.user?.role === 'customer' ? 'customer' : 'rep');
    const newMsg = await quotationRepository.createNegotiationMessage(
      quotationId, senderType, msgText, counter_discount || null
    );

    const quote = await quotationRepository.findDetailById(quotationId);
    if (quote) {
      const companyId = req.companyId || quote.company_id;
      if (senderType === 'customer') {
        emitUserNotification(quote.sales_rep_id, {
          type: 'info',
          title: '💬 New Customer Message',
          message: `Customer message on Quote #${quotationId}: "${msgText.substring(0, 40)}..."`,
          link: `/app/quote/${quotationId}`
        });
      }
    }

    return res.status(201).json(newMsg);
  }
}

module.exports = new QuotationController();
