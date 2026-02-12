import pool from '../config/database.js';

class PromoCode {
  static async create(code, discountPercent = 0, discountAmount = 0, maxUses = -1, minOrderAmount = 0, validFrom = null, validUntil = null, createdBy) {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_percent, discount_amount, max_uses, min_order_amount, valid_from, valid_until, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [code, discountPercent, discountAmount, maxUses, minOrderAmount, validFrom, validUntil, createdBy]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await pool.query(`
      SELECT * FROM promo_codes 
      WHERE code = $1 AND is_active = true
      AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
      AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
      AND (max_uses = -1 OR current_uses < max_uses)
    `, [code]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM promo_codes WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getAll(limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT * FROM promo_codes
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async incrementUses(codeId) {
    const result = await pool.query(
      'UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = $1 RETURNING *',
      [codeId]
    );
    return result.rows[0];
  }

  static async updateStatus(codeId, isActive) {
    const result = await pool.query(
      'UPDATE promo_codes SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, codeId]
    );
    return result.rows[0];
  }

  static async delete(codeId) {
    const result = await pool.query('DELETE FROM promo_codes WHERE id = $1 RETURNING id', [codeId]);
    return result.rows[0];
  }
}

export default PromoCode;
