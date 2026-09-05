const companyRepository = require('../repositories/company.repository');

class SuperadminController {
  async getCompanies(req, res) {
    const companies = await companyRepository.getAllCompaniesWithStats();
    return res.json(companies);
  }

  async getTenantUsers(req, res) {
    const users = await companyRepository.getAllTenantUsers();
    return res.json(users);
  }
}

module.exports = new SuperadminController();
