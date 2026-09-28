const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, classes } = req.body;
    if (phone && phone !== req.user.phone) {
       const existing = await User.findOne({ phone });
       if (existing) return res.status(409).json({ success: false, error: 'Phone already in use' });
    }
    const updateData = { name, phone };
    if (classes) updateData.classes = classes;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTarget = async (req, res) => {
  try {
    const { targetAmount } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { targetAmount }, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getProfile, updateProfile, updateTarget };
