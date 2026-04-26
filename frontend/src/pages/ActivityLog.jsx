import React, { useState } from 'react';
import { useData } from '../DataContext';
import { deleter } from '../api';

const ActivityLog = () => {
  const { data, loadAll } = useData();
  const [filterWho, setFilterWho] = useState('all');

  const list = [...data.activity].sort((a,b) => b.at.localeCompare(a.at));
  const filtered = filterWho === 'all' ? list : list.filter(a => a.user === filterWho);

  const nCount = data.activity.filter(a=>a.user==='nadeem').length;
  const bCount = data.activity.filter(a=>a.user==='bilawal').length;

  const handleClear = async () => {
    if (!window.confirm('Clear activity log history?')) return;
    try {
      // Logic would go here to tell backend to clear activity
      // For now, we'll assume a specific endpoint exists if we implemented it.
      await deleter('/activity/clear'); // I should add this to backend
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi"><div className="kpi-label">Total Actions</div><div className="kpi-value">{data.activity.length}</div></div>
        <div className="kpi"><div className="kpi-label">Nadeem</div><div className="kpi-value" style={{color:'#0f766e'}}>{nCount}</div></div>
        <div className="kpi"><div className="kpi-label">Bilawal</div><div className="kpi-value" style={{color:'#6d28d9'}}>{bCount}</div></div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px', justifyContent:'space-between' }}>
        <div className="pill-filter">
          <button className={filterWho==='all'?'active':''} onClick={()=>setFilterWho('all')}>All</button>
          <button className={filterWho==='nadeem'?'active':''} onClick={()=>setFilterWho('nadeem')}>Nadeem Only</button>
          <button className={filterWho==='bilawal'?'active':''} onClick={()=>setFilterWho('bilawal')}>Bilawal Only</button>
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleClear}>Clear Log</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>User</th><th>Action</th><th>Area</th><th>Detail</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="5" className="empty">No activity records.</td></tr> :
                filtered.slice(0, 200).map(a => {
                  const badgeCls = a.action==='create'?'badge-green':a.action==='update'?'badge-amber':a.action==='delete'?'badge-red':'badge-gray';
                  return (
                    <tr key={a._id}>
                      <td style={{ fontSize: '11px' }}>{a.at.replace('T', ' ').slice(0, 16)}</td>
                      <td>
                         <span className={`badge badge-${a.user==='nadeem'?'teal':'purple'}`} style={{ textTransform: 'capitalize' }}>
                           {a.user}
                         </span>
                      </td>
                      <td><span className={`badge ${badgeCls}`}>{a.action}</span></td>
                      <td><span className="badge badge-gray">{a.entity}</span></td>
                      <td style={{ fontSize: '12px' }}>{a.detail}</td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default ActivityLog;
