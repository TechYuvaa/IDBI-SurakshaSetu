import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, Phone, Mail, BookOpen, ShieldAlert, AlertTriangle, CreditCard, Key, Smartphone, ExternalLink, Search, X, Shield, Send, Check } from 'lucide-react';

const FAQ_DATA = [
  {
    id: 1,
    question: 'What should I do if I receive a suspicious SMS asking for my OTP?',
    answer: 'Never share your OTP with anyone, even if the caller claims to be from IDBI Bank. Banks will never ask for OTP, PIN, or CVV over phone or SMS. Use the Scam Checker feature in SuRakshaSetu to verify the message. If you have already shared your OTP, immediately call our 24/7 helpline and block your card.',
    icon: ShieldAlert,
  },
  {
    id: 2,
    question: 'How does the Transaction Monitor detect fraud?',
    answer: 'Our Neural Guard protocol uses real-time heuristic analysis including: velocity checks (unusual transaction frequency), amount anomaly detection (comparing against your historical average), beneficiary risk scoring (new/unknown recipients), time-based analysis (unusual hours like midnight-5AM), and device fingerprinting (unrecognized devices). Flagged transactions are held for your review before processing.',
    icon: AlertTriangle,
  },
  {
    id: 3,
    question: 'How is my data protected in the Secure Vault?',
    answer: 'All vault data is encrypted using AES-256-GCM encryption at rest and TLS 1.3 in transit. Your master key never leaves your device. We use zero-knowledge architecture — even IDBI Bank staff cannot view your vault contents. Biometric authentication is required for every access attempt.',
    icon: Key,
  },
  {
    id: 4,
    question: 'What does my Safety Score mean?',
    answer: 'Your Safety Score (0-100) reflects your overall digital security posture. It considers: account security settings (2FA, biometrics), transaction patterns, device trust levels, how actively you scan suspicious messages, and whether you follow recommended security protocols. A score above 90 is considered "Elite" level protection.',
    icon: CreditCard,
  },
  {
    id: 5,
    question: 'How do I add or remove a trusted device?',
    answer: 'Navigate to Secure Vault → Devices tab to manage your trusted devices. To add a new device, log in from that device and approve it via your primary device. To remove a device, click on it in the vault, select "Remove from Vault", and confirm. Removed devices will need re-authentication to access your account.',
    icon: Smartphone,
  },
];

const CONTACT_OPTIONS = [
  {
    id: 'phone',
    icon: Phone,
    title: '24/7 Fraud Helpline',
    detail: '1800-209-4324',
    subtitle: 'TOLL FREE • AVAILABLE 24/7',
    action: 'Call Now',
    highlight: true,
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Live Chat Support',
    detail: 'Average response: 2 mins',
    subtitle: 'AVAILABLE 9AM - 10PM IST',
    action: 'Start Chat',
    highlight: false,
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email Support',
    detail: 'security@idbibank.co.in',
    subtitle: 'RESPONSE WITHIN 24 HOURS',
    action: 'Send Email',
    highlight: false,
  },
];

const QUICK_LINKS = [
  { id: 'block', label: 'Block Debit/Credit Card', href: '#' },
  { id: 'report', label: 'Report Unauthorized Transaction', href: '#' },
  { id: 'reset', label: 'Reset Net Banking Password', href: '#' },
  { id: 'complaint', label: 'Lodge Cyber Crime Complaint', href: '#' },
  { id: 'ombudsman', label: 'RBI Ombudsman Portal', href: '#' },
  { id: 'locator', label: 'IDBI Bank Branch Locator', href: '#' },
];

