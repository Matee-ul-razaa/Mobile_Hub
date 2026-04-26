import React, { useState } from 'react';
import { useData } from '../DataContext';
import { userBadge } from '../utils';

const ActivityLog = () => {
  const { data } = useData();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? data.activity : data.activity.filter(a => a.user === filter);
  const sorted = [...filtered].reverse();

  const counts = {
    nadeem: data.activity.filter(a => a.user === 'nadeem').length,
    bilawal: data.activity.filter(a => a.user === 'bilawal').length,
    total: data.activity.length
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Activity Audit Trail</h2>
        <div className="page-actions">
          <button className={`btn ${filter==='all'?'btn-primary':''}`} onClick={()=>setFilter('all')}>All</button>
          <button className={`btn ${filter==='nadeem'?'btn-primary':''}`} onClick={()=>setFilter('nadeem')}>Nadeem</button>
          <button className={`btn ${filter==='bilawal'?'btn-primary':''}`} onClick={()=>setFilter('bilawal')}>Bilawal</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Changes</div>
          <div className="kpi-value">{counts.total}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">By Nadeem</div>
          <div className="kpi-value" style={{ color: '#0f766e' }}>{counts.nadeem}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">By Bilawal</div>
          <div className="kpi-value" style={{ color: '#6d28d9' }}>{counts.bilawal}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 300).map((a, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '12px' }}>{new Date(a.at).toLocaleString()}</td>
                  <td>
                    <span className={`badge-user ${a.user}`}>
                      {a.user.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ marginLeft: '8px' }}>{a.user}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${a.action==='create'?'green':a.action==='update'?'amber':'red'}`}>
                      {a.action}
                    </span>
                  </td>
                  <td><span className="badge badge-gray">{a.entity}</span></td>
                  <td style={{ fontSize: '13px' }}>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
