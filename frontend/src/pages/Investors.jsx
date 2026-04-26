import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Investors = () => {
  const { data, addInvestor, updateInvestor, deleteInvestor } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Investor Relations</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Investor</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Capital (PKR)</div>
          <div className="kpi-value purple">₨{fmtNum(a.totalCapitalPKR)}</div>
          <div className="kpi-sub">Paid in Pakistan</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Capital (KRW)</div>
          <div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div>
          <div className="kpi-sub">Received in Korea</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Monthly Commitment</div>
          <div className="kpi-value">{fmtKRW(a.totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)} / mo</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Lifetime Paid</div>
          <div className="kpi-value pos">{fmtKRW(a.totalPaid)}</div>
        </div>
      </div>

      <div className="inv-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {data.investors.map(inv => {
          const paid = data.payouts.filter(p => p.investorId === inv._id).reduce((sum, p) => sum + (p.amount || 0), 0);
          const share = a.totalCapital ? (inv.capital / a.totalCapital * 100).toFixed(1) : '0';
          return (
            <div key={inv._id} className="card inv-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>{inv.name} <span className="badge badge-purple" style={{ fontSize: '10px' }}>{share}% share</span></h3>
                <div className="inline-actions">
                  <button className="btn btn-sm" onClick={() => { setEditingItem(inv); setShowModal(true); }}>Edit</button>
                </div>
              </div>
              <div className="muted" style={{ fontSize: '12px', marginBottom: '15px' }}>Member since {inv.startDate}</div>
              
              <div className="inv-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '8px' }}>
                  <label className="muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Capital (KRW)</label>
                  <div style={{ fontWeight: 600 }}>{fmtKRW(inv.capital)}</div>
                </div>
                <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '8px' }}>
                  <label className="muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Total Paid</label>
                  <div style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtKRW(paid)}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Monthly Contribution:</span>
                  <strong>{fmtKRW(inv.monthlyPayout)}</strong>
                </div>
                <div className="muted" style={{ textAlign: 'right', fontSize: '11px' }}>₨{fmtNum(inv.monthlyPayoutPKR)} in Pakistan</div>
              </div>

              <div className="card-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Pay Now</button>
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
        <h3>{investor ? 'Edit' : 'Add'} Investor</h3>
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
