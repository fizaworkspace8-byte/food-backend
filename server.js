const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./db');

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server after database initialization
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();
    
    // Auto-seed if products table is empty
    const { pool } = require('./db');
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    
    if (products[0].count === 0) {
      console.log('📦 No products found. Running auto-seeder...');
      
      const conn = await pool.getConnection();
      try {
        // Seed categories
        await conn.query(`
          INSERT IGNORE INTO categories (name, description) VALUES
          ('Burgers', 'Premium craft burgers made with the finest ingredients'),
          ('Sides', 'Perfect accompaniments to elevate your meal'),
          ('Drinks', 'Refreshing beverages and artisan shakes'),
          ('Desserts', 'Sweet finales for the discerning palate')
        `);

        const [categories] = await conn.query('SELECT id, name FROM categories');
        const catMap = {};
        categories.forEach(c => { catMap[c.name] = c.id; });

        // Seed products
        await conn.query(`
          INSERT INTO products (name, description, price, image, category_id) VALUES
          ('The Grand Deluxe', 'Wagyu beef, truffle aioli, gold-dusted brioche.', 18.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', ?),
          ('Truffle Fire', 'Spicy wagyu with habanero-infused truffle sauce.', 15.49, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', ?),
          ('Smash Classic', 'Double smashed patties, American cheese, secret sauce.', 12.99, 'https://images.unsplash.com/photo-1572802419224-296b0aeee15d?w=600', ?),
          ('BBQ Royale', 'Pulled pork, smoked gouda, caramelized onions, BBQ glaze.', 16.99, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600', ?),
          ('Mushroom Swiss', 'Sauteed wild mushrooms, Swiss cheese, garlic aioli.', 14.49, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600', ?),
          ('The Vegan Beast', 'Plant-based patty, avocado, pickled jalapenos, chipotle mayo.', 13.99, 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600', ?),
          ('Gold Leaf Fries', 'Twice-fried potatoes dusted in 24k gold leaf.', 9.99, 'https://images.unsplash.com/photo-1630384066252-4237cc737f28?w=600', ?),
          ('Truffle Parmesan Fries', 'Crispy fries tossed in truffle oil and aged parmesan.', 8.49, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600', ?),
          ('Loaded Nachos', 'Tortilla chips with cheese sauce, jalapenos, sour cream.', 10.99, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', ?),
          ('Onion Rings Tower', 'Beer-battered onion rings with chipotle dipping sauce.', 7.99, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600', ?),
          ('Craft Cola', 'Small-batch artisan cola with vanilla and cinnamon.', 4.99, 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600', ?),
          ('Mango Shake', 'Fresh mango blended with vanilla ice cream.', 6.99, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600', ?),
          ('Iced Lemonade', 'Freshly squeezed lemons with mint and honey.', 5.49, 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600', ?),
          ('Chocolate Lava Cake', 'Warm rich chocolate cake with molten center.', 8.99, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600', ?),
          ('New York Cheesecake', 'Creamy classic cheesecake with berry compote.', 7.99, 'https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=600', ?)
        `, [
          catMap['Burgers'], catMap['Burgers'], catMap['Burgers'], catMap['Burgers'], catMap['Burgers'], catMap['Burgers'],
          catMap['Sides'], catMap['Sides'], catMap['Sides'], catMap['Sides'],
          catMap['Drinks'], catMap['Drinks'], catMap['Drinks'],
          catMap['Desserts'], catMap['Desserts']
        ]);

        console.log('✅ Auto-seeded 4 categories and 15 products');
      } finally {
        conn.release();
      }
    }

    app.listen(PORT, () => {
      console.log('----------------------------------------------------');
      console.log(`🚀 SERVER RESTARTED AT: ${new Date().toISOString()}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log('----------------------------------------------------');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
