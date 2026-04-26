import React, { useState } from 'react';
import { useData } from '../DataContext';

const Settings = () => {
  const { data, updateSettings } = useData();
  const [bizName, setBizName] = useState(data.settings.businessName || 'Mobile Hub');
  const [apiKey, setApiKey] = useState(data.settings.apiKey || '');

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobilehub-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    await updateSettings({ businessName: bizName, apiKey });
    alert('Settings saved!');
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">System Settings</h2>
      </div>

      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="card-header"><h3 className="card-title">Business Profile</h3></div>
        <div className="form-row">
          <label>Business Name</label>
          <input value={bizName} onChange={e=>setBizName(e.target.value)} placeholder="e.g. Mobile Hub Korea" />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>Save Profile</button>
      </div>

      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="card-header"><h3 className="card-title">Artificial Intelligence</h3></div>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
          Add an Anthropic API key to unlock natural language conversations with your business data. 
          The offline Roman Urdu engine works even without a key.
        </p>
        <div className="form-row">
          <label>Anthropic API Key (sk-ant-...)</label>
          <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Enter key for online AI" />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>Update AI Key</button>
      </div>

      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="card-header"><h3 className="card-title">Data Backup & Mobility</h3></div>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
          Download a complete snapshot of your business database in JSON format.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleExport}>⬇ Download JSON Backup</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</h3></div>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
          Resetting data will delete everything but keep the platform structure.
        </p>
        <button className="btn btn-danger" onClick={() => alert('Feature coming soon: Use JSON import to overwrite data.')}>Reset All Data</button>
      </div>
    </div>
  );
};

export default Settings;
