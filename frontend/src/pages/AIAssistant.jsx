import React, { useState } from 'react';
import { useData } from '../DataContext';

const AIAssistant = ({ toggleMenu }) => {
  const { data } = useData();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Salam! I am your Mobile Hub AI. Ask me about sales, profit, or inventory in Roman Urdu or English.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    
    // Offline Intent Logic (Simulated)
    setTimeout(() => {
      let reply = "I'm still learning the specifics, but I can help you find metrics in the Dashboard.";
      const low = input.toLowerCase();
      if (low.includes('profit')) reply = "Your realized profit is looking healthy! Check the Capital & Profit page for a full breakdown.";
      if (low.includes('inventory') || low.includes('stock')) reply = "You currently have items in stock. Head over to the Inventory page to see exactly what's left.";
      
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 600);
    setInput('');
  };

  return (
    <div>
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="menu-toggle" onClick={toggleMenu}>☰</button>
          <div>
            <h1 className="page-title">AI Assistant</h1>
            <div className="page-sub">Instant business insights</div>
          </div>
        </div>
      </div>

      <div className="ai-wrap">
        <div className="ai-chat-card">
          <div className="ai-header">
            <div className="ai-status">
              <div className="ai-dot"></div>
              Offline Intelligence Active
            </div>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="ai-input-row">
            <textarea 
              placeholder="Ask anything (e.g. 'Aaj ka profit kitna hai?')" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            />
            <button className="btn btn-primary" onClick={handleSend}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
