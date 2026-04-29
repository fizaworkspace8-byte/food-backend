const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/products — List all available products with category info
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_available = TRUE 
      ORDER BY p.category_id, p.name
    `);

    res.json(products);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
});

// GET /api/products/:id — Get single product details
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(products[0]);
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ message: 'Server error fetching product.' });
  }
});

// GET /api/categories — List all categories
router.get('/categories/all', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    console.error('Categories fetch error:', err);
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
});

module.exports = router;
