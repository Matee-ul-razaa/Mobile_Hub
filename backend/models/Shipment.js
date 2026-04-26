const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  ref: { type: String, default: '' },
  courier: { type: String, default: 'DHL' },
  status: { type: String, default: 'Preparing' }, // Preparing, Shipped, In Transit, Delivered, Issue
  trackingNumber: { type: String, default: '' },
  arrivedDate: { type: String, default: '' },
  shippingCost: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
