import pool from '../config/database.js';

class Chat {
  static async sendMessage(senderId, receiverId, message) {
    const result = await pool.query(
      `INSERT INTO chat_messages (sender_id, receiver_id, message, is_read)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [senderId, receiverId, message]
    );

    // Обновляем или создаем диалог
    await pool.query(`
      INSERT INTO chat_dialogs (user1_id, user2_id, last_message_id, updated_at)
      VALUES (
        LEAST($1, $2),
        GREATEST($1, $2),
        $3,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user1_id, user2_id)
      DO UPDATE SET last_message_id = $3, updated_at = CURRENT_TIMESTAMP
    `, [senderId, receiverId, result.rows[0].id]);

    return result.rows[0];
  }

  static async getMessages(userId1, userId2, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT m.*,
             u1.username as sender_name,
             u1.avatar_url as sender_avatar,
             u2.username as receiver_name
      FROM chat_messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `, [userId1, userId2, limit, offset]);
    
    return result.rows.reverse();
  }

  static async getDialogs(userId, limit = 50, offset = 0) {
    const result = await pool.query(`
      SELECT cd.*,
             CASE 
               WHEN cd.user1_id = $1 THEN cd.user2_id
               ELSE cd.user1_id
             END as other_user_id,
             CASE 
               WHEN cd.user1_id = $1 THEN u2.username
               ELSE u1.username
             END as other_user_name,
             CASE 
               WHEN cd.user1_id = $1 THEN u2.avatar_url
               ELSE u1.avatar_url
             END as other_user_avatar,
             m.message as last_message,
             COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = false THEN 1 END) as unread_count
      FROM chat_dialogs cd
      LEFT JOIN chat_messages m ON cd.last_message_id = m.id
      LEFT JOIN users u1 ON cd.user1_id = u1.id
      LEFT JOIN users u2 ON cd.user2_id = u2.id
      WHERE cd.user1_id = $1 OR cd.user2_id = $1
      GROUP BY cd.id, m.id, u1.username, u2.username, u1.avatar_url, u2.avatar_url
      ORDER BY cd.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return result.rows;
  }

  static async markAsRead(senderId, receiverId) {
    const result = await pool.query(
      `UPDATE chat_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
       RETURNING *`,
      [senderId, receiverId]
    );
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );
    return result.rows[0]?.count || 0;
  }

  static async deleteDialog(userId1, userId2) {
    await pool.query(
      `DELETE FROM chat_messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [userId1, userId2]
    );
    
    const result = await pool.query(
      `DELETE FROM chat_dialogs WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [userId1, userId2]
    );
    return result.rowCount;
  }
}

export default Chat;
