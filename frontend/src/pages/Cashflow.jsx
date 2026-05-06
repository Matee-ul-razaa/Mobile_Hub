import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW } from '../utils';
import * as XLSX from 'xlsx';

const Cashflow = ({ toggleMenu, onLogout }) => {
  const { data, addCashflow, deleteCashflow } = useData();
  const [showModal, setShowModal] = useState(false);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const handleDownloadStatement = () => {
    // Filter movements by date range
    const filteredMovements = allMovements.filter(m => {
      const d = m.date || '';
      return d >= fromDate && d <= toDate;
    });

    const reportData = filteredMovements.map(m => ({
      'Date': m.date,
      'Type': m.type === 'in' ? 'DEPOSIT' : 'WITHDRAWAL',
      'Source / Detail': m.source,
      'Category (Origin)': m.origin,
      'Note': m.note,
      'Amount (KRW)': m.amount,
      'Balance (KRW)': 0 
    }));

    // Calculate running balance based on ALL history before 'toDate' to get accurate starting balance
    let balance = 0;
    const allHistoryOldToNew = [...allMovements].reverse();
    const rowsOldToNew = [];

    allHistoryOldToNew.forEach(m => {
      if (m.type === 'in') balance += m.amount;
      else balance -= m.amount;

      if (m.date >= fromDate && m.date <= toDate) {
        rowsOldToNew.push({
          'Date': m.date,
          'Type': m.type === 'in' ? 'DEPOSIT' : 'WITHDRAWAL',
          'Source / Detail': m.source,
          'Category (Origin)': m.origin,
          'Note': m.note,
          'Amount (KRW)': m.amount,
          'Balance (KRW)': balance
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rowsOldToNew.reverse());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    
    // Auto-size columns
    const wscols = [
      {wch: 12}, {wch: 15}, {wch: 30}, {wch: 15}, {wch: 30}, {wch: 15}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `MobileHub_Statement_${fromDate}_to_${toDate}.xlsx`);
  };

  // Build a unified list of ALL cash movements
  const allMovements = [];

  // 1. Manual cashflow entries
  (data.cashflow || []).forEach(c => {
    allMovements.push({
      _id: c._id,
      date: c.date,
      type: c.type,
      source: c.source || '—',
      origin: 'Manual',
      note: c.note || '',
      amount: c.amount || 0,
      deletable: true,
    });
  });

  // 2. Fazi Cash (Hawala) — always Cash In
  (data.hawala || []).forEach(h => {
    allMovements.push({
      _id: `hawala-${h._id}`,
      date: h.date,
      type: 'in',
      source: `${h.buyer} → Fazi Cash`,
      origin: 'Fazi Cash',
      note: h.note || '',
      amount: h.amountKRW || 0,
      deletable: false,
    });
  });

  // 3. Expenses — always Cash Out
  (data.expenses || []).forEach(e => {
    allMovements.push({
      _id: `exp-${e._id}`,
      date: e.date,
      type: 'out',
      source: e.category || 'Expense',
      origin: 'Expense',
      note: e.note || '',
      amount: e.amount || 0,
      deletable: false,
    });
  });

  // 4. Investor Payouts — always Cash Out
  (data.payouts || []).forEach(p => {
    const inv = (data.investors || []).find(i => i._id === p.investorId);
    allMovements.push({
      _id: `pay-${p._id}`,
      date: p.date,
      type: 'out',
      source: inv ? `Payout → ${inv.name}` : 'Investor Payout',
      origin: 'Payout',
      note: p.note || '',
      amount: p.amount || 0,
      deletable: false,
    });
  });

  // 5. Owner Investments — always Cash In
  (data.ownerInvestments || []).forEach(o => {
    allMovements.push({
      _id: `own-${o._id}`,
      date: o.date,
      type: 'in',
      source: 'Owner Investment',
      origin: 'Investment',
      note: o.note || '',
      amount: o.amountKRW || 0,
      deletable: false,
    });
  });

  // 6. Investor Capital — always Cash In
  (data.investors || []).forEach(inv => {
    if (Number(inv.capital) > 0) {
      allMovements.push({
        _id: `inv-cap-${inv._id}`,
        date: inv.createdAt ? inv.createdAt.slice(0, 10) : '',
        type: 'in',
        source: `${inv.name} — Capital`,
        origin: 'Investor',
        note: '',
        amount: Number(inv.capital) || 0,
        deletable: false,
      });
    }
  });

  // 7. Inventory Purchases — always Cash Out
  (data.inventory || []).forEach(item => {
    if (Number(item.purchasePrice) > 0) {
      allMovements.push({
        _id: `inv-buy-${item._id}`,
        date: item.date || (item.createdAt ? item.createdAt.slice(0, 10) : ''),
        type: 'out',
        source: `Buy: ${item.modelName}`,
        origin: 'Inventory',
        note: item.imei1 || '',
        amount: Number(item.purchasePrice) || 0,
        deletable: false,
      });
    }
  });

  // 8. Hawala Discounts — always Cash Out
  (data.hawala || []).forEach(h => {
    if (Number(h.discountKRW) > 0) {
      allMovements.push({
        _id: `hawala-disc-${h._id}`,
        date: h.date,
        type: 'out',
        source: `${h.buyer} — Discount`,
        origin: 'Discount',
        note: h.note || '',
        amount: Number(h.discountKRW) || 0,
        deletable: false,
      });
    }
  });

  // Sort by date descending
  allMovements.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalIn = allMovements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
  const totalOut = allMovements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
  const net = totalIn - totalOut;

  const originColor = (origin) => {
    switch (origin) {
      case 'Manual': return 'var(--surface-2)';
      case 'Fazi Cash': return '#1e40af';
      case 'Expense': return '#b91c1c';
      case 'Payout': return '#b45309';
      case 'Investment': return '#047857';
      case 'Investor': return '#6d28d9';
      case 'Inventory': return '#0f766e';
      case 'Discount': return '#db2777';
      default: return 'var(--surface-2)';
    }
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Cash In / Out</h1>
            <div className="page-sub">Complete money movement record</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--surface-2)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px' }}>
             <span className="muted">From:</span>
             <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: '12px' }} />
             <span className="muted">To:</span>
             <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-1)', fontSize: '12px' }} />
          </div>
          <button className="btn" onClick={handleDownloadStatement} style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Statement
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Entry</button>
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
          <div className="kpi-label">TOTAL CASH IN</div>
          <div className="kpi-value pos">{fmtKRW(totalIn)}</div>
          <div className="kpi-sub">{allMovements.filter(m => m.type === 'in').length} inflow entries</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">TOTAL CASH OUT</div>
          <div className="kpi-value neg">{fmtKRW(totalOut)}</div>
          <div className="kpi-sub">{allMovements.filter(m => m.type === 'out').length} outflow entries</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">NET</div>
          <div className={`kpi-value ${net >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(net)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Cash Movement</h3>
          <div className="muted" style={{ fontSize: '11px' }}>{allMovements.length} total entries from all sources</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>TYPE</th>
                <th>SOURCE / DETAIL</th>
                <th>ORIGIN</th>
                <th>NOTE</th>
                <th className="num">AMOUNT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {allMovements.map(c => (
                <tr key={c._id}>
                  <td>{c.date}</td>
                  <td>
                    <span className={`badge badge-${c.type === 'in' ? 'green' : 'red'}`} style={{ fontSize: '9px', padding: '2px 4px' }}>
                      {c.type === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td>{c.source}</td>
                  <td>
                    <span className="badge" style={{ background: originColor(c.origin), color: '#fff', fontSize: '10px', padding: '2px 6px' }}>
                      {c.origin}
                    </span>
                  </td>
                  <td>{c.note}</td>
                  <td className={`num ${c.type === 'in' ? 'pos' : 'neg'}`}>
                    <strong>{c.type === 'in' ? '+' : '−'}{fmtKRW(c.amount)}</strong>
                  </td>
                  <td>
                    {c.deletable ? (
                      <div className="inline-actions">
                        <button className="btn btn-sm btn-danger" onClick={() => deleteCashflow(c._id)}>Del</button>
                      </div>
                    ) : (
                      <span className="muted" style={{ fontSize: '10px' }}>via {c.origin}</span>
                    )}
                  </td>
                </tr>
              ))}
              {allMovements.length === 0 && <tr><td colSpan="7" className="empty">No cash movements yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CashflowModal 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            await addCashflow(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const CashflowModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type: 'in', source: '', amount: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="card-header"><h3 className="card-title">New Won Transaction</h3></div>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row">
            <label>Type</label>
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="in">Cash In (+)</option>
              <option value="out">Cash Out (−)</option>
            </select>
          </div>
        </div>
        <div className="form-row"><label>Source / Detail *</label><input value={form.source} onChange={e=>setForm({...form, source:e.target.value})} placeholder="e.g. Sale payment, Shop rent, etc." /></div>
        <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
        <div className="form-row"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form, note:e.target.value})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Record Cash</button>
        </div>
      </div>
    </div>
  );
};

export default Cashflow;
