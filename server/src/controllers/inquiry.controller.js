/**
 * inquiry.controller.js
 *
 * Handles CRUD for Inquiries and listing their associated quotations.
 */
const inquiryService = require('../services/inquiry.service');
const db = require('../config/db');

class InquiryController {
  /** POST /inquiries — Create a new inquiry (customer or internal user on behalf of customer) */
  async create(req, res) {
    const { productId, quantity, notes, customerId, customerEmail, customerName } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Resolve company from product
    const prodRes = await db.query('SELECT company_id FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const companyId = prodRes.rows[0].company_id;

    // Resolve customer
    let resolvedCustomerId = customerId || req.user?.customerId || req.user?.id;

    if (!resolvedCustomerId && (customerEmail || customerName)) {
      // Create or find customer
      const email = customerEmail?.trim().toLowerCase();
      if (email) {
        const existing = await db.query('SELECT id FROM customers WHERE LOWER(email) = $1', [email]);
        if (existing.rows.length > 0) {
          resolvedCustomerId = existing.rows[0].id;
        } else {
          const { rows } = await db.query(
            'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
            ['cust_' + require('crypto').randomUUID().substring(0, 8), customerName || email.split('@')[0], email, 'guest']
          );
          resolvedCustomerId = rows[0].id;
        }
      }
    }

    if (!resolvedCustomerId) {
      const first = await db.query('SELECT id FROM customers LIMIT 1');
      resolvedCustomerId = first.rows[0]?.id;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({ error: 'Could not resolve customer' });
    }

    const result = await inquiryService.createInquiry(
      companyId, resolvedCustomerId, productId, quantity || 1, notes || ''
    );

    return res.status(201).json({
      success: true,
      inquiry: result.inquiry,
      product: result.product,
      customer: result.customer
    });
  }

  /** GET /inquiries — List inquiries for the user's company */
  async list(req, res) {
    const companyId = req.companyId;
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const offset = (page - 1) * limit;

    const result = await inquiryService.getInquiries(companyId, req.user.role, limit, offset);

    res.set('X-Total-Count', result.totalCount);
    return res.json(result.data);
  }

  /** GET /inquiries/:id — Get a single inquiry with its quotations */
  async getOne(req, res) {
    const { id } = req.params;
    const companyId = req.companyId;
    const inquiry = await inquiryService.getInquiryWithQuotations(id, companyId);
    return res.json(inquiry);
  }

  /** PUT /inquiries/:id/close — Close an inquiry */
  async close(req, res) {
    const { id } = req.params;
    const result = await inquiryService.closeInquiry(id, req.companyId);
    return res.json({ success: true, inquiry: result });
  }
}

module.exports = new InquiryController();
