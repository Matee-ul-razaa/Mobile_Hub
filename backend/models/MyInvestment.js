const mongoose = require('mongoose');

const MyInvestmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true }, // KRW
  source: { type: String, default: 'Personal Savings' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MyInvestment', MyInvestmentSchema);
