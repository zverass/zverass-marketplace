import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Инициализация БД при запуске
pool.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  );
`).then(result => {
  if (!result.rows[0].exists) {
    console.log('Инициализирую БД...');
    initDatabase();
  }
}).catch(err => console.error('Ошибка проверки БД:', err));

async function initDatabase() {
  try {
    await pool.query(`
      -- Таблица пользователей
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'buyer',
        balance DECIMAL(10, 2) DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0,
        reviews_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица категорий
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица товаров
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INT NOT NULL REFERENCES categories(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending',
        rating DECIMAL(3, 2) DEFAULT 0,
        reviews_count INT DEFAULT 0,
        sales_count INT DEFAULT 0,
        auto_delivery BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица ключей/файлов для автовыдачи
      CREATE TABLE product_keys (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        key_value VARCHAR(500) NOT NULL,
        file_url VARCHAR(500),
        is_used BOOLEAN DEFAULT false,
        used_by INT REFERENCES users(id),
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица заказов
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        promo_code_id INT REFERENCES promo_codes(id),
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        delivered_key VARCHAR(500),
        buyer_phone VARCHAR(20),
        payment_confirmed BOOLEAN DEFAULT false,
        payment_confirmed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица отзывов
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        buyer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица промокодов
      CREATE TABLE promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent INT DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        max_uses INT DEFAULT -1,
        current_uses INT DEFAULT 0,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_by INT NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица запросов на вывод
      CREATE TABLE withdrawals (
        id SERIAL PRIMARY KEY,
        seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        wallet_address VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by INT REFERENCES users(id)
      );

      -- Таблица чата
      CREATE TABLE chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Таблица диалогов чата
      CREATE TABLE chat_dialogs (
        id SERIAL PRIMARY KEY,
        user1_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_id INT REFERENCES chat_messages(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      );

      -- Создание дефолтных категорий
      INSERT INTO categories (name, icon) VALUES
        ('Аккаунты', 'fa-user'),
        ('Игры', 'fa-gamepad'),
        ('Софт', 'fa-laptop'),
        ('Цифровые услуги', 'fa-star'),
        ('Информация', 'fa-book'),
        ('Разное', 'fa-box');

      CREATE INDEX idx_products_seller ON products(seller_id);
      CREATE INDEX idx_products_status ON products(status);
      CREATE INDEX idx_orders_buyer ON orders(buyer_id);
      CREATE INDEX idx_orders_seller ON orders(seller_id);
      CREATE INDEX idx_chat_users ON chat_messages(sender_id, receiver_id);
    `);
    console.log('✅ БД инициализирована успешно');
  } catch (err) {
    console.error('Ошибка инициализации БД:', err);
  }
}

export default pool;
