import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Copy, Plus, CreditCard, Key, Smartphone, Shield, CheckCircle, X, Trash2 } from 'lucide-react';

const INITIAL_VAULT_ITEMS = [
  {
    id: 1,
    type: 'card',
    label: 'IDBI Debit Card',
    icon: CreditCard,
    details: { number: '4532 •••• •••• 3456', expiry: '09/28', cvv: '•••', name: 'RAJ KUMAR' },
    addedOn: '12 Jan 2026',
    status: 'active',
  },
  {
    id: 2,
    type: 'card',
    label: 'HDFC Credit Card',
    icon: CreditCard,
    details: { number: '5412 •••• •••• 9921', expiry: '03/27', cvv: '•••', name: 'RAJ KUMAR' },
    addedOn: '05 Mar 2026',
    status: 'active',
  },
  {
    id: 3,
    type: 'credential',
    label: 'IDBI Net Banking',
    icon: Key,
    details: { username: 'rajkumar_idbi', password: '••••••••••••' },
    addedOn: '12 Jan 2026',
    status: 'active',
  },
  {
    id: 4,
    type: 'device',
    label: 'iPhone 15 Pro (Primary)',
    icon: Smartphone,
    details: { deviceId: 'A1B2C3-D4E5F6', lastActive: 'Today, 04:42 PM', location: 'Mumbai, IN' },
    addedOn: '01 Jan 2026',
    status: 'trusted',
  },
  {
    id: 5,
    type: 'device',
    label: 'MacBook Air M3',
    icon: Smartphone,
    details: { deviceId: 'X7Y8Z9-M1N2O3', lastActive: 'Today, 03:10 PM', location: 'Mumbai, IN' },
    addedOn: '15 Jan 2026',
    status: 'trusted',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'ALL ITEMS' },
  { key: 'card', label: 'CARDS' },
  { key: 'credential', label: 'CREDENTIALS' },
  { key: 'device', label: 'DEVICES' },
];

