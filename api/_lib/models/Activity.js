const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  at: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  detail: { type: String, default: '' },
  amount: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
