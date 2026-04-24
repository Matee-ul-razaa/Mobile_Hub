import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, ym, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Payouts = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const totalPaid = data.payouts.reduce((a,x) => a + (+x.amount||0), 0);
  const totalPaidPKR = data.payouts.reduce((a,x) => a + (+x.amountPKR||0), 0);

  const sorted = [...data.payouts].sort((a,b) => b.date.localeCompare(a.date));

  const byMonth = {};
  data.payouts.forEach(p => { 
    const m = ym(p.date); 
    if(!byMonth[m]) byMonth[m] = {krw:0, pkr:0}; 
    byMonth[m].krw += (+p.amount||0); 
    byMonth[m].pkr += (+p.amountPKR||0); 
  });

  const handleEdit = (p) => {
    setEditData(p || { date:todayISO(), investorId:'', amount:0, amountPKR:0, note:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.investorId || !editData.amount) return alert('Investor and KRW amount required');
    try {
      if (editData._id) {
        await putter(`/payouts/${editData._id}`, editData);
      } else {
        await poster('/payouts', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete payout?')) return;
    try {
      await deleter(`/payouts/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Paid (PK)</div><div className="kpi-value">₨{fmtNum(totalPaidPKR)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Paid (KR)</div><div className="kpi-value neg">{fmtKRW(totalPaid)}</div></div>
        <div className="kpi"><div className="kpi-label">Entries</div><div className="kpi-value">{data.payouts.length}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Record Payout</button>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Payouts</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Investor</th><th className="num">PKR (paid in PK)</th><th className="num">KRW (from your cash)</th><th>Note</th><th></th></tr></thead>
              <tbody>
                {sorted.length === 0 ? <tr><td colSpan="6" className="empty">No payouts yet.</td></tr> :
                  sorted.map(p => {
                    const inv = data.investors.find(i => i._id === p.investorId);
                    return (
                      <tr key={p._id}>
                        <td>{p.date}</td>
                        <td><strong>{inv?inv.name:'—'}</strong></td>
                        <td className="num">₨{fmtNum(p.amountPKR||0)}</td>
                        <td className="num text-red"><strong>{fmtKRW(p.amount)}</strong></td>
                        <td>{p.note||''}</td>
                        <td>
                          <div className="inline-actions">
                            <button className="btn btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p._id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Paid by Month</h3></div>
          {Object.keys(byMonth).length === 0 ? <div className="empty">—</div> :
            Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).slice(0,6).map(([m,v]) => (
              <div key={m} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:'12px'}}>
                <span>{m}</span><span><span className="muted">₨{fmtNum(v.pkr)}</span> · <strong>{fmtKRW(v.krw)}</strong></span>
              </div>
            ))
          }
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Record'} Investor Payout</h3>
            <div className="form-row"><label>Investor *</label>
              <select value={editData.investorId} onChange={e => {
                const inv = data.investors.find(i => i._id === e.target.value);
                if (inv && !editData._id && !editData.amount) {
                  setEditData({...editData, investorId:e.target.value, amount: inv.monthlyPayout, amountPKR: inv.monthlyPayoutPKR||0});
                } else {
                  setEditData({...editData, investorId:e.target.value});
                }
              }}>
                <option value="">— select —</option>
                {data.investors.map(i => <option key={i._id} value={i._id}>{i.name} (₨{fmtNum(i.monthlyPayoutPKR||0)} / {fmtKRW(i.monthlyPayout)} per mo)</option>)}
              </select>
            </div>
            <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
            <div className="form-row-2">
              <div className="form-row"><label>Paid in Pakistan (PKR)</label><input type="number" value={editData.amountPKR} onChange={e => setEditData({...editData, amountPKR:Number(e.target.value)})} /></div>
              <div className="form-row"><label>Leaves your KRW cash *</label><input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount:Number(e.target.value)})} /></div>
            </div>
            <div className="form-row"><label>Note</label><textarea value={editData.note} onChange={e => setEditData({...editData, note:e.target.value})} /></div>
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
export default Payouts;