const FAQItem = ({ item, delay }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="cyber-panel overflow-hidden"
    >
      <div
        className="p-5 flex items-start gap-4 cursor-pointer hover:bg-brand-surface-light/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <item.icon className="w-4 h-4 text-brand-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-brand-text font-medium text-sm pr-8">{item.question}</h4>
        </div>
        <button className="text-brand-text-muted shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-brand-primary/10"
          >
            <div className="p-5 pl-[4.5rem]">
              <p className="text-sm text-brand-text-muted leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Cards State for Blocking Modal
  const [cards, setCards] = useState([
    { id: 'c1', type: 'debit', label: 'IDBI Signature Debit Card', number: '4532 •••• •••• 3456', blocked: false },
    { id: 'c2', type: 'credit', label: 'HDFC Regalia Credit Card', number: '5412 •••• •••• 9921', blocked: false }
  ]);

  // Chat State
  const [chatStatus, setChatStatus] = useState('connecting'); // 'connecting', 'connected'
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isChatOpen) {
      setChatStatus('connecting');
      setMessages([]);
      const connectTimer = setTimeout(() => {
        setChatStatus('connected');
        setMessages([
          { sender: 'agent', text: 'Secure Connection Established. My name is Vikram (IDBI Cyber Intelligence Ops). How can I assist you today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }, 2500);

      return () => clearTimeout(connectTimer);
    }
  }, [isChatOpen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStatus]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = {
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Simulate Agent Reply
    setTimeout(() => {
      let responseText = "Understood. I am running a protocol trace on your account logs. Did you receive any unexpected OTPs or notifications?";
      if (inputVal.toLowerCase().includes('transaction') || inputVal.toLowerCase().includes('money')) {
        responseText = "I've flagged the recent transactions for manual audit. Please verify if you recognize a merchant named 'CRYPTO_GATEWAY_V4'.";
      } else if (inputVal.toLowerCase().includes('block') || inputVal.toLowerCase().includes('card')) {
        responseText = "To block a card immediately, please close this chat and use the 'BLOCK CARD NOW' panel in the Help Center. I can also trigger the block from here if you provide the last 4 digits.";
      } else if (inputVal.toLowerCase().includes('hack') || inputVal.toLowerCase().includes('leak')) {
        responseText = "A safety scan has been initialized. Please change your net-banking password immediately and ensure your geofencing rules are enabled under safety profiles.";
      }

      setMessages(prev => [...prev, {
        sender: 'agent',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  const toggleBlockCard = (cardId) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, blocked: !c.blocked } : c));
  };

  const filteredFAQs = searchQuery.trim()
    ? FAQ_DATA.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : FAQ_DATA;

  return (
    <div className="pb-10 max-w-6xl">
      <header className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-primary mb-3">Help Center</h1>
        <p className="text-brand-text-muted text-sm leading-relaxed max-w-2xl">
          Get immediate assistance for fraud-related emergencies, learn how SuRakshaSetu protects your accounts, and access IDBI Bank support channels.
        </p>
      </header>

      {/* Emergency Banner */}
      <div className="cyber-panel p-5 px-6 mb-8 border-brand-danger/30 bg-[rgba(244,124,124,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-danger/10 border border-brand-danger/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-brand-danger" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-brand-danger mb-0.5">EMERGENCY PROTOCOL</div>
            <p className="text-sm text-brand-text">If you suspect fraud on your account, <span className="text-brand-danger font-bold">act immediately</span>. Block your card and call the helpline.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsBlockOpen(true)}
          className="px-5 py-2.5 rounded bg-brand-danger text-white text-[10px] font-mono tracking-widest font-bold hover:bg-brand-danger/90 transition-colors shrink-0"
        >
          BLOCK CARD NOW
        </button>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {CONTACT_OPTIONS.map((opt) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cyber-panel p-6 flex flex-col justify-between min-h-[180px] ${opt.highlight ? 'border-brand-primary/40' : ''}`}
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
                <opt.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <h4 className="text-brand-text font-medium mb-1">{opt.title}</h4>
              <div className="text-brand-primary font-mono text-sm font-bold mb-1">{opt.detail}</div>
              <div className="text-[9px] font-mono tracking-widest text-brand-text-muted">{opt.subtitle}</div>
            </div>
            <button 
              onClick={() => {
                if (opt.id === 'chat') {
                  setIsChatOpen(true);
                } else if (opt.id === 'phone') {
                  alert('Dialing Toll Free Hotline: 1800-209-4324');
                } else {
                  window.location.href = 'mailto:security@idbibank.co.in?subject=SuRakshaSetu Incident Report';
                }
              }}
              className={`mt-4 w-full py-2.5 rounded text-[10px] font-mono tracking-widest font-bold transition-all ${
                opt.highlight
                  ? 'cyber-button'
                  : 'border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10'
              }`}
            >
              {opt.action.toUpperCase()}
            </button>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-brand-text flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-primary" /> Frequently Asked Questions
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-brand-primary/20 to-transparent"></div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search FAQs..."
          className="cyber-input w-full pl-11 pr-4 py-3 rounded-lg font-sans text-sm"
        />
      </div>

      <div className="space-y-3 mb-10">
        {filteredFAQs.map((item, i) => (
          <FAQItem key={item.id} item={item} delay={0.05 * i} />
        ))}
        {filteredFAQs.length === 0 && (
          <div className="cyber-panel p-8 text-center">
            <HelpCircle className="w-10 h-10 text-brand-text-muted mx-auto mb-3" />
            <p className="text-brand-text-muted text-sm">No results found for "{searchQuery}". Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-brand-text">Quick Actions</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-brand-primary/20 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_LINKS.map((link, i) => (
          <motion.button
            key={link.id}
            onClick={() => {
              if (link.id === 'block') {
                setIsBlockOpen(true);
              } else {
                alert(`Redirecting to: ${link.label}`);
              }
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="cyber-panel p-4 flex items-center justify-between hover:border-brand-primary/40 transition-all group w-full text-left"
          >
            <span className="text-sm text-brand-text group-hover:text-brand-primary transition-colors">{link.label}</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-text-muted group-hover:text-brand-primary transition-colors" />
          </motion.button>
        ))}
      </div>

      {/* Block Card Modal */}
      <AnimatePresence>
        {isBlockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlockOpen(false)}
              className="absolute inset-0 bg-brand-bg/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg cyber-panel bg-brand-surface border-brand-danger/30 p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-brand-text flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-brand-danger animate-pulse" /> Emergency Lock
                  </h2>
                  <p className="text-[10px] font-mono tracking-widest text-brand-text-muted mt-1 uppercase">SUSPEND OR BLOCK CARDS</p>
                </div>
                <button 
                  onClick={() => setIsBlockOpen(false)}
                  className="p-1 rounded border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded border border-brand-danger/20 bg-brand-danger/5 text-xs text-brand-text-muted leading-relaxed">
                  <span className="text-brand-danger font-bold uppercase">Attention:</span> Blocking a card will instantly stop all domestic, international, and online POS/ATM transactions. This process is secure and fully audited.
                </div>

                {cards.map((card) => (
                  <div 
                    key={card.id} 
                    className={`p-5 rounded border flex items-center justify-between transition-all ${
                      card.blocked 
                        ? 'border-brand-danger/40 bg-brand-danger/5 opacity-80' 
                        : 'border-brand-primary/10 bg-brand-bg/30 hover:border-brand-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded flex items-center justify-center border ${
                        card.blocked 
                          ? 'border-brand-danger/30 text-brand-danger bg-brand-danger/10' 
                          : 'border-brand-primary/20 text-brand-primary bg-brand-primary/10'
                      }`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-medium ${card.blocked ? 'line-through text-brand-text-muted' : 'text-brand-text'}`}>{card.label}</h4>
                        <div className="text-[10px] font-mono text-brand-text-muted tracking-wide">{card.number}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBlockCard(card.id)}
                      className={`px-4 py-2 rounded font-mono text-[9px] tracking-widest font-bold border transition-all ${
                        card.blocked
                          ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                          : 'border-brand-danger/40 bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20'
                      }`}
                    >
                      {card.blocked ? 'UNBLOCK' : 'BLOCK NOW'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-brand-primary/10 pt-4">
                <button
                  onClick={() => setIsBlockOpen(false)}
                  className="px-6 py-2.5 rounded font-mono text-[10px] tracking-widest text-brand-text-muted hover:text-brand-text border border-brand-primary/20 hover:border-brand-primary/40 transition-all"
                >
                  CLOSE DIALOG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-brand-bg/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg h-[550px] cyber-panel bg-brand-surface border-brand-primary/30 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-brand-surface border-b border-brand-primary/10 p-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-brand-text">Sentinel Chat</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${chatStatus === 'connected' ? 'bg-brand-primary' : 'bg-brand-accent animate-ping'}`} />
                      <span className="text-[9px] font-mono text-brand-text-muted tracking-widest uppercase">
                        {chatStatus === 'connected' ? 'SECURE CHANNEL ACTIVE' : 'ESTABLISHING KEY EXCHANGE'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-bg/40">
                {chatStatus === 'connecting' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <div className="font-mono text-[10px] text-brand-text-muted tracking-widest uppercase max-w-xs leading-relaxed">
                      // HANDSHAKING WITH SENTINEL GATEWAY...<br />
                      // ASSIGNING INCIDENT MONITOR...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center py-2">
                      <span className="px-3 py-1 rounded bg-brand-surface-light/40 border border-brand-primary/10 text-[8px] font-mono tracking-wider text-brand-primary/80 uppercase">
                        AGENT VIKRAM ASSIGNED // CONVERSATION ID: {Math.floor(100000 + Math.random() * 900000)}
                      </span>
                    </div>

                    {messages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3.5 border ${
                          msg.sender === 'user'
                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-text rounded-tr-none'
                            : 'bg-brand-surface-light border-brand-primary/15 text-brand-text rounded-tl-none'
                        }`}>
                          <div className="text-xs font-sans leading-relaxed">{msg.text}</div>
                          <div className="text-[8px] font-mono text-brand-text-muted tracking-wide mt-1.5 text-right">{msg.time}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </>
                )}
              </div>

              {/* Chat Input */}
              <form 
                onSubmit={handleSendChat} 
                className="p-4 border-t border-brand-primary/10 bg-brand-surface shrink-0 flex gap-2"
              >
                <input
                  type="text"
                  disabled={chatStatus !== 'connected'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={chatStatus === 'connected' ? "Secure transmission input..." : "Connecting..."}
                  className="cyber-input flex-1 px-4 py-3 rounded font-sans text-xs disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatStatus !== 'connected'}
                  className="w-11 h-11 cyber-button flex items-center justify-center shrink-0 disabled:opacity-50 disabled:hover:box-shadow-none"
                >
                  <Send className="w-4 h-4 text-brand-bg" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HelpCenter;
