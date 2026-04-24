const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  amountPKR: { type: Number, default: 0 },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
