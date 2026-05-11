// routes/auth.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { login, changePassword, getMe } = require('../controllers/authController');

router.post('/login',           login);
router.get('/me',         auth, getMe);
router.post('/change-password', auth, changePassword);

module.exports = router;
