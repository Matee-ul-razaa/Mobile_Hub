const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  model: { type: String, required: true },
  brand: { type: String },
  sku: { type: String },
  qty: { type: Number, default: 0 },
  soldQty: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
