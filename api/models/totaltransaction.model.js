const mongoose = require('mongoose');

const totalAmountTransaction = new mongoose.Schema({
  amount: { type: Number, default: 0 },
});

const TotalTransactions = mongoose.model('totalAmountTransaction', totalAmountTransaction);

module.exports = TotalTransactions;
