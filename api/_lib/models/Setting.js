const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: { type: String, default: 'Mobile Hub' },
  owner: { type: String, default: '' },
  apiKey: { type: String, default: '' }, // For Anthropic
  aiModel: { type: String, default: 'claude-haiku-4-5' },
  users: {
    type: Map,
    of: new mongoose.Schema({
      name: String,
      role: String,
      pwdHash: String
    }),
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
