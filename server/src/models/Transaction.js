const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['spent', 'earned', 'adjustment'], required: true },
  adjustmentKind: { type: String, enum: ['add', 'subtract', 'update'] },
  amount: { type: Number, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  balanceAfter: { type: Number, required: true },
  date: { type: Date, default: Date.now, required: true }
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
