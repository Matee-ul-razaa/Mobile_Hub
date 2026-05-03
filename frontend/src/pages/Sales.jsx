import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Sales = ({ toggleMenu, onLogout }) => {
  const { data, addSale, updateSale, deleteSale, showToast } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const a = agg(data);

  const filteredSales = (data.sales || []).filter(s => {
    const search = searchTerm.toLowerCase();
    return (
      (s.buyer || '').toLowerCase().includes(search) ||
      (s.modelName || s.model || '').toLowerCase().includes(search) ||
      (s.imei1 || '').toLowerCase().includes(search)
    );
  });

  const handleExport = () => {
    const rows = data.sales.map(s => ({
      Date: s.date,
      Buyer: s.buyer,
      Model: s.modelName,
      Storage: s.storage || '',
      Color: s.color || '',
      IMEI: s.imei1 || '',
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
    const rows = [{
      Date: new Date().toISOString().slice(0, 10),
      Buyer: 'Ali Pakistan',
      IMEI: '354321294930989',
      Qty: 1,
      Price: 1250000,
      Received: 500000,
      Notes: 'Initial payment received'
    }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'sales-import-template.xlsx');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataArr = new Uint8Array(evt.target.result);
        const wb = XLSX.read(dataArr, { type: 'array', cellDates: true });
        
        let totalSuccess = 0;
        let totalFailed = 0;
        const allErrors = [];

        // Try all sheets in the workbook
        for (const sheetName of wb.SheetNames) {
          if (sheetName.toLowerCase().includes('statistics')) continue;

          const ws = wb.Sheets[sheetName];
          const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (allRows.length < 2) continue;

          console.log(`Import: Checking sheet "${sheetName}" (${allRows.length} rows)`);

          // 1. Find a default buyer from the top rows
          let defaultBuyer = '';
          for (let i = 0; i < Math.min(allRows.length, 15); i++) {
            const row = allRows[i];
            if (!row) continue;
            const idx = row.findIndex(c => {
              const s = String(c || '').toLowerCase();
              return s === 'customer' || s === 'buyer' || s.includes('customer:') || s.includes('buyer:');
            });
            if (idx >= 0 && row[idx+1]) {
              defaultBuyer = String(row[idx+1]).trim();
              break;
            }
          }

          // 2. Find the header row
          let headerIdx = -1;
          for (let i = 0; i < Math.min(allRows.length, 40); i++) {
            const row = allRows[i];
            if (row && row.some(c => {
              const s = String(c || '').toLowerCase();
              return (s.includes('model') && s.includes('name')) || s === 'imei' || s.includes('shipment price') || s.includes('actual price');
            })) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) {
            console.log(`Import: No header row found in sheet "${sheetName}"`);
            continue; 
          }

          const headers = allRows[headerIdx].map(h => String(h || '').trim());
          const getColIdx = (names) => {
            const nameList = Array.isArray(names) ? names : [names];
            return headers.findIndex(h => nameList.some(name => {
              const hl = h.toLowerCase().replace(/\s/g, '');
              const nl = name.toLowerCase().replace(/\s/g, '');
              return hl === nl || (nl.length > 3 && hl.includes(nl));
            }));
          };

          const iDate = getColIdx(['Date', 'Transaction Date', 'Shipment Date']);
          const iBuyer = getColIdx(['Buyer', 'Customer', 'Buyer Name']);
          const iIMEI = getColIdx(['IMEI', 'IMEI1', 'S/N', 'Serial']);
          const iQty = getColIdx(['Qty', 'Quantity']);
          // "Shipment Price" is the unit price
          const iPrice = getColIdx(['Shipment Price', 'Price', 'Rate', 'Actual Purchase Price']);
          // "Actual Shipment Price" is the received amount
          const iReceived = getColIdx(['Actual Shipment Price', 'Received', 'Paid']);
          const iNotes = getColIdx(['Notes', 'Memo', 'Product Memo']);
          const iModel = getColIdx(['Model Name', 'Model']);

          console.log(`Import: Headers found in "${sheetName}" at row ${headerIdx}`, { iIMEI, iModel, iPrice, iReceived, defaultBuyer });

          const parsePrice = (v) => {
            if (typeof v === 'number') return v;
            const s = String(v || '').replace(/[₩,$\s]/g, '');
            return Number(s) || 0;
          };

          for (let i = headerIdx + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length < 2) continue;

            let imei = iIMEI >= 0 ? String(row[iIMEI] || '').trim() : '';
            // FALLBACK: If fixed index is empty, scan entire row for 15-digit IMEI
            if (!imei || imei.length < 10) {
              const found = row.find(c => /^\d{15}$/.test(String(c || '').trim()));
              if (found) imei = String(found).trim();
            }

            let modelNameFromRow = iModel >= 0 ? String(row[iModel] || '').trim() : '';
            // FALLBACK: If fixed index is empty, try to find a cell that looks like a model
            if (!modelNameFromRow) {
               const found = row.find(c => {
                 const s = String(c || '').toLowerCase();
                 return s.includes('galaxy') || s.includes('iphone') || s.includes('pixel') || s.includes('note') || s.includes('ultra');
               });
               if (found) modelNameFromRow = String(found).trim();
            }
            
            if (!imei && !modelNameFromRow) continue; 
            if (modelNameFromRow.toLowerCase().includes('in cases of loss') || modelNameFromRow.toLowerCase().includes('responsibility')) continue;

            try {
              let buyer = iBuyer >= 0 ? String(row[iBuyer] || '').trim() : '';
              if (!buyer) buyer = defaultBuyer || 'Unknown Buyer';

              const rowDate = iDate >= 0 ? row[iDate] : '';
              let finalDate = new Date().toISOString().slice(0, 10);
              if (rowDate) {
                if (rowDate instanceof Date) finalDate = rowDate.toISOString().slice(0, 10);
                else if (!isNaN(rowDate) && Number(rowDate) > 40000) {
                   const d = new Date((Number(rowDate) - 25569) * 86400 * 1000);
                   finalDate = d.toISOString().slice(0, 10);
                } else {
                   finalDate = String(rowDate).trim();
                }
              }

              let unitPrice = iPrice >= 0 ? parsePrice(row[iPrice]) : 0;
              let receivedAmt = iReceived >= 0 ? parsePrice(row[iReceived]) : 0;

              // VALIDATION FIX: Backend doesn't allow received > total (unitPrice * qty).
              // If we received more than the base unit price (due to additional fees in the Excel),
              // we set the unitPrice to match the received amount.
              if (receivedAmt > unitPrice) {
                unitPrice = receivedAmt;
              }

              let saleObj = {
                date: finalDate,
                buyer: buyer,
                qty: iQty >= 0 ? Number(row[iQty]) || 1 : 1,
                pricePerUnit: unitPrice || 1,
                received: receivedAmt,
                notes: iNotes >= 0 ? String(row[iNotes] || '') : '',
                imei1: imei,
                modelName: modelNameFromRow || 'Unknown Model'
              };

              if (saleObj.pricePerUnit < 1) saleObj.pricePerUnit = 1;

              if (imei) {
                const invItem = (data.inventory || []).find(inv => (inv.imei1 === imei || inv.imei2 === imei) && inv.status === 'In Stock');
                if (invItem) {
                  saleObj.inventoryId = invItem._id;
                  saleObj.modelName = invItem.modelName;
                  saleObj.storage = invItem.storage;
                  saleObj.color = invItem.color;
                }
              }

              await addSale(saleObj);
              totalSuccess++;
            } catch (err) {
              totalFailed++;
              console.error('Sheet row error:', err);
              allErrors.push(err.message);
            }
          }
        }

        if (totalSuccess === 0 && totalFailed === 0) {
          showToast('No valid data rows found in any sheet. Check your Excel format.', 'warning');
        } else if (totalFailed > 0) {
          const firstErr = allErrors[0] || 'Unknown error';
          showToast(`Failed to import ${totalFailed} rows. First error: ${firstErr}`, 'danger');
        } else {
          showToast(`✓ ${totalSuccess} sales imported successfully!`);
        }
      } catch (err) {
        console.error('Import process error:', err);
        showToast(err.message || 'Import failed', 'danger');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
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
          <button className="btn" onClick={handleTemplate}>📄 Template</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            📥 Import Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleImport} />
          </label>
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
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

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi">
          <div className="kpi-label">TOTAL UNITS SOLD</div>
          <div className="kpi-value">{a.salesUnits}</div>
        </div>
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
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search buyer, model or IMEI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>BUYER</th>
                <th>MODEL</th>
                <th>DETAILS</th>
                <th className="num">QTY</th>
                <th className="num">PRICE/UNIT</th>
                <th className="num">TOTAL</th>
                <th className="num">RECEIVED</th>
                <th className="num">PENDING</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(s => {
                const total = s.qty * s.pricePerUnit;
                const pending = total - (s.received || 0);
                const status = pending <= 0 ? 'Paid' : (s.received > 0 ? 'Partial' : 'Pending');
                return (
                  <tr key={s._id}>
                    <td>{s.date}</td>
                    <td><strong>{s.buyer}</strong></td>
                    <td>{s.modelName || s.model}</td>
                    <td>
                      <div className="muted" style={{ fontSize: '11px' }}>
                        {[s.storage && `${s.storage}GB`, s.color, s.imei1].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </td>
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
                    <td>
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingSale(s); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteSale(s._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && <tr><td colSpan="11" className="empty">No sales found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SaleModal
          sale={editingSale}
          inventory={(data.inventory || []).filter(i => i.status === 'In Stock')}
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
    inventoryId: '',
    modelName: '',
    storage: '',
    color: '',
    imei1: '',
    qty: 1,
    pricePerUnit: 0,
    received: 0,
    notes: ''
  });

  const handleInventorySelect = (invId) => {
    if (!invId) {
      setForm({ ...form, inventoryId: '', modelName: '', storage: '', color: '', imei1: '' });
      return;
    }
    const item = inventory.find(i => i._id === invId);
    if (item) {
      setForm({
        ...form,
        inventoryId: invId,
        modelName: item.modelName,
        storage: item.storage || '',
        color: item.color || '',
        imei1: item.imei1 || '',
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{sale ? 'Edit' : 'New'} Sale Record</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-row"><label>Buyer *</label><input value={form.buyer} onChange={e => setForm({ ...form, buyer: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <label>Select from Inventory (In Stock)</label>
          <select value={form.inventoryId || ''} onChange={e => handleInventorySelect(e.target.value)}>
            <option value="">— manual entry —</option>
            {inventory.map(i => (
              <option key={i._id} value={i._id}>
                {i.modelName} {i.storage && `${i.storage}GB`} {i.color} {i.imei1 ? `· ${i.imei1.slice(-6)}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Model Name *</label><input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })} /></div>
          <div className="form-row"><label>Storage</label><input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Color</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
          <div className="form-row"><label>IMEI</label><input value={form.imei1} onChange={e => setForm({ ...form, imei1: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div>
          <div className="form-row"><label>Sale Price (KRW)</label><input type="number" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: Number(e.target.value) })} /></div>
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
