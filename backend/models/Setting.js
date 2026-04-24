const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: { type: String, default: 'Mobile Hub' },
  owner: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
