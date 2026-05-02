const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  model: { type: String, required: true, trim: true, unique: true },
  brand: { type: String, trim: true, default: '' },
  sku: { type: String, trim: true, default: '' },
  qty: { type: Number, default: 0, min: 0 },
  soldQty: { type: Number, default: 0, min: 0 },
  costPerUnit: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
