import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, CreditCard, Edit3, X, Save, Trash2, ShieldCheck, Shield, Lock, Smartphone, Bell, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import CountUp from '../components/CountUp';
import { useSecurity } from '../context/SecurityContext';

/* ── Confirmation Modal ── */
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmLabel, confirmColor = 'bg-brand-primary' }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          className="relative cyber-panel p-8 max-w-sm w-full text-center border-brand-primary/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center bg-brand-primary/10 border border-brand-primary/30">
            {confirmColor.includes('danger') 
              ? <AlertTriangle className="w-7 h-7 text-brand-danger" />
              : <CheckCircle className="w-7 h-7 text-brand-primary" />
            }
          </div>
          <h3 className="font-display text-xl font-bold text-brand-text mb-2">{title}</h3>
          <p className="text-sm text-brand-text-muted mb-8">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg border border-brand-primary/30 text-brand-text-muted font-mono text-xs tracking-widest hover:bg-brand-surface-light hover:text-brand-text transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-lg font-mono text-xs tracking-widest font-bold transition-all ${
                confirmColor.includes('danger')
                  ? 'bg-brand-danger text-white hover:bg-brand-danger/80'
                  : 'cyber-button'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Edit Dialog ── */
const EditDialog = ({ isOpen, onClose, profileData, onSave }) => {
  const [form, setForm] = useState({ ...profileData });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = () => {
    return Object.keys(profileData).some(key => profileData[key] !== form[key]);
  };

  const handleSaveClick = () => setShowSaveConfirm(true);
  const handleDiscardClick = () => {
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmSave = () => {
    onSave(form);
    setShowSaveConfirm(false);
    onClose();
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const fields = [
    { key: 'fullName', label: 'Full Name', icon: User, type: 'text' },
    { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel' },
    { key: 'email', label: 'Email Address', icon: Mail, type: 'email' },
    { key: 'location', label: 'Location', icon: MapPin, type: 'text' },
    { key: 'panNumber', label: 'PAN Number', icon: CreditCard, type: 'text' },
    { key: 'aadhaar', label: 'Aadhaar Number', icon: ShieldCheck, type: 'text' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={handleDiscardClick} />

          {/* Dialog */}
          <motion.div
            className="relative cyber-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto border-brand-primary/30"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-brand-surface border-b border-brand-primary/10 p-6 flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-text">Edit Profile</h2>
                <p className="text-xs text-brand-text-muted font-mono tracking-widest mt-1">MODIFY PERSONAL DETAILS</p>
              </div>
              <button
                onClick={handleDiscardClick}
                className="w-10 h-10 rounded-lg border border-brand-primary/20 flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 p-5 rounded-lg bg-brand-bg/50 border border-brand-primary/10 mb-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-brand-primary/50 overflow-hidden bg-brand-bg p-0.5">
                    <img
                      src="https://api.dicebear.com/9.x/notionists/svg?seed=RajKumar&backgroundColor=0A1512"
                      alt="Profile Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <button className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-primary text-brand-bg hover:bg-brand-text transition-colors">
                    <Edit3 className="w-3 h-3 text-brand-bg" />
                  </button>
                </div>
                <div>
                  <div className="text-brand-text font-medium mb-1">Profile Picture</div>
                  <div className="text-[10px] font-mono text-brand-text-muted tracking-widest">JPEG, PNG • MAX 2MB</div>
                </div>
              </div>

              {/* Input Fields */}
              {fields.map(({ key, label, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 flex items-center gap-1.5 block">
                    <Icon className="w-3 h-3" /> {label}
                  </label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="cyber-input w-full px-4 py-3 rounded-lg font-sans text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-brand-surface border-t border-brand-primary/10 p-6 flex justify-end gap-4">
              <button
                onClick={handleDiscardClick}
                className="px-6 py-3 rounded-lg border border-brand-danger/30 text-brand-danger font-mono text-xs tracking-widest flex items-center gap-2 hover:bg-brand-danger/10 transition-all"
              >
                <Trash2 className="w-4 h-4" /> DISCARD
              </button>
              <button
                onClick={handleSaveClick}
                className="cyber-button px-8 py-3 flex items-center gap-2 font-mono text-xs tracking-widest"
              >
                <Save className="w-4 h-4" /> SAVE CHANGES
              </button>
            </div>
          </motion.div>

          {/* Save Confirmation */}
          <ConfirmModal
            isOpen={showSaveConfirm}
            onConfirm={confirmSave}
            onCancel={() => setShowSaveConfirm(false)}
            title="Save Changes?"
            message="Your updated profile details will be saved and applied immediately across all linked services."
            confirmLabel="CONFIRM SAVE"
            confirmColor="bg-brand-primary"
          />

          {/* Discard Confirmation */}
          <ConfirmModal
            isOpen={showDiscardConfirm}
            onConfirm={confirmDiscard}
            onCancel={() => setShowDiscardConfirm(false)}
            title="Discard Changes?"
            message="All unsaved modifications will be permanently lost. This action cannot be undone."
            confirmLabel="DISCARD"
            confirmColor="bg-brand-danger"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Tip Card ── */
const TipCard = ({ tip, delay }) => {
  const [expanded, setExpanded] = useState(false);
  const isActionNeeded = tip.status === 'action_needed';
  const colorClass = isActionNeeded ? 'text-brand-accent' : 'text-brand-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className={`cyber-panel overflow-hidden ${isActionNeeded ? 'border-brand-accent/30' : ''}`}>
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-brand-surface-light transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${isActionNeeded ? 'bg-brand-accent/10' : 'bg-brand-primary/10'}`}>
              <tip.icon className={`w-4 h-4 ${isActionNeeded ? 'text-brand-accent' : 'text-brand-primary'}`} />
            </div>
            <div>
              <h4 className="text-brand-text text-sm font-medium">{tip.title}</h4>
              <span className={`text-[9px] font-mono uppercase tracking-widest ${colorClass}`}>
                {isActionNeeded ? 'ACTION RECOMMENDED' : 'ENABLED & SECURE'}
              </span>
            </div>
          </div>
          <button className="text-brand-text-muted hover:text-brand-text transition-colors">
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
              <div className="p-4">
                <p className="text-xs text-brand-text-muted mb-3">{tip.description}</p>
                <button className={`px-4 py-2 rounded text-[10px] font-mono tracking-widest font-bold transition-colors ${
                  isActionNeeded ? 'bg-brand-accent text-brand-bg' : 'border border-brand-primary text-brand-primary hover:bg-brand-primary/10'
                }`}>
                  {tip.action}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const TIP_CARDS = [
  { id: 1, title: 'Enable Biometric Authentication', icon: Smartphone, status: 'enabled', description: 'Use FaceID or Fingerprint to authorize high-value transactions.', action: 'MANAGE SETTINGS' },
  { id: 2, title: 'Set Transaction Limits', icon: Lock, status: 'action_needed', description: 'You have not set a daily UPI limit. Setting a limit prevents large unauthorized transfers.', action: 'SET LIMIT NOW' },
];

const TIERS = {
  bronze: { name: 'Bronze Shield', min: 0, max: 40, color: 'text-brand-danger', bg: 'bg-brand-danger/10 border-brand-danger/30' },
  silver: { name: 'Silver Shield', min: 41, max: 70, color: 'text-brand-warning', bg: 'bg-brand-warning/10 border-brand-warning/30' },
  gold: { name: 'Gold Shield', min: 71, max: 90, color: 'text-brand-accent', bg: 'bg-brand-accent/15 border-brand-accent/30' },
  guardian: { name: 'Setu Guardian', min: 91, max: 100, color: 'text-brand-primary', bg: 'bg-brand-primary/15 border-brand-primary/30' }
};

const getTier = (score) => {
  if (score >= 91) return { ...TIERS.guardian, key: 'guardian' };
  if (score >= 71) return { ...TIERS.gold, key: 'gold' };
  if (score >= 41) return { ...TIERS.silver, key: 'silver' };
  return { ...TIERS.bronze, key: 'bronze' };
};

/* ── Main Profile Component ── */
const Profile = () => {
  const { safetyScore, checkedMessages, transactions, activeThreats, activeAnomalies } = useSecurity();

  const activeTier = getTier(safetyScore);
  const [currentTierKey, setCurrentTierKey] = useState(activeTier.key);
  const [playLevelUp, setPlayLevelUp] = useState(false);

  useEffect(() => {
    const calculatedTier = getTier(safetyScore);
    if (calculatedTier.key !== currentTierKey) {
      setCurrentTierKey(calculatedTier.key);
      // Play brief pulse animation on tier upgrade/change
      setPlayLevelUp(true);
      const timer = setTimeout(() => setPlayLevelUp(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [safetyScore, currentTierKey]);

  const [profileData, setProfileData] = useState({
    fullName: 'Raj Kumar',
    phone: '+91 98765 43210',
    email: 'raj.kumar@example.com',
    location: 'Mumbai, India',
    panNumber: 'ABCPK1234A',
    aadhaar: 'XXXX-XXXX-7890',
  });
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Accounts state management
  const [accounts, setAccounts] = useState([
    { id: 1, bankName: 'IDBI Bank', nickname: 'IDBI Bank Savings', number: 'XXXX-XXXX-XXXX-3456', isPrimary: true },
    { id: 2, bankName: 'HDFC', nickname: 'HDFC Current', number: 'XXXX-XXXX-XXXX-9921', isPrimary: false }
  ]);
  
  // Account dialog states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountType, setNewAccountType] = useState('savings');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newIfscCode, setNewIfscCode] = useState('');

  // Confirmation / success popups
  const [showConfirmSaveAccount, setShowConfirmSaveAccount] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleSave = (updatedData) => {
    setProfileData(updatedData);
  };

  const handleSaveAccountConfirm = () => {
    const last4 = newAccountNumber.slice(-4);
    const maskedNumber = `XXXX-XXXX-XXXX-${last4 || '9999'}`;
    const newAcc = {
      id: Date.now(),
      bankName: newBankName || 'Unknown Bank',
      nickname: `${newBankName || 'Unknown Bank'} ${newAccountType === 'savings' ? 'Savings' : 'Current'}`,
      number: maskedNumber,
      isPrimary: false
    };
    setAccounts(prev => [...prev, newAcc]);
    
    // Close dialogues
    setShowConfirmSaveAccount(false);
    setIsAddAccountOpen(false);

    // Trigger Success Green Tick Overlay
    setShowSuccessOverlay(true);
    setTimeout(() => setShowSuccessOverlay(false), 2500);

    // Reset inputs
    setNewBankName('');
    setNewAccountNumber('');
    setNewIfscCode('');
    setNewAccountType('savings');
  };


  // Determine Risk Category based on score
  const getSecurityStatus = () => {
    if (safetyScore >= 90) return { label: 'Elite Protection', color: 'text-brand-primary' };
    if (safetyScore >= 70) return { label: 'Moderate Protection', color: 'text-brand-accent' };
    return { label: 'Vulnerable Perimeter', color: 'text-brand-danger' };
  };

  const statusObj = getSecurityStatus();

  return (
    <div className="space-y-8 pb-10 max-w-6xl">
      <header className="mb-4">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-brand-text mb-2">My Profile</h1>
        <p className="text-brand-text-muted text-sm">Manage your personal information and account security.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Personal Info + Accounts */}
        <div className="lg:col-span-3 space-y-6">

          {/* Personal Details Card */}
          <div className="cyber-panel p-6 md:p-8">
            <div className="flex justify-between items-start mb-8">
              <h3 className="font-mono text-[10px] tracking-widest text-brand-text-muted uppercase flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Personal Details
              </h3>
              <button
                onClick={() => setIsEditOpen(true)}
                className="text-brand-primary hover:text-brand-text flex items-center gap-1.5 text-xs font-mono tracking-widest transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-2 border-brand-primary/50 overflow-hidden bg-brand-bg p-0.5">
                  <img
                    src="https://api.dicebear.com/9.x/notionists/svg?seed=RajKumar&backgroundColor=0A1512"
                    alt="Profile Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                  <Edit3 className="w-3 h-3 text-brand-bg" />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 flex-1 w-full">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-brand-text-muted mb-1 flex items-center gap-1.5"><User className="w-3 h-3" /> Full Name</div>
                  <div className="text-brand-text font-medium text-lg">{profileData.fullName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-brand-text-muted mb-1 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</div>
                  <div className="text-brand-text font-medium text-lg">{profileData.phone}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-brand-text-muted mb-1 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</div>
                  <div className="text-brand-text font-medium">{profileData.email}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-brand-text-muted mb-1 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Location</div>
                  <div className="text-brand-text font-medium">{profileData.location}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Accounts */}
          <div className="cyber-panel p-6 md:p-8">
            <h3 className="font-mono text-[10px] tracking-widest text-brand-text-muted uppercase flex items-center gap-2 mb-6">
              <CreditCard className="w-3.5 h-3.5" /> Linked Accounts
            </h3>

            <div className="space-y-4">
              {accounts.map(acc => (
                <div 
                  key={acc.id} 
                  className={`p-4 rounded-lg border flex items-center justify-between hover:border-brand-primary/50 transition-colors ${
                    acc.isPrimary 
                      ? 'border-brand-primary/30 bg-brand-primary/5' 
                      : 'border-brand-primary/10 bg-brand-bg/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-bg border border-brand-primary/20 flex items-center justify-center">
                      <span className={`font-display font-bold text-sm ${acc.isPrimary ? 'text-brand-primary' : 'text-brand-text-muted'}`}>
                        {acc.bankName.substring(0, 4).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-brand-text font-medium">{acc.nickname}</h4>
                      <div className="text-[10px] font-mono text-brand-text-muted tracking-widest">{acc.number}</div>
                    </div>
                  </div>
                  {acc.isPrimary && (
                    <span className="px-2.5 py-1 rounded text-[9px] font-mono tracking-widest bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                      Primary
                    </span>
                  )}
                </div>
              ))}

              <button 
                onClick={() => setIsAddAccountOpen(true)}
                className="w-full p-4 rounded-lg border border-dashed border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/50 transition-all flex justify-center items-center gap-2 text-sm font-mono tracking-widest"
              >
                + Add New Account
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Security Score + Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Score */}
          <div className="cyber-panel p-6 flex flex-col items-center justify-center min-h-[320px]">
            <h3 className="font-mono text-[10px] tracking-widest text-brand-text-muted uppercase w-full mb-6 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Security Score
            </h3>
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(117,230,204,0.1)" strokeWidth="7" />
                <motion.circle
                  key={safetyScore}
                  cx="50" cy="50" r="42" fill="none"
                  stroke={safetyScore >= 90 ? "var(--color-brand-primary)" : safetyScore >= 70 ? "var(--color-brand-accent)" : "var(--color-brand-danger)"}
                  strokeWidth="7" strokeLinecap="round"
                  strokeDasharray="264"
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 * (1 - safetyScore / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ filter: safetyScore >= 90 ? 'drop-shadow(0 0 6px rgba(117,230,204,0.5))' : safetyScore >= 70 ? 'drop-shadow(0 0 6px rgba(229,135,102,0.5))' : 'drop-shadow(0 0 6px rgba(240,85,91,0.5))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-bold text-5xl text-brand-text">
                  <CountUp value={safetyScore} />
                </div>
                <div className="font-mono text-[9px] tracking-widest text-brand-accent uppercase mt-1">SAFETY SCORE</div>
                
                {/* Score Tier Badge */}
                <motion.div
                  animate={playLevelUp ? { scale: [1, 1.25, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className={`mt-2.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-mono font-bold tracking-wider uppercase ${activeTier.color} ${activeTier.bg}`}
                  style={{
                    boxShadow: playLevelUp ? `0 0 15px currentColor` : 'none'
                  }}
                >
                  {activeTier.key === 'bronze' && <Shield className="w-2.5 h-2.5 text-brand-danger" />}
                  {activeTier.key === 'silver' && <Shield className="w-2.5 h-2.5 text-brand-warning" />}
                  {activeTier.key === 'gold' && <ShieldCheck className="w-2.5 h-2.5 text-brand-accent" />}
                  {activeTier.key === 'guardian' && <ShieldCheck className="w-2.5 h-2.5 text-brand-primary animate-pulse" />}
                  <span>{activeTier.name}</span>
                </motion.div>
              </div>

            </div>
            <div className="text-center w-full">
              <div className={`text-sm font-semibold mb-1 ${statusObj.color}`}>
                Status: {statusObj.label}
              </div>
              
              {/* Dynamic Breakdown */}
              <div className="w-full mt-6 border-t border-brand-primary/10 pt-4 space-y-2 text-left font-mono text-[10px] text-brand-text-muted">
                <div className="text-brand-primary uppercase tracking-widest mb-1">// SCORE RESOLUTION LOG</div>
                <div className="flex justify-between">
                  <span>Base Security Baseline</span>
                  <span className="text-brand-primary">+78</span>
                </div>
                <div className="flex justify-between">
                  <span>SMS Audits Checked ({checkedMessages.length})</span>
                  <span className="text-brand-success">+{checkedMessages.length * 0.5}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verdicts Blocked/Flagged</span>
                  <span className="text-brand-success">
                    +{checkedMessages.filter(m => m.verdict === 'scam').length * 2.0 + checkedMessages.filter(m => m.verdict === 'suspicious').length * 1.0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Simulated Ledger Streams</span>
                  <span className="text-brand-success">+{Math.max(0, transactions.length - 2) * 0.2}</span>
                </div>
                <div className="flex justify-between text-brand-danger">
                  <span>Active Session Threats</span>
                  <span>-{(activeThreats * 1.5 + activeAnomalies * 2.0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="font-mono text-[10px] tracking-widest text-brand-text-muted uppercase mb-4 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" /> Recommendations
            </h3>
            <div className="space-y-3">
              {TIP_CARDS.map((tip, i) => (
                <TipCard key={tip.id} tip={tip} delay={0.2 + i * 0.1} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profileData={profileData}
        onSave={handleSave}
      />

      {/* Add New Linked Account Dialog */}
      <AnimatePresence>
        {isAddAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddAccountOpen(false)}
              className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md cyber-panel bg-[#141D1A]/95 backdrop-blur-md border border-brand-primary/30 p-8 shadow-2xl overflow-y-auto max-h-[90vh] z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-brand-text">Linked Accounts</h2>
                  <p className="text-[10px] font-mono tracking-widest text-brand-text-muted mt-1 uppercase">ADD BANK ACCOUNT</p>
                </div>
                <button 
                  onClick={() => setIsAddAccountOpen(false)}
                  className="p-1 rounded border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowConfirmSaveAccount(true);
                }} 
                className="space-y-5"
              >
                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">BANK NAME</label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="e.g. IDBI Bank, State Bank of India"
                    className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">ACCOUNT TYPE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['savings', 'current'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAccountType(type)}
                        className={`py-2.5 rounded border font-mono text-[10px] tracking-wider uppercase transition-all ${
                          newAccountType === type
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'border-brand-primary/10 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/30'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{9,18}"
                    title="Account number should be 9 to 18 digits"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder="e.g. 987654321012"
                    className="cyber-input w-full px-4 py-3 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-2 block">IFSC CODE</label>
                  <input
                    type="text"
                    required
                    pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                    title="IFSC should be 11 characters (e.g. IBKL0000123)"
                    value={newIfscCode}
                    onChange={(e) => setNewIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. IBKL0000123"
                    className="cyber-input w-full px-4 py-3 rounded font-mono text-xs uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-brand-primary/10">
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(false)}
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

      {/* Save Account Confirmation Dialog */}
      <ConfirmModal
        isOpen={showConfirmSaveAccount}
        onConfirm={handleSaveAccountConfirm}
        onCancel={() => setShowConfirmSaveAccount(false)}
        title="Link New Account?"
        message="Are you sure you want to securely register and link this bank account to your SuRakshaSetu profile?"
        confirmLabel="CONFIRM"
        confirmColor="bg-brand-primary"
      />

      {/* Success Green Tick Popup Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="cyber-panel p-8 max-w-sm w-full bg-[#141D1A] border border-brand-primary/45 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_40px_rgba(117,230,204,0.15)] relative"
            >
              {/* Corner decorations for consistent cyber styling */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-primary/30 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-brand-primary/30 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-primary/30 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-brand-primary/30 rounded-br" />

              <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary flex items-center justify-center text-brand-primary relative">
                <CheckCircle className="w-8 h-8" />
                <span className="absolute inset-0 rounded-full border border-brand-primary/30 animate-ping opacity-75" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-2xl text-brand-text">SUCCESS</h3>
                <p className="text-xs font-mono text-brand-primary mt-1 tracking-wider uppercase">Account Added Successfully</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default Profile;
