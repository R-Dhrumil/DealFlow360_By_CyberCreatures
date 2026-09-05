const authService = require('../services/auth.service');

class AuthController {
  async unifiedLogin(req, res) {
    const { email, password } = req.body;
    const result = await authService.unifiedLogin(email, password);
    return res.json(result);
  }

  async unifiedSignup(req, res) {
    const { accountType, name, email, password, companyName } = req.body;
    const result = await authService.unifiedSignup(accountType, name, email, password, companyName);
    return res.status(201).json(result);
  }
}

module.exports = new AuthController();
