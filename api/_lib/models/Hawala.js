const mongoose = require('mongoose');

const hawalaSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amountKRW: { type: Number, required: true },
  amountPKR: { type: Number, required: true },
  discountKRW: { type: Number, default: 0 },
  buyer: { type: String, required: true },
  receiverName: { type: String },
  receiverPhone: { type: String },
  receivedBy: { type: String },
  note: { type: String, default: '' },
  linkedSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }
}, { timestamps: true });

module.exports = mongoose.model('Hawala', hawalaSchema);
