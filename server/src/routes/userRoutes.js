const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, updateTarget } = require('../controllers/userController');
const { getTransactions, addTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactionController');

router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/target', updateTarget);

router.get('/transactions', getTransactions);
router.post('/transactions', addTransaction);
router.put('/transactions/:transactionId', updateTransaction);
router.delete('/transactions/:transactionId', deleteTransaction);

module.exports = router;
