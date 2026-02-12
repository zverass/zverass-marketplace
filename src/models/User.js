import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  static async create(username, email, password, role = 'buyer') {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, balance, created_at',
      [username, email, hashedPassword, role]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, username, email, role, balance, rating, reviews_count, avatar_url, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  static async updateBalance(userId, amount) {
    const result = await pool.query(
      'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING balance',
      [amount, userId]
    );
    return result.rows[0]?.balance;
  }

  static async getBalance(userId) {
    const result = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.balance || 0;
  }

  static async updateProfile(userId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, username, email, role, balance, rating, avatar_url`,
      values
    );
    return result.rows[0];
  }

  static async updateRating(userId) {
    const result = await pool.query(`
      UPDATE users 
      SET rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE seller_id = $1), 0),
          reviews_count = (SELECT COUNT(*) FROM reviews WHERE seller_id = $1)
      WHERE id = $1
      RETURNING rating, reviews_count
    `, [userId]);
    return result.rows[0];
  }

  static async getAllSellers(limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT id, username, avatar_url, rating, reviews_count, 
             (SELECT COUNT(*) FROM products WHERE seller_id = users.id AND status = 'approved') as products_count
      FROM users 
      WHERE role = 'seller'
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }
}

export default User;
