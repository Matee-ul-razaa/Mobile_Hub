import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Sales = ({ toggleMenu, onLogout }) => {
  const { data, addSale, updateSale, deleteSale, showToast } = useData();
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
    XLSX.writeFile(wb, `sales-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const handleTemplate = () => {
    const rows = [
      {
        Date: new Date().toISOString().slice(0, 10),
        Buyer: 'Ali Mobile Lahore',
        Model: 'iPhone 14 Pro',
        Qty: 1,
        PricePerUnit: 950000,
        Received: 500000,
        Notes: 'Sample sale record'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Template');
    XLSX.writeFile(wb, 'sales-template.xlsx');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws);

        let success = 0;
        let failed = 0;
        const errors = [];

        for (const [index, row] of rows.entries()) {
          try {
            const buyer = String(row.Buyer || '').trim();
            const model = String(row.Model || '').trim();
            const qty = Number(row.Qty || 0);
            const pricePerUnit = Number(row.PricePerUnit || row.Price || 0);
            const received = Number(row.Received || 0);

            if (!buyer) {
              failed++;
              errors.push(`Row ${index + 2}: Buyer is required`);
              continue;
            }

            if (!model) {
              failed++;
              errors.push(`Row ${index + 2}: Model is required`);
              continue;
            }

            if (qty <= 0) {
              failed++;
              errors.push(`Row ${index + 2}: Qty must be greater than zero`);
              continue;
            }

            if (pricePerUnit <= 0) {
              failed++;
              errors.push(`Row ${index + 2}: PricePerUnit must be greater than zero`);
              continue;
            }

            if (received < 0) {
              failed++;
              errors.push(`Row ${index + 2}: Received cannot be negative`);
              continue;
            }

            await addSale({
              date: row.Date || new Date().toISOString().slice(0, 10),
              buyer,
              model,
              qty,
              pricePerUnit,
              received,
              notes: String(row.Notes || '').trim()
            });

            success++;
          } catch (err) {
            failed++;
            errors.push(`Row ${index + 2}: ${err.message}`);
          }
        }

        if (failed > 0) {
          showToast(`Imported ${success}, failed ${failed}. Check console for details.`, 'warning');
          console.warn('Sales import errors:', errors);
        } else {
          showToast(`Sales import successful. ${success} rows imported.`);
        }
      } catch (err) {
        showToast(err.message || 'Sales import failed', 'danger');
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Sales</h1>
            <div className="page-sub">Orders sent to Pakistan buyers</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleTemplate}>⬇ Template</button>
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Import Excel
            <input type="file" style={{ display: 'none' }} onChange={handleImport} accept=".xlsx,.xls" />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditingSale(null); setShowModal(true); }}>+ New Sale</button>
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
          <div className="kpi-label">TOTAL REVENUE</div>
          <div className="kpi-value">{fmtKRW(a.salesRev)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">COST OF GOODS</div>
          <div className="kpi-value">{fmtKRW(a.salesCOGS)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">GROSS PROFIT</div>
          <div className="kpi-value pos">{fmtKRW(a.grossProfit)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">PENDING RECEIVABLE</div>
          <div className="kpi-value neg">{fmtKRW(a.pendingReceivable)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>BUYER</th>
                <th>MODEL</th>
                <th className="num">QTY</th>
                <th className="num">PRICE/UNIT</th>
                <th className="num">TOTAL</th>
                <th className="num">RECEIVED</th>
                <th className="num">PENDING</th>
                <th>STATUS</th>
                <th>SHIPMENT</th>
                <th>ADDED BY</th>
                <th>ACTIONS</th>
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
                    <td className="num">{fmtKRW(s.pricePerUnit)}</td>
                    <td className="num"><strong>{fmtKRW(total)}</strong></td>
                    <td className="num">{fmtKRW(s.received || 0)}</td>
                    <td className="num neg">{fmtKRW(pending)}</td>
                    <td>
                      <span className={`badge badge-${status === 'Paid' ? 'green' : (status === 'Partial' ? 'amber' : 'red')}`}>
                        {status}
                      </span>
                    </td>
                    <td><span className="muted">—</span></td>
                    <td><span className="badge badge-brand">{s.createdBy || '—'}</span></td>
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
    date: new Date().toISOString().slice(0, 10),
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
        <div className="card-header"><h3 className="card-title">{sale ? 'Edit' : 'New'} Sale Record</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-row"><label>Buyer *</label><input value={form.buyer} onChange={e => setForm({ ...form, buyer: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <label>Model (from stock)</label>
          <select value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
            <option value="">— select —</option>
            {inventory.map(i => <option key={i._id} value={i.model}>{i.model} (In stock: {i.qty - (i.soldQty || 0)})</option>)}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div>
          <div className="form-row"><label>Price (KRW)</label><input type="number" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row"><label>Received Amount (KRW)</label><input type="number" value={form.received} onChange={e => setForm({ ...form, received: Number(e.target.value) })} /></div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Sale</button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
