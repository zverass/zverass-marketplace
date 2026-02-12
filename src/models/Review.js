import pool from '../config/database.js';

class Review {
  static async create(orderId, buyerId, sellerId, productId, rating, comment = null) {
    const result = await pool.query(
      `INSERT INTO reviews (order_id, buyer_id, seller_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orderId, buyerId, sellerId, productId, rating, comment]
    );
    return result.rows[0];
  }

  static async findByProductId(productId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT r.*,
             u.username as buyer_name,
             u.avatar_url as buyer_avatar
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [productId, limit, offset]);
    return result.rows;
  }

  static async findBySellerId(sellerId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT r.*,
             u.username as buyer_name,
             p.name as product_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.seller_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, limit, offset]);
    return result.rows;
  }

  static async findByOrderId(orderId) {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE order_id = $1',
      [orderId]
    );
    return result.rows[0];
  }

  static async getAverageRating(productId) {
    const result = await pool.query(
      'SELECT AVG(rating)::DECIMAL(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = $1',
      [productId]
    );
    return result.rows[0];
  }
}

export default Review;
