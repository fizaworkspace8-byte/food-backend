const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST, 
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Auto-create database and tables on startup
async function initializeDatabase() {
  // First connect without database to create it if needed
  const tempConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'cafe'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempConn.end();

  // Now create all tables
  const conn = await pool.getConnection();
  try {
    // Users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        zip VARCHAR(20) DEFAULT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_code VARCHAR(10) DEFAULT NULL,
        google_id VARCHAR(255) DEFAULT NULL,
        picture VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Categories table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Products table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT DEFAULT NULL,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500) DEFAULT NULL,
        category_id INT DEFAULT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Cart items table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Orders table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(20) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_fee DECIMAL(10,2) DEFAULT 5.99,
        total DECIMAL(10,2) NOT NULL,
        status ENUM('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') DEFAULT 'confirmed',
        shipping_address TEXT DEFAULT NULL,
        shipping_city VARCHAR(100) DEFAULT NULL,
        shipping_zip VARCHAR(20) DEFAULT NULL,
        shipping_phone VARCHAR(20) DEFAULT NULL,
        payment_method VARCHAR(50) DEFAULT 'card',
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
      await conn.query('ALTER TABLE orders ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER user_id');
    } catch (e) {
      // Column might already exist, ignore error
    }

    try {
      await conn.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER verification_code');
    } catch (e) {
      // Column might already exist
    }

    try {
      await conn.query('ALTER TABLE users ADD COLUMN picture VARCHAR(500) DEFAULT NULL AFTER google_id');
    } catch (e) {
      // Column might already exist
    }

    // Order items table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(200) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        product_image VARCHAR(500) DEFAULT NULL,
        quantity INT NOT NULL,
        line_total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Database tables initialized successfully');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initializeDatabase };
