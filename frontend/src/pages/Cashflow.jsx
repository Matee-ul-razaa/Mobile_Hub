import React, { useState } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg } from '../utils';

const Cashflow = () => {
  const { data, addCashflow, updateCashflow, deleteCashflow } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const a = agg(data);

  // UNIFIED LEDGER Logic (Ported from HTML)
  const all = [];
  data.cashflow.forEach(c => all.push({ ...c, origin: 'Manual' }));
  data.hawala.forEach(h => all.push({ 
    _id: `h_${h._id}`, type: 'in', date: h.date, amount: h.amountKRW, source: `Fazi Cash — ${h.buyer}`, origin: 'Hawala' 
  }));
  data.expenses.forEach(e => all.push({ 
    _id: `e_${e._id}`, type: 'out', date: e.date, amount: e.amount, source: `Expense — ${e.category}`, origin: 'Expense' 
  }));
  data.payouts.forEach(p => {
    const inv = data.investors.find(i => i._id === p.investorId);
    all.push({ 
      _id: `p_${p._id}`, type: 'out', date: p.date, amount: p.amount, source: `Payout — ${inv?.name}`, origin: 'Payout' 
    });
  });
  data.ownerInvestments.forEach(o => all.push({ 
    _id: `o_${o._id}`, type: 'in', date: o.date, amount: o.amountKRW, source: `Owner — ${o.source}`, origin: 'Owner' 
  }));

  const sorted = all.sort((x, y) => y.date.localeCompare(x.date));

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Unified Cash Ledger</h2>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>+ Add Entry</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Cash In Hand</div>
          <div className={`kpi-value ${a.cashInHand >= 0 ? 'pos' : 'neg'}`}>{fmtKRW(a.cashInHand)}</div>
          <div className="kpi-sub">Available working cash</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Lifetime Cash In</div>
          <div className="kpi-value pos">{fmtKRW(a.hawalaIn + a.ownerCapital)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Lifetime Cash Out</div>
          <div className="kpi-value neg">{fmtKRW(a.totalExp + a.totalPaid)}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Detail</th>
                <th>Origin</th>
                <th className="num">Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c._id}>
                  <td>{c.date}</td>
                  <td><span className={`badge badge-${c.type==='in'?'green':'red'}`}>{c.type.toUpperCase()}</span></td>
                  <td>{c.source}</td>
                  <td><span className="badge badge-gray">{c.origin}</span></td>
                  <td className={`num text-${c.type==='in'?'green':'red'}`}>
                    <strong>{c.type==='in'?'+':'−'}{fmtKRW(c.amount)}</strong>
                  </td>
                  <td>
                    {c.origin === 'Manual' && (
                      <div className="inline-actions">
                        <button className="btn btn-sm" onClick={() => { setEditingItem(c); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteCashflow(c._id)}>Del</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CashflowModal 
          item={editingItem} 
          onClose={() => setShowModal(false)}
          onSave={async (obj) => {
            if (editingItem) await updateCashflow(editingItem._id, obj);
            else await addCashflow(obj);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const CashflowModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item || { date: new Date().toISOString().slice(0,10), type: 'in', source: '', amount: 0, note: '' });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{item ? 'Edit' : 'Add'} Cash Entry</h3>
        <div className="form-row-2">
          <div className="form-row"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
          <div className="form-row"><label>Type</label><select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}><option value="in">Cash In</option><option value="out">Cash Out</option></select></div>
        </div>
        <div className="form-row"><label>Detail / Reason *</label><input value={form.source} onChange={e=>setForm({...form, source:e.target.value})} /></div>
        <div className="form-row"><label>Amount (KRW) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} /></div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Entry</button>
        </div>
      </div>
    </div>
  );
};

export default Cashflow;
