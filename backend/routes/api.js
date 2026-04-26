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

// Helper for tiny hash (same as HTML version for consistency)
function hashPwd(s){
  let h = 5381;
  for(let i=0;i<s.length;i++) h = ((h<<5)+h) + s.charCodeAt(i);
  return (h>>>0).toString(36);
}

// Helper to define basic CRUD
const crudRoutes = (path, Model) => {
  router.get(path, async (req, res) => {
    try { res.json(await Model.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.get(`${path}/:id`, async (req, res) => {
    try { res.json(await Model.findById(req.params.id)); } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.post(path, async (req, res) => {
    try { res.status(201).json(await Model.create(req.body)); } catch (err) { res.status(400).json({ error: err.message }); }
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
      if (inv) {
        inv.soldQty += diff;
        await inv.save();
      }
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
      if (inv) {
        inv.soldQty -= (sale.qty || 0);
        await inv.save();
      }
      await Sale.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

crudRoutes('/expenses', Expense);
crudRoutes('/cashflow', Cashflow);
crudRoutes('/hawala', Hawala);
crudRoutes('/investors', Investor);
crudRoutes('/payouts', Payout);

// AUTH
router.post('/auth/login', async (req, res) => {
  const { user, password } = req.body;
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
    const userData = setting.users.get(user);
    if (!userData) return res.status(404).json({ error: 'User not found' });
    if (hashPwd(password) === userData.pwdHash) {
      res.json({ success: true, user: userData });
    } else {
      res.status(401).json({ error: 'Incorrect password' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/auth/change-password', async (req, res) => {
  const { user, oldPwd, newPwd } = req.body;
  try {
    let setting = await Setting.findOne();
    const userData = setting.users.get(user);
    if (hashPwd(oldPwd) === userData.pwdHash) {
      userData.pwdHash = hashPwd(newPwd);
      setting.users.set(user, userData);
      await setting.save();
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Incorrect current password' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/auth/reset', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (setting) {
      setting.users = {
        nadeem: { name: 'Nadeem', role: 'Admin', pwdHash: hashPwd('admin') },
        bilawal: { name: 'Bilawal', role: 'Admin', pwdHash: hashPwd('admin') }
      };
      await setting.save();
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Settings
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
    if (setting) {
      Object.assign(setting, req.body);
      await setting.save();
      res.json(setting);
    } else {
      res.json(await Setting.create(req.body));
    }
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Bulk Import and Reset
router.post('/bulk-import', async (req, res) => {
  const { table, data } = req.body;
  try {
    let Model;
    if (table === 'inventory') Model = Inventory;
    else if (table === 'sales') Model = Sale;
    else if (table === 'expenses') Model = Expense;
    else if (table === 'cashflow') Model = Cashflow;
    else if (table === 'hawala') Model = Hawala;
    else if (table === 'investors') Model = Investor;
    else if (table === 'payouts') Model = Payout;
    else if (table === 'owner-investment') Model = OwnerInvestment;
    else if (table === 'shipments') Model = Shipment;
    
    if (!Model) return res.status(400).json({ error: 'Invalid table' });
    const saved = await Model.insertMany(data);
    res.json({ message: `Imported ${saved.length} items`, count: saved.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reset-all', async (req, res) => {
  try {
    await Promise.all([
      Inventory.deleteMany({}),
      Sale.deleteMany({}),
      Expense.deleteMany({}),
      Cashflow.deleteMany({}),
      Hawala.deleteMany({}),
      Investor.deleteMany({}),
      Payout.deleteMany({}),
      OwnerInvestment.deleteMany({}),
      Shipment.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    res.json({ message: 'All data deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
