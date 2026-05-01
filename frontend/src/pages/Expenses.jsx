import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const Expenses = ({ toggleMenu, onLogout }) => {
  const { data, addExpense, updateExpense, deleteExpense } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);
  const byCat = {};
  data.expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + e.amount);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Expenses</h1>
            <div className="page-sub">Shipping, packing, commission, personal costs</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Expense</button>
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

      <div className="chart-grid">
        <div className="card">
          <div className="card-header"><h3 className="card-title">All Expenses — Total {fmtKRW(a.totalExp)}</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CATEGORY</th>
                  <th>NOTE</th>
                  <th className="num">AMOUNT (KRW)</th>
                  <th>ADDED BY</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {[...data.expenses].reverse().map(e => (
                  <tr key={e._id}>
                    <td>{e.date}</td>
                    <td><span className="badge badge-amber">{e.category}</span></td>
                    <td>{e.note}</td>
                    <td className="num neg"><strong>{fmtKRW(e.amount)}</strong></td>
                    <td><span className="badge badge-brand">{e.createdBy || '—'}</span></td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingItem(e); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteExpense(e._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">By Category</h3></div>
          <div className="cat-list">
            {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat, val]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{cat}</span>
                <strong>{fmtKRW(val)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <ExpenseModal 
          item={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateExpense(editingItem._id, obj);
            else await addExpense(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const ExpenseModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || { date: new Date().toISOString().slice(0,10), category: 'Shipping', amount: 0, note: '' });
  const cats = ['Shipping','Packaging','Commission','Customs','Transport','Office','Salary','Other'];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Add'} Expense</h3></div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row">
          <label>Category</label>
          <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Expense</button>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
