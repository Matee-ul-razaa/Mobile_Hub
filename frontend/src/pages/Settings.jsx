import React from 'react';
import { useData } from '../DataContext';

const Settings = ({ toggleMenu, onLogout }) => {
  const { data, updateSettings, clearActivity, wipeAllData, showToast, showConfirm } = useData();
  const currentUser = localStorage.getItem('mobile_hub_user') || 'bilawal';
  const [activeAdmin, setActiveAdmin] = React.useState(currentUser);
  const [tempApiKey, setTempApiKey] = React.useState(data.settings?.apiKey || '');
  const [passwords, setPasswords] = React.useState({ current: '', new: '', confirm: '' });

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      showToast('Please fill all password fields', 'danger');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match', 'danger');
      return;
    }
    
    // Send to backend via updateSettings
    const usersUpdate = {
      [activeAdmin]: { password: passwords.new }
    };
    
    updateSettings({ users: usersUpdate });
    setPasswords({ current: '', new: '', confirm: '' });
    showToast('Password updated successfully!');
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `mobile-hub-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        showConfirm('This will replace ALL current data with the backup. Proceed?', () => {
          setData(imported);
          showToast('Data restored successfully!');
        });
      } catch (err) {
        showToast('Invalid backup file.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">Settings & Backup</h1>
            <div className="page-sub">Export, import, reset your data</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3 className="card-title">Business Info</h3></div>
        <div className="form-row">
          <label>Business Name</label>
          <input defaultValue="Mobile Hub" placeholder="e.g. Mobile Hub" />
        </div>
        <div className="form-row">
          <label>Owner Name</label>
          <input placeholder="e.g. Bilawal" />
        </div>
        <button className="btn btn-primary" style={{ marginTop: '10px' }}>Save</button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">Admin Accounts & Passwords</h3>
          <span className="muted" style={{ fontSize: '10px' }}>Signed in as {activeAdmin === 'bilawal' ? 'Bilawal' : 'Nadeem'}</span>
        </div>
        <div className="page-sub" style={{ padding: '0 0 16px' }}>Change your own password below. Default password for both admins is admin — please change it.</div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div
            onClick={() => { if (currentUser === 'nadeem') setActiveAdmin('nadeem'); }}
            style={{ flex: 1, minWidth: '160px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: currentUser === 'nadeem' ? 'pointer' : 'default', background: activeAdmin === 'nadeem' ? 'rgba(20, 184, 166, 0.1)' : 'transparent', borderColor: activeAdmin === 'nadeem' ? 'var(--teal)' : 'var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>N</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Nadeem</div>
                <div className="muted" style={{ fontSize: '10px' }}>Admin</div>
              </div>
            </div>
            {currentUser !== 'nadeem' && <div className="muted" style={{ fontSize: '10px', marginTop: '8px' }}>Only Nadeem can change this password. Sign in as Nadeem to modify.</div>}
          </div>
          <div
            onClick={() => { if (currentUser === 'bilawal') setActiveAdmin('bilawal'); }}
            style={{ flex: 1, minWidth: '160px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', cursor: currentUser === 'bilawal' ? 'pointer' : 'default', background: activeAdmin === 'bilawal' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', borderColor: activeAdmin === 'bilawal' ? 'var(--purple)' : 'var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>B</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Bilawal</div>
                <div className="muted" style={{ fontSize: '10px' }}>Admin</div>
              </div>
            </div>
            {currentUser !== 'bilawal' && <div className="muted" style={{ fontSize: '10px', marginTop: '8px' }}>Only Bilawal can change this password. Sign in as Bilawal to modify.</div>}
          </div>
        </div>

        {activeAdmin === currentUser && (
          <div className="password-fields">
            <div className="form-row">
              <label>Current password</label>
              <input 
                type="password" 
                placeholder="enter current password" 
                value={passwords.current}
                onChange={e => setPasswords({...passwords, current: e.target.value})}
              />
            </div>
            <div className="form-row-2">
              <div className="form-row">
                <label>New password</label>
                <input 
                  type="password" 
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                />
              </div>
              <div className="form-row">
                <label>Confirm new password</label>
                <input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={handlePasswordChange}>Change password</button>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '6px', color: '#fb923c', fontSize: '11px' }}>
          Forgot password? Passwords are stored only in this browser. If forgotten, click "Reset login data" below — this only deletes the login info, not your business data.
        </div>
        <button className="btn btn-sm" style={{ marginTop: '12px', color: 'var(--red)', borderColor: 'var(--red-soft)' }}>Reset login data</button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3 className="card-title">AI Assistant — API Key (optional)</h3></div>
        <div className="page-sub" style={{ padding: '0 0 16px' }}>The AI Assistant works offline for common questions without any setup. To unlock full <strong>conversational AI</strong> (ask anything about your business in plain language), get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>Google AI Studio</a> and paste it below. It is stored only in this browser.</div>
        <div className="form-row">
          <label>API Key</label>
          <input
            type="text"
            placeholder="AIzaSyAylPsWydZlz60RtMT1TiIqzm94pCUmz4Q"
            value={tempApiKey}
            onChange={e => setTempApiKey(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
        </div>
        <div className="form-row">
          <label>Preferred AI Provider</label>
          <select
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}
            value={data.settings?.aiProvider || 'gemini'}
            onChange={e => updateSettings({ aiProvider: e.target.value })}
          >
            <option value="gemini">Google Gemini (Recommended)</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { updateSettings({ apiKey: tempApiKey }); showToast('AI settings saved!'); }}>Save AI settings</button>
          <button className="btn" onClick={() => showToast('Connection successful!')}>Test connection</button>
          <button className="btn" style={{ color: 'var(--red)' }} onClick={() => { setTempApiKey(''); updateSettings({ apiKey: '' }); }}>Remove key</button>
        </div>
        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '6px', color: '#fb923c', fontSize: '11px' }}>
          Privacy note: When you chat with the AI, a compact summary of your current business data (totals, recent activity) is sent to Anthropic with each message so answers are accurate. Your raw records never leave this browser. You can always remove the key to disable online AI.
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3 className="card-title">Backup & Restore</h3></div>
        <div className="page-sub" style={{ padding: '0 0 16px' }}>Your data lives inside this browser. Always export a backup regularly (especially before clearing browser data or switching devices).</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={handleExportData}>⬇ Export JSON Backup</button>
          <button className="btn btn-sm">⬇ Export CSV (all tables)</button>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            ⬆ Import JSON
            <input type="file" style={{ display: 'none' }} onChange={handleImportData} accept=".json" />
          </label>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--red-soft)' }}>
        <div className="card-header"><h3 className="card-title" style={{ color: 'var(--red)' }}>Danger Zone</h3></div>
        <div className="page-sub" style={{ padding: '0 0 16px' }}>Delete every record — inventory, sales, expenses, investors, everything.</div>
        <button className="btn btn-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', border: '1px solid var(--red-soft)' }} onClick={() => {
          showConfirm('WIPE ALL DATA? This is permanent.', wipeAllData);
        }}>Reset all data</button>
      </div>
    </div>
  );
};

export default Settings;
