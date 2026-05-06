const mongoose = require('mongoose');

const buyerPaymentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  buyer: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, default: 'Cash' },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  linkedHawalaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hawala' }
}, { timestamps: true });

module.exports = mongoose.model('BuyerPayment', buyerPaymentSchema);
