import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg, todayISO, uid } from '../utils';
import { poster, putter, deleter } from '../api';

const Investors = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const a = agg(data);

  const handleEdit = (inv) => {
    setEditData(inv || { name: '', contact: '', capitalPKR: 0, capital: 0, monthlyPayoutPKR: 0, monthlyPayout: 0, startDate: todayISO(), notes: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/investors/${editData._id}`, editData);
      else await poster('/investors', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete investor and all their history?')) return;
    try {
      await deleter(`/investors/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Investor Capital</div><div className="kpi-value purple">{fmtKRW(a.totalCapital)}</div><div className="kpi-sub">₨{fmtNum(a.totalCapitalPKR)} PKR total</div></div>
        <div className="kpi"><div className="kpi-label">Monthly Commitment</div><div className="kpi-value">{fmtKRW(a.totalMonthly)}</div><div className="kpi-sub">₨{fmtNum(a.totalMonthlyPKR)} PKR / mo</div></div>
        <div className="kpi"><div className="kpi-label">Lifetime Paid</div><div className="kpi-value pos">{fmtKRW(a.totalPaid)}</div><div className="kpi-sub">₨{fmtNum(a.totalPaidPKR)} PKR total</div></div>
      </div>

      <div style={{ marginBottom:'16px' }}><button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Investor</button></div>

      <div className="inv-grid">
        {data.investors.map(i => {
          const paid = data.payouts.filter(p => p.investorId === i._id).reduce((acc,x)=>acc+x.amount, 0);
          const share = a.totalCapital ? (i.capital / a.totalCapital * 100).toFixed(1) : 0;
          return (
            <div className="inv-card" key={i._id}>
              <h4>{i.name} <span className="badge badge-purple" style={{marginLeft:'6px'}}>{share}%</span></h4>
              <div className="inv-meta">{i.contact || 'No contact'} · since {i.startDate}</div>
              <div className="inv-stats">
                <div><div className="inv-stat-label">Capital (PKR)</div><div className="inv-stat-val">₨{fmtNum(i.capitalPKR)}</div></div>
                <div><div className="inv-stat-label">Capital (KRW)</div><div className="inv-stat-val">{fmtKRW(i.capital)}</div></div>
                <div><div className="inv-stat-label">Monthly (PKR)</div><div className="inv-stat-val">₨{fmtNum(i.monthlyPayoutPKR)}</div></div>
                <div><div className="inv-stat-label">Monthly (KRW)</div><div className="inv-stat-val">{fmtKRW(i.monthlyPayout)}</div></div>
                <div><div className="inv-stat-label">Total Paid (KRW)</div><div className="inv-stat-val text-green">{fmtKRW(paid)}</div></div>
              </div>
              <div className="actions">
                 <button className="btn btn-sm" onClick={() => handleEdit(i)}>Edit</button>
                 <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i._id)}>Del</button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Add'} Investor</h3>
            <div className="form-row"><label>Name *</label><input value={editData.name} onChange={e=>setEditData({...editData, name:e.target.value})} /></div>
            <div className="form-row"><label>Contact Info</label><input value={editData.contact} onChange={e=>setEditData({...editData, contact:e.target.value})} /></div>
            <div style={{ background:'var(--surface-2)', padding:'12px', borderRadius:'8px', marginBottom:'12px' }}>
              <div className="form-row-2">
                <div className="form-row"><label>Capital (PKR)</label><input type="number" value={editData.capitalPKR} onChange={e=>setEditData({...editData, capitalPKR:Number(e.target.value)})} /></div>
                <div className="form-row"><label>Capital (KRW) *</label><input type="number" value={editData.capital} onChange={e=>setEditData({...editData, capital:Number(e.target.value)})} /></div>
              </div>
            </div>
            <div style={{ background:'var(--surface-2)', padding:'12px', borderRadius:'8px', marginBottom:'12px' }}>
              <div className="form-row-2">
                <div className="form-row"><label>Monthly Payout (PKR)</label><input type="number" value={editData.monthlyPayoutPKR} onChange={e=>setEditData({...editData, monthlyPayoutPKR:Number(e.target.value)})} /></div>
                <div className="form-row"><label>Monthly Payout (KRW) *</label><input type="number" value={editData.monthlyPayout} onChange={e=>setEditData({...editData, monthlyPayout:Number(e.target.value)})} /></div>
              </div>
            </div>
            <div className="form-row"><label>Start Date</label><input type="date" value={editData.startDate} onChange={e=>setEditData({...editData, startDate:e.target.value})} /></div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Investors;
