const express = require('express');
const crypto = require('crypto');
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

const TOKEN_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'mobile-hub-change-this-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Legacy hash support for existing database users.
function legacyHashPwd(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('scrypt$')) {
    const [, salt, hash] = storedHash.split('$');
    const candidate = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(hash, 'hex'));
  }
  return legacyHashPwd(password) === storedHash;
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const parts = token.split('.');  
  if (parts.length < 2) return null;
  const body = parts[0];
  const sig = parts.slice(1).join('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
    req.user = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in again.' });
  }
}

async function ensureSettings() {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create({
      users: {
        nadeem: { name: 'Nadeem', role: 'Admin', pwdHash: hashPassword('admin') },
        bilawal: { name: 'Bilawal', role: 'Admin', pwdHash: hashPassword('admin') },
      },
    });
  }
  if (!setting.users) setting.users = {};
  for (const key of ['nadeem', 'bilawal']) {
    if (!setting.users[key]) {
      setting.users[key] = { name: key === 'nadeem' ? 'Nadeem' : 'Bilawal', role: 'Admin', pwdHash: hashPassword('admin') };
    }
  }
  setting.markModified('users');
  await setting.save();
  return setting;
}

const numberValue = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const nonNegative = (v) => numberValue(v) >= 0;
const positive = (v) => numberValue(v) > 0;

function validateInventory(body) {
  if (!String(body.modelName || '').trim()) return 'Model Name is required';
  if (!nonNegative(body.purchasePrice || 0)) return 'Purchase Price cannot be negative';
  return null;
}

function validateAmount(body, amountField = 'amount') {
  if (!positive(body[amountField])) return `${amountField} must be greater than zero`;
  return null;
}

async function writeActivity(req, action, entity, detail = '', amount = null) {
  try {
    await Activity.create({
      at: new Date().toISOString(),
      user: req.user?.user || 'system',
      action,
      entity,
      detail: String(detail || ''),
      amount,
    });
  } catch (err) {
    console.warn('Activity write failed:', err.message);
  }
}

async function crudList(Model, sort = { createdAt: -1 }) { return Model.find().sort(sort); }

