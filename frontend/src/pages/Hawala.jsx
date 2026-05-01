import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, fmtNum, agg } from '../utils';

const Hawala = ({ toggleMenu, onLogout }) => {
  const { data, addHawala, updateHawala, deleteHawala } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Fazi Cash</h1>
            <div className="page-sub">Hawala & PKR transfers</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Record Fazi Cash</button>
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

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Received (KRW)</div>
          <div className="kpi-value pos">{fmtKRW(a.hawalaIn)}</div>
          <div className="kpi-sub">Earnings from Pakistani sales</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Settled (PKR)</div>
          <div className="kpi-value">₨{fmtNum(a.hawalaPKR)}</div>
          <div className="kpi-sub">Amount paid in Pakistan</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Discount</div>
          <div className="kpi-value neg">{fmtKRW(a.hawalaDiscount)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)', lineBreak: '1.5' }}>
          <strong>How this works:</strong> The buyer in Pakistan pays in PKR. Their Korea contact hands you KRW locally. 
          Record both here. If you gave a discount on the transfer, enter it to keep your profit tracking accurate.
        </p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Buyer (PK)</th>
                <th>From (KR)</th>
                <th className="num">PKR Amount</th>
                <th className="num">KRW Received</th>
                <th className="num">Discount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.hawala.map(h => (
                <tr key={h._id}>
                  <td>{h.date}</td>
                  <td><strong>{h.buyer}</strong></td>
                  <td>{h.receiverName || '—'}</td>
                  <td className="num">₨{fmtNum(h.amountPKR)}</td>
                  <td className="num pos"><strong>+{fmtKRW(h.amountKRW)}</strong></td>
                  <td className="num neg">{h.discountKRW ? `−${fmtKRW(h.discountKRW)}` : '—'}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => { setEditingItem(h); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteHawala(h._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <HawalaModal 
          item={editingItem} 
          sales={data.sales}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateHawala(editingItem._id, obj);
            else await addHawala(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const HawalaModal = ({ item, sales, onClose, onSave }) => {
  const [form, setForm] = useState(item || { 
    date: new Date().toISOString().slice(0,10), 
    buyer: '', 
    amountPKR: 0, 
    amountKRW: 0, 
    discountKRW: 0, 
    receiverName: '', 
    note: '', 
    linkedSaleId: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Record'} Fazi Cash</h3></div>
        <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        <div className="form-row"><label>Buyer (Pakistan) *</label><input value={form.buyer} onChange={e=>setForm({...form, buyer:e.target.value})} /></div>
        <div className="form-row">
          <label>Link to Sale (marks as received)</label>
          <select value={form.linkedSaleId} onChange={e=>setForm({...form, linkedSaleId:e.target.value})}>
            <option value="">— none —</option>
            {sales.filter(s => (s.qty*s.pricePerUnit) > (s.received||0)).map(s => (
              <option key={s._id} value={s._id}>{s.date} · {s.buyer} · {fmtKRW(s.qty*s.pricePerUnit)}</option>
            ))}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>PKR Amount</label><input type="number" value={form.amountPKR} onChange={e=>setForm({...form, amountPKR:Number(e.target.value)})} /></div>
          <div className="form-row"><label>KRW Received *</label><input type="number" value={form.amountKRW} onChange={e=>setForm({...form, amountKRW:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Discount Given (KRW)</label><input type="number" value={form.discountKRW} onChange={e=>setForm({...form, discountKRW:Number(e.target.value)})} /></div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Transaction</button>
        </div>
      </div>
    </div>
  );
};

export default Hawala;
