import React, { useState } from 'react';
import { useData } from '../DataContext';

const AIAssistant = ({ toggleMenu, onLogout }) => {
  const { data } = useData();
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm your Mobile Hub AI assistant. Ask me anything about your business — profit, cash, inventory, Fazi Cash, investors. Tap a suggestion below or type your own question." }
  ]);
  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSend = async (text) => {
    const msgText = text || input;
    if (!msgText.trim() || loading) return;

    const userMsg = { role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput('');
    setLoading(true);

    const apiKey = data.settings?.apiKey;

    if (!apiKey) {
      setTimeout(() => {
        let reply = "I'm currently in offline mode. Please add your Gemini API key in Settings to unlock my full potential and get accurate answers about your business.";
        const low = msgText.toLowerCase();
        if (low.includes('profit')) reply = "Your profit metrics are calculated in real-time. Head to the 'Capital & Profit' page for the most accurate breakdown of your earnings.";
        if (low.includes('inventory') || low.includes('stock')) reply = "I can see you have several models in stock. Check the 'Inventory' page to see exactly what's available and what's sold out.";
        
        setMessages(prev => [...prev, { role: 'bot', text: reply }]);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      // Prepare business context for the AI
      const context = `
        You are Mobile Hub AI, a professional business analyst for a mobile shop.
        Analyze this business data and answer the user's question concisely and accurately.
        
        BUSINESS DATA:
        - Name: ${data.settings?.businessName || 'Mobile Hub'}
        - Total Inventory Models: ${data.inventory.length}
        - Total Sales Records: ${data.sales.length}
        - Total Expense Records: ${data.expenses.length}
        - Active Investors: ${data.investors.length}
        
        INSTRUCTIONS:
        1. Use KRW for currency values unless PKR is specifically asked for.
        2. Be professional and helpful.
        3. If you don't have enough data to be 100% sure, tell the user which page they should check.
        4. Keep answers short (max 2-3 sentences).
      `;

      const provider = data.settings?.aiProvider || 'gemini';
      let aiReply = '';

      if (provider === 'gemini') {
        try {
          // 1. Auto-discover available models for this specific key
          const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const modelsJson = await modelsRes.json();
          
          if (modelsJson.error) {
            throw new Error(modelsJson.error.message);
          }

          const availableModels = modelsJson.models?.filter(m => 
            m.supportedGenerationMethods.includes('generateContent') && 
            m.name.includes('gemini')
          ) || [];

          if (availableModels.length === 0) {
            throw new Error("No compatible Gemini models found for this API key.");
          }

          // 2. Use the first available model (usually the best one)
          const bestModel = availableModels[0].name; // e.g. "models/gemini-1.5-flash"
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${bestModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${context}\n\nUser Question: ${msgText}` }] }]
            })
          });
          
          const json = await response.json();
          if (json.error) {
            throw new Error(json.error.message);
          }
          
          aiReply = json.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        } catch (e) {
          aiReply = `Gemini Error: ${e.message}. This usually happens if the API key is restricted. Please try creating a new key in AI Studio and make sure 'Generative Language API' is enabled.`;
        }
      } else {
        aiReply = "Anthropic Claude integration is almost ready. For now, please use Google Gemini for the best experience!";
      }
      
      setMessages(prev => [...prev, { role: 'bot', text: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: `Connection Error: ${err.message}. Please check your internet and API key.` }]);
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="badge-group" style={{ background: 'var(--surface-2)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
            <button className="btn btn-sm btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}>English</button>
            <button className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '11px', background: 'transparent', border: 'none' }}>Urdu (Roman)</button>
          </div>
          <button className="btn btn-sm" style={{ background: 'var(--surface-2)', fontSize: '11px' }} onClick={() => setMessages([messages[0]])}>Clear</button>
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

      <div className="ai-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div className="ai-chat-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div className="ai-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>Mobile Hub AI</div>
              <div className="muted" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--text-3)', borderRadius: '50%' }}></span> 
                {data.settings?.apiKey ? (
                  <span style={{ color: 'var(--green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%' }}></span> 
                    Online · Connected
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--text-3)', borderRadius: '50%' }}></span> 
                    Offline mode · limited answers
                  </span>
                )}
                · <span style={{ color: 'var(--brand)', cursor: 'pointer' }} onClick={() => window.location.href='/settings'}>Change API key</span>
              </div>
            </div>
            <div className="muted" style={{ fontSize: '10px' }}>Language: English</div>
          </div>

          <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="ai-msg bot" style={{ opacity: 0.7, fontStyle: 'italic' }}>
                Typing...
              </div>
            )}
          </div>

          <div className="ai-quick" style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'transparent' }}>
            <button className="btn-pill" onClick={() => handleSend("What's my current profit?")}>What's my current profit?</button>
            <button className="btn-pill" onClick={() => handleSend("How much cash do I have?")}>How much cash do I have?</button>
            <button className="btn-pill" onClick={() => handleSend("Who owes me money?")}>Who owes me money?</button>
            <button className="btn-pill" onClick={() => handleSend("Recent shipments status")}>Recent shipments status</button>
            <button className="btn-pill" onClick={() => handleSend("Top selling models")}>Top selling models</button>
            <button className="btn-pill" onClick={() => handleSend("This month's expenses")}>This month's expenses</button>
            <button className="btn-pill" onClick={() => handleSend("Total Fazi Cash discount given")}>Total Fazi Cash discount given</button>
            <button className="btn-pill" onClick={() => handleSend("Investor payout summary")}>Investor payout summary</button>
          </div>

          <div className="ai-input-row" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea 
              placeholder="Ask anything about your business..." 
              style={{ flex: 1, minHeight: '44px', maxHeight: '120px', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', background: 'var(--surface-2)', color: 'var(--text)', resize: 'none' }}
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
