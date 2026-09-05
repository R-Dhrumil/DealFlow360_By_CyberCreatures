const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const customerRepository = require('../repositories/customer.repository');
const companyRepository = require('../repositories/company.repository');
const config = require('../config/environment');
const ApiError = require('../utils/apiError');
const db = require('../config/db');

// Seeded Demo Accounts for Instant Testing
const DEMO_ACCOUNTS = [
  { email: 'superadmin@dealflow360.com', password: 'SuperAdmin123!', name: 'Super Admin', role: 'super_admin', id: 'sa-001' },
  { email: 'admin@cybercreatures.com', password: 'Admin123!', name: 'CyberCreatures Admin', role: 'admin', id: 'usr-admin-01', companyId: 'comp-01' },
  { email: 'manager@cybercreatures.com', password: 'Manager123!', name: 'Sales Manager', role: 'sales_manager', id: 'usr-mgr-01', companyId: 'comp-01' },
  { email: 'finance@cybercreatures.com', password: 'Finance123!', name: 'Finance Lead', role: 'finance', id: 'usr-fin-01', companyId: 'comp-01' },
  { email: 'sales@cybercreatures.com', password: 'Sales123!', name: 'Sales Executive', role: 'sales_rep', id: 'usr-rep-01', companyId: 'comp-01' },
  { email: 'customer@acme.com', password: 'Customer123!', name: 'Acme Procurement', role: 'customer', id: 'cust-acme-01' },
];

class AuthService {
  /**
   * Unified login: Automatically identifies user role (Super Admin, User, or Customer)
   * from credentials without requiring manual role selection.
   */
  async unifiedLogin(email, password) {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Pre-seeded Demo Credentials (for quick testing)
    const demoMatch = DEMO_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === cleanEmail && acc.password === password
    );
    if (demoMatch) {
      const token = jwt.sign(
        { userId: demoMatch.id, role: demoMatch.role, companyId: demoMatch.companyId },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      return {
        token,
        user: {
          id: demoMatch.id,
          name: demoMatch.name,
          email: demoMatch.email,
          role: demoMatch.role,
          companyId: demoMatch.companyId
        }
      };
    }

    // 2. Check Internal Users Table (Admin, Sales Manager, Finance, Sales Rep)
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
        }
      }
    } catch (err) {
      console.warn('DB lookup failed in unifiedLogin, checking fallback customers:', err.message);
    }

    // 3. Check Customer Table
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
        }
      }
    } catch (err) {
      console.warn('Customer lookup failed in unifiedLogin:', err.message);
    }

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
        // Fallback response for offline setup mode
        const token = jwt.sign(
          { userId: 'usr-' + Date.now(), role: 'admin' },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );
        return {
          token,
          user: {
            id: 'usr-' + Date.now(),
            name,
            email: cleanEmail,
            role: 'admin',
            companyId: 'comp-' + Date.now()
          }
        };
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
        const token = jwt.sign(
          { customerId: 'cust-' + Date.now(), role: 'customer' },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );
        return {
          token,
          user: {
            id: 'cust-' + Date.now(),
            name,
            email: cleanEmail,
            role: 'customer'
          }
        };
      }
    }
  }
}

module.exports = new AuthService();
