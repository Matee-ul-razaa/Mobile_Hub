import React, { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { agg, fmtKRW, fmtNum, ym, chartColors } from '../utils';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data } = useData();
  const navigate = useNavigate();

  const a = agg(data);

  // Recent activity logic
  let recent = [];
  data.sales.slice(-5).forEach(s => recent.push({ date: s.date, type: 'Sale', detail: `${s.buyer} — ${s.qty}× ${s.model}`, amount: s.qty * s.pricePerUnit }));
  data.expenses.slice(-5).forEach(e => recent.push({ date: e.date, type: 'Expense', detail: `${e.category}${e.note ? ' — ' + e.note : ''}`, amount: -e.amount }));
  data.hawala.slice(-5).forEach(h => recent.push({ date: h.date, type: 'Fazi Cash In', detail: `From ${h.buyer} (via ${h.receiverName})`, amount: h.amountKRW }));
  data.payouts.slice(-5).forEach(p => {
    const inv = data.investors.find(i => i._id === p.investorId);
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
    const own = data.ownerInvestment.filter(o=>ym(o.date)===m).reduce((acc,x)=>acc+(+x.amountKRW||0), 0);
    return hawala + ci + own;
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

  const lowStock = data.inventory.filter(i => (i.qty - i.soldQty) <= 2);

  return (
    <>
      {lowStock.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', background: 'var(--red-soft)', borderColor: 'var(--red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--red)' }}>
            <strong>⚠️ Low Stock Warning:</strong>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {lowStock.map(i => <span key={i._id} className="badge badge-red">{i.model} ({i.qty - i.soldQty} left)</span>)}
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label text-brand">CASH IN HAND</div>
          <div className={`kpi-value text-green`}>{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Cash In + Fazi Cash – Out – Exp – Payouts</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">INVENTORY VALUE</div>
          <div className="kpi-value text-blue">{fmtKRW(a.invValue)}</div>
          <div className="kpi-sub">{a.invUnits} units in stock</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">TOTAL SALES</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
          <div className="kpi-sub">{data.sales.length} shipment(s)</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">GROSS PROFIT</div>
          <div className="kpi-value text-green">{fmtKRW(a.grossProfit)}</div>
          <div className="kpi-sub">Sales – cost of goods</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">NET PROFIT</div>
          <div className="kpi-value text-green">{fmtKRW(a.netProfit)}</div>
          <div className="kpi-sub">After expenses</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">PENDING RECEIVABLE</div>
          <div className="kpi-value text-red">{fmtKRW(a.pendingReceivable)}</div>
          <div className="kpi-sub">Yet to be collected via Fazi Cash</div>
        </div>

        <div className="kpi">
          <div className="kpi-label text-brand">FAZI CASH RECEIVED (KRW)</div>
          <div className="kpi-value text-teal">{fmtKRW(a.hawalaIn)}</div>
          <div className="kpi-sub">₨{fmtNum(a.hawalaPKR)} PKR settled</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">TOTAL FAZI CASH DISCOUNT</div>
          <div className="kpi-value text-red">{fmtKRW(a.hawalaDiscount)}</div>
          <div className="kpi-sub">Discount given on Fazi Cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">TOTAL CAPITAL POOL</div>
          <div className="kpi-value text-purple">{fmtKRW(a.totalCapitalPool)}</div>
          <div className="kpi-sub">Initial {fmtKRW(a.totalCapital + a.ownerCapital)} + retained profit</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">RETAINED PROFIT</div>
          <div className={`kpi-value ${a.retainedProfit >= 0 ? 'text-green' : 'text-red'}`}>{fmtKRW(a.retainedProfit)}</div>
          <div className="kpi-sub">Profit reinvested in business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">INVESTOR CAPITAL</div>
          <div className="kpi-value text-purple">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">{data.investors.length} investors · ₨{fmtNum(a.totalCapitalPKR)} paid in PK</div>
        </div>
        <div className="kpi">
          <div className="kpi-label text-brand">MONTHLY PAYOUT DUE</div>
          <div className="kpi-value text-blue">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)}/mo in PK · Total paid: {fmtKRW(a.totalPaid)}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Monthly Cash Flow</h3></div>
          <div className="chart-box" style={{height:'300px'}}><Bar data={cashData} options={cashOptions} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Detail</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {recent.map((r, idx) => (
                  <tr key={idx}>
                    <td><span className={`badge badge-${r.type==='Sale'?'green':r.type==='Fazi Cash In'?'teal':r.type==='Payout'?'purple':'amber'}`}>{r.type}</span></td>
                    <td style={{ fontSize:'12px' }}>{r.detail}</td>
                    <td className={`num text-${r.amount>=0?'green':'red'}`}>{fmtKRW(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
export default Dashboard;
