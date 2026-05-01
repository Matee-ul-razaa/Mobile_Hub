import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Payouts = ({ toggleMenu, onLogout }) => {
  const { data, addPayout, deletePayout } = useData();
  const [showModal, setShowModal] = useState(false);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Investor Payouts</h1>
            <div className="page-sub">Record of monthly payments to investors</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Payout</button>
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
          <div className="kpi-label">TOTAL PAID (PK)</div>
          <div className="kpi-value">₨{fmtNum(a.totalPaidPKR)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL PAID (KR)</div>
          <div className="kpi-value neg">{fmtKRW(a.totalPaid)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ENTRIES</div>
          <div className="kpi-value">{data.payouts.length}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Payouts</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>INVESTOR</th>
                  <th className="num">PKR (PAID IN PK)</th>
                  <th className="num">KRW (FROM YOUR CASH)</th>
                  <th>NOTE</th>
                  <th>ADDED BY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      No payouts yet.
                    </td>
                  </tr>
                ) : (
                  [...data.payouts].reverse().map(p => {
                    const inv = data.investors.find(i => i._id === p.investorId);
                    return (
                      <tr key={p._id}>
                        <td>{p.date}</td>
                        <td><strong>{inv ? inv.name : 'Unknown'}</strong></td>
                        <td className="num">₨{fmtNum(p.amountPKR)}</td>
                        <td className="num neg"><strong>−{fmtKRW(p.amount)}</strong></td>
                        <td>{p.note || '—'}</td>
                        <td><span className="badge badge-brand">Admin</span></td>
                        <td>
                          <div className="inline-actions">
                            <button className="btn btn-sm btn-danger" onClick={() => deletePayout(p._id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Paid by Month</h3></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-3)' }}>
            —
          </div>
        </div>
      </div>

      {showModal && (
        <PayoutModal 
          investors={data.investors}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addPayout(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const PayoutModal = ({ investors, onClose, onSave }) => {
  const [form, setForm] = useState({ investorId: '', date: new Date().toISOString().slice(0,10), amount: 0, amountPKR: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">Record Payout</h3></div>
        <div className="form-row">
          <label>Select Investor *</label>
          <select value={form.investorId} onChange={e=>setForm({...form, investorId:e.target.value})}>
            <option value="">— select —</option>
            {investors.map(inv => <option key={inv._id} value={inv._id}>{inv.name}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (Won) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Settle in (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Payout</button>
        </div>
      </div>
    </div>
  );
};

export default Payouts;
