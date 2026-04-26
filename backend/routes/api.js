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
const MyInvestment = require('../models/MyInvestment');

// Helper to define basic CRUD
const crudRoutes = (path, Model) => {
  // Get all
  router.get(path, async (req, res) => {
    try {
      const data = await Model.find().sort({ createdAt: -1 });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get by ID
  router.get(`${path}/:id`, async (req, res) => {
    try {
      const data = await Model.findById(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create
  router.post(path, async (req, res) => {
    try {
      const newData = new Model(req.body);
      const saved = await newData.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update
  router.put(`${path}/:id`, async (req, res) => {
    try {
      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete
  router.delete(`${path}/:id`, async (req, res) => {
    try {
      await Model.findByIdAndDelete(req.params.id);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
};

crudRoutes('/inventory', Inventory);
crudRoutes('/owner-investment', OwnerInvestment);

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
      // Model changed
      const oldInv = await Inventory.findOne({ model: oldSale.model });
      if (oldInv) { oldInv.soldQty -= oldSale.qty; await oldInv.save(); }
      const newInv = await Inventory.findOne({ model: newSale.model });
      if (newInv) { newInv.soldQty += newSale.qty; await newInv.save(); }
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

// Settings has slightly different logic (usually a singleton)
router.get('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ businessName: 'Mobile Hub', owner: '' });
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (setting) {
      setting.businessName = req.body.businessName;
      setting.owner = req.body.owner;
      await setting.save();
    } else {
      setting = await Setting.create(req.body);
    }
    res.json(setting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

    if (!Model) return res.status(400).json({ error: 'Invalid table' });

    const saved = await Model.insertMany(data);
    res.json({ message: `Imported ${saved.length} items`, count: saved.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    ]);
    res.json({ message: 'All data deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
