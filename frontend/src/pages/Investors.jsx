import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Investors = ({ toggleMenu, onLogout }) => {
  const navigate = useNavigate();
  const { data, addInvestor, updateInvestor, deleteInvestor } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Investors</h1>
            <div className="page-sub">{data.investors.length} investors with monthly payouts</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Investor</button>
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
          <div className="kpi-label">INVESTORS</div>
          <div className="kpi-value">{data.investors.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL CAPITAL (PK)</div>
          <div className="kpi-value purple">₨{fmtNum(a.totalCapitalPKR)}</div>
          <div className="kpi-sub">Paid by investors in Pakistan</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL CAPITAL (KR)</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">Received here as working cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">MONTHLY COMMITMENT</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)} / mo in PK</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">LIFETIME PAID (PK)</div>
          <div className="kpi-value pos">₨0</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">LIFETIME PAID (KR)</div>
          <div className="kpi-value pos">₩0</div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-2)', lineHeight: '1.5' }}>
          <strong>How investor amounts work:</strong> Investors paid their capital in <strong>PKR in Pakistan</strong>, and you received the equivalent amount as <strong>KRW in Korea</strong> (Fazi Cash). Both numbers are tracked per investor. The <strong>KRW amount</strong> is your actual working capital. Monthly payouts follow the same pattern — enter what you send in PKR and what leaves your KRW cash.
        </p>
      </div>

      <div className="inv-grid">
        {data.investors.map((inv, idx) => {
          const paid = data.payouts.filter(p => p.investorId === inv._id).reduce((sum, p) => sum + (p.amount || 0), 0);
          const share = a.totalCapital ? (inv.capital / a.totalCapital * 100).toFixed(1) : '0';
          return (
            <div key={inv._id} className="inv-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Investor {idx + 1} 
                  <span style={{ background: 'var(--purple-soft)', color: 'var(--purple)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>
                    {share}%
                  </span>
                </h4>
              </div>
              <div className="muted" style={{ fontSize: '11px', marginBottom: '14px' }}>— · since {inv.startDate}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '11px' }}>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Capital (paid in PK)</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>₨{fmtNum(inv.capitalPKR)}</div>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Capital (received in KR)</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{fmtKRW(inv.capital)}</div>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Monthly (PK)</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>₨{fmtNum(inv.monthlyPayoutPKR)}</div>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Monthly (KR)</div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{fmtKRW(inv.monthlyPayout)}</div>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Total Paid (PK)</div>
                  <div className="pos" style={{ fontWeight: '700', fontSize: '13px' }}>₨0</div>
                </div>
                <div>
                  <div className="muted" style={{ marginBottom: '2px' }}>Total Paid (KR)</div>
                  <div className="pos" style={{ fontWeight: '700', fontSize: '13px' }}>₩0</div>
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span className="muted">Months Covered</span>
                  <strong>0</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
                <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => navigate('/payouts')}>Pay Now</button>
                <button className="btn btn-sm" style={{ background: 'var(--surface-2)' }} onClick={() => { setEditingItem(inv); setShowModal(true); }}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => deleteInvestor(inv._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <InvestorModal 
          investor={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateInvestor(editingItem._id, obj);
            else await addInvestor(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const InvestorModal = ({ investor, onClose, onSave }) => {
  const [form, setForm] = useState(investor || { 
    name: '', 
    contact: '', 
    capitalPKR: 0, 
    capital: 0, 
    monthlyPayoutPKR: 0, 
    monthlyPayout: 0, 
    startDate: new Date().toISOString().slice(0,10), 
    notes: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{investor ? 'Edit' : 'Add'} Investor</h3></div>
        <div className="form-row"><label>Investment Name *</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
        <div className="form-row-2">
          <div className="form-row"><label>Capital (PKR)</label><input type="number" value={form.capitalPKR} onChange={e=>setForm({...form, capitalPKR:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Capital (KRW) *</label><input type="number" value={form.capital} onChange={e=>setForm({...form, capital:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Monthly (PKR)</label><input type="number" value={form.monthlyPayoutPKR} onChange={e=>setForm({...form, monthlyPayoutPKR:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Monthly (KRW) *</label><input type="number" value={form.monthlyPayout} onChange={e=>setForm({...form, monthlyPayout:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
        <div className="form-row"><label>Start Date *</label><input type="date" value={form.startDate} onChange={e=>setForm({...form, startDate:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Investor</button>
        </div>
      </div>
    </div>
  );
};

export default Investors;
