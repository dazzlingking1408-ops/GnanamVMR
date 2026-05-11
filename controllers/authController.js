// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/* ─────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────── */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = db.users.find(u => u.username === username.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = signToken(user);
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/change-password
───────────────────────────────────────── */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const userIdx = db.users.findIndex(u => u.id === req.user.id);
    if (userIdx === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, db.users[userIdx].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    db.users[userIdx].password_hash = await bcrypt.hash(newPassword, 12);
    db.users[userIdx].updated_at    = new Date().toISOString();
    db.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/* ─────────────────────────────────────────
   GET /api/auth/me
───────────────────────────────────────── */
exports.getMe = (req, res) => {
  try {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({
      success: true,
      user: { id: user.id, username: user.username, created_at: user.created_at }
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
