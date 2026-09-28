const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

router.post('/signup', authLimiter, register);
router.post('/login', authLimiter, login);

module.exports = router;
