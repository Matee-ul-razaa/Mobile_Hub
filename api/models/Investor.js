const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, default: '' },
  capitalPKR: { type: Number, default: 0 },
  capital: { type: Number, required: true }, // KRW
  monthlyPayoutPKR: { type: Number, default: 0 },
  monthlyPayout: { type: Number, required: true }, // KRW
  startDate: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);
