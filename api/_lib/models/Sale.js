const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date:         { type: String, required: true },
  buyer:        { type: String, required: true, trim: true },
  inventoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  modelName:    { type: String, required: true, trim: true },
  storage:      { type: String, trim: true, default: '' },
  color:        { type: String, trim: true, default: '' },
  imei1:        { type: String, trim: true, default: '' },
  qty:          { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true, min: 1 },
  received:     { type: Number, default: 0, min: 0 },
  shipmentId:   { type: String, default: '' },
  notes:        { type: String, default: '' },
  createdBy:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
