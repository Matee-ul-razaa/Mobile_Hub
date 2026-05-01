import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const CapitalProfit = ({ toggleMenu, onLogout }) => {
  const { data } = useData();
  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Capital & Profit</h1>
            <div className="page-sub">Growth of your business capital over time</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-danger" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">TOTAL CAPITAL POOL</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapitalPool)}</div>
          <div className="kpi-sub">Working capital including profits</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">INVESTOR CAPITAL</div>
          <div className="kpi-value">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">From 5 investors</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">MY OWN INVESTMENT</div>
          <div className="kpi-value brand">{fmtKRW(a.ownerCapital)}</div>
          <div className="kpi-sub">Your own money added</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">RETAINED PROFIT</div>
          <div className={`kpi-value ${a.retainedProfit >= 0 ? 'pos' : 'neg'}`}>
            {a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}
          </div>
          <div className="kpi-sub">{((a.retainedProfit / (a.totalCapital + a.ownerCapital || 1)) * 100).toFixed(1)}% growth on capital</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header"><h3 className="card-title">How your capital is built</h3></div>
        <div style={{ padding: '4px 0 16px' }}>
          <div style={{ display: 'flex', height: '12px', borderRadius: '4px', overflow: 'hidden', background: 'var(--surface-2)', position: 'relative' }}>
            <div style={{ width: `${(a.totalCapital/a.totalCapitalPool)*100}%`, background: 'var(--purple)' }}></div>
            <div style={{ width: `${(a.ownerCapital/a.totalCapitalPool)*100}%`, background: 'var(--brand)' }}></div>
            {a.retainedProfit < 0 && <div style={{ width: `${(Math.abs(a.retainedProfit)/a.totalCapitalPool)*100}%`, background: 'var(--red)' }}></div>}
            <div style={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: '9px', fontWeight: 'bold', color: '#fff', top: '50%', transform: 'translateY(-50%)' }}>
              {fmtKRW(a.totalCapital)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
             <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-3)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: 'var(--purple)', borderRadius: '2px' }}></span> Investors</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: 'var(--brand)', borderRadius: '2px' }}></span> My investment</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: 'var(--red)', borderRadius: '2px' }}></span> Loss</span>
             </div>
             <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-2)' }}>Total: {fmtKRW(a.totalCapitalPool)}</div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Realized Profit Calculation</h3>
            <span className="muted" style={{ fontSize: '10px' }}>Based on cash actually received</span>
          </div>
          <div className="table-wrap">
            <table style={{ minWidth: 'auto' }}>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td>Realized Revenue <span className="muted" style={{ fontSize: '10px' }}>(from Fazi Cash / received)</span></td>
                  <td className="num pos"><strong>+{fmtKRW(a.realizedRevenue)}</strong></td>
                </tr>
                <tr>
                  <td>Cost of Goods Sold <span className="muted" style={{ fontSize: '10px' }}>(for received portion)</span></td>
                  <td className="num neg">−{fmtKRW(a.salesCOGS * (a.realizedRevenue/a.salesRev || 0))}</td>
                </tr>
                <tr>
                  <td>Fazi Cash Discounts Given</td>
                  <td className="num neg">−{fmtKRW(a.hawalaDiscount)}</td>
                </tr>
                <tr style={{ background: 'var(--surface-2)', fontWeight: '600' }}>
                  <td>Gross Realized Profit</td>
                  <td className={`num ${a.realizedGrossProfit >= 0 ? 'pos' : 'neg'}`}>
                    {fmtKRW(a.realizedGrossProfit)}
                  </td>
                </tr>
                <tr>
                  <td>Total Expenses</td>
                  <td className="num neg">−{fmtKRW(a.totalExp)}</td>
                </tr>
                <tr>
                  <td>Total Investor Payouts</td>
                  <td className="num neg">−{fmtKRW(a.totalPaid)}</td>
                </tr>
                <tr style={{ background: 'var(--surface-2)', fontWeight: '700', fontSize: '14px' }}>
                  <td>Net Retained Profit</td>
                  <td className={`num ${a.retainedProfit >= 0 ? 'pos' : 'neg'}`}>
                    {a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Business Position Today</h3></div>
          <div className="table-wrap">
            <table style={{ minWidth: 'auto' }}>
              <tbody>
                <tr><td>Cash In Hand</td><td className="num"><strong>{fmtKRW(a.cashInHand)}</strong></td></tr>
                <tr><td>Inventory Value <span className="muted" style={{ fontSize: '10px' }}>(stock remaining)</span></td><td className="num"><strong>{fmtKRW(a.invValue)}</strong></td></tr>
                <tr><td>Pending Receivable <span className="muted" style={{ fontSize: '10px' }}>(not yet received)</span></td><td className="num"><strong>{fmtKRW(a.pendingReceivable)}</strong></td></tr>
                <tr style={{ background: 'var(--surface-2)', fontWeight: '700' }}>
                  <td>Total Business Assets</td>
                  <td className="num">{fmtKRW(a.cashInHand + a.invValue + a.pendingReceivable)}</td>
                </tr>
                <tr style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  <td>vs. Total Capital Pool</td>
                  <td className="num">{fmtKRW(a.totalCapitalPool)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '12px', lineHeight: '1.4' }}>
            Total assets should be close to Total Capital Pool once all receivables settle. Differences may be from un-booked income or costs.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Monthly Profit (last 6 months)</h3>
          <span className="muted" style={{ fontSize: '10px' }}>Cash-basis · realized when Fazi Cash comes in</span>
        </div>
        <div className="table-wrap">
          <table style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th>MONTH</th>
                <th>FAZI CASH</th>
                <th>−COGS</th>
                <th>DISCOUNTS</th>
                <th>EXPENSES</th>
                <th>PAYOUTS</th>
                <th>PROFIT</th>
              </tr>
            </thead>
            <tbody>
              {['2023-10', '2023-11', '2023-12', '2024-01', '2024-02', '2024-03'].map(m => (
                <tr key={m}>
                  <td>{m}</td>
                  <td className="num pos">+₩0</td>
                  <td className="num neg">−₩0</td>
                  <td className="num neg">−₩0</td>
                  <td className="num neg">−₩0</td>
                  <td className="num neg">−₩0</td>
                  <td className="num pos">+₩0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>How this works</h4>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: '1.8' }}>
          <p><strong>Total Capital Pool = Initial Investor Capital + Retained Profit.</strong> This is the real working capital of your business. It grows automatically as you make profit.</p>
          <p><strong>Why "Realized" Profit:</strong> A mobile shipped to Pakistan isn't profit until the cash reaches you via Fazi Cash. If you've received half the payment for a shipment, only half of that sale's profit counts as realized. This keeps your capital figure honest — you can only reinvest money that actually exists.</p>
          <p><strong>Where the profit sits:</strong> Retained profit doesn't go into a separate box — it's mixed into your working cash, your inventory, and your pending receivables. The "Business Position Today" table shows where everything actually is right now.</p>
        </div>
      </div>
    </div>
  );
};

export default CapitalProfit;
