// config/init.js — runs on every server start
// Creates default admin user if not exists

const bcrypt = require('bcryptjs');
const db     = require('./db');

function init() {
  // Create default admin if no users exist
  const adminExists = db.users.find(u => u.username === 'admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 12);
    const id   = db.nextUserId();
    db.users.push({
      id,
      username:      'admin',
      password_hash: hash,
      created_at:    new Date().toISOString()
    });
    db.save();
    console.log('✅  Default admin created — username: admin / password: admin123');
    console.log('    ⚠️  Change this password after first login!');
  } else {
    console.log('✅  Admin user ready');
  }
  console.log('✅  Database ready —', db.records.length, 'records,', db.users.length, 'user(s)');
}

init();
module.exports = init;
