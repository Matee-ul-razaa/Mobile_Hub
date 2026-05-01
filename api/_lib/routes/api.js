const express = require('express');
const router = express.Router();

const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Cashflow = require('../models/Cashflow');
const Hawala = require('../models/Hawala');
const Investor = require('../models/Investor');
const Payout = require('../models/Payout');
const Setting = require('../models/Setting');
const OwnerInvestment = require('../models/OwnerInvestment');
const Shipment = require('../models/Shipment');
const Activity = require('../models/Activity');

// Helper for tiny hash
function hashPwd(s){
  let h = 5381;
  for(let i=0;i<s.length;i++) h = ((h<<5)+h) + s.charCodeAt(i);
  return (h>>>0).toString(36);
}

// Helper for CRUD
const crudRoutes = (path, Model) => {
  router.get(path, async (req, res) => {
    try { res.json(await Model.find().sort({ createdAt: -1 })); } 
    catch (err) { console.error(`GET ${path} error:`, err); res.status(500).json({ error: err.message }); }
  });
  router.get(`${path}/:id`, async (req, res) => {
    try { res.json(await Model.findById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.post(path, async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); } 
    catch (err) { console.error(`POST ${path} error:`, err); res.status(400).json({ error: err.message }); }
  });
  router.put(`${path}/:id`, async (req, res) => {
    try { res.json(await Model.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { res.status(400).json({ error: err.message }); }
  });
  router.delete(`${path}/:id`, async (req, res) => {
    try { await Model.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
  });
};

crudRoutes('/inventory', Inventory);
crudRoutes('/owner-investment', OwnerInvestment);
crudRoutes('/shipments', Shipment);
crudRoutes('/activity', Activity);
crudRoutes('/expenses', Expense);
crudRoutes('/cashflow', Cashflow);
crudRoutes('/hawala', Hawala);
crudRoutes('/investors', Investor);
crudRoutes('/payouts', Payout);

// Sales CRUD with Inventory Synchronization
router.get('/sales', async (req, res) => {
  try { res.json(await Sale.find().sort({ date: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sales', async (req, res) => {
  try {
    const sale = await Sale.create(req.body);
    const inv = await Inventory.findOne({ model: sale.model });
    if (inv) {
      inv.soldQty += (sale.qty || 0);
      await inv.save();
    }
    res.status(201).json(sale);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const oldSale = await Sale.findById(req.params.id);
    const newSale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (oldSale && newSale && oldSale.model === newSale.model) {
      const diff = (newSale.qty || 0) - (oldSale.qty || 0);
      const inv = await Inventory.findOne({ model: newSale.model });
      if (inv) { inv.soldQty += diff; await inv.save(); }
    } else if (oldSale && newSale && oldSale.model !== newSale.model) {
      const oldInv = await Inventory.findOne({ model: oldSale.model });
      if (oldInv) { oldInv.soldQty -= oldSale.qty; await oldInv.save(); }
      const newInv = await Inventory.findOne({ model: newSale.model });
      if (newInv) { newInv.soldQty += (newSale.qty || 0); await newInv.save(); }
    }
    res.json(newSale);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (sale) {
      const inv = await Inventory.findOne({ model: sale.model });
      if (inv) { inv.soldQty -= (sale.qty || 0); await inv.save(); }
      await Sale.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AUTH
router.post('/auth/login', async (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        users: {
          nadeem: { name: 'Nadeem', role: 'Admin', pwdHash: hashPwd('admin') },
          bilawal: { name: 'Bilawal', role: 'Admin', pwdHash: hashPwd('admin') }
        }
      });
    }

    const userData = setting.users[user];
    if (!userData) {
      // If user is missing from existing settings, add them
      setting.users[user] = { 
        name: user === 'nadeem' ? 'Nadeem' : 'Bilawal', 
        role: 'Admin', 
        pwdHash: hashPwd('admin') 
      };
      setting.markModified('users');
      await setting.save();
      return res.status(401).json({ error: 'Default account created. Please try again with password "admin"' });
    }

    if (hashPwd(password) === userData.pwdHash) {
      res.json({ success: true, user: userData });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({
        users: {
          nadeem: { name: 'Nadeem', role: 'Admin', pwdHash: hashPwd('admin') },
          bilawal: { name: 'Bilawal', role: 'Admin', pwdHash: hashPwd('admin') }
        }
      });
    }
    res.json(setting);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    // Special handling for users map to hash passwords if they are updated
    if (req.body.users) {
      if (!setting.users) setting.users = {};
      for (const [key, value] of Object.entries(req.body.users)) {
        let updateData = { ...value };
        if (updateData.password) {
          updateData.pwdHash = hashPwd(updateData.password);
          delete updateData.password;
        }
        
        setting.users[key] = { ...(setting.users[key] || {}), ...updateData };
      }
      setting.markModified('users');
      delete req.body.users;
    }

    Object.assign(setting, req.body);
    await setting.save();
    res.json(setting);
  } catch (err) { 
    console.error('SETTINGS UPDATE ERROR:', err);
    res.status(400).json({ error: err.message }); 
  }
});

router.post('/reset-all', async (req, res) => {
  try {
    await Promise.all([
      Inventory.deleteMany({}), Sale.deleteMany({}), Expense.deleteMany({}),
      Cashflow.deleteMany({}), Hawala.deleteMany({}), Investor.deleteMany({}),
      Payout.deleteMany({}), OwnerInvestment.deleteMany({}), Shipment.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    res.json({ message: 'All data deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/activity', async (req, res) => {
  try {
    await Activity.deleteMany({});
    res.json({ message: 'Activity logs cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
