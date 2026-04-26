import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { putter, poster } from '../api';

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

  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `MobileHub_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if(!confirm('This will APPEND data to your current database. Continue?')) return;
        
        // Loop through keys and import
        const tables = ['inventory','sales','expenses','cashflow','hawala','investors','payouts'];
        for(const t of tables) {
          if(parsed[t] && parsed[t].length > 0) {
            await poster('/bulk-import', { table: t, data: parsed[t] });
          }
        }
        loadAll();
        alert('Backup imported successfully!');
      } catch (err) { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  const resetAll = async () => {
    if(!confirm('Delete ALL data? This cannot be undone.')) return;
    if(!confirm('ARE YOU ABSOLUTELY SURE? Everything will be wiped.')) return;
    try {
      await poster('/reset-all', {});
      loadAll();
      alert('Database reset complete.');
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-header"><h3 className="card-title">Business Info</h3></div>
        <div className="form-row"><label>Business Name</label><input value={biz} onChange={e => setBiz(e.target.value)} /></div>
        <div className="form-row"><label>Owner Name / Details</label><input value={owner} onChange={e => setOwner(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="card-header"><h3 className="card-title">Data Backup & Migration</h3></div>
        <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
          Download a full copy of your database for safekeeping or migration to another device.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={exportBackup}>💾 Export JSON Backup</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            📤 Restore from Backup
            <input type="file" hidden accept=".json" onChange={importBackup} />
          </label>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--red-soft)' }}>
        <div className="card-header"><h3 className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</h3></div>
        <p className="muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
          Resetting will delete all inventory, sales, expenses, and investor records permanently.
        </p>
        <button className="btn btn-danger" onClick={resetAll}>⚠️ Reset All Data</button>
      </div>
    </div>
  );
};
export default Settings;
