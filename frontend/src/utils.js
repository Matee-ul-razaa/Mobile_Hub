export const fmtKRW = n => '₩' + (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const fmtNum = n => (Number(n)||0).toLocaleString('en-US', {maximumFractionDigits:0});
export const todayISO = () => new Date().toISOString().slice(0,10);
export const nowISO = () => new Date().toISOString();
export const ym = d => (d||todayISO()).slice(0,7);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

export function hashPwd(s){
  let h = 5381;
  for(let i=0;i<s.length;i++) h = ((h<<5)+h) + s.charCodeAt(i);
  return (h>>>0).toString(36);
}

export function chartColors(){
  const isDark = document.documentElement.classList.contains('dark') || 
                 (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return {
    text: isDark ? '#d1d5db' : '#4b5563',
    grid: isDark ? '#374151' : '#e5e7eb',
    palette: ['#1e40af','#047857','#b45309','#6d28d9','#0f766e','#b91c1c','#db2777','#0891b2']
  };
}

export function agg(data){
  const invValue = (data.inventory||[]).reduce((a,x)=> a + Math.max(0,(x.qty - x.soldQty)) * x.costPerUnit, 0);
  const invUnits = (data.inventory||[]).reduce((a,x)=> a + Math.max(0,(x.qty - x.soldQty)), 0);
  const salesRev = (data.sales||[]).reduce((a,x)=> a + x.qty * x.pricePerUnit, 0);
  const salesCOGS = (data.sales||[]).reduce((a,x)=>{
    const item = data.inventory.find(i=>i.model===x.model);
    return a + x.qty * (item ? item.costPerUnit : 0);
  }, 0);
  const grossProfit = salesRev - salesCOGS;
  const totalExp = (data.expenses||[]).reduce((a,x)=>a+x.amount,0);
  const netProfit = grossProfit - totalExp;
  const cashIn = (data.cashflow||[]).filter(c=>c.type==='in').reduce((a,x)=>a+x.amount,0);
  const cashOut = (data.cashflow||[]).filter(c=>c.type==='out').reduce((a,x)=>a+x.amount,0);
  const hawalaIn = (data.hawala||[]).reduce((a,x)=>a+(+x.amountKRW||0),0);
  const hawalaPKR = (data.hawala||[]).reduce((a,x)=>a+(+x.amountPKR||0),0);
  const hawalaDiscount = (data.hawala||[]).reduce((a,x)=>a+(+x.discountKRW||0),0);
  const pendingReceivable = (data.sales||[]).reduce((a,x)=> a + Math.max(0, (x.qty*x.pricePerUnit) - (x.received||0)), 0);
  const totalCapital = (data.investors||[]).reduce((a,x)=>a+(+x.capital||0),0);
  const totalCapitalPKR = (data.investors||[]).reduce((a,x)=>a+(+x.capitalPKR||0),0);
  const ownerCapital = (data.ownerInvestment||[]).reduce((a,x)=>a+(+x.amountKRW||0),0);
  const ownerCapitalPKR = (data.ownerInvestment||[]).reduce((a,x)=>a+(+x.amountPKR||0),0);
  const totalMonthly = (data.investors||[]).reduce((a,x)=>a+(+x.monthlyPayout||0),0);
  const totalMonthlyPKR = (data.investors||[]).reduce((a,x)=>a+(+x.monthlyPayoutPKR||0),0);
  const totalPaid = (data.payouts||[]).reduce((a,x)=>a+(+x.amount||0),0);
  const totalPaidPKR = (data.payouts||[]).reduce((a,x)=>a+(+x.amountPKR||0),0);
  
  // Realized profit
  let realizedRevenue = 0, realizedCOGS = 0;
  (data.sales||[]).forEach(s=>{
    const total = s.qty * s.pricePerUnit;
    if(total<=0) return;
    const received = Math.min(s.received||0, total);
    const ratio = received / total;
    realizedRevenue += received;
    const item = data.inventory.find(i=>i.model===s.model);
    const costPerUnit = item ? item.costPerUnit : 0;
    realizedCOGS += s.qty * costPerUnit * ratio;
  });
  const realizedGrossProfit = realizedRevenue - realizedCOGS - hawalaDiscount;
  const realizedNetProfit = realizedGrossProfit - totalExp - totalPaid;
  const retainedProfit = realizedNetProfit;
  const totalCapitalPool = totalCapital + ownerCapital + retainedProfit;
  const cashInHand = cashIn - cashOut + hawalaIn + ownerCapital - totalExp - totalPaid;

  return {invValue,invUnits,salesRev,salesCOGS,grossProfit,totalExp,netProfit,
    cashIn,cashOut,hawalaIn,hawalaPKR,hawalaDiscount,pendingReceivable,
    totalCapital,totalCapitalPKR,ownerCapital,ownerCapitalPKR,
    totalMonthly,totalMonthlyPKR,totalPaid,totalPaidPKR,
    cashInHand,
    realizedRevenue,realizedCOGS,realizedGrossProfit,realizedNetProfit,
    retainedProfit,totalCapitalPool};
}
