import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const Cashflow = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const all = [];
  data.cashflow.forEach(c => all.push({...c, src:'Manual', dbId: c._id}));
  data.hawala.forEach(h => all.push({_id:'h_'+h._id, type:'in', date:h.date, amount:h.amountKRW, source:`Hawala — ${h.buyer}`, note:h.note||'', src:'Hawala'}));
  data.expenses.forEach(e => all.push({_id:'e_'+e._id, type:'out', date:e.date, amount:e.amount, source:`Expense — ${e.category}`, note:e.note||'', src:'Expense'}));
  data.payouts.forEach(p => {
    const inv = data.investors.find(i => i._id === p.investorId);
    all.push({_id:'p_'+p._id, type:'out', date:p.date, amount:p.amount, source:`Payout — ${inv?inv.name:'?'}`, note:p.note||'', src:'Payout'});
  });

  all.sort((a,b) => b.date.localeCompare(a.date));
  const cashIn = all.filter(x => x.type==='in').reduce((a,x) => a+x.amount, 0);
  const cashOut = all.filter(x => x.type==='out').reduce((a,x) => a+x.amount, 0);

  const handleEdit = (c) => {
    setEditData(c || { date:todayISO(), type:'in', amount:0, source:'', note:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.amount||!editData.source) return alert('Source & amount required');
    try {
      if (editData.dbId) {
        await putter(`/cashflow/${editData.dbId}`, editData);
      } else {
        await poster('/cashflow', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete?')) return;
    try {
      await deleter(`/cashflow/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Cash In</div><div className="kpi-value pos">{fmtKRW(cashIn)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Cash Out</div><div className="kpi-value neg">{fmtKRW(cashOut)}</div></div>
        <div className="kpi"><div className="kpi-label">Net</div><div className={`kpi-value ${cashIn-cashOut>=0?'pos':'neg'}`}>{fmtKRW(cashIn-cashOut)}</div></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Entry</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">All Cash Movement</h3>
          <div className="muted" style={{fontSize:'12px'}}>Includes manual entries, hawala, expenses, payouts</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Source / Detail</th><th>Origin</th><th>Note</th><th className="num">Amount</th><th></th></tr></thead>
            <tbody>
              {all.length === 0 ? <tr><td colSpan="7" className="empty">No entries yet.</td></tr> :
                all.map(c => (
                  <tr key={c._id}>
                    <td>{c.date}</td>
                    <td>{c.type==='in'?<span className="badge badge-green">IN</span>:<span className="badge badge-red">OUT</span>}</td>
                    <td>{c.source}</td>
                    <td><span className="badge badge-gray">{c.src}</span></td>
                    <td>{c.note||''}</td>
                    <td className={`num text-${c.type==='in'?'green':'red'}`}>
                      <strong>{c.type==='in'?'+':'−'}{fmtKRW(c.amount)}</strong>
                    </td>
                    <td>
                      {c.src === 'Manual' && (
                        <div className="inline-actions">
                          <button className="btn btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.dbId)}>Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData.dbId ? 'Edit' : 'Add'} Cash Entry</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Type</label>
                <select value={editData.type} onChange={e => setEditData({...editData, type:e.target.value})}>
                  <option value="in">Cash In</option>
                  <option value="out">Cash Out</option>
                </select>
              </div>
            </div>
            <div className="form-row"><label>Source / Reason *</label><input value={editData.source} onChange={e => setEditData({...editData, source:e.target.value})} placeholder="Investor top-up / Withdraw etc." /></div>
            <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount:Number(e.target.value)})} /></div>
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
export default Cashflow;
