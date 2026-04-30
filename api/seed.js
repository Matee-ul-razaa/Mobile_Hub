require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobile_hub';

const activitySchema = new mongoose.Schema({ at: Date, user: String, action: String, entity: String, detail: String });
const Activity = mongoose.model('Activity', activitySchema);

const inventorySchema = new mongoose.Schema({ model: String, brand: String, sku: String, qty: Number, costPerUnit: Number, soldQty: Number, notes: String });
const Inventory = mongoose.model('Inventory', inventorySchema);

const saleSchema = new mongoose.Schema({ date: String, buyer: String, model: String, qty: Number, pricePerUnit: Number, received: Number, notes: String, shipmentId: String });
const Sale = mongoose.model('Sale', saleSchema);

const expenseSchema = new mongoose.Schema({ date: String, category: String, amount: Number, note: String });
const Expense = mongoose.model('Expense', expenseSchema);

const cashflowSchema = new mongoose.Schema({ date: String, type: String, amount: Number, source: String, note: String });
const Cashflow = mongoose.model('Cashflow', cashflowSchema);

const hawalaSchema = new mongoose.Schema({ date: String, buyer: String, amountPKR: Number, amountKRW: Number, discountKRW: Number, receiverName: String, note: String });
const Hawala = mongoose.model('Hawala', hawalaSchema);

const investorSchema = new mongoose.Schema({ name: String, contact: String, capitalPKR: Number, capital: Number, monthlyPayoutPKR: Number, monthlyPayout: Number, startDate: String, notes: String });
const Investor = mongoose.model('Investor', investorSchema);

const payoutSchema = new mongoose.Schema({ investorId: String, date: String, amount: Number, amountPKR: Number, note: String });
const Payout = mongoose.model('Payout', payoutSchema);

const ownerInvestmentSchema = new mongoose.Schema({ date: String, amountKRW: Number, amountPKR: Number, source: String, note: String });
const OwnerInvestment = mongoose.model('OwnerInvestment', ownerInvestmentSchema);

const shipmentSchema = new mongoose.Schema({ date: String, ref: String, courier: String, status: String, arrivedDate: String, shippingCost: Number, notes: String });
const Shipment = mongoose.model('Shipment', shipmentSchema);

const settingsSchema = new mongoose.Schema({ businessName: String, owner: String });
const Settings = mongoose.model('Settings', settingsSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected for seeding...');

  // Clear existing
  await Promise.all([
    Inventory.deleteMany({}), Sale.deleteMany({}), Expense.deleteMany({}),
    Cashflow.deleteMany({}), Hawala.deleteMany({}), Investor.deleteMany({}),
    Payout.deleteMany({}), OwnerInvestment.deleteMany({}), Shipment.deleteMany({}),
    Activity.deleteMany({}), Settings.deleteMany({})
  ]);

  // Seed exactly as HTML
  await Inventory.create([
    { model: 'iPhone 15 Pro 256GB', brand: 'Apple', sku: 'IP15P-256', qty: 12, costPerUnit: 1650000, soldQty: 8, notes: 'Space Black' },
    { model: 'Samsung S24 Ultra 512GB', brand: 'Samsung', sku: 'S24U-512', qty: 6, costPerUnit: 1420000, soldQty: 4, notes: '' }
  ]);

  await Sale.create([
    { date: new Date().toISOString().slice(0, 10), buyer: 'Ali Traders, Karachi', model: 'iPhone 15 Pro 256GB', qty: 8, pricePerUnit: 1820000, received: 0, notes: 'Pending hawala' }
  ]);

  await Expense.create([
    { date: new Date().toISOString().slice(0, 10), category: 'Shipping', amount: 350000, note: 'DHL box to Karachi' },
    { date: new Date().toISOString().slice(0, 10), category: 'Packaging', amount: 45000, note: '' }
  ]);

  await Cashflow.create([
    { date: new Date().toISOString().slice(0, 10), type: 'in', amount: 2500000, source: 'Investor top-up', note: 'Initial capital' }
  ]);

  await Investor.create([
    { name: 'Investor 1', contact: '', capitalPKR: 2000000, capital: 10000000, monthlyPayoutPKR: 60000, monthlyPayout: 300000, startDate: new Date().toISOString().slice(0, 10), notes: '' },
    { name: 'Investor 2', contact: '', capitalPKR: 1600000, capital: 8000000, monthlyPayoutPKR: 48000, monthlyPayout: 240000, startDate: new Date().toISOString().slice(0, 10), notes: '' },
    { name: 'Investor 3', contact: '', capitalPKR: 1000000, capital: 5000000, monthlyPayoutPKR: 30000, monthlyPayout: 150000, startDate: new Date().toISOString().slice(0, 10), notes: '' },
    { name: 'Investor 4', contact: '', capitalPKR: 1000000, capital: 5000000, monthlyPayoutPKR: 30000, monthlyPayout: 150000, startDate: new Date().toISOString().slice(0, 10), notes: '' },
    { name: 'Investor 5', contact: '', capitalPKR: 800000, capital: 4000000, monthlyPayoutPKR: 24000, monthlyPayout: 120000, startDate: new Date().toISOString().slice(0, 10), notes: '' }
  ]);

  await Settings.create({ businessName: 'Mobile Hub', owner: '' });

  console.log('Seeding complete with exact HTML data.');
  process.exit();
}

seed();
