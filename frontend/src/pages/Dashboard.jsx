import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, ym } from '../utils';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const Dashboard = ({ toggleMenu, onLogout }) => {
  const { data } = useData();
  const a = agg(data);

  // --- CHART DATA PROCESSING ---
  const getMonthlyCashFlow = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // Use local year/month to avoid UTC timezone shift
      const m = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}`;
      months.push(m);
    }
    return months.map(m => {
      const inflow = 
        (data.hawala || []).filter(h => ym(h.date) === m).reduce((s, x) => s + (Number(x.amountKRW) || 0), 0) +
        (data.cashflow || []).filter(c => c.type === 'in' && ym(c.date) === m).reduce((s, x) => s + (Number(x.amount) || 0), 0) +
        (data.ownerInvestments || []).filter(o => ym(o.date) === m).reduce((s, x) => s + (Number(x.amountKRW) || 0), 0);
      const outflow = 
        (data.inventory || []).filter(i => ym(i.date || i.createdAt) === m).reduce((s, x) => s + (Number(x.purchasePrice) || 0), 0) +
        (data.expenses || []).filter(e => ym(e.date) === m).reduce((s, x) => s + (Number(x.amount) || 0), 0) +
        (data.cashflow || []).filter(c => c.type === 'out' && ym(c.date) === m).reduce((s, x) => s + (Number(x.amount) || 0), 0) +
        (data.payouts || []).filter(p => ym(p.date) === m).reduce((s, x) => s + (Number(x.amount) || 0), 0) +
        (data.hawala || []).filter(h => ym(h.date) === m).reduce((s, x) => s + (Number(x.discountKRW) || 0), 0);
      return { name: m, In: inflow, Out: outflow };
    });
  };

  const getExpenseData = () => {
    const byCat = {};
    (data.expenses || []).forEach(e => byCat[e.category] = (byCat[e.category] || 0) + e.amount);
    return Object.entries(byCat).map(([name, value]) => ({ name, value }));
  };

  const getSalesProfitData = () => {
    return (data.sales || []).slice(-8).map((s, i) => {
      const rev = s.qty * s.pricePerUnit;
      // For per-unit inventory, look up by inventoryId or modelName
      let cost = 0;
      if (s.inventoryId) {
        const it = (data.inventory || []).find(inv => inv._id === s.inventoryId);
        cost = s.qty * (it ? (Number(it.purchasePrice) || 0) : 0);
      } else {
        const it = (data.inventory || []).find(inv => inv.modelName === (s.modelName || s.model));
        cost = s.qty * (it ? (Number(it.purchasePrice) || 0) : 0);
      }
      return { name: `#${i + 1} ${(s.buyer || '').slice(0, 8)}`, Revenue: rev, Profit: rev - cost };
    });
  };

  const getInvestorShare = () => {
    return (data.investors || []).map(inv => ({ name: inv.name, value: inv.capital }));
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
        <button className="btn btn-danger btn-sm" onClick={onLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
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
          <div className="kpi-sub">{(data.sales || []).length} shipment(s)</div>
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
          <div className="kpi-sub">{(data.investors || []).length} investors · ₨{fmtNum(a.totalCapitalPKR)} paid in PK</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Monthly Payout Due</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR || 0)}/mo in PK · Total paid: {fmtKRW(a.totalPaid)}</div>
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ fill: 'transparent' }} 
                  shared={false} 
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="In" fill="#047857" name="Cash In" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Out" fill="#b91c1c" name="Cash Out" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Expense Breakdown</h3></div>
          <div className="chart-box small" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getExpenseData()}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getExpenseData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} itemStyle={{ color: "#fff", fontSize: "13px" }} labelStyle={{ color: "#fff", fontWeight: "bold", marginBottom: "4px" }} formatter={(v) => fmtKRW(v)} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '16px' }} />
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  itemStyle={{ color: '#fff', fontSize: '13px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ fill: 'transparent' }} 
                  shared={false} 
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Revenue" fill="#1e40af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Investor Capital Share</h3></div>
          <div className="chart-box small" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getInvestorShare()}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {getInvestorShare().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "none", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} itemStyle={{ color: "#fff", fontSize: "13px" }} labelStyle={{ color: "#fff", fontWeight: "bold", marginBottom: "4px" }} formatter={(v) => fmtKRW(v)} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '16px' }} />
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
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Detail</th>
                <th className="num">Amount (KRW)</th>
              </tr>
            </thead>
            <tbody>
              {(data.activity || []).slice(-5).reverse().map((act, i) => {
                const isPositive = act.action === 'create' && (act.entity === 'sales' || act.entity === 'cashflow' || act.entity === 'ownerInvestments');
                const isNegative = act.action === 'create' && (act.entity === 'expenses' || act.entity === 'payouts');
                return (
                  <tr key={i}>
                    <td>{new Date(act.at).toISOString().slice(0, 10)}</td>
                    <td>
                      <span className={`badge badge-${isPositive ? 'green' : isNegative ? 'amber' : 'brand'}`}>
                        {act.entity === 'sales' ? 'Sale' : act.entity === 'expenses' ? 'Expense' : act.entity === 'cashflow' ? 'Cashflow' : 'Info'}
                      </span>
                    </td>
                    <td>{act.detail}</td>
                    <td className={`num ${isPositive ? 'green' : isNegative ? 'red' : ''}`}>
                      {isPositive ? '+' : isNegative ? '-' : ''} {act.amount ? fmtKRW(act.amount) : '--'}
                    </td>
                  </tr>
                );
              })}
              {(data.activity || []).length === 0 && <tr><td colSpan="4" className="empty">No activity yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
