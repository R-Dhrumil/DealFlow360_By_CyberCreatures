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

  async logout(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.logout(token);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  }
}

module.exports = new AuthController();
