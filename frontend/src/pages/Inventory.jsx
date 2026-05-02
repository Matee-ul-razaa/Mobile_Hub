import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW } from '../utils';
import * as XLSX from 'xlsx';

const Inventory = ({ toggleMenu, onLogout }) => {
  const { data, addInventory, updateInventory, deleteInventory, showToast } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');

  const inventory = data.inventory || [];
  const inStock = inventory.filter(i => i.status === 'In Stock');
  const sold = inventory.filter(i => i.status === 'Sold');
  const totalValue = inStock.reduce((a, x) => a + (Number(x.purchasePrice) || 0), 0);

  const filtered = inventory.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.modelName || '').toLowerCase().includes(q) ||
           (item.modelNumber || '').toLowerCase().includes(q) ||
           (item.imei1 || '').includes(q) ||
           (item.imei2 || '').includes(q) ||
           (item.color || '').toLowerCase().includes(q) ||
           (item.storage || '').toLowerCase().includes(q);
  });

  // Parse the Korean invoice format (Excel file from phone wholesaler)
  const parseInvoicePrice = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      return Number(val.replace(/[₩,\s]/g, '')) || 0;
    }
    return 0;
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find the header row (contains "Model Name" or "IMEI")
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i];
          if (row && row.some(c => String(c || '').includes('Model Name') || String(c || '').includes('IMEI'))) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          showToast('Could not find header row with "Model Name" or "IMEI". Check file format.', 'danger');
          return;
        }

        const headers = rows[headerIdx].map(h => String(h || '').trim());
        const colIdx = (name) => headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));

        const iModelName = colIdx('Model Name');
        const iModelNum = colIdx('Model Number');
        const iCapacity = colIdx('Capacity');
        const iColor = colIdx('Color');
        const iIMEI = headers.findIndex(h => h === 'IMEI');
        const iIMEI2 = headers.findIndex(h => h === 'IMEI2');
        const iPurchasePrice = colIdx('Purchase Price');
        const iActualPrice = colIdx('Actual Purchase Price');
        const iMemo = colIdx('Product Memo');

        let success = 0, failed = 0;
        const errors = [];

        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 3) continue;

          const modelName = String(row[iModelName] || '').trim();
          if (!modelName) continue; // skip empty rows / footer

          try {
            const priceRaw = iActualPrice >= 0 ? row[iActualPrice] : row[iPurchasePrice];
            await addInventory({
              modelName,
              modelNumber: iModelNum >= 0 ? String(row[iModelNum] || '').trim() : '',
              storage: iCapacity >= 0 ? String(row[iCapacity] || '').trim() : '',
              color: iColor >= 0 ? String(row[iColor] || '').trim() : '',
              imei1: iIMEI >= 0 ? String(row[iIMEI] || '').trim() : '',
              imei2: iIMEI2 >= 0 ? String(row[iIMEI2] || '').trim() : '',
              purchasePrice: parseInvoicePrice(priceRaw),
              notes: iMemo >= 0 ? String(row[iMemo] || '').trim() : '',
            });
            success++;
          } catch (err) {
            failed++;
            errors.push(`Row ${i + 1}: ${err.message}`);
          }
        }

        if (failed > 0) {
          showToast(`Imported ${success}, failed ${failed}. Check console.`, 'warning');
          console.warn('Import errors:', errors);
        } else {
          showToast(`✓ ${success} phones imported successfully!`);
        }
      } catch (err) {
        showToast(err.message || 'Import failed', 'danger');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const rows = inventory.map(x => ({
      'Model Name': x.modelName,
      'Model Number': x.modelNumber || '',
      'Storage': x.storage || '',
      'Color': x.color || '',
      'IMEI1': x.imei1 || '',
      'IMEI2': x.imei2 || '',
      'Purchase Price': x.purchasePrice || 0,
      'Status': x.status || 'In Stock',
      'Notes': x.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleTemplate = () => {
    const rows = [{
      'Model Name': 'iPhone 15 Pro',
      'Model Number': 'A3102',
      'Storage': '256',
      'Color': 'Natural Titanium',
      'IMEI1': '354321294930989',
      'IMEI2': '354321295462958',
      'Purchase Price': 860000,
      'Notes': 'battery health: 86.5%',
    }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
    XLSX.writeFile(wb, 'inventory-template.xlsx');
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Inventory</h1>
            <div className="page-sub">Per-unit phone stock with IMEI tracking</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleTemplate}>⬇ Template</button>
          <button className="btn" onClick={handleExport}>⬇ Export</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Import Invoice
            <input type="file" style={{ display: 'none' }} onChange={handleImport} accept=".xlsx,.xls,.txt" />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Phone</button>
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
          <div className="kpi-label">TOTAL PHONES</div>
          <div className="kpi-value">{inventory.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">IN STOCK</div>
          <div className="kpi-value brand">{inStock.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SOLD</div>
          <div className="kpi-value pos">{sold.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">STOCK VALUE</div>
          <div className="kpi-value">{fmtKRW(totalValue)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '14px', padding: '12px 16px' }}>
        <input
          type="text"
          placeholder="🔍 Search by model, IMEI, color, storage..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '13px' }}
        />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>MODEL</th>
                <th>STORAGE</th>
                <th>COLOR</th>
                <th>IMEI1</th>
                <th>IMEI2</th>
                <th className="num">PURCHASE PRICE</th>
                <th>STATUS</th>
                <th>NOTES</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.modelName}</strong>
                    {item.modelNumber && <div className="muted" style={{ fontSize: '11px' }}>{item.modelNumber}</div>}
                  </td>
                  <td>{item.storage ? `${item.storage}GB` : '—'}</td>
                  <td>{item.color || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.imei1 || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.imei2 || '—'}</td>
                  <td className="num">{fmtKRW(item.purchasePrice)}</td>
                  <td>
                    <span className={`badge badge-${item.status === 'In Stock' ? 'green' : 'amber'}`}>
                      {item.status || 'In Stock'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes || '—'}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => { setEditingItem(item); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteInventory(item._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="9" className="empty">No phones found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <InventoryModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateInventory(editingItem._id, obj);
            else await addInventory(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const InventoryModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || {
    modelName: '', modelNumber: '', storage: '', color: '',
    imei1: '', imei2: '', purchasePrice: 0, notes: ''
  });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Add'} Phone</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Model Name *</label><input value={form.modelName} onChange={e => setForm({ ...form, modelName: e.target.value })} placeholder="iPhone 15 Pro" /></div>
          <div className="form-row"><label>Model Number</label><input value={form.modelNumber} onChange={e => setForm({ ...form, modelNumber: e.target.value })} placeholder="A3102" /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Storage</label><input value={form.storage} onChange={e => setForm({ ...form, storage: e.target.value })} placeholder="256" /></div>
          <div className="form-row"><label>Color</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Natural Titanium" /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>IMEI1</label><input value={form.imei1} onChange={e => setForm({ ...form, imei1: e.target.value })} placeholder="354321294930989" /></div>
          <div className="form-row"><label>IMEI2 (optional)</label><input value={form.imei2} onChange={e => setForm({ ...form, imei2: e.target.value })} placeholder="Optional" /></div>
        </div>
        <div className="form-row"><label>Purchase Price (KRW)</label><input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></div>
        <div className="form-row"><label>Notes (optional)</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="battery health, condition, etc." /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
