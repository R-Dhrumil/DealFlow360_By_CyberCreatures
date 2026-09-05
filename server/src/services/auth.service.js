const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const customerRepository = require('../repositories/customer.repository');
const companyRepository = require('../repositories/company.repository');
const config = require('../config/environment');
const ApiError = require('../utils/apiError');
const db = require('../config/db');

class AuthService {
  /**
   * Unified login: Automatically identifies user role (Super Admin, User, or Customer)
   * from database credentials without requiring manual role selection.
   */
  async unifiedLogin(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Internal Users Table (Admin, Sales Manager, Finance, Sales Rep, Super Admin)
    try {
      const user = await userRepository.findByEmail(cleanEmail);
      if (user) {
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (isValidPassword) {
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
        } else {
          // User email exists in DB but password is wrong
          throw ApiError.unauthorized('Invalid email or password');
        }
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.warn('DB user lookup error:', err.message);
    }

    // 2. Check Customer Table
    try {
      const customer = await customerRepository.findByEmail(cleanEmail);
      if (customer) {
        const isValidPassword = await bcrypt.compare(password, customer.password_hash);
        if (isValidPassword) {
          const token = jwt.sign(
            { customerId: customer.id, role: 'customer' },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
          );
          return {
            token,
            user: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              role: 'customer'
            }
          };
        } else {
          // Customer email exists in DB but password is wrong
          throw ApiError.unauthorized('Invalid email or password');
        }
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.warn('Customer DB lookup error:', err.message);
    }

    // 3. Credentials not found in DB
    throw ApiError.unauthorized('Invalid email or password');
  }

  /**
   * Unified Sign Up: Asks ONLY for Account Type (Admin vs Customer)
   */
  async unifiedSignup(accountType, name, email, password, companyName) {
    if (!name || !email || !password) {
      throw ApiError.badRequest('Name, email, and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();

    if (accountType === 'admin') {
      try {
        const existingUser = await userRepository.findByEmail(cleanEmail);
        if (existingUser) {
          throw ApiError.conflict('An account with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
        
        const companyRes = await db.query(
          'INSERT INTO companies (name, subdomain_slug) VALUES ($1, $2) RETURNING id, name',
          [companyName || `${name} Organization`, slug]
        );
        const company = companyRes.rows[0];

        const userRes = await db.query(
          `INSERT INTO users (company_id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, 'admin')
           RETURNING id, name, email, role, company_id`,
          [company.id, name, cleanEmail, passwordHash]
        );
        const newUser = userRes.rows[0];

        const token = jwt.sign(
          { userId: newUser.id, companyId: newUser.company_id, role: 'admin' },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );

        return {
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: 'admin',
            companyId: newUser.company_id
          }
        };
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw ApiError.internal(err.message || 'Failed to create admin user');
      }
    } else {
      try {
        const existingCustomer = await customerRepository.findByEmail(cleanEmail);
        if (existingCustomer) {
          throw ApiError.conflict('A customer account with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newCustomer = await customerRepository.create(name, cleanEmail, passwordHash);

        const token = jwt.sign(
          { customerId: newCustomer.id, role: 'customer' },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );

        return {
          token,
          user: {
            id: newCustomer.id,
            name: newCustomer.name,
            email: newCustomer.email,
            role: 'customer'
          }
        };
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw ApiError.internal(err.message || 'Failed to create customer account');
      }
    }
  }
}

module.exports = new AuthService();
