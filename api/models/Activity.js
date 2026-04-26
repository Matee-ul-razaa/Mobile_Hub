const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  at: { type: String, required: true },
  user: { type: String, required: true }, // nadeem, bilawal
  action: { type: String, required: true }, // create, update, delete, login, import, ai_query
  entity: { type: String, required: true }, // inventory, sale, shipment, etc.
  detail: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
