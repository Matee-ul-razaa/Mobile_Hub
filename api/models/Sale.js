const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: String, required: true },
  buyer: { type: String, required: true },
  model: { type: String, required: true },
  qty: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  received: { type: Number, default: 0 },
  shipmentId: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
