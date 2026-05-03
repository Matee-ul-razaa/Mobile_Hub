const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  date: { type: String, required: true },
  sentDate: { type: String, default: '' },
  ref: { type: String, default: '' },
  id: { type: String, default: '' },
  courier: { type: String, default: 'DHL' },
  status: { type: String, default: 'Preparing' },
  trackingNumber: { type: String, default: '' },
  trackingNum: { type: String, default: '' },
  destination: { type: String, default: '' },
  arrivedDate: { type: String, default: '' },
  shippingCost: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '' },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

shipmentSchema.pre('validate', function() {
  if (!this.date && this.sentDate) this.date = this.sentDate;
  if (!this.sentDate && this.date) this.sentDate = this.date;
  if (!this.trackingNumber && this.trackingNum) this.trackingNumber = this.trackingNum;
  if (!this.trackingNum && this.trackingNumber) this.trackingNum = this.trackingNumber;
});

module.exports = mongoose.model('Shipment', shipmentSchema);
