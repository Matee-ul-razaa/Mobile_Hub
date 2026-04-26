import React from 'react';
import { useData } from '../DataContext';
import { agg, fmtKRW, fmtNum, ym } from '../utils';

const CapitalProfit = () => {
  const { data } = useData();
  const a = agg(data);

  // Growth Chart logic (simplified for React)
  const growth = (a.retainedProfit / (a.totalCapital + a.ownerCapital || 1) * 100).toFixed(1);

  // Monthly breakdown
  const months = [];
  const d = new Date();
  for(let i=5;i>=0;i--){
    const dd = new Date(d.getFullYear(), d.getMonth()-i, 1);
    months.push(dd.toISOString().slice(0,7));
  }

  const totalSalesValue = data.sales.reduce((s,x)=>s+x.qty*x.pricePerUnit,0);
  const cogsPerKRWReceived = totalSalesValue ? (a.salesCOGS / totalSalesValue) : 0;

  const monthlyData = months.map(m=>{
    const hIn = data.hawala.filter(h=>ym(h.date)===m).reduce((s,x)=>s+(+x.amountKRW||0),0);
    const hDisc = data.hawala.filter(h=>ym(h.date)===m).reduce((s,x)=>s+(+x.discountKRW||0),0);
    const exp = data.expenses.filter(e=>ym(e.date)===m).reduce((s,x)=>s+x.amount,0);
    const pay = data.payouts.filter(p=>ym(p.date)===m).reduce((s,x)=>s+(+x.amount||0),0);
    const approxCOGS = hIn * cogsPerKRWReceived;
    const profit = hIn - approxCOGS - hDisc - exp - pay;
    return {month:m, hIn, approxCOGS, hDisc, exp, pay, profit};
  });

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Capital Pool</div><div className="kpi-value purple">{fmtKRW(a.totalCapitalPool)}</div><div className="kpi-sub">Investments + Retained Profit</div></div>
        <div className="kpi"><div className="kpi-label">Investor Capital</div><div className="kpi-value">{fmtKRW(a.totalCapital)}</div><div className="kpi-sub">From {data.investors.length} investors</div></div>
        <div className="kpi"><div className="kpi-label">My Own Investment</div><div className="kpi-value brand">{fmtKRW(a.ownerCapital)}</div><div className="kpi-sub">Your personal funds</div></div>
        <div className="kpi"><div className="kpi-label">Retained Profit</div><div className={a.retainedProfit >= 0 ? 'kpi-value pos' : 'kpi-value neg'}>{a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}</div><div className="kpi-sub">{growth}% growth on capital</div></div>
      </div>

      <div className="card" style={{ marginBottom:'14px' }}>
        <div className="card-header"><h3 className="card-title">Capital Composition</h3></div>
        <div style={{ padding:'8px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
             <div style={{ flex:1, background:'var(--surface-2)', borderRadius:'999px', height:'28px', overflow:'hidden', display:'flex' }}>
               {a.totalCapital > 0 && <div style={{ background:'#6d28d9', height:'100%', width:`${(a.totalCapital / a.totalCapitalPool * 100)}%` }} />}
               {a.ownerCapital > 0 && <div style={{ background:'#1e40af', height:'100%', width:`${(a.ownerCapital / a.totalCapitalPool * 100)}%` }} />}
               <div style={{ background: a.retainedProfit >= 0 ? '#047857' : '#b91c1c', height:'100%', width:`${(Math.abs(a.retainedProfit) / a.totalCapitalPool * 100)}%` }} />
             </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-3)' }}>
            <span><span style={{ display:'inline-block', width:'8px', height:'8px', background:'#6d28d9', marginRight:'4px' }}/>Investors</span>
            <span><span style={{ display:'inline-block', width:'8px', height:'8px', background:'#1e40af', marginRight:'4px' }}/>Me</span>
            <span><span style={{ display:'inline-block', width:'8px', height:'8px', background: a.retainedProfit >= 0 ? '#047857' : '#b91c1c', marginRight:'4px' }}/>Profit</span>
            <span style={{ color:'var(--text)' }}><strong>Total: {fmtKRW(a.totalCapitalPool)}</strong></span>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Realized Profit Calculation</h3></div>
          <table className="no-bg">
            <tbody>
              <tr><td>Realized Revenue <div className="muted" style={{fontSize:'10px'}}>From Fazi Cash</div></td><td className="num text-green">+{fmtKRW(a.realizedRevenue)}</td></tr>
              <tr><td>Cost of Goods Sold <div className="muted" style={{fontSize:'10px'}}>Proportional to cash received</div></td><td className="num text-red">−{fmtKRW(a.realizedCOGS)}</td></tr>
              <tr><td>Discounts Given</td><td className="num text-red">−{fmtKRW(a.hawalaDiscount)}</td></tr>
              <tr style={{ background:'var(--surface-2)' }}><td><strong>Gross Realized Profit</strong></td><td className="num font-bold">{fmtKRW(a.realizedGrossProfit)}</td></tr>
              <tr><td>Total Expenses</td><td className="num text-red">−{fmtKRW(a.totalExp)}</td></tr>
              <tr><td>Total Investor Payouts</td><td className="num text-red">−{fmtKRW(a.totalPaid)}</td></tr>
              <tr style={{ background:'var(--surface-2)' }}><td><strong>Net Retained Profit</strong></td><td className={`num font-bold ${a.retainedProfit>=0?'text-green':'text-red'}`}>{a.retainedProfit>=0?'+':''}{fmtKRW(a.retainedProfit)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Business Position Today</h3></div>
          <table className="no-bg">
            <tbody>
              <tr><td>Cash In Hand</td><td className="num font-bold text-green">{fmtKRW(a.cashInHand)}</td></tr>
              <tr><td>Inventory Value <div className="muted" style={{fontSize:'10px'}}>Stack remaining</div></td><td className="num font-bold">{fmtKRW(a.invValue)}</td></tr>
              <tr><td>Pending Receivable <div className="muted" style={{fontSize:'10px'}}>Not yet collected</div></td><td className="num font-bold">{fmtKRW(a.pendingReceivable)}</td></tr>
              <tr style={{ background:'var(--surface-2)' }}><td><strong>Total Assets</strong></td><td className="num font-bold">{fmtKRW(a.cashInHand + a.invValue + a.pendingReceivable)}</td></tr>
              <tr><td className="muted">vs. Total Capital Pool</td><td className="num muted">{fmtKRW(a.totalCapitalPool)}</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: '11px', marginTop:'10px' }} className="muted">Total assets should match Capital Pool once all receivables settle.</p>
        </div>
      </div>

      <div className="card" style={{ marginTop:'14px' }}>
        <div className="card-header"><h3 className="card-title">Monthly Trend (last 6 months)</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th className="num">Fazi Cash</th><th className="num">~COGS</th><th className="num">Exp+Pay</th><th className="num">Profit</th></tr></thead>
            <tbody>
              {monthlyData.map(r => (
                <tr key={r.month}>
                  <td>{r.month}</td>
                  <td className="num text-green">+{fmtKRW(r.hIn)}</td>
                  <td className="num text-red">−{fmtKRW(r.approxCOGS)}</td>
                  <td className="num text-red">−{fmtKRW(r.exp + r.pay)}</td>
                  <td className={`num font-bold ${r.profit>=0?'text-green':'text-red'}`}>{r.profit>=0?'+':''}{fmtKRW(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default CapitalProfit;
