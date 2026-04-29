const express = require('express');
const { pool } = require('../db');
const { sendOrderConfirmationEmail } = require('../utils/email');

const router = express.Router();

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ORD-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      shipping_address, shipping_city, shipping_zip,
      shipping_phone, payment_method, email, items
    } = req.body;

    if (!email || !items || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Missing required information' });
    }

    // Fix: Ensure numbers are calculated with precision
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.price || item.product_price || 0);
      const qty = parseInt(item.quantity || 1);
      return sum + (price * qty);
    }, 0);

    const shippingFee = 5.99;
    const total = parseFloat((subtotal + shippingFee).toFixed(2));
    const orderNumber = generateOrderNumber();

    // Fix: Added shipping_zip to the INSERT statement
    const [orderResult] = await conn.query(
      `INSERT INTO orders (
        order_number, email, subtotal, shipping_fee, total, 
        status, shipping_address, shipping_city, shipping_zip, 
        shipping_phone, payment_method
      ) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?)`,
      [
        orderNumber, email, subtotal, shippingFee, total,
        shipping_address, shipping_city, shipping_zip || '',
        shipping_phone, payment_method || 'cod'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      const price = parseFloat(item.price || item.product_price || 0);
      const lineTotal = parseFloat((price * item.quantity).toFixed(2));

      await conn.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_price, 
          product_image, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id || item.product_id,
          item.name || item.product_name,
          price,
          item.image || item.product_image || null,
          item.quantity,
          lineTotal
        ]
      );
    }

    await conn.commit();
    res.status(201).json({ order_number: orderNumber });

    // Non-blocking email
    sendOrderConfirmationEmail(email, "Customer", { order_number: orderNumber, total })
      .catch(e => console.error("Email Error:", e.message));

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('CRITICAL SERVER ERROR:', err.sqlMessage || err.message);
    res.status(500).json({
      message: 'Order failed',
      error: err.sqlMessage || err.message
    });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;