const mongoose = require('mongoose');

// Models
const Inventory = require('./_lib/models/Inventory');
const Expense = require('./_lib/models/Expense');
const Hawala = require('./_lib/models/Hawala');
const Investor = require('./_lib/models/Investor');
const Payout = require('./_lib/models/Payout');
const OwnerInvestment = require('./_lib/models/OwnerInvestment');
const Cashflow = require('./_lib/models/Cashflow');
const BuyerPayment = require('./_lib/models/BuyerPayment');

const uri = 'mongodb+srv://BilawalHaider:Bilawal0609.@cluster0.cs7qy8q.mongodb.net/mobile_hub?appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  const inventory = await Inventory.find();
  const expenses = await Expense.find();
  const hawala = await Hawala.find();
  const investors = await Investor.find();
  const payouts = await Payout.find();
  const ownerInvestments = await OwnerInvestment.find();
  const cashflow = await Cashflow.find();
  
  const inStock = inventory.filter(x => x.status === 'In Stock');
  const invValue = inStock.reduce((a, x) => a + (Number(x.purchasePrice) || 0), 0);
  
  const manualCashIn = cashflow.filter(c=>c.type==='in').reduce((a,x)=>a+x.amount,0);
  const manualCashOut = cashflow.filter(c=>c.type==='out').reduce((a,x)=>a+x.amount,0);
  const receivedHawala = hawala.filter(h => h.status !== 'Unreceived');
  const hawalaIn = receivedHawala.reduce((a,x)=>a+(+x.amountKRW||0),0);
  const hawalaDiscount = receivedHawala.reduce((a,x)=>a+(+x.discountKRW||0),0);
  
  const totalCapital = investors.reduce((a,x)=>a+(+x.capital||0),0);
  const ownerCapital = ownerInvestments.reduce((a,x)=>a+(+x.amountKRW||0),0);
  
  const totalExp = expenses.reduce((a,x)=>a+x.amount,0);
  const totalPaid = payouts.reduce((a,x)=>a+(+x.amount||0),0);
  const invTotalCost = inventory.reduce((a, x) => a + (Number(x.purchasePrice) || 0), 0);

  const totalCashIn = ownerCapital + totalCapital + hawalaIn + manualCashIn;
  const totalCashOut = invTotalCost + totalExp + totalPaid + hawalaDiscount + manualCashOut;
  const cashInHand = totalCashIn - totalCashOut;

  console.log('--- CIH DIAGNOSTICS ---');
  console.log('Total Cash In:', totalCashIn);
  console.log('  Owner Capital:', ownerCapital);
  console.log('  Investor Capital:', totalCapital);
  console.log('  Hawala In:', hawalaIn);
  console.log('  Manual Cash In:', manualCashIn);
  
  console.log('\nTotal Cash Out:', totalCashOut);
  console.log('  Inventory Total Cost (ALL phones ever):', invTotalCost);
  console.log('  Inventory Value (In Stock Only):', invValue);
  console.log('  Total Expenses:', totalExp);
  console.log('  Total Investor Payouts:', totalPaid);
  console.log('  Hawala Discounts:', hawalaDiscount);
  console.log('  Manual Cash Out:', manualCashOut);
  
  console.log('\nCALCULATED CIH:', cashInHand);
  process.exit(0);
}
run();
