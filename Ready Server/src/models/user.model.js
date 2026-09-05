import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';

export class User {
  /**
   * Sanitize user object to never expose password hash
   */
  static sanitize(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Compare candidate plaintext password against hash
   */
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  /**
   * Create a new user
   */
  static async create({ name, email, password, role = 'USER', department = 'General' }) {
    const text = `
      INSERT INTO users (name, email, password, role, department)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, department, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const values = [name, email.toLowerCase().trim(), password, role, department];
    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Find a user by Email (Includes password hash for authentication)
   */
  static async findByEmail(email) {
    const text = `
      SELECT id, name, email, password, role, department, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM users
      WHERE email = $1
    `;
    const res = await query(text, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  }

  /**
   * Find a user by UUID ID
   */
  static async findById(id) {
    const text = `
      SELECT id, name, email, role, department, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find all users with optional pagination
   */
  static async findAll({ limit = 100, offset = 0 } = {}) {
    const text = `
      SELECT id, name, email, role, department, is_active AS "isActive", created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const res = await query(text, [limit, offset]);
    return res.rows;
  }

  /**
   * Count total users
   */
  static async count() {
    const res = await query('SELECT COUNT(*) AS total FROM users');
    return parseInt(res.rows[0].total, 10);
  }

  /**
   * Update a user's role
   */
  static async updateRole(id, role) {
    const text = `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role, department, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await query(text, [role, id]);
    return res.rows[0] || null;
  }

  /**
   * Delete all users (Used by Seeder)
   */
  static async deleteMany() {
    return await query('DELETE FROM users');
  }

  /**
   * Bulk insert users (Used by Seeder)
   */
  static async createMany(users) {
    if (!users || users.length === 0) return [];
    
    // Construct parameterized multi-row insert
    const valuePlaceholders = [];
    const params = [];
    let idx = 1;

    for (const u of users) {
      valuePlaceholders.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
      params.push(
        u.name,
        u.email.toLowerCase().trim(),
        u.password,
        u.role || 'USER',
        u.department || 'General',
        u.isActive !== undefined ? u.isActive : true
      );
      idx += 6;
    }

    const sql = `
      INSERT INTO users (name, email, password, role, department, is_active)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role, department, is_active AS "isActive"
    `;

    const res = await query(sql, params);
    return res.rows;
  }
}
