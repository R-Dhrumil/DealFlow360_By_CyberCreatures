const quotationService = require('../services/quotation.service');
const quotationRepository = require('../repositories/quotation.repository');
const db = require('../config/db');
const crypto = require('crypto');
const { logAction } = require('../services/audit.service');

class QuotationController {
  async create(req, res) {
    const { customerId, lines } = req.body;
    const result = await quotationService.createQuotation(
      req.companyId,
      req.user.userId,
      customerId,
      lines
    );
    return res.status(201).json({ success: true, ...result });
  }

  async createCustomerRequest(req, res) {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    // 1. Fetch Product details
    const prodRes = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = prodRes.rows[0];

    // 2. Resolve IDs
    const companyId = product.company_id || 'c1';
    let customerId = req.user?.customerId || req.user?.id || 'cust1';
    
    // Ensure customerId exists in customers table
    const custCheck = await db.query('SELECT id FROM customers WHERE id = $1', [customerId]);
    if (custCheck.rows.length === 0) {
      const firstCust = await db.query('SELECT id FROM customers LIMIT 1');
      customerId = firstCust.rows[0]?.id || 'cust1';
    }

    // Find active sales rep
    const repRes = await db.query("SELECT id FROM users WHERE company_id = $1 AND role = 'sales_rep' LIMIT 1", [companyId]);
    const salesRepId = repRes.rows[0]?.id || 'u4';

    // 3. Create Quotation with clean short ID (e.g. q_1092)
    const quoteId = 'q_' + Math.floor(1000 + Math.random() * 9000);
    const quoteRes = await db.query(
      `INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, blended_risk_score)
       VALUES ($1, $2, $3, $4, 'pending_approval', 5.00)
       RETURNING *`,
      [quoteId, companyId, customerId, salesRepId]
    );
    const newQuote = quoteRes.rows[0];

    // 4. Create Quotation Line with unique ID
    const lineId = 'ql_' + crypto.randomUUID();
    await db.query(
      `INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
       VALUES ($1, $2, $3, $4, $5, 0.00, 'one_time')`,
      [lineId, newQuote.id, product.id, qty, product.base_price]
    );

    await logAction('quotation', newQuote.id, salesRepId, 'customer_requested', {
      product_name: product.name,
      base_price: product.base_price
    });

    return res.status(201).json({
      success: true,
      quotation: newQuote,
      message: `Quotation requested for ${product.name}`
    });
  }

  async submit(req, res) {
    const quotationId = req.params.id;
    const result = await quotationService.submitQuotation(req.companyId, quotationId);
    return res.json({ success: true, ...result });
  }

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
    
    // BOLA Protection: Sales Reps can only view their own quotes
    if (req.user && req.user.role === 'sales_rep') {
      const quotations = await quotationRepository.findByCompanyAndSalesRep(req.companyId, req.user.userId, limit, offset);
      res.set('X-Total-Count', quotations.totalCount);
      return res.json(quotations.data);
    }

    const quotations = await quotationRepository.findByCompany(req.companyId, limit, offset);
    res.set('X-Total-Count', quotations.totalCount);
    return res.json(quotations.data);
  }

  async getQuotationById(req, res) {
    const quote = await quotationRepository.findDetailById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // BOLA Protection: Restrict access for specific roles
    if (req.user && req.user.role === 'sales_rep' && quote.sales_rep_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this quotation.' });
    }
    if (req.user && req.user.role === 'customer' && quote.customer_id !== (req.user.customerId || req.user.id)) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this quotation.' });
    }

    return res.json(quote);
  }

  async approve(req, res) {
    const quotationId = req.params.id;
    const result = await quotationService.approveQuotation(req.companyId, quotationId, req.user.role);
    return res.json({ success: true, ...result });
  }

  async reject(req, res) {
    const quotationId = req.params.id;
    const result = await quotationService.rejectQuotation(req.companyId, quotationId, req.user.role);
    return res.json({ success: true, ...result });
  }

  async confirm(req, res) {
    const quotationId = req.params.id;
    const result = await quotationService.confirmQuotation(req.companyId, quotationId);
    return res.json({ success: true, ...result });
  }

  async counterOffer(req, res) {
    const quotationId = req.params.id;
    const { lines, status = 'pending_approval' } = req.body;
    if (lines && Array.isArray(lines)) {
      for (const l of lines) {
        await db.query(
          'UPDATE quotation_lines SET discount_percent = $1 WHERE id = $2 AND quotation_id = $3',
          [l.discountPercent, l.id, quotationId]
        );
      }
    }
    const quote = await quotationRepository.findDetailById(quotationId);
    const updated = await quotationRepository.updateQuotationStatusAndScore(
      quotationId,
      status,
      15.00
    );
    return res.json({ success: true, quotation: updated });
  }

  async getMessages(req, res) {
    const quotationId = req.params.id;
    const messages = await quotationRepository.getNegotiationMessages(quotationId);
    return res.json(messages || []);
  }

  async postMessage(req, res) {
    const quotationId = req.params.id;
    const { content, message, sender_type, counter_discount } = req.body;
    const msgText = content || message;
    if (!msgText || !msgText.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    const senderType = sender_type || (req.user?.role === 'customer' ? 'customer' : 'rep');
    const newMsg = await quotationRepository.createNegotiationMessage(
      quotationId,
      senderType,
      msgText,
      counter_discount || null
    );
    return res.status(201).json(newMsg);
  }
}

module.exports = new QuotationController();
