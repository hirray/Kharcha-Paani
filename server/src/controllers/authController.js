const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const defaultClasses = [
  { name: 'Food', icon: 'utensils', color: '#f87171', isDefault: true, order: 1 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#60a5fa', isDefault: true, order: 2 },
  { name: 'Recharge', icon: 'smartphone', color: '#34d399', isDefault: true, order: 3 },
  { name: 'Others', icon: 'more-horizontal', color: '#a78bfa', isDefault: true, order: 4 },
];

const register = async (req, res) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(409).json({ success: false, error: 'This phone number is already registered, please log in' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phone,
      passwordHash,
      classes: defaultClasses,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          token: generateToken(user._id),
          user: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            balance: user.balance,
            targetAmount: user.targetAmount,
          }
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+passwordHash');

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      res.json({
        success: true,
        data: {
          token: generateToken(user._id),
          user: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            balance: user.balance,
            targetAmount: user.targetAmount,
          }
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid phone number or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { register, login };
