const companyRepository = require('../repositories/company.repository');

class SuperadminController {
  async getCompanies(req, res) {
    const companies = await companyRepository.getAllCompaniesWithStats();
    return res.json(companies);
  }
}

module.exports = new SuperadminController();
