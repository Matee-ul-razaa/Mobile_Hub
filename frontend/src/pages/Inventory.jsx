import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';
import * as XLSX from 'xlsx';

const Inventory = ({ toggleMenu, onLogout }) => {
  const { data, addInventory, updateInventory, deleteInventory, showToast } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  const handleExport = () => {
    const rows = data.inventory.map(x => ({
      Model: x.model,
      Brand: x.brand || '',
      SKU: x.sku || '',
      Bought: x.qty,
      Sold: x.soldQty,
      Remaining: Math.max(0, x.qty - x.soldQty),
      CostPerUnit: x.costPerUnit,
      Value: Math.max(0, x.qty - x.soldQty) * x.costPerUnit,
      Notes: x.notes || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
        const items = XLSX.utils.sheet_to_json(ws);

        let success = 0;
        let failed = 0;
        const errors = [];

        for (const [index, item] of items.entries()) {
          try {
            const model = String(item.Model || '').trim();

            if (!model) {
              failed++;
              errors.push(`Row ${index + 2}: Model is required`);
              continue;
            }

            const bought = Number(item.Bought || 0);
            const costPerUnit = Number(item.CostPerUnit || 0);

            if (bought < 0 || costPerUnit < 0) {
              failed++;
              errors.push(`Row ${index + 2}: Bought and CostPerUnit cannot be negative`);
              continue;
            }

            await addInventory({
              model,
              brand: String(item.Brand || '').trim(),
              sku: String(item.SKU || '').trim(),
              qty: bought,
              costPerUnit,
              notes: String(item.Notes || '').trim()
            });

            success++;
          } catch (err) {
            failed++;
            errors.push(`Row ${index + 2}: ${err.message}`);
          }
        }

        if (failed > 0) {
          showToast(`Imported ${success}, failed ${failed}. Check console for details.`, 'warning');
          console.warn('Inventory import errors:', errors);
        } else {
          showToast(`Inventory import successful. ${success} rows imported.`);
        }
      } catch (err) {
        showToast(err.message || 'Import failed', 'danger');
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };
  const handleTemplate = () => {
    const rows = [
      {
        Model: 'iPhone 14 Pro',
        Brand: 'Apple',
        SKU: 'IP14P-128',
        Bought: 5,
        CostPerUnit: 850000,
        Notes: 'Sample inventory item'
      }
    ];
    const handleTemplate = () => {
      const rows = [
        {
          Model: 'iPhone 14 Pro',
          Brand: 'Apple',
          SKU: 'IP14P-128',
          Bought: 5,
          CostPerUnit: 850000,
          Notes: 'Sample inventory item'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
      XLSX.writeFile(wb, 'inventory-template.xlsx');
    };
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
            <div className="page-sub">Stock of mobile phones in hand</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleTemplate}>⬇ Template</button>
          <button className="btn" onClick={handleExport}>⬇ Export Excel</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ Import Excel
            <input type="file" style={{ display: 'none' }} onChange={handleImport} accept=".xlsx,.xls" />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Item</button>
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
          <div className="kpi-label">TOTAL ITEMS</div>
          <div className="kpi-value">{data.inventory.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">UNITS IN STOCK</div>
          <div className="kpi-value brand">{a.invUnits}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">INVENTORY VALUE</div>
          <div className="kpi-value">{fmtKRW(a.invValue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>MODEL</th>
                <th className="num">BOUGHT</th>
                <th className="num">SOLD</th>
                <th className="num">IN STOCK</th>
                <th className="num">COST/UNIT</th>
                <th className="num">STOCK VALUE</th>
                <th>NOTES</th>
                <th>ADDED BY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory.map(item => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.model}</strong>
                    <div className="muted" style={{ fontSize: '11px' }}>{item.brand} - {item.sku}</div>
                  </td>
                  <td className="num">{item.qty}</td>
                  <td className="num">{item.soldQty || 0}</td>
                  <td className="num"><strong>{item.qty - (item.soldQty || 0)}</strong></td>
                  <td className="num">{fmtKRW(item.costPerUnit)}</td>
                  <td className="num">{fmtKRW((item.qty - (item.soldQty || 0)) * item.costPerUnit)}</td>
                  <td>{item.notes || '—'}</td>
                  <td><span className="badge badge-brand">{item.createdBy || '—'}</span></td>
                  <td>
                    <div className="inline-actions">
                      <button className="btn btn-sm" onClick={() => { setEditingItem(item); setShowModal(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteInventory(item._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
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
  const [form, setForm] = useState(item || { date: new Date().toISOString().slice(0, 10), model: '', brand: '', sku: '', qty: 0, costPerUnit: 0, notes: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">{item ? 'Edit' : 'Add'} Inventory Item</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div className="form-row"><label>Model *</label><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Brand</label><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
          <div className="form-row"><label>SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
        </div>
        <div className="form-row-2">
          <div className="form-row"><label>Quantity</label><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: Number(e.target.value) })} /></div>
          <div className="form-row"><label>Cost (KRW)</label><input type="number" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: Number(e.target.value) })} /></div>
        </div>
        <div className="form-row"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
