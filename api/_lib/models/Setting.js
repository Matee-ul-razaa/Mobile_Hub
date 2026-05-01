const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: { type: String, default: 'Mobile Hub' },
  owner: { type: String, default: '' },
  apiKey: { type: String, default: '' }, // For Anthropic
  aiModel: { type: String, default: 'claude-haiku-4-5' },
  users: {
    type: Object,
    default: {
      nadeem: { name: 'Nadeem', role: 'Admin', pwdHash: '6j6l3m' }, // 'admin' hash
      bilawal: { name: 'Bilawal', role: 'Admin', pwdHash: '6j6l3m' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
