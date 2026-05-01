import React, { useState } from 'react';
import { useData } from '../DataContext';

const ActivityLog = ({ toggleMenu, onLogout }) => {
  const { data, clearActivity } = useData();
  const [filterUser, setFilterUser] = useState('all');

  const filtered = data.activity.filter(a => {

    if (a.action !== 'login') return false;
    
    if (filterUser === 'all') return true;
    return a.user?.toLowerCase() === filterUser;
  });

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Activity Log</h1>
            <div className="page-sub">Admin Sign-in History</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className={`btn btn-sm ${filterUser === 'all' ? 'btn-primary' : ''}`} 
            style={{ padding: '4px 12px', fontSize: '11px', border: filterUser === 'all' ? 'none' : '1px solid var(--border)', background: filterUser === 'all' ? '' : 'transparent' }}
            onClick={() => setFilterUser('all')}
          >
            All
          </button>
          <button 
            className={`btn btn-sm ${filterUser === 'nadeem' ? 'btn-primary' : ''}`} 
            style={{ padding: '4px 12px', fontSize: '11px', border: filterUser === 'nadeem' ? 'none' : '1px solid var(--border)', background: filterUser === 'nadeem' ? '' : 'transparent' }}
            onClick={() => setFilterUser('nadeem')}
          >
            Nadeem only
          </button>
          <button 
            className={`btn btn-sm ${filterUser === 'bilawal' ? 'btn-primary' : ''}`} 
            style={{ padding: '4px 12px', fontSize: '11px', border: filterUser === 'bilawal' ? 'none' : '1px solid var(--border)', background: filterUser === 'bilawal' ? '' : 'transparent' }}
            onClick={() => setFilterUser('bilawal')}
          >
            Bilawal only
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--surface-2)', fontSize: '11px', border: '1px solid var(--red-soft)', color: 'var(--red)' }} onClick={clearActivity}>Clear Log</button>
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
          <div className="kpi-label">TOTAL CHANGES</div>
          <div className="kpi-value">{data.activity.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">BY NADEEM</div>
          <div className="kpi-value teal">{data.activity.filter(a => a.user === 'nadeem').length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">BY BILAWAL</div>
          <div className="kpi-value purple">{data.activity.filter(a => a.user !== 'nadeem').length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">SHOWING</div>
          <div className="kpi-value">{filtered.length}</div>
          <div className="kpi-sub">of {data.activity.length} filtered</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
           <h3 className="card-title">Login History</h3>
           <span className="muted" style={{ fontSize: '10px' }}>Latest 300 records. Clear old entries anytime to keep the file small.</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>WHEN</th>
                <th>USER</th>
                <th>ACTION</th>
                <th>AREA</th>
                <th>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                   <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No logs found for this filter.</td>
                </tr>
              ) : (
                [...filtered].reverse().map((act, i) => {
                const user = act.user?.toLowerCase() === 'nadeem' ? 'Nadeem' : 'Bilawal';
                return (
                  <tr key={i}>
                    <td style={{ fontSize: '12px' }}>
                      {new Date(act.at).toISOString().slice(0, 10)} {new Date(act.at).toTimeString().slice(0, 5)}
                    </td>
                    <td>
                      <span className="badge" style={{ background: user === 'Nadeem' ? 'var(--teal-soft)' : 'rgba(139, 92, 246, 0.2)', color: user === 'Nadeem' ? 'var(--teal)' : '#8b5cf6', fontSize: '9px', padding: '2px 6px' }}>
                        {user}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)', fontSize: '10px', padding: '2px 6px' }}>
                        {act.action || 'system'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '10px', padding: '2px 6px' }}>
                        {act.entity || 'log'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'normal', maxWidth: '400px', fontSize: '12px' }}>{act.detail || act.note || '—'}</td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
