import React from 'react';
import { useData } from '../DataContext';

const ActivityLog = ({ toggleMenu }) => {
  const { data } = useData();

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Activity Log</h1>
            <div className="page-sub">Audit trail of all changes</div>
          </div>
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
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {[...data.activity].reverse().map((act, i) => (
                <tr key={i}>
                  <td>
                    <div className="muted">{new Date(act.at).toLocaleDateString()}</div>
                    <strong>{new Date(act.at).toLocaleTimeString()}</strong>
                  </td>
                  <td>
                    <span className={`badge badge-${act.user === 'nadeem' ? 'teal' : 'purple'}`}>
                      {act.user.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${act.action === 'create' ? 'green' : (act.action === 'update' ? 'amber' : 'red')}`}>
                      {act.action.toUpperCase()}
                    </span>
                  </td>
                  <td>{act.entity}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: '300px' }}>{act.note}</td>
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
