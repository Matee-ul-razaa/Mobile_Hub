import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { fmtKRW, agg, fmtNum, todayISO, ym } from '../utils';

// OFFLINE INTENT ENGINE (Ported from HTML)
const getOfflineAnswer = (text, data, lang) => {
  const t = text.toLowerCase().trim();
  const a = agg(data);
  const T = (en, ur) => lang === 'ur' ? ur : en;

  // Profit
  if(/(profit|earning|kamai|faida|mun[aá]fa|munafa)/.test(t)){
    return T(
      `**Your realized profit so far: ${fmtKRW(a.retainedProfit)}**\n\nBreakdown:\n• Realized revenue: ${fmtKRW(a.realizedRevenue)}\n• Cost of goods: −${fmtKRW(a.salesCOGS)}\n• Hawala discounts: −${fmtKRW(a.hawalaDiscount)}\n• Expenses: −${fmtKRW(a.totalExp)}\n• Investor payouts: −${fmtKRW(a.totalPaid)}\n\n${a.retainedProfit>=0?'Great — this profit is added to your capital pool.':'You are running at a loss right now.'}`,
      `**Ab tak ka asal munafa: ${fmtKRW(a.retainedProfit)}**\n\nTafseel:\n• Realized revenue: ${fmtKRW(a.realizedRevenue)}\n• Mobiles ki cost: −${fmtKRW(a.salesCOGS)}\n• Hawala discount: −${fmtKRW(a.hawalaDiscount)}\n• Expenses: −${fmtKRW(a.totalExp)}\n• Investor payout: −${fmtKRW(a.totalPaid)}\n\n${a.retainedProfit>=0?'Bahut accha — yeh munafa aapke capital pool mein shaamil ho gaya hai.':'Abhi loss mein hain.'}`
    );
  }

  // Who owes money
  if(/(owe|pending|receivable|baqi|udhaar|qarza|waapas|kis\s*(ka|ke))/.test(t)){
    const pendingBuyers = {};
    data.sales.forEach(s=>{
      const total = s.qty*s.pricePerUnit;
      const pending = Math.max(0, total - (s.received||0));
      if(pending>0) pendingBuyers[s.buyer] = (pendingBuyers[s.buyer]||0) + pending;
    });
    const list = Object.entries(pendingBuyers).sort((x,y)=>y[1]-x[1]);
    if(!list.length){
      return T('✓ No pending receivables. All buyers have paid in full.', '✓ Koi buyer ka paisa baqi nahi hai. Sab ne poora payment kar diya hai.');
    }
    const lines = list.slice(0,10).map(([b,v])=>`• **${b}** — ${fmtKRW(v)}`).join('\n');
    return T(
      `**Total pending: ${fmtKRW(a.pendingReceivable)}** across ${list.length} buyer(s):\n\n${lines}`,
      `**Total baqi: ${fmtKRW(a.pendingReceivable)}** (${list.length} buyer se):\n\n${lines}`
    );
  }

  // Stock
  if(/(stock|inventory|phone.*(hai|available)|kitne phone|mobile.*(kitne|hain)|available)/.test(t)){
    const items = data.inventory.filter(x=>x.qty-x.soldQty>0);
    const lines = items.slice(0,10).map(x=>`• **${x.model}** — ${x.qty-x.soldQty} units (${fmtKRW((x.qty-x.soldQty)*x.costPerUnit)})`).join('\n');
    return T(
      `**Stock in hand: ${a.invUnits} units, worth ${fmtKRW(a.invValue)}**\n\n${lines||'No stock currently.'}`,
      `**Stock mein maujood: ${a.invUnits} units, qeemat ${fmtKRW(a.invValue)}**\n\n${lines||'Abhi koi stock nahi.'}`
    );
  }

  // Cash
  if(/(cash|paisa|paise|hath|how much|kitna)/.test(t)){
    return T(
      `**Cash in hand: ${fmtKRW(a.cashInHand)}**\n\n• Total cash in: ${fmtKRW(a.hawalaIn + a.ownerCapital)}\n• Total out: ${fmtKRW(a.totalExp + a.totalPaid)}\n• Inventory value: ${fmtKRW(a.invValue)}\n• Pending from buyers: ${fmtKRW(a.pendingReceivable)}`,
      `**Hath mein cash: ${fmtKRW(a.cashInHand)}**\n\n• Total aya: ${fmtKRW(a.hawalaIn + a.ownerCapital)}\n• Total gaya: ${fmtKRW(a.totalExp + a.totalPaid)}\n• Stock mein: ${fmtKRW(a.invValue)}\n• Buyer se pending: ${fmtKRW(a.pendingReceivable)}`
    );
  }

  return null;
};

const AIAssistant = () => {
  const { data } = useData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      const welcome = lang === 'ur' 
        ? "Assalam-o-Alaikum! Main Mobile Hub ka AI assistant hun. Aap apne business ke baare mein kuch bhi pooch sakte hain — profit, cash, inventory. Neeche se koi sawaal chunein ya apna sawaal type karein."
        : "Hello! I'm your Mobile Hub AI assistant. Ask me anything about your business — profit, cash, inventory. Tap a suggestion below or type your own question.";
      setMessages([{ role: 'bot', text: welcome, source: 'offline' }]);
    }
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text) => {
    const q = text || input;
    if (!q.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking
    setTimeout(() => {
      const offAnswer = getOfflineAnswer(q, data, lang);
      if (offAnswer) {
        setMessages(prev => [...prev, { role: 'bot', text: offAnswer, source: 'offline' }]);
      } else {
        const fallback = lang === 'ur'
          ? "Maaf kijiye, main is sawaal ka offline mode mein jawaab nahi de sakta. Koshish karein ke profit, cash ya stock ke baare mein poochein."
          : "I can't answer that specific question in offline mode. Try asking about profit, cash, or stock levels.";
        setMessages(prev => [...prev, { role: 'bot', text: fallback, source: 'offline' }]);
      }
      setIsTyping(false);
    }, 600);
  };

  const quickQs = [
    "What's my current profit?",
    "How much cash do I have?",
    "Who owes me money?",
    "Check stock levels",
  ];

  return (
    <div className="ai-wrap">
      <div className="card ai-chat-card">
        <div className="ai-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Mobile Hub AI</div>
            <div className="ai-status">
              <span className="ai-dot"></span>
              Offline Mode · Instant Answers
            </div>
          </div>
          <div className="ai-lang-toggle">
            <button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>English</button>
            <button className={lang==='ur'?'active':''} onClick={()=>setLang('ur')}>Urdu (Roman)</button>
          </div>
        </div>

        <div className="ai-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>
              <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              {m.source && <div className="badge-src">{m.source==='offline'?'Instant':'AI'}</div>}
            </div>
          ))}
          {isTyping && <div className="ai-msg bot">Thinking...</div>}
        </div>

        <div className="ai-quick">
          {quickQs.map(q => <button key={q} onClick={()=>handleSend(q)}>{q}</button>)}
        </div>

        <div className="ai-input-row">
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            placeholder="Ask about profit, stock, or payments..."
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button className="btn btn-primary" onClick={()=>handleSend()}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
