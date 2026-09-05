const { generateQuotationPDF, generateQuotationsExcel } = require('../services/export.service');
const quotationRepository = require('../repositories/quotation.repository');
const dashboardRepository = require('../repositories/dashboard.repository');

class ExportController {
  async exportQuotationPDF(req, res) {
    const { id } = req.params;
    const quotation = await quotationRepository.findByIdAndCompany(id, req.companyId || '11111111-1111-1111-1111-111111111111');
    const lines = await quotationRepository.findQuotationLinesWithCategory(id);
    
    const payload = quotation ? { ...quotation, lines } : { id, customer_name: 'Acme Corp', status: 'approved', lines: [] };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Quotation-${id}.pdf"`);
    
    generateQuotationPDF(payload, res);
  }

  async exportReportExcel(req, res) {
    const highRiskDeals = await dashboardRepository.getHighRiskDeals(req.companyId || '11111111-1111-1111-1111-111111111111', 50);
    const buffer = await generateQuotationsExcel(highRiskDeals);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Quotations-Report.xlsx"');
    res.send(buffer);
  }
}

module.exports = new ExportController();
