import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { putter } from '../api';

const Settings = () => {
  const { data, loadAll } = useData();
  const [biz, setBiz] = useState(data.settings?.businessName || '');
  const [owner, setOwner] = useState(data.settings?.owner || '');

  useEffect(() => {
    setBiz(data.settings?.businessName || '');
    setOwner(data.settings?.owner || '');
  }, [data.settings]);

  const saveSettings = async () => {
    try {
      await putter('/settings', { businessName: biz, owner });
      alert('Saved');
      loadAll();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-header"><h3 className="card-title">Business Info</h3></div>
        <div className="form-row"><label>Business Name</label><input value={biz} onChange={e => setBiz(e.target.value)} /></div>
        <div className="form-row"><label>Owner Name</label><input value={owner} onChange={e => setOwner(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={saveSettings}>Save</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title" style={{ color: 'var(--red)' }}>Migration</h3></div>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: '13px' }}>
          This application is now backed by a MongoDB database. All data is persisted securely via a backend API.
        </p>
      </div>
    </>
  );
};
export default Settings;
