import pool from '../config/database.js';

class Order {
  static async create(buyerId, sellerId, productId, quantity, price, totalPrice, promoCodeId = null, discountAmount = 0, buyerPhone = null) {
    const orderNumber = `ZVR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO orders (order_number, buyer_id, seller_id, product_id, quantity, price, total_price, promo_code_id, discount_amount, buyer_phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING *`,
      [orderNumber, buyerId, sellerId, productId, quantity, price, totalPrice, promoCodeId, discountAmount, buyerPhone]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT o.*,
             p.name as product_name,
             p.image_url as product_image,
             u1.username as buyer_name,
             u2.username as seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u1 ON o.buyer_id = u1.id
      JOIN users u2 ON o.seller_id = u2.id
      WHERE o.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findByOrderNumber(orderNumber) {
    const result = await pool.query(`
      SELECT o.*,
             p.name as product_name,
             u1.username as buyer_name,
             u2.username as seller_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u1 ON o.buyer_id = u1.id
      JOIN users u2 ON o.seller_id = u2.id
      WHERE o.order_number = $1
    `, [orderNumber]);
    return result.rows[0];
  }

  static async findByBuyerId(buyerId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT o.*, 
             p.name as product_name,
             p.image_url as product_image,
             u.username as seller_name,
             u.avatar_url as seller_avatar
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [buyerId, limit, offset]);
    return result.rows;
  }

  static async findBySellerId(sellerId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT o.*, 
             p.name as product_name,
             u.username as buyer_name,
             u.avatar_url as buyer_avatar,
             u.email as buyer_email
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, limit, offset]);
    return result.rows;
  }

  static async updateStatus(orderId, status) {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    return result.rows[0];
  }

  static async confirmPayment(orderId, deliveredKey = null) {
    const result = await pool.query(
      `UPDATE orders SET payment_confirmed = true, payment_confirmed_at = CURRENT_TIMESTAMP, status = 'completed', delivered_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [deliveredKey, orderId]
    );
    return result.rows[0];
  }

  static async getStats(sellerId) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        SUM(total_price) as total_revenue
      FROM orders
      WHERE seller_id = $1
    `, [sellerId]);
    return result.rows[0];
  }

  static async getPendingPaymentOrders(limit = 50) {
    const result = await pool.query(`
      SELECT o.*, 
             p.name as product_name,
             u.username as buyer_name
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.status = 'pending' AND o.payment_confirmed = false
      ORDER BY o.created_at ASC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  static async getCompletedCount(sellerId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE seller_id = $1 AND status = $2',
      [sellerId, 'completed']
    );
    return result.rows[0]?.count || 0;
  }

  static async getTotalRevenue(sellerId) {
    const result = await pool.query(
      'SELECT SUM(total_price) as revenue FROM orders WHERE seller_id = $1 AND status = $2',
      [sellerId, 'completed']
    );
    return result.rows[0]?.revenue || 0;
  }
}

export default Order;
