const quotationService = require('../services/quotation.service');

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

  async submit(req, res) {
    const quotationId = req.params.id;
    const result = await quotationService.submitQuotation(req.companyId, quotationId);
    return res.json({ success: true, ...result });
  }
}

module.exports = new QuotationController();
