const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor', required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  amountPKR: { type: Number, default: 0, min: 0 },
  note: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
