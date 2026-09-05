const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return res.json(result);
  }

  async customerLogin(req, res) {
    const { email, password } = req.body;
    const result = await authService.loginCustomer(email, password);
    return res.json(result);
  }

  async customerSignup(req, res) {
    const { name, email, password } = req.body;
    const result = await authService.signupCustomer(name, email, password);
    return res.status(201).json(result);
  }
}

module.exports = new AuthController();
