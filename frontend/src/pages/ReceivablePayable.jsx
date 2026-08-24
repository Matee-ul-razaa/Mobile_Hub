import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const ReceivablePayable = ({ toggleMenu, onLogout }) => {
  const { data, addRP, updateRP, deleteRP, showToast, showConfirm, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const rp = data.rp || [];
  const a = agg(data);

  const pendingReceivables = rp.filter(r => r.type === 'Receivable' && r.status === 'Pending').reduce((acc, r) => acc + (r.amount || 0), 0);
  const pendingPayables = rp.filter(r => r.type === 'Payable' && r.status === 'Pending').reduce((acc, r) => acc + (r.amount || 0), 0);

  const handleSave = async (obj) => {
    try {
      if (obj._id) {
        await updateRP(obj._id, obj);
        showToast('Record updated');
      } else {
        await addRP(obj);
        showToast('Record added');
      }
      setShowModal(false);
    } catch (err) {
      showToast(err.message || 'Error saving record', 'danger');
    }
  };

  const handleDelete = (id) => {
    showConfirm('Are you sure you want to delete this record?', async () => {
      try {
        await deleteRP(id);
        await refreshData();
        showToast('Record deleted');
      } catch (err) {
        showToast('Error deleting record', 'danger');
      }
    });
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title-bar">
          <button className="menu-btn" onClick={toggleMenu}>☰</button>
          <h2 className="page-title">Receivable & Payable</h2>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Record Entry</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Receivables (Pending)</div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>{fmtKRW(pendingReceivables)}</div>
          <div className="kpi-sub">Total money you are owed</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Payables (Pending)</div>
          <div className="kpi-value neg" style={{ color: 'var(--red)' }}>{fmtKRW(pendingPayables)}</div>
          <div className="kpi-sub">Total money you owe</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Records</h3>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Party</th>
                <th className="num">Amount (KRW)</th>
                <th>Status</th>
                <th>Note</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rp.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No records found. Add one above!</td></tr>
              ) : (
                rp.slice().reverse().map(r => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>
                      <span className={`badge ${r.type === 'Receivable' ? 'bg-green' : 'bg-red'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="bold">{r.party}</td>
                    <td className="num">{fmtKRW(r.amount)}</td>
                    <td>
                      <span className={`badge ${r.status === 'Settled' ? 'bg-gray' : 'bg-orange'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="muted">{r.notes || '—'}</td>
                    <td className="action-col">
                      <div className="action-group">
                        <button className="btn-action-edit" onClick={() => { setEditingItem(r); setShowModal(true); }}>Edit</button>
                        <button className="btn-action-del" onClick={() => handleDelete(r._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <RPModal 
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const RPModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || {
    date: new Date().toISOString().slice(0, 10),
    type: 'Receivable',
    party: '',
    amount: '',
    status: 'Pending',
    notes: ''
  });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="card-header">
          <h3 className="card-title">{item ? 'Edit Record' : 'Add Record'}</h3>
        </div>
        <div className="form-row-2">
          <div className="form-row">
            <label>Date *</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div className="form-row">
            <label>Type *</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="Receivable">Receivable (Money owed to you)</option>
              <option value="Payable">Payable (Money you owe)</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label>Party (Person or Company Name) *</label>
          <input type="text" placeholder="e.g. Ali, Electronics Ltd" value={form.party} onChange={e => setForm({...form, party: e.target.value})} />
        </div>
        <div className="form-row-2">
          <div className="form-row">
            <label>Amount (KRW) *</label>
            <input type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label>Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default ReceivablePayable;
