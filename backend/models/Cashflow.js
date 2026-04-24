const mongoose = require('mongoose');

const cashflowSchema = new mongoose.Schema({
  date: { type: String, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Cashflow', cashflowSchema);
