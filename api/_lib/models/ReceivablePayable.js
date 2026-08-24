const mongoose = require('mongoose');

const rpSchema = new mongoose.Schema({
  date: { type: String, required: true },
  type: { type: String, enum: ['Receivable', 'Payable'], required: true },
  party: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Settled'], default: 'Pending' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ReceivablePayable', rpSchema);
