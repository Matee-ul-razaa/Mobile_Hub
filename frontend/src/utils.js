export const fmtKRW = n => '₩' + (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const fmtNum = n => (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const todayISO = () => new Date().toISOString().slice(0,10);
export const ym = d => (d||todayISO()).slice(0,7);

export const agg = (data) => {
  const inventory = data.inventory || [];
  const sales = data.sales || [];
  const expenses = data.expenses || [];
  const hawala = data.hawala || [];
  const investors = data.investors || [];
  const payouts = data.payouts || [];
  const ownerInvestments = data.ownerInvestments || [];
  const cashflow = data.cashflow || [];

  const invValue = inventory.reduce((a,x)=> a + Math.max(0,(x.qty - x.soldQty)) * x.costPerUnit, 0);
  const invUnits = inventory.reduce((a,x)=> a + Math.max(0,(x.qty - x.soldQty)), 0);
  const salesRev = sales.reduce((a,x)=> a + x.qty * x.pricePerUnit, 0);
  
  const salesCOGS = sales.reduce((a,x)=>{
    const item = inventory.find(i=>i.model===x.model);
    return a + x.qty * (item ? item.costPerUnit : 0);
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
  const totalPaid = payouts.reduce((a,x)=>a+(+x.amount||0),0);
  const totalPaidPKR = payouts.reduce((a,x)=>a+(+x.amountPKR||0),0);
  
  const cashInHand = manualCashIn - manualCashOut + hawalaIn + ownerCapital - totalExp - totalPaid;

  // REALIZED PROFIT LOGIC (The "Real" Cash Profit)
  let realizedRevenue = 0, realizedCOGS = 0;
  sales.forEach(s=>{
    const total = s.qty * s.pricePerUnit;
    if(total<=0) return;
    const received = Math.min(s.received||0, total);
    const ratio = received / total; 
    realizedRevenue += received;
    const item = inventory.find(i=>i.model===s.model);
    const costPerUnit = item ? item.costPerUnit : 0;
    realizedCOGS += s.qty * costPerUnit * ratio;
  });

  const realizedGrossProfit = realizedRevenue - realizedCOGS - hawalaDiscount;
  const retainedProfit = realizedGrossProfit - totalExp - totalPaid;
  const totalCapitalPool = totalCapital + ownerCapital + retainedProfit;

  return {
    invValue, invUnits, salesRev, salesCOGS, grossProfit, totalExp, netProfit,
    hawalaIn, hawalaPKR, hawalaDiscount, pendingReceivable,
    totalCapital, totalCapitalPKR, ownerCapital, ownerCapitalPKR,
    totalMonthly, totalPaid, totalPaidPKR,
    cashInHand, realizedRevenue, realizedGrossProfit, retainedProfit, totalCapitalPool
  };
};
