import { query } from '../config/db.js';

export class Otp {
  /**
   * Save a new OTP code for an email address
   */
  static async create({ email, otp, expiresAt }) {
    // Delete any prior OTPs for this email first
    await this.deleteByEmail(email);

    const text = `
      INSERT INTO otps (email, otp, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, email, otp, expires_at AS "expiresAt", created_at AS "createdAt"
    `;
    const values = [email.toLowerCase().trim(), otp, expiresAt];
    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Find valid, unexpired OTP code
   */
  static async findValid({ email, otp }) {
    const text = `
      SELECT id, email, otp, expires_at AS "expiresAt"
      FROM otps
      WHERE email = $1 AND otp = $2 AND expires_at >= NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [email.toLowerCase().trim(), otp.trim()]);
    return res.rows[0] || null;
  }

  /**
   * Delete OTP records by email
   */
  static async deleteByEmail(email) {
    const text = 'DELETE FROM otps WHERE email = $1';
    return await query(text, [email.toLowerCase().trim()]);
  }

  /**
   * Delete all OTP records (Used for cleanup or test resets)
   */
  static async deleteMany() {
    return await query('DELETE FROM otps');
  }
}
