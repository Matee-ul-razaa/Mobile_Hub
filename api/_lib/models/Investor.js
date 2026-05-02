const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String, default: '' },
  capitalPKR: { type: Number, default: 0, min: 0 },
  capital: { type: Number, required: true, min: 0 },
  monthlyPayoutPKR: { type: Number, default: 0, min: 0 },
  monthlyPayout: { type: Number, required: true, min: 0 },
  startDate: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Investor', investorSchema);
