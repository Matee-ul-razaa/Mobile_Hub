import React, { useState } from 'react';
import { useData } from '../DataContext';

const AIAssistant = ({ toggleMenu }) => {
  const { data } = useData();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Salam! I am your Mobile Hub AI. Ask me about sales, profit, or inventory in Roman Urdu or English.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (text) => {
    const msgText = text || input;
    if (!msgText.trim()) return;
    const userMsg = { role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    
    // Offline Intent Logic (Simulated)
    setTimeout(() => {
      let reply = "I'm still learning the specifics, but I can help you find metrics in the Dashboard.";
      const low = msgText.toLowerCase();
      if (low.includes('profit')) reply = "Your realized profit is looking healthy! Check the Capital & Profit page for a full breakdown.";
      if (low.includes('inventory') || low.includes('stock')) reply = "You currently have items in stock. Head over to the Inventory page to see exactly what's left.";
      
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 600);
    if (!text) setInput('');
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <div className="page-sub">Ask anything about your business</div>
          </div>
        </div>
      </div>

      <div className="ai-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div className="ai-chat-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div className="ai-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ai-status">
              <div className="ai-dot"></div>
              Offline Intelligence Active
            </div>
            <div className="ai-lang-toggle">
              <button className="active">English</button>
              <button>Urdu</button>
            </div>
          </div>

          <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="ai-quick" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap', background: 'var(--surface-2)' }}>
            <button onClick={() => handleSend("Sales overview")}>Sales overview</button>
            <button onClick={() => handleSend("Expense breakdown")}>Expense breakdown</button>
            <button onClick={() => handleSend("Investor summary")}>Investor summary</button>
          </div>

          <div className="ai-input-row" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea 
              placeholder="Ask anything..." 
              style={{ flex: 1, minHeight: '40px', maxHeight: '120px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)', resize: 'none' }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button className="btn btn-primary" style={{ padding: '10px 16px' }} onClick={() => handleSend()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
