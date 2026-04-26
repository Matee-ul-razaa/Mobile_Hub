import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const CapitalProfit = () => {
  const { data } = useData();
  const a = agg(data);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Capital Pool & Profit Analysis</h2>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Capital Pool</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapitalPool)}</div>
          <div className="kpi-sub">Total working money in business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Investor Capital</div>
          <div className="kpi-value">{fmtKRW(a.totalCapital)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">My Own Investment</div>
          <div className="kpi-value brand">{fmtKRW(a.ownerCapital)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Retained Profit</div>
          <div className={`kpi-value ${a.retainedProfit >= 0 ? 'pos' : 'neg'}`}>
            {a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-header"><h3 className="card-title">How your capital is built</h3></div>
        <div style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', height: '28px', borderRadius: '999px', overflow: 'hidden', background: 'var(--surface-2)' }}>
            <div style={{ width: `${(a.totalCapital/a.totalCapitalPool)*100}%`, background: '#6d28d9' }}></div>
            <div style={{ width: `${(a.ownerCapital/a.totalCapitalPool)*100}%`, background: '#1e40af' }}></div>
            <div style={{ width: `${(Math.max(0, a.retainedProfit)/a.totalCapitalPool)*100}%`, background: '#047857' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px', color: 'var(--text-3)' }}>
            <span>Investors: {fmtKRW(a.totalCapital)}</span>
            <span>Owner: {fmtKRW(a.ownerCapital)}</span>
            <span>Retained Profit: {fmtKRW(Math.max(0, a.retainedProfit))}</span>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Realized Profit Breakdown</h3></div>
          <table style={{ minWidth: 'auto' }}>
            <tbody>
              <tr>
                <td>Realized Revenue <span className="muted" style={{ fontSize: '11px' }}>(Cash Received)</span></td>
                <td className="num text-green"><strong>+{fmtKRW(a.realizedRevenue)}</strong></td>
              </tr>
              <tr>
                <td>Cost of Goods <span className="muted" style={{ fontSize: '11px' }}>(for received portion)</span></td>
                <td className="num text-red">−{fmtKRW(a.salesCOGS * (a.realizedRevenue/a.salesRev || 0))}</td>
              </tr>
              <tr>
                <td>Fazi Cash Discounts</td>
                <td className="num text-red">−{fmtKRW(a.hawalaDiscount)}</td>
              </tr>
              <tr style={{ background: 'var(--surface-2)' }}>
                <td><strong>Gross Realized Profit</strong></td>
                <td className={`num ${a.realizedGrossProfit >= 0 ? 'text-green' : 'text-red'}`}>
                  <strong>{fmtKRW(a.realizedGrossProfit)}</strong>
                </td>
              </tr>
              <tr>
                <td>Total Expenses</td>
                <td className="num text-red">−{fmtKRW(a.totalExp)}</td>
              </tr>
              <tr>
                <td>Investor Payouts</td>
                <td className="num text-red">−{fmtKRW(a.totalPaid)}</td>
              </tr>
              <tr style={{ background: 'var(--surface-3)' }}>
                <td><strong>Net Retained Profit</strong></td>
                <td className={`num ${a.retainedProfit >= 0 ? 'text-green' : 'text-red'}`}>
                  <strong>{a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Business Position Today</h3></div>
          <table style={{ minWidth: 'auto' }}>
            <tbody>
              <tr><td>Cash In Hand</td><td className="num"><strong>{fmtKRW(a.cashInHand)}</strong></td></tr>
              <tr><td>Inventory Value</td><td className="num"><strong>{fmtKRW(a.invValue)}</strong></td></tr>
              <tr><td>Pending Receivable</td><td className="num"><strong>{fmtKRW(a.pendingReceivable)}</strong></td></tr>
              <tr style={{ background: 'var(--surface-2)' }}>
                <td><strong>Total Business Assets</strong></td>
                <td className="num"><strong>{fmtKRW(a.cashInHand + a.invValue + a.pendingReceivable)}</strong></td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '10px', lineHeight: '1.5' }}>
            Total assets should equal your Capital Pool once all receivables are collected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CapitalProfit;
