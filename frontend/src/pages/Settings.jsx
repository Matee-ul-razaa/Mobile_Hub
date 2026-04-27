import React from 'react';
import { useData } from '../DataContext';

const Settings = ({ toggleMenu }) => {
  const { data, setData } = useData();

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `mobile-hub-backup-${new Date().toISOString().slice(0,10)}.json`);
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
        if (window.confirm('This will replace ALL current data with the backup. Proceed?')) {
          setData(imported);
          alert('Data restored successfully!');
        }
      } catch (err) {
        alert('Invalid backup file.');
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
            <h1 className="page-title">Settings / Backup</h1>
            <div className="page-sub">System configuration and data safety</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header"><h3 className="card-title">Cloud Backup & Restore</h3></div>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '18px' }}>
          Your data is automatically saved to the database. However, you can download a full JSON backup for offline keeping.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleExportData}>Download Backup (.json)</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            Restore from File
            <input type="file" style={{ display: 'none' }} onChange={handleImportData} accept=".json" />
          </label>
        </div>

        <div className="sep"></div>

        <div className="card-header"><h3 className="card-title">Business Identity</h3></div>
        <div className="form-row">
          <label>Platform Name</label>
          <input value="Mobile Hub — Korea" disabled />
        </div>
        <div className="form-row">
          <label>Base Currency</label>
          <input value="KRW (Korean Won)" disabled />
        </div>
        
        <div className="sep"></div>
        <p className="muted" style={{ fontSize: '11px' }}>
          System Version: 2.0.0 (MERN Stack Edition) · Match: Definitive HTML Master v1.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
