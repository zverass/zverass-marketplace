import pool from '../config/database.js';

class Withdrawal {
  static async create(sellerId, amount, walletAddress = null) {
    const result = await pool.query(
      `INSERT INTO withdrawals (seller_id, amount, wallet_address, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [sellerId, amount, walletAddress]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT w.*,
             u.username as seller_name,
             u.email as seller_email
      FROM withdrawals w
      JOIN users u ON w.seller_id = u.id
      WHERE w.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findBySellerId(sellerId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT * FROM withdrawals
      WHERE seller_id = $1
      ORDER BY requested_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, limit, offset]);
    return result.rows;
  }

  static async getAll(limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT w.*,
             u.username as seller_name,
             u.email as seller_email,
             admin.username as processed_by_name
      FROM withdrawals w
      JOIN users u ON w.seller_id = u.id
      LEFT JOIN users admin ON w.processed_by = admin.id
      ORDER BY w.requested_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async getPending(limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT w.*,
             u.username as seller_name,
             u.email as seller_email
      FROM withdrawals w
      JOIN users u ON w.seller_id = u.id
      WHERE w.status = 'pending'
      ORDER BY w.requested_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async updateStatus(withdrawalId, status, processedBy = null) {
    const result = await pool.query(
      `UPDATE withdrawals SET status = $1, processed_at = CURRENT_TIMESTAMP, processed_by = $2 WHERE id = $3 RETURNING *`,
      [status, processedBy, withdrawalId]
    );
    return result.rows[0];
  }

  static async getTotalPending(sellerId) {
    const result = await pool.query(
      'SELECT SUM(amount)::DECIMAL(10,2) as total FROM withdrawals WHERE seller_id = $1 AND status = $2',
      [sellerId, 'pending']
    );
    return result.rows[0]?.total || 0;
  }
}

export default Withdrawal;
