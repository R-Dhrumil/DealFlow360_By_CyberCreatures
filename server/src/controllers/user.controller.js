const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const companyRepository = require('../repositories/company.repository');
const ApiError = require('../utils/apiError');

class UserController {
  async getCompanyUsers(req, res) {
    const companyId = req.user?.companyId;
    
    if (companyId) {
      const users = await userRepository.findByCompanyId(companyId);
      const formatted = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'Active',
        dealsCount: parseInt(u.deals_count || 0, 10)
      }));
      return res.json(formatted);
    }

    if (req.user?.role === 'super_admin') {
      const users = await companyRepository.getAllTenantUsers();
      const formatted = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'Active',
        dealsCount: 0
      }));
      return res.json(formatted);
    }

    throw ApiError.forbidden('Unauthorized access to team directory');
  }

  async provisionUser(req, res) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw ApiError.forbidden('Only administrators can provision new team members');
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw ApiError.badRequest('Full Name, Email Address, Password, and Role are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(cleanEmail);
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const companyId = req.user?.companyId || req.body.companyId;
    if (!companyId) {
      throw ApiError.badRequest('Company context is required to provision team members');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'u_' + crypto.randomUUID();

    const newUser = await userRepository.createUser({
      id: userId,
      companyId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role
    });

    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Active',
      dealsCount: 0
    });
  }

  async updateUserRole(req, res) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw ApiError.forbidden('Only administrators can update team member roles');
    }

    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['sales_rep', 'sales_manager', 'finance', 'admin', 'super_admin'];
    if (!role || !validRoles.includes(role)) {
      throw ApiError.badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const companyId = req.user?.role === 'super_admin' ? null : req.user?.companyId;

    const updatedUser = await userRepository.updateUserRole(id, role, companyId);
    if (!updatedUser) {
      return res.json({ id, role, status: 'Active' });
    }

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: 'Active'
    });
  }
}

module.exports = new UserController();
