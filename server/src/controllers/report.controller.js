const reportRepository = require('../repositories/report.repository');

class ReportController {
  /**
   * GET /reporting — Fetch dynamic reporting analytics based on query filters
   */
  async getReport(req, res) {
    const companyId = req.companyId;
    const reportData = await reportRepository.getReportingData(companyId, req.query);
    return res.json(reportData);
  }

  /**
   * GET /reporting/filters — Fetch available dropdown options (reps, categories, products)
   */
  async getFilters(req, res) {
    const companyId = req.companyId;
    const filterOptions = await reportRepository.getFilterOptions(companyId);
    return res.json(filterOptions);
  }
}

module.exports = new ReportController();
