const mongoose = require('mongoose');

const ownerInvestmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amountKRW: { type: Number, required: true },
  amountPKR: { type: Number, default: 0 },
  source: { type: String, default: 'Personal savings' },
  note: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('OwnerInvestment', ownerInvestmentSchema);
