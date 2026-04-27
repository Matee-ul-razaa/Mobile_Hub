import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Investors = ({ toggleMenu }) => {
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
            <div className="page-sub">Partners and capital contributions</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Investor</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Capital (PKR)</div>
          <div className="kpi-value purple">₨{fmtNum(a.totalCapitalPKR)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Capital (KRW)</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Monthly Commitment</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)} / mo</div>
        </div>
      </div>

      <div className="inv-grid">
        {data.investors.map(inv => {
          const paid = data.payouts.filter(p => p.investorId === inv._id).reduce((sum, p) => sum + (p.amount || 0), 0);
          const share = a.totalCapital ? (inv.capital / a.totalCapital * 100).toFixed(1) : '0';
          return (
            <div key={inv._id} className="inv-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: 0 }}>{inv.name} <span className="badge badge-purple" style={{ fontSize: '10px' }}>{share}% share</span></h4>
                <div className="inline-actions">
                  <button className="btn btn-sm" onClick={() => { setEditingItem(inv); setShowModal(true); }}>Edit</button>
                </div>
              </div>
              <div className="inv-meta">Member since {inv.startDate}</div>
              
              <div className="inv-stats">
                <div>
                  <div className="inv-stat-label">Capital (KRW)</div>
                  <div className="inv-stat-val">{fmtKRW(inv.capital)}</div>
                </div>
                <div>
                  <div className="inv-stat-label">Total Paid</div>
                  <div className="inv-stat-val pos">{fmtKRW(paid)}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span className="muted">Monthly Payout:</span>
                  <strong>{fmtKRW(inv.monthlyPayout)}</strong>
                </div>
              </div>

              <div className="actions">
                <button className="btn btn-danger btn-sm" onClick={() => deleteInvestor(inv._id)}>Delete</button>
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
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Investor</button>
        </div>
      </div>
    </div>
  );
};

export default Investors;
