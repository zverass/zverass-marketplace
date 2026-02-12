import pool from '../config/database.js';

class Product {
  static async create(sellerId, categoryId, name, description, price, imageUrl, autoDelivery = false) {
    const result = await pool.query(
      `INSERT INTO products (seller_id, category_id, name, description, price, image_url, auto_delivery, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [sellerId, categoryId, name, description, price, imageUrl, autoDelivery]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT p.*, 
             u.username as seller_name, 
             u.avatar_url as seller_avatar,
             u.rating as seller_rating,
             c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async findBySellerId(sellerId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, limit, offset]);
    return result.rows;
  }

  static async getAllApproved(limit = 50, offset = 0, categoryId = null, search = null) {
    let query = `
      SELECT p.*, 
             u.username as seller_name, 
             u.avatar_url as seller_avatar,
             c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'approved'
    `;
    const params = [];

    if (categoryId) {
      params.push(categoryId);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getPending(limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT p.*, u.username as seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  static async updateStatus(productId, status) {
    const result = await pool.query(
      `UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, productId]
    );
    return result.rows[0];
  }

  static async update(productId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(productId);
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(productId) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [productId]);
    return result.rows[0];
  }

  static async updateRating(productId) {
    const result = await pool.query(`
      UPDATE products 
      SET rating = COALESCE((SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE product_id = $1), 0),
          reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
      WHERE id = $1
      RETURNING rating, reviews_count
    `, [productId]);
    return result.rows[0];
  }

  static async incrementSalesCount(productId) {
    const result = await pool.query(
      'UPDATE products SET sales_count = sales_count + 1 WHERE id = $1 RETURNING sales_count',
      [productId]
    );
    return result.rows[0]?.sales_count;
  }

  static async getBestSelling(limit = 10) {
    const result = await pool.query(`
      SELECT p.*, 
             u.username as seller_name, 
             u.avatar_url as seller_avatar,
             c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'approved'
      ORDER BY p.sales_count DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  }

  static async getByCategory(categoryId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT p.*, 
             u.username as seller_name, 
             u.avatar_url as seller_avatar,
             c.name as category_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 AND p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [categoryId, limit, offset]);
    return result.rows;
  }
}

export default Product;
