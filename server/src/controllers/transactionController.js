const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.id }).sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addTransaction = async (req, res) => {
  try {
    const { type, adjustmentKind, amount, classId, description } = req.body;
    const user = await User.findById(req.params.id);
    
    let newBalance = user.balance;
    if (type === 'spent') newBalance -= amount;
    else if (type === 'earned') newBalance += amount;
    else if (type === 'adjustment') {
      if (adjustmentKind === 'add') newBalance += amount;
      else if (adjustmentKind === 'subtract') newBalance -= amount;
      else if (adjustmentKind === 'update') newBalance = amount;
    }
    
    const transaction = await Transaction.create({
      userId: req.params.id,
      type,
      adjustmentKind,
      amount,
      classId,
      description,
      balanceAfter: newBalance
    });

    user.balance = newBalance;
    await user.save();

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    
    if (transaction.userId.toString() !== id) return res.status(403).json({ success: false, error: 'Unauthorized' });

    const user = await User.findById(id);
    if (transaction.type === 'spent') {
      user.balance += transaction.amount;
    } else if (transaction.type === 'earned') {
      user.balance -= transaction.amount;
    } else if (transaction.type === 'adjustment') {
      if (transaction.adjustmentKind === 'add') user.balance -= transaction.amount;
      else if (transaction.adjustmentKind === 'subtract') user.balance += transaction.amount;
    }

    await transaction.deleteOne();
    await user.save();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    const { amount, description, classId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (transaction.userId.toString() !== id) return res.status(403).json({ success: false, error: 'Unauthorized' });

    if (amount !== undefined && amount !== transaction.amount) {
      const user = await User.findById(id);
      const diff = amount - transaction.amount;
      
      if (transaction.type === 'spent') {
        user.balance -= diff;
      } else if (transaction.type === 'earned') {
        user.balance += diff;
      } else if (transaction.type === 'adjustment') {
        if (transaction.adjustmentKind === 'add') user.balance += diff;
        else if (transaction.adjustmentKind === 'subtract') user.balance -= diff;
      }
      
      transaction.amount = amount;
      await user.save();
    }
    
    if (description !== undefined) transaction.description = description;
    if (classId !== undefined) transaction.classId = classId;
    
    await transaction.save();
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
