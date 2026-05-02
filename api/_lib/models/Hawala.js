const mongoose = require('mongoose');

const hawalaSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amountKRW: { type: Number, required: true, min: 1 },
  amountPKR: { type: Number, default: 0, min: 0 },
  discountKRW: { type: Number, default: 0, min: 0 },
  buyer: { type: String, required: true, trim: true },
  receiverName: { type: String, default: '' },
  receiverPhone: { type: String, default: '' },
  receivedBy: { type: String, default: '' },
  note: { type: String, default: '' },
  linkedSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }
}, { timestamps: true });

module.exports = mongoose.model('Hawala', hawalaSchema);