// Public auth endpoint
router.post('/auth/login', async (req, res) => {
  const { user, password } = req.body;
  const username = String(user || '').trim().toLowerCase();
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const setting = await ensureSettings();
    const userData = setting.users[username];
    if (!userData) return res.status(401).json({ error: 'Unknown user' });

    if (!verifyPassword(password, userData.pwdHash)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Upgrade legacy hashes on successful login.
    if (!String(userData.pwdHash || '').startsWith('scrypt$')) {
      setting.users[username].pwdHash = hashPassword(password);
      setting.markModified('users');
      await setting.save();
    }

    const token = signToken({ user: username, role: userData.role || 'Admin', name: userData.name || username });
    res.json({ success: true, token, user: { username, name: userData.name || username, role: userData.role || 'Admin' } });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

router.get('/health', (_req, res) => res.json({ ok: true }));

// All routes below this line require login.
router.use(authRequired);

// Inventory — per-unit (each phone is one document)
router.get('/inventory', async (req, res) => {
  try { res.json(await crudList(Inventory)); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/inventory', async (req, res) => {
  try {
    const error = validateInventory(req.body);
    if (error) return res.status(400).json({ error });

    // Check IMEI1 uniqueness if provided
    const imei1 = String(req.body.imei1 || '').trim();
    if (imei1) {
      const dup = await Inventory.findOne({ imei1 });
      if (dup) return res.status(409).json({ error: `IMEI ${imei1} already exists in inventory.` });
    }

    const item = await Inventory.create({
      ...req.body,
      modelName: String(req.body.modelName).trim(),
      imei1,
      imei2: String(req.body.imei2 || '').trim(),
      status: 'In Stock',
      createdBy: req.user?.user || '',
    });
    await writeActivity(req, 'create', 'inventory', `${item.modelName} ${item.storage} ${item.color}`, item.purchasePrice);
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/inventory/:id', async (req, res) => {
  try {
    const error = validateInventory(req.body);
    if (error) return res.status(400).json({ error });
    const existing = await Inventory.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Inventory item not found' });

    // Check IMEI1 uniqueness if changed
    const imei1 = String(req.body.imei1 || '').trim();
    if (imei1 && imei1 !== existing.imei1) {
      const dup = await Inventory.findOne({ imei1, _id: { $ne: req.params.id } });
      if (dup) return res.status(409).json({ error: `IMEI ${imei1} already exists in inventory.` });
    }

    const updated = await Inventory.findByIdAndUpdate(req.params.id, {
      ...req.body,
      modelName: String(req.body.modelName).trim(),
      imei1,
      imei2: String(req.body.imei2 || '').trim(),
    }, { new: true, runValidators: true });
    await writeActivity(req, 'update', 'inventory', `${updated.modelName} ${updated.storage}`);
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory item not found' });
    if (item.status === 'Sold') return res.status(409).json({ error: 'Cannot delete a sold item. It is linked to a sale record.' });
    await Inventory.findByIdAndDelete(req.params.id);
    await writeActivity(req, 'delete', 'inventory', `${item.modelName} ${item.imei1}`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sales — marks inventory items as Sold
router.get('/sales', async (req, res) => {
  try { res.json(await Sale.find().sort({ date: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/sales', async (req, res) => {
  try {
    if (!String(req.body.buyer || '').trim()) return res.status(400).json({ error: 'Buyer is required' });
    if (!String(req.body.modelName || '').trim()) return res.status(400).json({ error: 'Model is required' });
    if (!positive(req.body.qty)) return res.status(400).json({ error: 'Quantity must be greater than zero' });
    if (!positive(req.body.pricePerUnit)) return res.status(400).json({ error: 'Price per unit must be greater than zero' });
    if (!nonNegative(req.body.received || 0)) return res.status(400).json({ error: 'Received amount cannot be negative' });
    const saleTotal = numberValue(req.body.qty) * numberValue(req.body.pricePerUnit);
    if (numberValue(req.body.received || 0) > saleTotal) return res.status(400).json({ error: 'Received amount cannot exceed total sale value' });

    // If a specific inventory item was selected, mark it as Sold
    if (req.body.inventoryId) {
      const inv = await Inventory.findById(req.body.inventoryId);
      if (inv && inv.status === 'In Stock') {
        inv.status = 'Sold';
        await inv.save();
      }
    }

    const sale = await Sale.create({
      ...req.body,
      createdBy: req.user?.user || '',
    });
    await writeActivity(req, 'create', 'sales', `${sale.buyer} - ${sale.modelName}`, sale.qty * sale.pricePerUnit);
    res.status(201).json(sale);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/sales/:id', async (req, res) => {
  try {
    if (!positive(req.body.qty)) return res.status(400).json({ error: 'Quantity must be greater than zero' });
    if (!positive(req.body.pricePerUnit)) return res.status(400).json({ error: 'Price per unit must be greater than zero' });
    if (!nonNegative(req.body.received || 0)) return res.status(400).json({ error: 'Received amount cannot be negative' });
    const saleTotal = numberValue(req.body.qty) * numberValue(req.body.pricePerUnit);
    if (numberValue(req.body.received || 0) > saleTotal) return res.status(400).json({ error: 'Received amount cannot exceed total sale value' });

    const oldSale = await Sale.findById(req.params.id);
    if (!oldSale) return res.status(404).json({ error: 'Sale not found' });

    // If inventory item changed, restore old and mark new
    if (oldSale.inventoryId && String(oldSale.inventoryId) !== String(req.body.inventoryId || '')) {
      await Inventory.findByIdAndUpdate(oldSale.inventoryId, { status: 'In Stock' });
    }
    if (req.body.inventoryId) {
      await Inventory.findByIdAndUpdate(req.body.inventoryId, { status: 'Sold' });
    }

    const newSale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await writeActivity(req, 'update', 'sales', `${newSale.buyer} - ${newSale.modelName}`);
    res.json(newSale);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    // Restore inventory item to In Stock
    if (sale.inventoryId) {
      await Inventory.findByIdAndUpdate(sale.inventoryId, { status: 'In Stock' });
    }

    await Sale.findByIdAndDelete(req.params.id);
    await writeActivity(req, 'delete', 'sales', `${sale.buyer} - ${sale.modelName}`);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// Generic CRUD with light validation
function crudRoutes(path, Model, options = {}) {
  router.get(path, async (_req, res) => {
    try { res.json(await Model.find().sort(options.sort || { createdAt: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
  });
  router.post(path, async (req, res) => {
    try {
      if (options.validate) {
        const error = await options.validate(req.body, req);
        if (error) return res.status(400).json({ error });
      }
      const created = await Model.create(req.body);
      await writeActivity(req, 'create', path.replace('/', ''), options.detail?.(created) || created.name || created.category || created.source || created.ref || 'item', created.amount || created.amountKRW || null);
      res.status(201).json(created);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });
  router.put(`${path}/:id`, async (req, res) => {
    try {
      if (options.validate) {
        const error = await options.validate(req.body, req, req.params.id);
        if (error) return res.status(400).json({ error });
      }
      const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ error: 'Record not found' });
      await writeActivity(req, 'update', path.replace('/', ''), options.detail?.(updated) || updated.name || updated.category || updated.source || updated.ref || 'item');
      res.json(updated);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });
  router.delete(`${path}/:id`, async (req, res) => {
    try {
      if (options.beforeDelete) {
        const error = await options.beforeDelete(req.params.id);
        if (error) return res.status(409).json({ error });
      }
      const deleted = await Model.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Record not found' });
      await writeActivity(req, 'delete', path.replace('/', ''), options.detail?.(deleted) || deleted.name || deleted.category || deleted.source || deleted.ref || req.params.id);
      res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

crudRoutes('/expenses', Expense, { validate: (b) => !b.date ? 'Date is required' : !String(b.category || '').trim() ? 'Category is required' : validateAmount(b) });
crudRoutes('/cashflow', Cashflow, { validate: (b) => !b.date ? 'Date is required' : !['in', 'out'].includes(b.type) ? 'Type must be in or out' : !String(b.source || '').trim() ? 'Source is required' : validateAmount(b) });
crudRoutes('/investors', Investor, {
  validate: (b) => !String(b.name || '').trim() ? 'Investor name is required' : !nonNegative(b.capital || 0) ? 'Capital cannot be negative' : !nonNegative(b.monthlyPayout || 0) ? 'Monthly payout cannot be negative' : null,
  beforeDelete: async (id) => (await Payout.countDocuments({ investorId: id })) > 0 ? 'Cannot delete investor with payout history.' : null,
});
crudRoutes('/payouts', Payout, { validate: (b) => !b.investorId ? 'Investor is required' : !b.date ? 'Date is required' : validateAmount(b) });
crudRoutes('/owner-investment', OwnerInvestment, { validate: (b) => !b.date ? 'Date is required' : validateAmount(b, 'amountKRW') });
crudRoutes('/shipments', Shipment, { validate: (b) => !(b.date || b.sentDate) ? 'Shipment date is required' : null });

// Hawala / Fazi Cash with linked sale synchronization.
async function applyHawalaToSale(hawala, sign = 1) {
  if (!hawala?.linkedSaleId) return;
  await Sale.findByIdAndUpdate(hawala.linkedSaleId, { $inc: { received: sign * numberValue(hawala.amountKRW) } }, { new: true });
}
router.get('/hawala', async (_req, res) => {
  try { res.json(await Hawala.find().sort({ date: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/hawala', async (req, res) => {
  try {
    if (!req.body.date) return res.status(400).json({ error: 'Date is required' });
    if (!positive(req.body.amountKRW)) return res.status(400).json({ error: 'Amount KRW must be greater than zero' });
    if (!nonNegative(req.body.amountPKR || 0)) return res.status(400).json({ error: 'Amount PKR cannot be negative' });
    if (!String(req.body.buyer || '').trim()) return res.status(400).json({ error: 'Buyer is required' });
    const hawala = await Hawala.create(req.body);
    await applyHawalaToSale(hawala, 1);
    await writeActivity(req, 'create', 'hawala', hawala.buyer, hawala.amountKRW);
    res.status(201).json(hawala);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.put('/hawala/:id', async (req, res) => {
  try {
    const oldHawala = await Hawala.findById(req.params.id);
    if (!oldHawala) return res.status(404).json({ error: 'Hawala record not found' });
    await applyHawalaToSale(oldHawala, -1);
    const updated = await Hawala.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await applyHawalaToSale(updated, 1);
    await writeActivity(req, 'update', 'hawala', updated.buyer, updated.amountKRW);
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/hawala/:id', async (req, res) => {
  try {
    const hawala = await Hawala.findById(req.params.id);
    if (!hawala) return res.status(404).json({ error: 'Hawala record not found' });
    await applyHawalaToSale(hawala, -1);
    await Hawala.findByIdAndDelete(req.params.id);
    await writeActivity(req, 'delete', 'hawala', hawala.buyer, hawala.amountKRW);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Settings
router.get('/settings', async (_req, res) => {
  try { res.json(await ensureSettings()); } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/settings', async (req, res) => {
  try {
    const setting = await ensureSettings();

    if (req.body.users) {
      for (const [key, value] of Object.entries(req.body.users)) {
        const updateData = { ...value };
        if (updateData.password) {
          if (key !== req.user.user) return res.status(403).json({ error: 'You can only change your own password' });
          const existing = setting.users[key];
          if (!verifyPassword(updateData.currentPassword || '', existing?.pwdHash)) return res.status(400).json({ error: 'Current password is incorrect' });
          if (String(updateData.password).length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
          updateData.pwdHash = hashPassword(updateData.password);
          delete updateData.password;
          delete updateData.currentPassword;
        }
        setting.users[key] = { ...(setting.users[key] || {}), ...updateData };
      }
      setting.markModified('users');
      delete req.body.users;
    }

    // Only allow whitelisted fields to prevent mass-assignment
    const allowed = ['businessName', 'owner', 'apiKey', 'aiModel', 'aiProvider'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) setting[field] = req.body[field];
    }
    await setting.save();
    await writeActivity(req, 'update', 'settings', 'Business settings updated');
    res.json(setting);
  } catch (err) {
    console.error('SETTINGS UPDATE ERROR:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/restore-data', async (req, res) => {
  try {
    const b = req.body || {};
    await Promise.all([
      Inventory.deleteMany({}), Sale.deleteMany({}), Expense.deleteMany({}),
      Cashflow.deleteMany({}), Hawala.deleteMany({}), Investor.deleteMany({}),
      Payout.deleteMany({}), OwnerInvestment.deleteMany({}), Shipment.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    if (Array.isArray(b.inventory)) await Inventory.insertMany(b.inventory.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.sales)) await Sale.insertMany(b.sales.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.expenses)) await Expense.insertMany(b.expenses.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.cashflow)) await Cashflow.insertMany(b.cashflow.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.hawala)) await Hawala.insertMany(b.hawala.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.investors)) await Investor.insertMany(b.investors.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.payouts)) await Payout.insertMany(b.payouts.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.ownerInvestments)) await OwnerInvestment.insertMany(b.ownerInvestments.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (Array.isArray(b.shipments)) await Shipment.insertMany(b.shipments.map(({ _id, ...x }) => x), { ordered: false }).catch(() => {});
    if (b.settings) {
      const setting = await ensureSettings();
      Object.assign(setting, { businessName: b.settings.businessName, owner: b.settings.owner, apiKey: b.settings.apiKey, aiModel: b.settings.aiModel });
      await setting.save();
    }
    await writeActivity(req, 'import', 'backup', 'Data restored from backup');
    res.json({ message: 'Data restored' });
  } catch (err) { res.status(400).json({ error: err.message }); }
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

// Activity Log
router.get('/activity', async (req, res) => {
  try {
    const logs = await Activity.find().sort({ createdAt: -1 }).limit(300);
    res.json(logs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/activity', async (req, res) => {
  try {
    const item = await Activity.create({
      at: req.body.at || new Date().toISOString(),
      user: req.body.user || req.user?.user || 'system',
      action: req.body.action || 'system',
      entity: req.body.entity || 'log',
      detail: req.body.detail || '',
      amount: req.body.amount || null,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/activity', async (_req, res) => {
  try {
    await Activity.deleteMany({});
    res.json({ message: 'Activity logs cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
