import React from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { data } = useData();
  const a = agg(data);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Executive Overview</h2>
        <div className="muted" style={{ fontSize: '13px' }}>Real-time business intelligence for Mobile Hub</div>
      </div>

      <div className="kpi-grid dashboard-mega-grid">
        <div className="kpi">
          <div className="kpi-label">Cash In Hand</div>
          <div className="kpi-value">{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Total ready-to-use cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Retained Profit</div>
          <div className={`kpi-value ${a.retainedProfit >= 0 ? 'pos' : 'neg'}`}>
            {a.retainedProfit >= 0 ? '+' : ''}{fmtKRW(a.retainedProfit)}
          </div>
          <div className="kpi-sub">Realized cash growth</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Capital Pool</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapitalPool)}</div>
          <div className="kpi-sub">Working capital + profit</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pending Receivables</div>
          <div className="kpi-value neg">{fmtKRW(a.pendingReceivable)}</div>
          <div className="kpi-sub">Awaiting Fazi Cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Inventory Units</div>
          <div className="kpi-value brand">{a.invUnits}</div>
          <div className="kpi-sub">Units available for sale</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{fmtKRW(a.invValue)}</div>
          <div className="kpi-sub">Total stock at cost</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Sales Revenue</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
          <div className="kpi-sub">Total invoiced amount</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Gross Profit</div>
          <div className="kpi-value pos">{fmtKRW(a.grossProfit)}</div>
          <div className="kpi-sub">{((a.grossProfit/a.salesRev)*100 || 0).toFixed(1)}% Margin</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Expenses</div>
          <div className="kpi-value neg">{fmtKRW(a.totalExp)}</div>
          <div className="kpi-sub">Shipping, Customs, etc.</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Investor Payouts</div>
          <div className="kpi-value neg">{fmtKRW(a.totalPaid)}</div>
          <div className="kpi-sub">Total paid to 5 investors</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Owner Investment</div>
          <div className="kpi-value brand">{fmtKRW(a.ownerCapital)}</div>
          <div className="kpi-sub">Personal money injected</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Fazi Cash Discounts</div>
          <div className="kpi-value neg">{fmtKRW(a.hawalaDiscount)}</div>
          <div className="kpi-sub">PKR transfer discounts</div>
        </div>
      </div>

      <div className="chart-grid" style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Inventory</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="num">Stock</th>
                  <th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.inventory.slice(-5).reverse().map(i => (
                  <tr key={i._id}>
                    <td>{i.model}</td>
                    <td className="num">{i.qty - (i.soldQty||0)}</td>
                    <td className="num">{fmtKRW(i.costPerUnit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/inventory" className="btn btn-sm" style={{ marginTop: '10px', display: 'inline-block' }}>View All Inventory</Link>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
          <div className="activity-mini-list">
            {data.activity.slice(-6).reverse().map((act, i) => (
              <div key={i} className="activity-item">
                <span className={`badge badge-${act.action==='create'?'green':act.action==='update'?'amber':'red'}`} style={{ fontSize: '9px' }}>
                  {act.action}
                </span>
                <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                  <strong>{act.user}</strong> {act.action}d {act.entity}
                </span>
                <div className="muted" style={{ fontSize: '10px', marginLeft: '45px' }}>{new Date(act.at).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
          <Link to="/activity" className="btn btn-sm" style={{ marginTop: '10px', display: 'inline-block' }}>View Full Log</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
