import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Sales = () => {
  const { data, addSale, updateSale, deleteSale } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  const a = agg(data);

  const handleExport = () => {
    const rows = data.sales.map(s => ({
      Date: s.date,
      Buyer: s.buyer,
      Model: s.model,
      Qty: s.qty,
      Price: s.pricePerUnit,
      Total: s.qty * s.pricePerUnit,
      Received: s.received || 0,
      Pending: (s.qty * s.pricePerUnit) - (s.received || 0),
      Notes: s.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales-export-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Sales & Shipments</h2>
        <div className="page-actions">
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
          <button className="btn btn-primary" onClick={() => { setEditingSale(null); setShowModal(true); }}>+ New Sale</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Cost of Goods</div>
          <div className="kpi-value">{fmtKRW(a.salesCOGS)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Gross Profit</div>
          <div className="kpi-value pos">{fmtKRW(a.grossProfit)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Pending Receivable</div>
          <div className="kpi-value neg">{fmtKRW(a.pendingReceivable)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Buyer</th>
                <th>Model</th>
                <th className="num">Qty</th>
                <th className="num">Total</th>
                <th className="num">Received</th>
                <th className="num">Pending</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map(s => {
                const total = s.qty * s.pricePerUnit;
                const pending = total - (s.received || 0);
                const status = pending <= 0 ? 'Paid' : (s.received > 0 ? 'Partial' : 'Pending');
                return (
                  <tr key={s._id}>
                    <td>{s.date}</td>
                    <td><strong>{s.buyer}</strong></td>
                    <td>{s.model}</td>
                    <td className="num">{s.qty}</td>
                    <td className="num"><strong>{fmtKRW(total)}</strong></td>
                    <td className="num">{fmtKRW(s.received || 0)}</td>
                    <td className="num text-red">{fmtKRW(pending)}</td>
                    <td>
                      <span className={`badge badge-${status === 'Paid' ? 'green' : (status === 'Partial' ? 'amber' : 'red')}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingSale(s); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteSale(s._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SaleModal 
          sale={editingSale} 
          inventory={data.inventory}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingSale) await updateSale(editingSale._id, obj);
            else await addSale(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const SaleModal = ({ sale, inventory, onClose, onSave }) => {
  const [form, setForm] = useState(sale || { 
    date: new Date().toISOString().slice(0,10), 
    buyer: '', 
    model: '', 
    qty: 1, 
    pricePerUnit: 0, 
    received: 0, 
    notes: '' 
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{sale ? 'Edit' : 'New'} Sale Record</h3>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row"><label>Buyer *</label><input value={form.buyer} onChange={e=>setForm({...form, buyer:e.target.value})} /></div>
        </div>
        <div className="form-row">
          <label>Model (from stock)</label>
          <select value={form.model} onChange={e=>setForm({...form, model:e.target.value})}>
            <option value="">— select —</option>
            {inventory.map(i => <option key={i._id} value={i.model}>{i.model} (In stock: {i.qty - (i.soldQty||0)})</option>)}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e=>setForm({...form, qty:Number(e.target.value)})} /></div>
          <div className="form-row"><label>Price (KRW)</label><input type="number" value={form.pricePerUnit} onChange={e=>setForm({...form, pricePerUnit:Number(e.target.value)})} /></div>
        </div>
        <div className="form-row"><label>Received Amount (KRW)</label><input type="number" value={form.received} onChange={e=>setForm({...form, received:Number(e.target.value)})} /></div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Sale</button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
