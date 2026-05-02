const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  modelName:    { type: String, required: true, trim: true },
  modelNumber:  { type: String, trim: true, default: '' },
  storage:      { type: String, trim: true, default: '' },
  color:        { type: String, trim: true, default: '' },
  imei1:        { type: String, trim: true, default: '' },
  imei2:        { type: String, trim: true, default: '' },
  purchasePrice:{ type: Number, default: 0, min: 0 },
  notes:        { type: String, default: '' },
  status:       { type: String, enum: ['In Stock', 'Sold'], default: 'In Stock' },
  createdBy:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
