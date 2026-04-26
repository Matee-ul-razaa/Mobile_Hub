import React, { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, ym, chartColors } from '../utils';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data } = useData();
  const navigate = useNavigate();

  // Aggregations
  const invValue = data.inventory.reduce((a,x) => a + Math.max(0,(x.qty - x.soldQty)) * x.costPerUnit, 0);
  const invUnits = data.inventory.reduce((a,x) => a + Math.max(0,(x.qty - x.soldQty)), 0);
  const salesRev = data.sales.reduce((a,x) => a + x.qty * x.pricePerUnit, 0);
  const salesCOGS = data.sales.reduce((a,x) => {
    const item = data.inventory.find(i => i.model===x.model);
    return a + x.qty * (item ? item.costPerUnit : 0);
  }, 0);
  const grossProfit = salesRev - salesCOGS;
  const totalExp = data.expenses.reduce((a,x) => a + x.amount, 0);
  const netProfit = grossProfit - totalExp;
  const cashIn = data.cashflow.filter(c => c.type==='in').reduce((a,x) => a + x.amount, 0);
  const cashOut = data.cashflow.filter(c => c.type==='out').reduce((a,x) => a + x.amount, 0);
  const hawalaIn = data.hawala.reduce((a,x) => a + (+x.amountKRW||0), 0);
  const hawalaPKR = data.hawala.reduce((a,x) => a + (+x.amountPKR||0), 0);
  const hawalaDiscount = data.hawala.reduce((a,x) => a + (+x.discountKRW||0), 0);
  const pendingReceivable = data.sales.reduce((a,x) => a + Math.max(0, (x.qty*x.pricePerUnit) - (x.received||0)), 0);
  const ownerCap = data.ownerInvestment.reduce((a,x) => a + (+x.amount||0), 0);
  const totalCapital = data.investors.reduce((a,x) => a + (+x.capital||0), 0) + ownerCap;
  const totalCapitalPKR = data.investors.reduce((a,x) => a + (+x.capitalPKR||0), 0);
  const totalMonthly = data.investors.reduce((a,x) => a + (+x.monthlyPayout||0), 0);
  const totalMonthlyPKR = data.investors.reduce((a,x) => a + (+x.monthlyPayoutPKR||0), 0);
  const totalPaid = data.payouts.reduce((a,x) => a + (+x.amount||0), 0);
  const totalPaidPKR = data.payouts.reduce((a,x) => a + (+x.amountPKR||0), 0);
  const cashInHand = cashIn - cashOut + hawalaIn + ownerCap - totalExp - totalPaid;

  const a = { invValue, invUnits, salesRev, salesCOGS, grossProfit, totalExp, netProfit, cashIn, cashOut, hawalaIn, hawalaPKR, hawalaDiscount, pendingReceivable, totalCapital, totalCapitalPKR, totalMonthly, totalMonthlyPKR, totalPaid, totalPaidPKR, cashInHand };

  // Recent activity
  let recent = [];
  data.sales.slice(-5).forEach(s => recent.push({ date: s.date, type: 'Sale', detail: `${s.buyer} — ${s.qty}× ${s.model}`, amount: s.qty * s.pricePerUnit }));
  data.expenses.slice(-5).forEach(e => recent.push({ date: e.date, type: 'Expense', detail: `${e.category}${e.note ? ' — ' + e.note : ''}`, amount: -e.amount }));
  data.hawala.slice(-5).forEach(h => recent.push({ date: h.date, type: 'Hawala In', detail: `From ${h.buyer} (via ${h.receiverName})`, amount: h.amountKRW }));
  data.payouts.slice(-5).forEach(p => {
    const inv = data.investors.find(i => i._id === p.investorId || i.id === p.investorId);
    recent.push({ date: p.date, type: 'Payout', detail: inv ? inv.name : 'Investor', amount: -p.amount });
  });
  recent.sort((a,b) => b.date.localeCompare(a.date));
  recent = recent.slice(0, 10);

  // Cash Chart
  const months = [];
  const d = new Date();
  for(let i=5;i>=0;i--){
    const dd = new Date(d.getFullYear(), d.getMonth()-i, 1);
    months.push(dd.toISOString().slice(0,7));
  }
  const inflow = months.map(m => {
    const hawala = data.hawala.filter(h => ym(h.date)===m).reduce((acc,x) => acc+x.amountKRW, 0);
    const ci = data.cashflow.filter(c => c.type==='in'&&ym(c.date)===m).reduce((acc,x) => acc+x.amount, 0);
    return hawala + ci;
  });
  const outflow = months.map(m => {
    const exp = data.expenses.filter(e => ym(e.date)===m).reduce((acc,x) => acc+x.amount, 0);
    const co = data.cashflow.filter(c => c.type==='out'&&ym(c.date)===m).reduce((acc,x) => acc+x.amount, 0);
    const po = data.payouts.filter(p => ym(p.date)===m).reduce((acc,x) => acc+x.amount, 0);
    return exp + co + po;
  });
  const cTheme = chartColors();
  const cashData = {
    labels: months,
    datasets: [
      { label:'Cash In', data:inflow, backgroundColor:'#047857' },
      { label:'Cash Out', data:outflow, backgroundColor:'#b91c1c' },
    ]
  };
  const cashOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: cTheme.text } } },
    scales: { x: { ticks: { color: cTheme.text }, grid: { color: cTheme.grid } }, y: { ticks: { color: cTheme.text, callback: v => '₩'+(v/1000).toFixed(0)+'k' }, grid: { color: cTheme.grid } } }
  };

  // Exp Chart
  const byCat = {};
  data.expenses.forEach(e => byCat[e.category] = (byCat[e.category]||0) + e.amount);
  const expData = {
    labels: Object.keys(byCat),
    datasets: [{ data: Object.values(byCat), backgroundColor: cTheme.palette }]
  };
  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: cTheme.text, font: { size: 11 } } } } };

  // Sales Chart
  const salesLabels = data.sales.map((s,i) => `#${i+1} ${s.buyer.slice(0,12)}`);
  const rev = data.sales.map(s => s.qty * s.pricePerUnit);
  const cost = data.sales.map(s => {
    const it = data.inventory.find(i => i.model===s.model);
    return s.qty * (it ? it.costPerUnit : 0);
  });
  const profit = rev.map((r,i) => r - cost[i]);
  const salesDataObj = {
    labels: salesLabels,
    datasets: [
      { label: 'Revenue', data: rev, backgroundColor: '#1e40af' },
      { label: 'Profit', data: profit, backgroundColor: '#047857' }
    ]
  };
  const salesOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: cTheme.text } } },
    scales: { x: { ticks: { color: cTheme.text }, grid: { color: cTheme.grid } }, y: { ticks: { color: cTheme.text, callback: v => '₩'+(v/1e6).toFixed(1)+'M' }, grid: { color: cTheme.grid } } }
  };

  // Inv Chart
  const invLabels = data.investors.map(i => i.name);
  const vals = data.investors.map(i => i.capital);
  const invChartData = {
    labels: invLabels,
    datasets: [{ data: vals, backgroundColor: cTheme.palette }]
  };

  const lowStock = data.inventory.filter(i => (i.qty - i.soldQty) <= 2);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Business Dashboard</h1>
          <div className="page-sub">Overview of your global mobile trade</div>
        </div>
        <div className="right">
          <button className="btn btn-primary" onClick={() => navigate('/sales')}>+ New Sale</button>
          <button className="btn" onClick={() => navigate('/expenses')}>+ Expense</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: 'var(--red-soft)', borderColor: 'var(--red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--red)' }}>
            <strong>⚠️ Low Stock Warning:</strong>
            {lowStock.map(i => <span key={i._id} className="badge badge-red">{i.model} ({i.qty - i.soldQty} left)</span>)}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Cash In Hand</div>
          <div className={`kpi-value ${a.cashInHand>=0?'pos':'neg'}`}>{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Cash in + Hawala − Out − Exp − Payouts</div></div>
        <div className="kpi"><div className="kpi-label">Inventory Value</div>
          <div className="kpi-value brand">{fmtKRW(a.invValue)}</div>
          <div className="kpi-sub">{a.invUnits} units in stock</div></div>
        <div className="kpi"><div className="kpi-label">Total Sales</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
          <div className="kpi-sub">{data.sales.length} shipment(s)</div></div>
        <div className="kpi"><div className="kpi-label">Gross Profit</div>
          <div className={`kpi-value ${a.grossProfit>=0?'pos':'neg'}`}>{fmtKRW(a.grossProfit)}</div>
          <div className="kpi-sub">Sales − cost of goods</div></div>
        <div className="kpi"><div className="kpi-label">Net Profit</div>
          <div className={`kpi-value ${a.netProfit>=0?'pos':'neg'}`}>{fmtKRW(a.netProfit)}</div>
          <div className="kpi-sub">After expenses</div></div>
        <div className="kpi"><div className="kpi-label">Pending Receivable</div>
          <div className={`kpi-value ${a.pendingReceivable>0?'neg':''}`}>{fmtKRW(a.pendingReceivable)}</div>
          <div className="kpi-sub">Yet to be collected via hawala</div></div>
        <div className="kpi"><div className="kpi-label">Hawala Received (KRW)</div>
          <div className="kpi-value pos">{fmtKRW(a.hawalaIn)}</div>
          <div className="kpi-sub">Earnings from PK sales · ₨{fmtNum(a.hawalaPKR)} PKR settled</div></div>
        <div className="kpi"><div className="kpi-label">Total Hawala Discount</div>
          <div className="kpi-value neg">{fmtKRW(a.hawalaDiscount)}</div>
          <div className="kpi-sub">Discount given on hawala</div></div>
        <div className="kpi"><div className="kpi-label">Total Working Capital</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">{data.investors.length} investors + My Capital</div></div>
        <div className="kpi"><div className="kpi-label">Monthly Payout Due</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)}/mo in PK · Total paid: {fmtKRW(a.totalPaid)}</div></div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Monthly Cash Flow (last 6 months)</h3></div>
          <div className="chart-box"><Bar data={cashData} options={cashOptions} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Expense Breakdown</h3></div>
          <div className="chart-box small">
            {expData.labels.length ? <Doughnut data={expData} options={pieOptions} /> : <div className="empty">No expenses yet</div>}
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Sales vs Profit (by shipment)</h3></div>
          <div className="chart-box">
            {salesDataObj.labels.length ? <Bar data={salesDataObj} options={salesOptions} /> : <div className="empty">No sales yet</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Investor Capital Share</h3></div>
          <div className="chart-box small">
            {invChartData.labels.length ? <Pie data={invChartData} options={pieOptions} /> : null}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '14px' }}>
        <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Detail</th><th className="num">Amount (KRW)</th></tr></thead>
            <tbody>
              {recent.length === 0 ? <tr><td colSpan="4" className="empty">No activity yet</td></tr> : 
                recent.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.date}</td>
                    <td><span className={`badge badge-${r.type==='Sale'?'green':r.type==='Hawala In'?'teal':r.type==='Payout'?'purple':'amber'}`}>{r.type}</span></td>
                    <td>{r.detail}</td>
                    <td className={`num text-${r.amount>=0?'green':'red'}`}>{r.amount>=0?'+':''}{fmtKRW(r.amount)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
