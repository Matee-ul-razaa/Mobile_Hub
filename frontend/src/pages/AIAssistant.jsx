import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { agg, fmtNum, fmtKRW, todayISO, ym } from '../utils';

const AI_QUICK_QUESTIONS = [
  "What's my current profit?",
  "How much cash do I have?",
  "Who owes me money?",
  "Recent shipments status",
  "Top selling models",
  "This month's expenses",
  "Total Fazi Cash discount given",
  "Investor payout summary",
];

const AIAssistant = () => {
  const { data } = useData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (messages.length === 0) {
      const welcome = lang === 'ur'
        ? "Assalam-o-Alaikum! Main Mobile Hub ka AI assistant hun. Aap apne business ke baare mein kuch bhi pooch sakte hain — profit, cash, inventory, Fazi Cash, investors. Neeche se koi sawaal chunein ya apna sawaal type karein."
        : "Hello! I'm your Mobile Hub AI assistant. Ask me anything about your business — profit, cash, inventory, Fazi Cash, investors. Tap a suggestion below or type your own question.";
      setMessages([{ role: 'bot', text: welcome, source: 'offline' }]);
    }
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    askAI(input.trim());
    setInput('');
  };

  const askAI = async (text) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    
    // Offline logic
    const offlineResponse = getOfflineAnswer(text, lang, data);
    if (offlineResponse && !data.settings.apiKey) {
      setMessages(prev => [...prev, { role: 'bot', text: offlineResponse, source: 'offline' }]);
      return;
    }

    if (!data.settings.apiKey) {
      const msg = lang === 'ur'
        ? "Main is sawaal ka jawaab offline mode mein nahi de sakta. Settings mein API key add karein, phir koi bhi sawaal poocha ja sakta hai."
        : "I can't answer that one in offline mode. Add an API key in Settings to ask anything in natural language.";
      setMessages(prev => [...prev, { role: 'bot', text: msg, source: 'offline' }]);
      return;
    }

    // Online AI
    setLoading(true);
    setMessages(prev => [...prev, { role: 'bot', text: '__typing__', source: 'online' }]);
    
    try {
      const snapshot = buildSnapshot(data);
      const system = getSystemPrompt(lang, snapshot);
      const history = messages.filter(m => m.text !== '__typing__').slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': data.settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: data.settings.aiModel || 'claude-haiku-4-5',
          max_tokens: 800,
          system,
          messages: [...history, { role: 'user', content: text }]
        })
      });
      const json = await res.json();
      setMessages(prev => prev.filter(m => m.text !== '__typing__'));

      if (res.ok && json.content) {
        const reply = json.content.map(b => b.text || '').join('\n');
        setMessages(prev => [...prev, { role: 'bot', text: reply, source: 'online' }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: json.error?.message || 'Error connecting to AI', source: 'error' }]);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.text !== '__typing__'));
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error: ' + err.message, source: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-wrap">
      <div className="ai-chat-card">
        <div className="ai-header">
          <div>
            <div style={{ fontWeight: 600 }}>Mobile Hub AI</div>
            <div className="ai-status">
              <span className={`ai-dot ${data.settings.apiKey ? '' : 'off'}`}></span>
              {data.settings.apiKey ? 'Online mode · conversational AI' : 'Offline mode · quick answers only'}
            </div>
          </div>
          <div className="ai-lang-toggle">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>en</button>
            <button className={lang === 'ur' ? 'active' : ''} onClick={() => setLang('ur')}>ur</button>
          </div>
        </div>
        <div className="ai-messages" ref={scrollRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ${m.role === 'user' ? 'user' : (m.source === 'error' ? 'bot error' : 'bot')}`}>
              {m.text === '__typing__' ? <div className="typing-indicator"><span></span><span></span><span></span></div> : renderMd(m.text)}
              {m.role === 'bot' && m.source && <div className="badge-src">{m.source === 'online' ? 'Claude' : 'Instant'}</div>}
            </div>
          ))}
        </div>
        <div className="ai-quick">
          {AI_QUICK_QUESTIONS.map(q => <button key={q} onClick={() => askAI(q)}>{q}</button>)}
        </div>
        <form className="ai-input-row" onSubmit={handleSubmit}>
          <textarea 
            placeholder="Ask anything about your business..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>Send</button>
        </form>
      </div>
    </div>
  );
};

// --- Helpers ---
const renderMd = (s) => {
  return s.split('\n').map((line, k) => (
    <div key={k}>{line.split('**').map((tok, i) => i % 2 ? <strong key={i}>{tok}</strong> : tok)}</div>
  ));
};

const getOfflineAnswer = (text, lang, data) => {
  const t = text.toLowerCase();
  const a = agg(data);
  const T = (en, ur) => lang === 'ur' ? ur : en;

  if (t.includes('profit') || t.includes('kamai')) {
    return T(
      `**Your realized profit so far: ${fmtKRW(a.retainedProfit)}**\nBreakdown:\n- Revenue: ${fmtKRW(a.realizedRevenue)}\n- COGS: -${fmtKRW(a.realizedCOGS)}\n- Expenses: -${fmtKRW(a.totalExp)}\n- Payouts: -${fmtKRW(a.totalPaid)}`,
      `**Ab tak ka asal munafa: ${fmtKRW(a.retainedProfit)}**\nTafseel:\n- Revenue: ${fmtKRW(a.realizedRevenue)}\n- Kharcha: -${fmtKRW(a.totalExp)}\n- Investor payout: -${fmtKRW(a.totalPaid)}`
    );
  }
  if (t.includes('cash') || t.includes('paisa')) {
    return T(
      `**Cash in hand: ${fmtKRW(a.cashInHand)}**\nIncludes Fazi Cash and your investments minus all expenses and payouts.`,
      `**Hath mein cash: ${fmtKRW(a.cashInHand)}**\nIs mein Fazi cash aur aapki apni investment shamil hai kharche nikalne ke baad.`
    );
  }
  if (t.includes('owe') || t.includes('baqi')) {
    const list = data.sales.filter(s => (s.qty * s.pricePerUnit) - (s.received || 0) > 0);
    if (!list.length) return T("No pending receivables.", "Sab buyers ne pay kar diya hai.");
    const lines = list.map(s => `- **${s.buyer}**: ${fmtKRW((s.qty * s.pricePerUnit) - (s.received || 0))}`).join('\n');
    return T(`**Pending from buyers:**\n${lines}`, `**Buyers se baqi raqam:**\n${lines}`);
  }
  // ... more logic could be added here
  return null;
};

const buildSnapshot = (data) => {
  const a = agg(data);
  return {
    business: data.settings.businessName,
    today: todayISO(),
    totals: { cashInHand: a.cashInHand, capitalPool: a.totalCapitalPool, netProfit: a.retainedProfit },
    inventory: { items: data.inventory.length, stockUnits: a.invUnits, value: a.invValue },
    sales: { count: data.sales.length, revenue: a.salesRev, pending: a.pendingReceivable },
    shipments: data.shipments.slice(-5).map(s => ({ date: s.date, status: s.status, courier: s.courier })),
    expenses: { thisMonth: data.expenses.filter(e => ym(e.date) === ym()).reduce((s, x) => s + x.amount, 0) }
  };
};

const getSystemPrompt = (lang, snapshot) => {
  const instr = lang === 'ur' ? 'IMPORTANT: Respond in Urdu written in Roman English letters. Keep tone friendly.' : 'Respond in clear, simple English.';
  return `You are the AI for "Mobile Hub", an export business KR to PK. ${instr} Data snapshot:\n${JSON.stringify(snapshot)}`;
};

export default AIAssistant;
