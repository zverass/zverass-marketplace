import pool from '../config/database.js';

class ProductKey {
  static async create(productId, keyValue, fileUrl = null) {
    const result = await pool.query(
      `INSERT INTO product_keys (product_id, key_value, file_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, keyValue, fileUrl]
    );
    return result.rows[0];
  }

  static async getUnused(productId, limit = 1) {
    const result = await pool.query(
      `SELECT * FROM product_keys WHERE product_id = $1 AND is_used = false
       ORDER BY created_at ASC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  }

  static async markAsUsed(keyId, userId) {
    const result = await pool.query(
      `UPDATE product_keys SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [userId, keyId]
    );
    return result.rows[0];
  }

  static async getUsageHistory(productId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT pk.*, u.username as used_by_username
      FROM product_keys pk
      LEFT JOIN users u ON pk.used_by = u.id
      WHERE pk.product_id = $1 AND pk.is_used = true
      ORDER BY pk.used_at DESC
      LIMIT $2 OFFSET $3
    `, [productId, limit, offset]);
    return result.rows;
  }

  static async getUnusedCount(productId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM product_keys WHERE product_id = $1 AND is_used = false',
      [productId]
    );
    return result.rows[0]?.count || 0;
  }

  static async delete(keyId) {
    const result = await pool.query('DELETE FROM product_keys WHERE id = $1 RETURNING id', [keyId]);
    return result.rows[0];
  }
}

export default ProductKey;
