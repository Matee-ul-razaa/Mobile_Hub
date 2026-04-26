require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
const Sale = require('./models/Sale');
const Expense = require('./models/Expense');
const Cashflow = require('./models/Cashflow');
const Hawala = require('./models/Hawala');
const Investor = require('./models/Investor');
const Payout = require('./models/Payout');
const Setting = require('./models/Setting');

const todayISO = () => new Date().toISOString().slice(0,10);

const defaultData = {
  inventory: [
    { model:'iPhone 15 Pro 256GB', brand:'Apple', sku:'IP15P-256', qty:12, costPerUnit:1650000, soldQty:8, notes:'Space Black'},
    { model:'Samsung S24 Ultra 512GB', brand:'Samsung', sku:'S24U-512', qty:6, costPerUnit:1420000, soldQty:4, notes:''},
  ],
  sales: [
    { date:todayISO(), buyer:'Ali Traders, Karachi', model:'iPhone 15 Pro 256GB', qty:8, pricePerUnit:1820000, received:0, notes:'Pending hawala'},
  ],
  expenses: [
    { date:todayISO(), category:'Shipping', amount:350000, note:'DHL box to Karachi'},
    { date:todayISO(), category:'Packaging', amount:45000, note:''},
  ],
  cashflow: [
    { date:todayISO(), type:'in', amount:2500000, source:'Investor top-up', note:'Initial capital'},
  ],
  hawala: [],
  investors: [
    { name:'Investor 1', contact:'', capitalPKR:2000000, capital:10000000, monthlyPayoutPKR:60000, monthlyPayout:300000, startDate:todayISO(), notes:''},
    { name:'Investor 2', contact:'', capitalPKR:1600000, capital:8000000,  monthlyPayoutPKR:48000, monthlyPayout:240000, startDate:todayISO(), notes:''},
    { name:'Investor 3', contact:'', capitalPKR:1000000, capital:5000000,  monthlyPayoutPKR:30000, monthlyPayout:150000, startDate:todayISO(), notes:''},
    { name:'Investor 4', contact:'', capitalPKR:1000000, capital:5000000,  monthlyPayoutPKR:30000, monthlyPayout:150000, startDate:todayISO(), notes:''},
    { name:'Investor 5', contact:'', capitalPKR:800000,  capital:4000000,  monthlyPayoutPKR:24000, monthlyPayout:120000, startDate:todayISO(), notes:''},
  ],
  payouts: [],
  settings: { businessName: 'Mobile Hub', owner: '' }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    console.log("Clearing existing data...");
    await Inventory.deleteMany({});
    await Sale.deleteMany({});
    await Expense.deleteMany({});
    await Cashflow.deleteMany({});
    await Hawala.deleteMany({});
    await Investor.deleteMany({});
    await Payout.deleteMany({});
    await Setting.deleteMany({});

    console.log("Inserting default data...");
    await Inventory.insertMany(defaultData.inventory);
    await Sale.insertMany(defaultData.sales);
    await Expense.insertMany(defaultData.expenses);
    await Cashflow.insertMany(defaultData.cashflow);
    await Investor.insertMany(defaultData.investors);
    await Setting.create(defaultData.settings);

    console.log("Database seeded successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
