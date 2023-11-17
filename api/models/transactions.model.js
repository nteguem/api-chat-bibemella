const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  operator: { type: String, required: true, },
  transactionId: { type: String, required: true, unique: true},
  status: { type: String, required: true, },
  amount: { type: Number, required: true, },
  transactionNumber: { type: String, required: true, },
  userNumber: { type: String, required: true, },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productservices' },
  optionId: { type: String },
  isOption: { type: Boolean, default: false},
});

const Transactions = mongoose.model('transactions', transactionSchema);

module.exports = Transactions;
