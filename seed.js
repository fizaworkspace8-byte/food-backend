const { pool, initializeDatabase } = require('./db');

async function seedDatabase() {
  try {
    console.log('🌱 Initializing database schema...');
    await initializeDatabase();

    const conn = await pool.getConnection();
    try {
      // Check if products already exist
      const [existingProducts] = await conn.query('SELECT COUNT(*) as count FROM products');
      if (existingProducts[0].count > 0) {
        console.log('📦 Products already seeded. Skipping...');
        return;
      }

      console.log('🍔 Seeding categories...');
      await conn.query(`
        INSERT INTO categories (name, description) VALUES
        ('Burgers', 'Premium craft burgers made with the finest ingredients'),
        ('Sides', 'Perfect accompaniments to elevate your meal'),
        ('Drinks', 'Refreshing beverages and artisan shakes'),
        ('Desserts', 'Sweet finales for the discerning palate')
      `);

      // Get category IDs
      const [categories] = await conn.query('SELECT id, name FROM categories');
      const catMap = {};
      categories.forEach(c => { catMap[c.name] = c.id; });

      console.log('🍔 Seeding products...');
      await conn.query(`
        INSERT INTO products (name, description, price, image, category_id) VALUES
        ('The Grand Deluxe', 'Wagyu beef, truffle aioli, gold-dusted brioche.', 18.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', ?),
        ('Truffle Fire', 'Spicy wagyu with habanero-infused truffle sauce.', 15.49, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', ?),
        ('Smash Classic', 'Double smashed patties, American cheese, secret sauce.', 12.99, 'https://images.unsplash.com/photo-1572802419224-296b0aeee15d?w=600', ?),
        ('BBQ Royale', 'Pulled pork, smoked gouda, caramelized onions, BBQ glaze.', 16.99, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600', ?),
        ('Mushroom Swiss', 'Sautéed wild mushrooms, Swiss cheese, garlic aioli.', 14.49, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600', ?),
        ('The Vegan Beast', 'Plant-based patty, avocado, pickled jalapeños, chipotle mayo.', 13.99, 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600', ?),
        ('Gold Leaf Fries', 'Twice-fried potatoes dusted in 24k gold leaf.', 9.99, 'https://images.unsplash.com/photo-1630384066252-4237cc737f28?w=600', ?),
        ('Truffle Parmesan Fries', 'Crispy fries tossed in truffle oil and aged parmesan.', 8.49, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600', ?),
        ('Loaded Nachos', 'Tortilla chips with cheese sauce, jalapeños, sour cream.', 10.99, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', ?),
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

      console.log('✅ Database seeded successfully!');
      console.log('   - 4 categories');
      console.log('   - 15 products (6 burgers, 4 sides, 3 drinks, 2 desserts)');
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
