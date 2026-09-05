const quotationService = require('../services/quotation.service');
const quotationRepository = require('../repositories/quotation.repository');
const db = require('../config/db');
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
    const companyId = product.company_id || '11111111-1111-1111-1111-111111111111';
    const customerId = req.user?.customerId || req.user?.id || '33333333-3333-3333-3333-333333333331';
    
    // Find active sales rep
    const repRes = await db.query("SELECT id FROM users WHERE company_id = $1 AND role = 'sales_rep' LIMIT 1", [companyId]);
    const salesRepId = repRes.rows[0]?.id || '11111111-1111-1111-1111-100000000003';

    // 3. Create Quotation
    const quoteRes = await db.query(
      `INSERT INTO quotations (company_id, customer_id, sales_rep_id, status, blended_risk_score)
       VALUES ($1, $2, $3, 'draft', 0.00)
       RETURNING *`,
      [companyId, customerId, salesRepId]
    );
    const newQuote = quoteRes.rows[0];

    // 4. Create Quotation Line
    await db.query(
      `INSERT INTO quotation_lines (quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
       VALUES ($1, $2, $3, $4, 0.00, 'one_time')`,
      [newQuote.id, product.id, qty, product.base_price]
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
    if (req.user && req.user.role === 'customer') {
      const customerId = req.user.customerId || req.user.id || '33333333-3333-3333-3333-333333333331';
      const customerQuotes = await quotationRepository.findByCustomer(customerId);
      if (customerQuotes && customerQuotes.length > 0) {
        return res.json(customerQuotes);
      }
      const allQuotes = await quotationRepository.findAll();
      return res.json(allQuotes);
    }
    const quotations = await quotationRepository.findByCompany(req.companyId);
    return res.json(quotations);
  }

  async getQuotationById(req, res) {
    const quote = await quotationRepository.findDetailById(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    return res.json(quote);
  }

  async updateStatus(req, res) {
    const quotationId = req.params.id;
    const { status } = req.body;
    const quote = await quotationRepository.findDetailById(quotationId);
    if (!quote) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    const updated = await quotationRepository.updateQuotationStatusAndScore(
      quotationId,
      status || 'confirmed',
      quote.blended_risk_score || 0
    );
    return res.json({ success: true, quotation: updated });
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
}

module.exports = new QuotationController();
