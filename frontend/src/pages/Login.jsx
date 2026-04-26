import React, { useState } from 'react';
import { poster } from '../api';

const Login = ({ onLogin }) => {
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await poster('/auth/login', { user: selected, password });
      if (res.success) {
        localStorage.setItem('mobile_hub_user', selected);
        onLogin(selected);
      }
    } catch (err) {
      setError('Incorrect password. Try "admin".');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="logo-circ" style={{ margin: '0 auto 12px' }}>MH</div>
          <h2 style={{ margin: 0 }}>Mobile Hub</h2>
          <div className="muted" style={{ fontSize: '13px' }}>Business Manager v2.0</div>
        </div>

        {!selected ? (
          <>
            <p className="muted" style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px' }}>Select profile to sign in</p>
            <div className="user-picker">
              <button className="user-btn" onClick={() => setSelected('nadeem')}>
                <div className="avatar n">N</div>
                <span>Nadeem</span>
              </button>
              <button className="user-btn" onClick={() => setSelected('bilawal')}>
                <div className="avatar b">B</div>
                <span>Bilawal</span>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleLogin}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: 'var(--surface-2)', padding: '10px', borderRadius: '12px' }}>
               <div className={`avatar ${selected==='nadeem'?'n':'b'}`} style={{ width:'32px', height:'32px' }}>{selected[0].toUpperCase()}</div>
               <div style={{ flex:1 }}>
                 <div style={{ fontWeight:600, fontSize:'14px' }}>{selected==='nadeem'?'Nadeem':'Bilawal'}</div>
                 <div className="muted" style={{ fontSize:'11px' }}>Administrator</div>
               </div>
               <button type="button" className="btn btn-sm" onClick={() => {setSelected(null); setPassword('');}}>Change</button>
             </div>
             <div className="form-row">
               <label>Enter Password</label>
               <input 
                 autoFocus 
                 type="password" 
                 placeholder="••••" 
                 value={password} 
                 onChange={e=>setPassword(e.target.value)}
                 style={{ textAlign:'center', fontSize:'18px', letterSpacing:'4px' }}
               />
             </div>
             {error && <div style={{ color:'var(--red)', fontSize:'12px', marginBottom:'12px', textAlign:'center' }}>{error}</div>}
             <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Sign In</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
