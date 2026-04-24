import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Investors = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const totalCapital = data.investors.reduce((a,x) => a + (+x.capital||0), 0);
  const totalCapitalPKR = data.investors.reduce((a,x) => a + (+x.capitalPKR||0), 0);
  const totalMonthly = data.investors.reduce((a,x) => a + (+x.monthlyPayout||0), 0);
  const totalMonthlyPKR = data.investors.reduce((a,x) => a + (+x.monthlyPayoutPKR||0), 0);
  const totalPaid = data.payouts.reduce((a,x) => a + (+x.amount||0), 0);
  const totalPaidPKR = data.payouts.reduce((a,x) => a + (+x.amountPKR||0), 0);

  const handleEdit = (i) => {
    setEditData(i || { name:'', contact:'', capitalPKR:0, capital:0, monthlyPayoutPKR:0, monthlyPayout:0, startDate:todayISO(), notes:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.name) return alert('Name required');
    try {
      if (editData._id) {
        await putter(`/investors/${editData._id}`, editData);
      } else {
        await poster('/investors', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete investor and all their payouts?')) return;
    try {
      // In a real app we'd delete payouts on backend
      await deleter(`/investors/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Investors</div><div className="kpi-value">{data.investors.length}</div></div>
        <div className="kpi"><div className="kpi-label">Total Capital (PK)</div><div className="kpi-value purple">₨{fmtNum(totalCapitalPKR)}</div>
          <div className="kpi-sub">Paid by investors in Pakistan</div></div>
        <div className="kpi"><div className="kpi-label">Total Capital (KR)</div><div className="kpi-value purple">{fmtKRW(totalCapital)}</div>
          <div className="kpi-sub">Received here as working cash</div></div>
        <div className="kpi"><div className="kpi-label">Monthly Commitment</div><div className="kpi-value">{fmtKRW(totalMonthly)}</div>
          <div className="kpi-sub">₨{fmtNum(totalMonthlyPKR)}/mo in PK</div></div>
        <div className="kpi"><div className="kpi-label">Lifetime Paid (PK)</div><div className="kpi-value pos">₨{fmtNum(totalPaidPKR)}</div></div>
        <div className="kpi"><div className="kpi-label">Lifetime Paid (KR)</div><div className="kpi-value pos">{fmtKRW(totalPaid)}</div></div>
      </div>
      <div className="card" style={{ marginBottom: '14px' }}>
        <p style={{ margin:0, fontSize:'13px', color:'var(--text-2)' }}>
          <strong>How investor amounts work:</strong> Investors paid their capital in <strong>PKR in Pakistan</strong>, and you received the equivalent amount as <strong>KRW in Korea</strong> (hawala). Both numbers are tracked per investor. The <strong>KRW amount</strong> is your actual working capital. Monthly payouts follow the same pattern — enter what you send in PKR and what leaves your KRW cash.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Investor</button>
      </div>

      <div className="inv-grid">
        {data.investors.length === 0 ? <div className="empty" style={{gridColumn:'1/-1'}}>No investors yet.</div> :
          data.investors.map(i => {
            const paid = data.payouts.filter(p => p.investorId===i._id).reduce((a,x) => a+(+x.amount||0), 0);
            const paidPKR = data.payouts.filter(p => p.investorId===i._id).reduce((a,x) => a+(+x.amountPKR||0), 0);
            const share = totalCapital ? (i.capital/totalCapital*100).toFixed(1) : '0';
            return (
              <div key={i._id} className="inv-card">
                <h4>{i.name} <span className="badge badge-purple" style={{marginLeft:'6px'}}>{share}%</span></h4>
                <div className="inv-meta">{i.contact||'—'} · since {i.startDate}</div>
                <div className="inv-stats">
                  <div><div className="inv-stat-label">Capital (paid in PK)</div><div className="inv-stat-val">₨{fmtNum(i.capitalPKR||0)}</div></div>
                  <div><div className="inv-stat-label">Capital (received in KR)</div><div className="inv-stat-val">{fmtKRW(i.capital)}</div></div>
                  <div><div className="inv-stat-label">Monthly (PK)</div><div className="inv-stat-val">₨{fmtNum(i.monthlyPayoutPKR||0)}</div></div>
                  <div><div className="inv-stat-label">Monthly (KR)</div><div className="inv-stat-val">{fmtKRW(i.monthlyPayout)}</div></div>
                  <div><div className="inv-stat-label">Total Paid (PK)</div><div className="inv-stat-val text-green">₨{fmtNum(paidPKR)}</div></div>
                  <div><div className="inv-stat-label">Total Paid (KR)</div><div className="inv-stat-val text-green">{fmtKRW(paid)}</div></div>
                  <div><div className="inv-stat-label">Months Covered</div><div className="inv-stat-val">{i.monthlyPayout?Math.floor(paid/i.monthlyPayout):0}</div></div>
                </div>
                {i.notes && <div className="muted" style={{marginTop:'10px',fontSize:'12px'}}>{i.notes}</div>}
                <div className="actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(i)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i._id)}>Delete</button>
                </div>
              </div>
            );
          })
        }
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Add'} Investor</h3>
            <div className="form-row"><label>Name *</label><input value={editData.name} onChange={e => setEditData({...editData, name:e.target.value})} /></div>
            <div className="form-row"><label>Contact (phone / email)</label><input value={editData.contact} onChange={e => setEditData({...editData, contact:e.target.value})} /></div>
            <div style={{ background:'var(--surface-2)', borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
              <div className="muted" style={{ fontSize:'12px', fontWeight:500, marginBottom:'8px' }}>CAPITAL (one-time)</div>
              <div className="form-row-2">
                <div className="form-row"><label>Paid in Pakistan (PKR)</label><input type="number" value={editData.capitalPKR} onChange={e => setEditData({...editData, capitalPKR:Number(e.target.value)})} placeholder="e.g. 2000000" /></div>
                <div className="form-row"><label>Received in Korea (KRW) *</label><input type="number" value={editData.capital} onChange={e => setEditData({...editData, capital:Number(e.target.value)})} placeholder="e.g. 10000000" /></div>
              </div>
            </div>
            <div style={{ background:'var(--surface-2)', borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
              <div className="muted" style={{ fontSize:'12px', fontWeight:500, marginBottom:'8px' }}>MONTHLY PAYOUT</div>
              <div className="form-row-2">
                <div className="form-row"><label>You pay in Pakistan (PKR)</label><input type="number" value={editData.monthlyPayoutPKR} onChange={e => setEditData({...editData, monthlyPayoutPKR:Number(e.target.value)})} placeholder="e.g. 60000" /></div>
                <div className="form-row"><label>Leaves your KRW cash *</label><input type="number" value={editData.monthlyPayout} onChange={e => setEditData({...editData, monthlyPayout:Number(e.target.value)})} placeholder="e.g. 300000" /></div>
              </div>
            </div>
            <div className="form-row"><label>Start Date</label><input type="date" value={editData.startDate} onChange={e => setEditData({...editData, startDate:e.target.value})} /></div>
            <div className="form-row"><label>Notes</label><textarea value={editData.notes} onChange={e => setEditData({...editData, notes:e.target.value})} /></div>
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
