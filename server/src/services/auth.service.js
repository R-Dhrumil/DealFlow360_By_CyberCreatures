const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const customerRepository = require('../repositories/customer.repository');
const config = require('../config/environment');
const ApiError = require('../utils/apiError');

class AuthService {
  async loginUser(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      }
    };
  }

  async loginCustomer(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const customer = await customerRepository.findByEmail(email);
    if (!customer) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, customer.password_hash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = jwt.sign(
      { customerId: customer.id, role: 'customer' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: 'customer'
      }
    };
  }

  async signupCustomer(name, email, password) {
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email and password are required');
    }

    const existingCustomer = await customerRepository.findByEmail(email);
    if (existingCustomer) {
      throw ApiError.conflict('Customer email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newCustomer = await customerRepository.create(name, email, passwordHash);

    const token = jwt.sign(
      { customerId: newCustomer.id, role: 'customer' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        role: 'customer'
      }
    };
  }
}

module.exports = new AuthService();
