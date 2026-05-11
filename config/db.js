// config/db.js — JSON file-based database
// Pure Node.js — no compilation, no MySQL, no SQLite binaries needed
// Data is stored in data/vmr.json

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'vmr.json');

/* ── Default empty structure ── */
const DEFAULT = {
  users:    [],
  vehicles: [
    { id: 1, name: 'Venue', type: 'car' },
    { id: 2, name: 'FZ',    type: 'bike' }
  ],
  records:      [],
  record_items: [],
  _meta: { lastRecordId: 0, lastItemId: 0, lastUserId: 0 }
};

/* ── Load database from file ── */
function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT));
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('DB read error — resetting:', e.message);
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

/* ── Save database to file ── */
function save(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

/* ── In-memory database (loaded once on startup) ── */
const db = load();
console.log('✅  JSON database loaded —', DATA_FILE);

/* ── Auto-save helper ── */
db.save = () => save(db);

/* ── ID generators ── */
db.nextUserId    = () => { db._meta.lastUserId++;    db.save(); return db._meta.lastUserId; };
db.nextRecordId  = () => { db._meta.lastRecordId++;  db.save(); return db._meta.lastRecordId; };
db.nextItemId    = () => { db._meta.lastItemId++;    db.save(); return db._meta.lastItemId; };

module.exports = db;
