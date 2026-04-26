import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg, todayISO, ym } from '../utils';
import { poster, putter, deleter } from '../api';

const Expenses = () => {
  const { data, loadAll } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filterMonth, setFilterMonth] = useState(ym());

  const a = agg(data);
  const list = data.expenses.filter(e => ym(e.date) === filterMonth);
  const totalMonth = list.reduce((acc,x)=>acc+x.amount, 0);

  const handleEdit = (exp) => {
    setEditData(exp || { date: todayISO(), category: 'Office Rent', amount: 0, note: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editData._id) await putter(`/expenses/${editData._id}`, editData);
      else await poster('/expenses', editData);
      setModalOpen(false);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete expense entry?')) return;
    try {
      await deleter(`/expenses/${id}`);
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Expenses (All Time)</div><div className="kpi-value text-red">{fmtKRW(a.totalExp)}</div></div>
        <div className="kpi"><div className="kpi-label">Month Total ({filterMonth})</div><div className="kpi-value">{fmtKRW(totalMonth)}</div></div>
        <div className="kpi"><div className="kpi-label">Entries</div><div className="kpi-value">{list.length}</div></div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleEdit(null)}>+ Create Expense</button>
        <div style={{ flex:1 }} />
        <input type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{ padding:'8px 12px', borderRadius:'10px', border:'1px solid var(--border)', background:'var(--surface-2)' }} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Category</th><th>Note</th><th className="num">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan="5" className="empty">No expenses for this month.</td></tr> :
                list.map(e => (
                  <tr key={e._id}>
                    <td>{e.date}</td>
                    <td><span className="badge badge-gray">{e.category}</span></td>
                    <td>{e.note}</td>
                    <td className="num text-red font-bold">{fmtKRW(e.amount)}</td>
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

      {modalOpen && (
        <div className="modal-bg show">
          <div className="modal">
            <h3>{editData._id ? 'Edit' : 'Create'} Expense</h3>
            <div className="form-row-2">
              <div className="form-row"><label>Date *</label><input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} /></div>
              <div className="form-row"><label>Category</label>
                <select value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})}>
                  <option>Office Rent</option>
                  <option>Electricity / Utilities</option>
                  <option>Shipping / Customs</option>
                  <option>Marketing</option>
                  <option>Travel / Food</option>
                  <option>Taxes</option>
                  <option>Wages / Commissions</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:Number(e.target.value)})} /></div>
            <div className="form-row"><label>Note</label><textarea value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} /></div>
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
