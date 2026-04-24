import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, todayISO } from '../utils';
import { poster, putter, deleter } from '../api';

const EXP_CATS = ['Shipping','Packaging','Commission','Customs','Transport','Office','Personal','Salary','Other'];

const Expenses = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const total = data.expenses.reduce((a,x) => a+x.amount, 0);
  const byCat = {};
  data.expenses.forEach(e => byCat[e.category] = (byCat[e.category]||0) + e.amount);

  const handleEdit = (e) => {
    setEditData(e || { date:todayISO(), category:'Shipping', amount:0, note:'' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if(!editData.amount) return alert('Amount required');
    try {
      if (editData._id) {
        await putter(`/expenses/${editData._id}`, editData);
      } else {
        await poster('/expenses', editData);
      }
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete expense?')) return;
    try {
      await deleter(`/expenses/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const sortedExpenses = [...data.expenses].sort((a,b) => b.date.localeCompare(a.date));

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Add Expense</button>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Expenses — Total {fmtKRW(total)}</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Note</th><th className="num">Amount (KRW)</th><th></th></tr></thead>
              <tbody>
                {sortedExpenses.length === 0 ? <tr><td colSpan="5" className="empty">No expenses yet.</td></tr> :
                  sortedExpenses.map(e => (
                    <tr key={e._id}>
                      <td>{e.date}</td>
                      <td><span className="badge badge-amber">{e.category}</span></td>
                      <td>{e.note||''}</td>
                      <td className="num text-red"><strong>{fmtKRW(e.amount)}</strong></td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn btn-sm" onClick={() => handleEdit(e)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">By Category</h3></div>
          {Object.keys(byCat).length === 0 ? <div className="empty">—</div> :
            Object.entries(byCat).sort((a,b) => b[1]-a[1]).map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
                <span>{k}</span><strong>{fmtKRW(v)}</strong>
              </div>
            ))
          }
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg show" onClick={(e) => { if(e.target.className.includes('modal-bg')) setModalOpen(false) }}>
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Add'} Expense</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date</label><input type="date" value={editData.date} onChange={e => setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Category</label>
                <select value={editData.category} onChange={e => setEditData({...editData, category:e.target.value})}>
                  {EXP_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
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
export default Expenses;
