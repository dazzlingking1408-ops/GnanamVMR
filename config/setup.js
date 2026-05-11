// config/setup.js
// Run ONCE: node config/setup.js
// Creates all tables and default admin user in SQLite

const bcrypt = require('bcryptjs');
const db     = require('./db');

async function setup() {
  console.log('\n🔧  Setting up VMR SQLite database...\n');

  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅  Table "users" ready');

  // 2. Vehicles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      type       TEXT NOT NULL CHECK(type IN ('car','bike')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed vehicles if empty
  const vCount = db.prepare('SELECT COUNT(*) AS cnt FROM vehicles').get();
  if (vCount.cnt === 0) {
    db.prepare(`INSERT INTO vehicles (name, type) VALUES (?, ?)`).run('Venue', 'car');
    db.prepare(`INSERT INTO vehicles (name, type) VALUES (?, ?)`).run('FZ',    'bike');
    console.log('✅  Vehicles seeded: Venue, FZ');
  } else {
    console.log('✅  Table "vehicles" ready (already seeded)');
  }

  // 3. Records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id  INTEGER NOT NULL,
      date        TEXT    NOT NULL,
      odo         INTEGER NOT NULL,
      rate_per_l  REAL    NOT NULL,
      total_price REAL    NOT NULL,
      cum_price   REAL    NOT NULL DEFAULT 0,
      box_type    TEXT    NOT NULL DEFAULT 'Service'
                          CHECK(box_type IN ('Service','Maintenance','Repair','Inspection')),
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table "records" ready');

  // 4. Record items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS record_items (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      item_name TEXT    NOT NULL,
      item_cost REAL    NOT NULL,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);
  console.log('✅  Table "record_items" ready');

  // 5. Default admin user
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 12);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('\n👤  Default admin user created');
    console.log('    Username : admin');
    console.log('    Password : admin123');
    console.log('    ⚠️  Change this password after first login!\n');
  } else {
    console.log('✅  Admin user already exists');
  }

  console.log('\n🚀  Setup complete! Now run: npm run dev\n');
  process.exit(0);
}

setup().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
