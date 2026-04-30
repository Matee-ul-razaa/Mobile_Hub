import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, ym } from '../utils';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const Dashboard = ({ toggleMenu }) => {
  const { data } = useData();
  const a = agg(data);

  // --- CHART DATA PROCESSING ---
  const getMonthlyCashFlow = () => {
    const months = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push(dd.toISOString().slice(0, 7));
    }
    return months.map(m => {
      const inflow = (data.hawala||[]).filter(h => ym(h.date) === m).reduce((s, x) => s + (x.amountKRW||0), 0) +
                     (data.cashflow||[]).filter(c => c.type === 'in' && ym(c.date) === m).reduce((s, x) => s + (x.amount||0), 0) +
                     (data.ownerInvestments||[]).filter(o => ym(o.date) === m).reduce((s, x) => s + (x.amountKRW||0), 0);
      const outflow = (data.expenses||[]).filter(e => ym(e.date) === m).reduce((s, x) => s + (x.amount||0), 0) +
                      (data.cashflow||[]).filter(c => c.type === 'out' && ym(c.date) === m).reduce((s, x) => s + (x.amount||0), 0) +
                      (data.payouts||[]).filter(p => ym(p.date) === m).reduce((s, x) => s + (x.amount||0), 0);
      return { name: m, In: inflow, Out: outflow };
    });
  };

  const getExpenseData = () => {
    const byCat = {};
    (data.expenses||[]).forEach(e => byCat[e.category] = (byCat[e.category] || 0) + e.amount);
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  };

  const getSalesProfitData = () => {
    return (data.sales||[]).slice(-8).map((s, i) => {
      const rev = s.qty * s.pricePerUnit;
      const it = data.inventory.find(inv => inv.model === s.model);
      const cost = s.qty * (it ? it.costPerUnit : 0);
      return { name: `#${i+1} ${s.buyer.slice(0, 8)}`, Revenue: rev, Profit: rev - cost };
    });
  };

  const getInvestorShare = () => {
    return (data.investors||[]).map(inv => ({ name: inv.name, value: inv.capital }));
  };

  const COLORS = ['#1e40af', '#047857', '#b45309', '#6d28d9', '#0f766e', '#b91c1c', '#db2777', '#0891b2'];

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-sub">Overview of your business</div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Cash In Hand</div>
          <div className={`kpi-value ${a.cashInHand >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Cash in + Fazi Cash − Out − Exp − Payouts</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value brand">{fmtKRW(a.invValue)}</div>
          <div className="kpi-sub">{a.invUnits} units in stock</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Sales</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
          <div className="kpi-sub">{(data.sales||[]).length} shipment(s)</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Gross Profit</div>
          <div className={`kpi-value ${a.grossProfit >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(a.grossProfit)}</div>
          <div className="kpi-sub">Sales − cost of goods</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Net Profit</div>
          <div className={`kpi-value ${a.netProfit >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(a.netProfit)}</div>
          <div className="kpi-sub">After expenses</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pending Receivable</div>
          <div className={`kpi-value ${a.pendingReceivable > 0 ? 'neg' : ''}`}>{fmtKRW(a.pendingReceivable)}</div>
          <div className="kpi-sub">Yet to be collected via Fazi Cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Fazi Cash Received (KRW)</div>
          <div className="kpi-value pos">{fmtKRW(a.hawalaIn)}</div>
          <div className="kpi-sub">Your earnings from PK sales · ₨{fmtNum(a.hawalaPKR)} PKR settled</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Fazi Cash Discount</div>
          <div className="kpi-value neg">{fmtKRW(a.hawalaDiscount)}</div>
          <div className="kpi-sub">Discount given on Fazi Cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Capital Pool</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapitalPool)}</div>
          <div className="kpi-sub">Initial {fmtKRW(a.totalCapital)} + retained profit</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Retained Profit</div>
          <div className={`kpi-value ${a.retainedProfit >= 0 ? 'pos' : 'neg'}`}>{a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}</div>
          <div className="kpi-sub">Profit reinvested in business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Investor Capital</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">{(data.investors||[]).length} investors · ₨{fmtNum(a.totalCapitalPKR)} paid in PK</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Monthly Payout Due</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR||0)}/mo in PK · Total paid: {fmtKRW(a.totalPaid)}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Monthly Cash Flow (last 6 months)</h3></div>
          <div className="chart-box" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyCashFlow()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={v => '₩' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip />
                <Legend />
                <Bar dataKey="In" fill="#047857" name="Cash In" />
                <Bar dataKey="Out" fill="#b91c1c" name="Cash Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Expense Breakdown</h3></div>
          <div className="chart-box small" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getExpenseData()} outerRadius={80} dataKey="value" labelLine={false}>
                  {getExpenseData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtKRW(v)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Sales vs Profit (by shipment)</h3></div>
          <div className="chart-box" style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getSalesProfitData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={11} tickFormatter={v => '₩' + (v / 1e6).toFixed(1) + 'M'} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Revenue" fill="#1e40af" />
                <Bar dataKey="Profit" fill="#047857" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Investor Capital Share</h3></div>
          <div className="chart-box small" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getInvestorShare()} outerRadius={80} dataKey="value">
                  {getInvestorShare().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtKRW(v)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '14px' }}>
        <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Detail</th><th className="num">Amount (KRW)</th></tr>
            </thead>
            <tbody>
              {data.activity.slice(-10).reverse().map((act, i) => (
                <tr key={i}>
                  <td>{new Date(act.at).toISOString().slice(0, 10)}</td>
                  <td><span className={`badge badge-${act.action==='create'?'green':act.action==='update'?'amber':'red'}`}>{act.entity} {act.action}</span></td>
                  <td>{act.detail}</td>
                  <td className="num"><strong>{act.action==='create'?'+':'-'}</strong></td>
                </tr>
              ))}
              {data.activity.length === 0 && <tr><td colSpan="4" className="empty">No activity yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
