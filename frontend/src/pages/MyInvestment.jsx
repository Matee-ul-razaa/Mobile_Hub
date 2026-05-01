import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const MyInvestment = ({ toggleMenu, onLogout }) => {
  const { data, addOwnerInvestment, deleteOwnerInvestment } = useData();
  const [showModal, setShowModal] = useState(false);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">My Investment</h1>
            <div className="page-sub">Your own money put into the business</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add My Investment</button>
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
          <div className="kpi-label">MY TOTAL INVESTMENT (KR)</div>
          <div className="kpi-value">{fmtKRW(a.ownerCapital)}</div>
          <div className="kpi-sub">Your own money in the business</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">MY TOTAL INVESTMENT (PK)</div>
          <div className="kpi-value">₨{fmtNum(a.ownerCapitalPKR)}</div>
          <div className="kpi-sub">If paid in Pakistan</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">ENTRIES</div>
          <div className="kpi-value">{data.ownerInvestments.length}</div>
          <div className="kpi-sub">Times you added money</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">YOUR SHARE OF CAPITAL</div>
          <div className="kpi-value">{a.totalCapital ? (a.ownerCapital / a.totalCapital * 100).toFixed(1) : '0.0'}%</div>
          <div className="kpi-sub">of total capital pool</div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-2)', lineHeight: '1.5' }}>
          <strong>What goes here:</strong> Any money you personally <strong>put into the business</strong> — from savings, a bank loan to yourself, profit you're reinvesting, or even your own capital you brought in along with the investors. This is separate from the 5 investors because you don't pay yourself a monthly payout, and it counts toward your Total Capital Pool.<br/><br/>
          <strong>If you sent it via hawala:</strong> Fill both the PKR amount (what left your PK account) and the KRW amount (what arrived here). If you put in cash directly in Korea, just fill the KRW field.
        </p>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">All My Investments</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>SOURCE</th>
                <th className="num">PKR AMOUNT</th>
                <th className="num">KRW AMOUNT</th>
                <th>NOTE</th>
                <th>ADDED BY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.ownerInvestments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    No investments yet. Click + Add My Investment.
                  </td>
                </tr>
              ) : (
                [...data.ownerInvestments].reverse().map(inv => (
                  <tr key={inv._id}>
                    <td>{inv.date}</td>
                    <td>{inv.source || 'Personal'}</td>
                    <td className="num">₨{fmtNum(inv.amountPKR)}</td>
                    <td className="num pos"><strong>{fmtKRW(inv.amountKRW)}</strong></td>
                    <td>{inv.note}</td>
                    <td><span className="badge badge-brand">Admin</span></td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm btn-danger" onClick={() => deleteOwnerInvestment(inv._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <OwnerModal 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addOwnerInvestment(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const OwnerModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), amountKRW: 0, amountPKR: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">Add Owner Capital</h3></div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Amount (Won) *</label><input type="number" value={form.amountKRW} onChange={e=>setForm({...form, amountKRW:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Ref (PKR)</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Investment</button>
        </div>
      </div>
    </div>
  );
};

export default MyInvestment;
