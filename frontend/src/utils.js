export const fmtKRW = n => {
  const val = Number(n) || 0;
  return (val < 0 ? '-' : '') + '₩' + Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
};
export const fmtNum = n => (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const todayISO = () => new Date().toISOString().slice(0,10);
export const ym = d => (d||todayISO()).slice(0,7);
export const userName = u => u === 'nadeem' ? 'Nadeem' : u === 'bilawal' ? 'Bilawal' : u;
export const userBadge = u => u;

export const agg = (data) => {
  const inventory = data.inventory || [];
  const sales = data.sales || [];
  const expenses = data.expenses || [];
  const hawala = data.hawala || [];
  const investors = data.investors || [];
  const payouts = data.payouts || [];
  const ownerInvestments = data.ownerInvestments || [];
  const cashflow = data.cashflow || [];

  // Per-unit inventory: each item is one phone
  const inStock = inventory.filter(x => x.status === 'In Stock');
  const invValue = inStock.reduce((a, x) => a + (Number(x.purchasePrice) || 0), 0);
  const invUnits = inStock.length;
  const salesRev = sales.reduce((a,x)=> a + x.qty * x.pricePerUnit, 0);
  const salesUnits = sales.reduce((a,x)=> a + (Number(x.qty)||0), 0);
  
  // COGS: find purchase price from inventory for each sale
  const salesCOGS = sales.reduce((a,x)=>{
    // Try to find the linked inventory item
    let cost = 0;
    if (x.inventoryId) {
      const item = inventory.find(i => i._id === x.inventoryId);
      cost = item ? (Number(item.purchasePrice) || 0) : 0;
    } else {
      // Fallback: match by modelName + imei1
      const item = inventory.find(i => i.modelName === (x.modelName || x.model) && (x.imei1 ? i.imei1 === x.imei1 : true));
      cost = item ? (Number(item.purchasePrice) || 0) : 0;
    }
    return a + x.qty * cost;
  }, 0);

  const grossProfit = salesRev - salesCOGS;
  const totalExp = expenses.reduce((a,x)=>a+x.amount,0);
  const netProfit = grossProfit - totalExp;
  
  const manualCashIn = cashflow.filter(c=>c.type==='in').reduce((a,x)=>a+x.amount,0);
  const manualCashOut = cashflow.filter(c=>c.type==='out').reduce((a,x)=>a+x.amount,0);
  const hawalaIn = hawala.reduce((a,x)=>a+(+x.amountKRW||0),0);
  const hawalaPKR = hawala.reduce((a,x)=>a+(+x.amountPKR||0),0);
  const hawalaDiscount = hawala.reduce((a,x)=>a+(+x.discountKRW||0),0);
  const pendingReceivable = sales.reduce((a,x)=> a + Math.max(0, (x.qty*x.pricePerUnit) - (x.received||0)), 0);
  
  const totalCapital = investors.reduce((a,x)=>a+(+x.capital||0),0);
  const totalCapitalPKR = investors.reduce((a,x)=>a+(+x.capitalPKR||0),0);
  const ownerCapital = ownerInvestments.reduce((a,x)=>a+(+x.amountKRW||0),0);
  const ownerCapitalPKR = ownerInvestments.reduce((a,x)=>a+(+x.amountPKR||0),0);
  
  const totalMonthly = investors.reduce((a,x)=>a+(+x.monthlyPayout||0),0);
  const totalMonthlyPKR = investors.reduce((a,x)=>a+(+x.monthlyPayoutPKR||0),0);
  const totalPaid = payouts.reduce((a,x)=>a+(+x.amount||0),0);
  const totalPaidPKR = payouts.reduce((a,x)=>a+(+x.amountPKR||0),0);
  // Total cost of ALL phones ever purchased (cash that left your hand)
  const invTotalCost = inventory.reduce((a, x) => a + (Number(x.purchasePrice) || 0), 0);

  // CASH IN = all sources of money arriving
  const totalCashIn = ownerCapital + totalCapital + hawalaIn + manualCashIn;
  // CASH OUT = all sources of money leaving
  const totalCashOut = invTotalCost + totalExp + totalPaid + hawalaDiscount + manualCashOut;
  const cashInHand = totalCashIn - totalCashOut;

  // REALIZED PROFIT LOGIC (The "Real" Cash Profit)
  let realizedRevenue = 0, realizedCOGS = 0;
  sales.forEach(s=>{
    const total = s.qty * s.pricePerUnit;
    if(total<=0) return;
    const received = Math.min(s.received||0, total);
    const ratio = received / total; 
    realizedRevenue += received;
    let costPerUnit = 0;
    if (s.inventoryId) {
      const item = inventory.find(i => i._id === s.inventoryId);
      costPerUnit = item ? (Number(item.purchasePrice) || 0) : 0;
    } else {
      const item = inventory.find(i => i.modelName === (s.modelName || s.model));
      costPerUnit = item ? (Number(item.purchasePrice) || 0) : 0;
    }
    realizedCOGS += s.qty * costPerUnit * ratio;
  });

  const realizedGrossProfit = realizedRevenue - realizedCOGS - hawalaDiscount;
  const retainedProfit = realizedGrossProfit - totalExp - totalPaid;
  const totalCapitalPool = totalCapital + ownerCapital + retainedProfit;

  return {
    invValue, invUnits, salesRev, salesUnits, salesCOGS, grossProfit, totalExp, netProfit,
    hawalaIn, hawalaPKR, hawalaDiscount, pendingReceivable,
    totalCapital, totalCapitalPKR, ownerCapital, ownerCapitalPKR,
    totalMonthly, totalMonthlyPKR, totalPaid, totalPaidPKR,
    totalCashIn, totalCashOut, cashInHand, realizedRevenue, realizedGrossProfit, retainedProfit, totalCapitalPool
  };
};
