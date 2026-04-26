import React, { useState } from 'react';
import { useData } from '../DataContext';
import { putter, poster } from '../api';
import { hashPwd } from '../utils';

const Settings = () => {
  const { data, loadAll } = useData();
  const [bizName, setBizName] = useState(data.settings.businessName);
  const [owner, setOwner] = useState(data.settings.owner);
  const [apiKey, setApiKey] = useState(data.settings.apiKey);
  const [aiModel, setAiModel] = useState(data.settings.aiModel);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  const currentUser = localStorage.getItem('mobile_hub_user');

  const handleSaveBiz = async () => {
    try {
      await putter('/settings', { ...data.settings, businessName: bizName, owner });
      alert('Saved');
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleSaveAI = async () => {
    try {
      await putter('/settings', { ...data.settings, apiKey, aiModel });
      alert('AI Settings Saved');
      loadAll();
    } catch (err) { alert(err.message); }
  };

  const handleChangePwd = async () => {
    if (passwords.new !== passwords.confirm) return alert('Passwords do not match');
    try {
      await poster('/auth/change-password', { user: currentUser, oldPwd: passwords.old, newPwd: passwords.new });
      alert('Password changed successfully');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) { alert(err.message); }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><h3 className="card-title">Business Info</h3></div>
        <div className="form-row"><label>Business Name</label><input value={bizName} onChange={e=>setBizName(e.target.value)} /></div>
        <div className="form-row"><label>Owner Name</label><input value={owner} onChange={e=>setOwner(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={handleSaveBiz}>Save Info</button>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><h3 className="card-title">My Account (signed in as {currentUser})</h3></div>
        <div className="form-row"><label>Current Password</label><input type="password" value={passwords.old} onChange={e=>setPasswords({...passwords, old:e.target.value})} /></div>
        <div className="form-row"><label>New Password</label><input type="password" value={passwords.new} onChange={e=>setPasswords({...passwords, new:e.target.value})} /></div>
        <div className="form-row"><label>Confirm New Password</label><input type="password" value={passwords.confirm} onChange={e=>setPasswords({...passwords, confirm:e.target.value})} /></div>
        <button className="btn btn-primary" onClick={handleChangePwd}>Change Password</button>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><h3 className="card-title">AI Assistant (Anthropic)</h3></div>
        <p className="muted" style={{ fontSize: '12px', marginBottom: '10px' }}>Add an API key to enable natural language chat about your business.</p>
        <div className="form-row"><label>Anthropic API Key</label><input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} /></div>
        <div className="form-row">
          <label>Model</label>
          <select value={aiModel} onChange={e=>setAiModel(e.target.value)}>
            <option value="claude-haiku-4-5">Claude Haiku 4.5 (Fast)</option>
            <option value="claude-sonnet-4-5">Claude Sonnet 4.5 (Capabile)</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleSaveAI}>Save AI Settings</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</h3></div>
        <button className="btn btn-danger" onClick={async () => {
          if (window.confirm('Wipe ALL business data?')) {
            await poster('/reset-all');
            loadAll();
          }
        }}>Reset All Data</button>
      </div>
    </div>
  );
};
export default Settings;
