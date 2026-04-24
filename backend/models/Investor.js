const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  capitalPKR: { type: Number, default: 0 },
  capital: { type: Number, required: true },
  monthlyPayoutPKR: { type: Number, default: 0 },
  monthlyPayout: { type: Number, required: true },
  startDate: { type: String },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);
