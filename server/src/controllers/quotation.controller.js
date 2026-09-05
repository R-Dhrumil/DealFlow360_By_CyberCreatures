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

  /** POST /quotations/customer-request — Marketplace inquiry creation */
  async createCustomerRequest(req, res) {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    // Fetch Product details
    const prodRes = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = prodRes.rows[0];
    const companyId = product.company_id || 'c1';

    let customerId = req.user?.customerId || req.user?.id || null;

    // Ensure customerId exists in customers table
    if (customerId) {
      const custCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customerId]);
      if (custCheck.rows.length === 0) {
        const firstCust = await db.query('SELECT id FROM customers LIMIT 1');
        customerId = firstCust.rows[0]?.id || null;
      }
    }

    if (!customerId) {
      const firstCust = await db.query('SELECT id FROM customers LIMIT 1');
      customerId = firstCust.rows[0]?.id;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'No customer available' });
    }

    // Create inquiry — notifies all sales reps
    const inquiryResult = await inquiryService.createInquiry(companyId, customerId, productId, qty);
    const inquiry = inquiryResult.inquiry;

    return res.status(201).json({
      success: true,
      inquiry,
      message: `Inquiry created for ${product.name}. Sales team has been notified.`
    });
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

    if (req.user && req.user.role === 'customer') {
      const customerId = req.user.customerId || req.user.id || 'cust1';
      const customerQuotes = await quotationRepository.findByCustomer(customerId, limit, offset);
      if (customerQuotes && customerQuotes.data.length > 0) {
        res.set('X-Total-Count', customerQuotes.totalCount);
        return res.json(customerQuotes.data);
      }
      const allQuotes = await quotationRepository.findAll(limit, offset);
      res.set('X-Total-Count', allQuotes.totalCount);
      return res.json(allQuotes.data);
    }

    // BOLA Protection: Sales Reps only see their own quotes
    if (req.user && req.user.role === 'sales_rep') {
      const quotations = await quotationRepository.findByCompanyAndSalesRep(req.companyId, req.user.userId, limit, offset);
      res.set('X-Total-Count', quotations.totalCount);
      return res.json(quotations.data);
    }

    const quotations = await quotationRepository.findByCompany(req.companyId, limit, offset);
    res.set('X-Total-Count', quotations.totalCount);
    return res.json(quotations.data);
  }

  /** GET /quotations/:id */
  async getQuotationById(req, res) {
    const quote = await quotationRepository.findDetailById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    return res.json(quote);
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
    const result = await quotationService.confirmQuotation(req.companyId, quotationId);
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
        if (l.quantity !== undefined) {
          await db.query(
            'UPDATE quotation_lines SET discount_percent = $1, quantity = $2 WHERE id = $3 AND quotation_id = $4',
            [l.discountPercent, Math.max(1, Number(l.quantity) || 1), l.id, quotationId]
          );
        } else {
          await db.query(
            'UPDATE quotation_lines SET discount_percent = $1 WHERE id = $2 AND quotation_id = $3',
            [l.discountPercent, l.id, quotationId]
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
