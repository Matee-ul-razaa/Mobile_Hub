// Generate Genspark-style ledger Excel from current MongoDB data
// Run with: node scratch/generate_ledger.js

const path = require('path');
const dotenv = require(path.join(__dirname, '..', 'api', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'api', '.env') });

const mongoose = require(path.join(__dirname, '..', 'api', 'node_modules', 'mongoose'));
const xlsx = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'xlsx'));

const Investor        = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Investor'));
const OwnerInvestment = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'OwnerInvestment'));
const Inventory       = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Inventory'));
const Sale            = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Sale'));
const Hawala          = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Hawala'));
const Expense         = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Expense'));
const Payout          = require(path.join(__dirname, '..', 'api', '_lib', 'models', 'Payout'));

const fmt = n => Number(n) || 0;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const [investors, ownerInvs, inventory, sales, hawala, expenses, payouts] = await Promise.all([
    Investor.find().lean(),
    OwnerInvestment.find().lean(),
    Inventory.find().lean(),
    Sale.find().lean(),
    Hawala.find().lean(),
    Expense.find().lean(),
    Payout.find({}).populate('investorId').lean(),
  ]);

  // ─────────────────────────────────────────────────────────────────
  // Build ledger rows: { Description, Debit, Credit, Notes }
  // ─────────────────────────────────────────────────────────────────
  const rows = [];

  rows.push(['Description', 'Debit (KRW)', 'Credit (KRW)', 'Notes']);

  // ===== CREDITS (Money IN) =====
  rows.push(['── CAPITAL & INVESTMENTS (Credits) ──', '', '', '']);

  // Owner investments
  ownerInvs.forEach(o => {
    rows.push([
      `My Investment — ${o.source || 'Personal'} (${o.date})`,
      '',
      fmt(o.amountKRW),
      o.note || `PKR ${fmt(o.amountPKR).toLocaleString()}`,
    ]);
  });

  // Permanent investors
  const permInvestors = investors.filter(i => i.type !== 'Temporary');
  permInvestors.forEach(i => {
    rows.push([
      `${i.name} (Permanent Investor)`,
      '',
      fmt(i.capital),
      `PKR ${fmt(i.capitalPKR).toLocaleString()} | since ${i.startDate || 'N/A'}`,
    ]);
  });

  // Temporary investors
  const tempInvestors = investors.filter(i => i.type === 'Temporary');
  tempInvestors.forEach(i => {
    rows.push([
      `${i.name} (Short-term / Temporary)`,
      '',
      fmt(i.capital),
      `PKR ${fmt(i.capitalPKR).toLocaleString()} | since ${i.startDate || 'N/A'}`,
    ]);
  });

  // Fazi Cash Received from buyers (treat as Credit — phone payments coming in)
  const receivedHawala = hawala.filter(h => h.status !== 'Unreceived');
  rows.push(['── FAZI CASH RECEIVED (Phone Payments) ──', '', '', '']);
  receivedHawala.forEach(h => {
    rows.push([
      `Fazi Cash from ${h.buyer} (${h.date})`,
      '',
      fmt(h.amountKRW),
      `PKR ${fmt(h.amountPKR).toLocaleString()}${h.discountKRW ? ` | discount ${fmt(h.discountKRW).toLocaleString()}` : ''}${h.receiverName ? ` | ${h.receiverName}` : ''}`,
    ]);
  });

  // ===== DEBITS (Money OUT) =====
  rows.push(['── INVENTORY PURCHASES (Debits) ──', '', '', '']);
  inventory.forEach(i => {
    rows.push([
      `${i.modelName} ${i.storage || ''} ${i.color || ''} (${i.date})`.trim(),
      fmt(i.purchasePrice),
      '',
      `${i.status}${i.imei1 ? ` | IMEI ${i.imei1}` : ''}`,
    ]);
  });

  rows.push(['── EXPENSES (Debits) ──', '', '', '']);
  expenses.forEach(e => {
    rows.push([
      `${e.category} (${e.date})`,
      fmt(e.amount),
      '',
      e.note || '',
    ]);
  });

  rows.push(['── INVESTOR PAYOUTS (Debits) ──', '', '', '']);
  payouts.forEach(p => {
    const investorName = p.investorId?.name || 'Unknown';
    rows.push([
      `Payout to ${investorName} (${p.date})`,
      fmt(p.amount),
      '',
      `PKR ${fmt(p.amountPKR).toLocaleString()}${p.note ? ` | ${p.note}` : ''}`,
    ]);
  });

  rows.push(['── FAZI DISCOUNTS GIVEN (Debits) ──', '', '', '']);
  const totalDiscount = receivedHawala.reduce((a, h) => a + fmt(h.discountKRW), 0);
  if (totalDiscount > 0) {
    rows.push([
      'Total Fazi discounts given',
      totalDiscount,
      '',
      `${receivedHawala.filter(h => h.discountKRW > 0).length} entries`,
    ]);
  }

  rows.push(['── FAZI CASH PENDING (Unreceived — Debits) ──', '', '', '']);
  const unrecHawala = hawala.filter(h => h.status === 'Unreceived');
  unrecHawala.forEach(h => {
    const net = Math.max(0, fmt(h.amountKRW) - fmt(h.discountKRW));
    rows.push([
      `Pending Fazi from ${h.buyer} (${h.date})`,
      net,
      '',
      `Net of discount${h.discountKRW ? ` ${fmt(h.discountKRW).toLocaleString()}` : ''}`,
    ]);
  });

  rows.push(['── SALES RECEIVABLES (Debits) ──', '', '', '']);
  const salesReceivables = sales
    .map(s => ({ s, pending: Math.max(0, (fmt(s.qty) * fmt(s.pricePerUnit)) - fmt(s.received)) }))
    .filter(x => x.pending > 0);
  salesReceivables.forEach(({ s, pending }) => {
    rows.push([
      `Sales receivable — ${s.modelName || s.model || 'phone'} ${s.buyer ? '→ ' + s.buyer : ''} (${s.date})`,
      pending,
      '',
      `qty ${s.qty} × ${fmt(s.pricePerUnit).toLocaleString()}, received ${fmt(s.received).toLocaleString()}`,
    ]);
  });

  // ===== TOTALS =====
  let totalDebit = 0, totalCredit = 0;
  for (const r of rows) {
    totalDebit  += fmt(r[1]);
    totalCredit += fmt(r[2]);
  }

  // Cash In Hand = Total Credits − Total Debits (so far). If positive → cash sitting; if negative → deficit.
  const cashInHand = totalCredit - totalDebit;

  rows.push(['', '', '', '']);
  rows.push(['CASH IN HAND', cashInHand < 0 ? cashInHand : '', cashInHand >= 0 ? cashInHand : '', cashInHand >= 0 ? 'Positive — liquid cash position' : 'Negative — short by this amount']);

  rows.push(['', '', '', '']);
  rows.push(['TOTAL', totalDebit + (cashInHand < 0 ? cashInHand : 0), totalCredit + (cashInHand >= 0 ? cashInHand : 0), '']);
  rows.push(['Reconciliation (Credits − Debits − CIH)', '', '', '0 means perfectly balanced']);

  // Write Excel
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 60 },  // Description
    { wch: 18 },  // Debit
    { wch: 18 },  // Credit
    { wch: 50 },  // Notes
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Ledger');

  // Add a Summary sheet
  const totalCapital = investors.reduce((a, i) => a + fmt(i.capital), 0);
  const ownerCapital = ownerInvs.reduce((a, o) => a + fmt(o.amountKRW), 0);
  const hawalaIn = receivedHawala.reduce((a, h) => a + fmt(h.amountKRW), 0);
  const invTotalCost = inventory.reduce((a, i) => a + fmt(i.purchasePrice), 0);
  const totalExp = expenses.reduce((a, e) => a + fmt(e.amount), 0);
  const totalPaid = payouts.reduce((a, p) => a + fmt(p.amount), 0);
  const hawalaPending = unrecHawala.reduce((a, h) => a + Math.max(0, fmt(h.amountKRW) - fmt(h.discountKRW)), 0);
  const pendingReceivable = salesReceivables.reduce((a, x) => a + x.pending, 0);

  const summary = [
    ['Mobile Hub — Ledger Summary', '', `Generated ${new Date().toISOString().slice(0, 10)}`],
    ['', '', ''],
    ['── CASH IN (Credits) ──', '', ''],
    ['Permanent Investor Capital',  permInvestors.reduce((a,i)=>a+fmt(i.capital),0), `${permInvestors.length} investors`],
    ['Temporary Investor Capital',  tempInvestors.reduce((a,i)=>a+fmt(i.capital),0), `${tempInvestors.length} investors`],
    ['Total Investor Capital',      totalCapital, ''],
    ['Owner (My) Investment',       ownerCapital, `${ownerInvs.length} entries`],
    ['Fazi Cash Received',          hawalaIn,     `${receivedHawala.length} entries`],
    ['TOTAL CASH IN',               totalCapital + ownerCapital + hawalaIn, ''],
    ['', '', ''],
    ['── CASH OUT (Debits) ──', '', ''],
    ['Inventory Total Cost',        invTotalCost, `${inventory.length} phones (sold + in stock)`],
    ['Total Expenses',               totalExp,    `${expenses.length} entries`],
    ['Total Payouts',                totalPaid,   `${payouts.length} entries`],
    ['Fazi Discounts Given',         totalDiscount, ''],
    ['Fazi Pending Collect',         hawalaPending, `${unrecHawala.length} entries (net of discount)`],
    ['Sales Receivables',            pendingReceivable, `${salesReceivables.length} entries`],
    ['TOTAL CASH OUT',               invTotalCost + totalExp + totalPaid + totalDiscount + hawalaPending + pendingReceivable, ''],
    ['', '', ''],
    ['── CASH IN HAND ──', '', ''],
    ['CIH = Total Cash IN − Total Cash OUT',
      (totalCapital + ownerCapital + hawalaIn) - (invTotalCost + totalExp + totalPaid + totalDiscount + hawalaPending + pendingReceivable),
      ''],
  ];
  const ws2 = xlsx.utils.aoa_to_sheet(summary);
  ws2['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, ws2, 'Summary');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const outPath = path.join(__dirname, '..', `MobileHub_Ledger_${today}.xlsx`);
  xlsx.writeFile(wb, outPath);

  console.log(`\n✓ Ledger written to: ${outPath}`);
  console.log(`  Total Debit:  ₩${totalDebit.toLocaleString()}`);
  console.log(`  Total Credit: ₩${totalCredit.toLocaleString()}`);
  console.log(`  Cash In Hand: ₩${cashInHand.toLocaleString()}`);

  await mongoose.disconnect();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