const VaultCard = ({ item, onRemove }) => {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusColors = {
    active: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30',
    verified: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30',
    trusted: 'text-brand-primary bg-brand-primary/10 border-brand-primary/30',
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    const textToCopy = Object.entries(item.details)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="cyber-panel overflow-hidden"
    >
      <div
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-brand-surface-light/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <item.icon className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h4 className="text-brand-text font-medium text-sm">{item.label}</h4>
            <div className="text-[9px] font-mono text-brand-text-muted tracking-widest mt-0.5">ADDED {item.addedOn.toUpperCase()}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-bold border uppercase ${statusColors[item.status] || 'text-brand-primary bg-brand-primary/10 border-brand-primary/30'}`}>
            {item.status}
          </span>
          <Lock className="w-3.5 h-3.5 text-brand-text-muted" />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-brand-primary/10 bg-brand-bg/60"
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[10px] font-mono tracking-widest text-brand-primary uppercase">Secured Details</h5>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-mono tracking-widest border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                  >
                    {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {revealed ? 'HIDE' : 'REVEAL'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-mono tracking-widest border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item.details).map(([key, value]) => (
                  <div key={key} className="bg-brand-surface-light/50 p-3 rounded border border-brand-primary/10">
                    <div className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="font-mono text-sm text-brand-text">
                      {revealed ? value : value.toString().replace(/./g, '•')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-mono tracking-widest border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all"
                >
                  <Trash2 className="w-3 h-3" /> REMOVE FROM VAULT
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Vault = () => {
  const [vaultItems, setVaultItems] = useState(INITIAL_VAULT_ITEMS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form States
  const [itemType, setItemType] = useState('card');
  const [label, setLabel] = useState('');
  
  // Fields for card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Fields for credential
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Fields for device
  const [deviceId, setDeviceId] = useState('');
  const [deviceLocation, setDeviceLocation] = useState('');

  const filtered = activeCategory === 'all'
    ? vaultItems
    : vaultItems.filter(i => i.type === activeCategory);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!label) return;

    let details = {};
    let icon = Key;
    let status = 'active';

    if (itemType === 'card') {
      details = {
        number: cardNumber || '4532 •••• •••• 9999',
        expiry: cardExpiry || '12/30',
        cvv: cardCvv || '•••',
        name: cardHolder || 'RAJ KUMAR'
      };
      icon = CreditCard;
    } else if (itemType === 'credential') {
      details = {
        username: username || 'user@example.com',
        password: password || '••••••••••••'
      };
      icon = Key;
    } else if (itemType === 'device') {
      details = {
        deviceId: deviceId || 'D3F4G5-H6J7K8',
        lastActive: 'Just now',
        location: deviceLocation || 'Mumbai, IN'
      };
      icon = Smartphone;
      status = 'trusted';
    }

    const newItem = {
      id: Date.now(),
      type: itemType,
      label: label,
      icon,
      details,
      addedOn: 'Today',
      status
    };

    setVaultItems(prev => [newItem, ...prev]);
    resetForm();
    setIsAddOpen(false);
  };

  const resetForm = () => {
    setLabel('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder('');
    setUsername('');
    setPassword('');
    setDeviceId('');
    setDeviceLocation('');
  };

  const handleRemove = (id) => {
    setVaultItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="pb-10 max-w-6xl">
      <header className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-primary mb-3">Secure Vault</h1>
          <p className="text-brand-text-muted text-sm leading-relaxed">
            Military-grade encrypted storage for your financial credentials, cards, and trusted devices. All data is AES-256 encrypted at rest.
          </p>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="cyber-button px-6 py-4 flex items-center gap-3 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <div className="text-left leading-tight text-xs">
            ADD NEW<br />ITEM
          </div>
        </button>
      </header>

      {/* Encryption Status Bar */}
      <div className="cyber-panel p-4 px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-brand-primary" />
          <span className="text-[10px] font-mono tracking-widest text-brand-text-muted">VAULT ENCRYPTION: <span className="text-brand-primary font-bold">AES-256-GCM ACTIVE</span></span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-brand-primary" />
          <span className="text-[10px] font-mono tracking-widest text-brand-primary">{vaultItems.length} ITEMS SECURED</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-5 py-2.5 rounded text-[10px] font-mono tracking-widest whitespace-nowrap transition-all border ${
              activeCategory === cat.key
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/50'
                : 'border-brand-primary/10 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Vault Items List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <VaultCard key={item.id} item={item} onRemove={handleRemove} />
          ))}
        </AnimatePresence>
      </div>

      {/* Add New Item Dialog */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-brand-bg/85 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg cyber-panel bg-brand-surface border-brand-primary/30 p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-brand-text">Secure Vault</h2>
                  <p className="text-[10px] font-mono tracking-widest text-brand-text-muted mt-1 uppercase">ADD ENCRYPTED RECORD</p>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="p-1 rounded border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-6">
                {/* Select Item Type */}
                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">RECORD TYPE</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'card', label: 'CARD', icon: CreditCard },
                      { key: 'credential', label: 'CREDENTIAL', icon: Key },
                      { key: 'device', label: 'DEVICE', icon: Smartphone }
                    ].map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setItemType(type.key)}
                          className={`py-3 rounded border font-mono text-[10px] tracking-wider flex flex-col items-center gap-2 transition-all ${
                            itemType === type.key
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                              : 'border-brand-primary/10 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/30'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Common Name/Label Input */}
                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">RECORD LABEL / NAME</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={
                      itemType === 'card' ? 'e.g. My IDBI Platinum Card' :
                      itemType === 'credential' ? 'e.g. Netbanking Gateway' :
                      'e.g. Raj\'s Personal Phone'
                    }
                    className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                  />
                </div>

                {/* Card Fields */}
                {itemType === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">CARD NUMBER</label>
                      <input
                        type="text"
                        placeholder="4532 9988 7766 5544"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">EXPIRY DATE</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">CVV</label>
                        <input
                          type="password"
                          maxLength="3"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">CARDHOLDER NAME</label>
                      <input
                        type="text"
                        placeholder="RAJ KUMAR"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Credential Fields */}
                {itemType === 'credential' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">USERNAME / CLIENT ID</label>
                      <input
                        type="text"
                        placeholder="rajkumar_idbi"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">SECURE PASSWORD</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Device Fields */}
                {itemType === 'device' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">DEVICE IDENTIFIER / MAC</label>
                      <input
                        type="text"
                        placeholder="A1B2C3-D4E5F6"
                        value={deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">TRUSTED GEOLOCATION</label>
                      <input
                        type="text"
                        placeholder="Mumbai, IN"
                        value={deviceLocation}
                        onChange={(e) => setDeviceLocation(e.target.value)}
                        className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-brand-primary/10">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setIsAddOpen(false); }}
                    className="flex-1 py-3 rounded border border-brand-danger/30 text-brand-danger font-mono text-xs tracking-widest hover:bg-brand-danger/10 transition-all"
                  >
                    DISCARD
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded font-mono text-xs tracking-widest font-bold bg-brand-primary text-brand-bg hover:bg-brand-primary-dark transition-all shadow-[0_0_15px_rgba(117,230,204,0.3)]"
                  >
                    SAVE SECURELY
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Vault;
