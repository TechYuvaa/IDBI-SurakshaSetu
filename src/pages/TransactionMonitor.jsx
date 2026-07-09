import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, PlusCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from '../components/CountUp';
import { useSecurity } from '../context/SecurityContext';

// ─────────────────────────────────────────────────────────────────────────────
// Client-side transaction risk engine — no API, no backend required
// ─────────────────────────────────────────────────────────────────────────────
const analyzeTransaction = (tx) => {
  const reasons = [];
  let score = 0;

  // Rule 1: High value transaction
  if (tx.amountVal >= 500000) {
    score += 25;
    reasons.push(`High-value transfer: ₹${tx.amountVal.toLocaleString('en-IN')} exceeds standard monitoring threshold`);
  } else if (tx.amountVal >= 100000) {
    score += 10;
    reasons.push('Large transaction amount flagged for review');
  }

  // Rule 2: Unusual hour (11pm–4am)
  const hour = new Date(tx.timestamp).getHours();
  if (hour >= 23 || hour <= 4) {
    score += 30;
    reasons.push(`Off-hours transaction at ${hour}:00 — unusual banking activity window`);
  }

  // Rule 3: Unknown / suspicious device
  if (/unknown|linux|unrecognised/i.test(tx.device)) {
    score += 30;
    reasons.push('Transaction initiated from an unrecognised or suspicious device');
  }

  // Rule 4: Suspicious beneficiary keywords
  if (/crypto|wallet|exchange|casino|betting|foreign|intl/i.test(tx.beneficiary)) {
    score += 25;
    reasons.push('Beneficiary name associated with high-risk category (crypto/gambling/international)');
  }

  // Determine risk level
  let status, riskScore, flagReasons;
  if (score >= 55) {
    status = 'highrisk';
    riskScore = Math.min(98, 55 + score * 0.4);
    flagReasons = reasons.length > 0 ? reasons : ['Multiple anomaly signals detected simultaneously'];
  } else if (score >= 25) {
    status = 'medium';
    riskScore = Math.min(55, 25 + score * 0.5);
    flagReasons = reasons.length > 0 ? reasons : ['Moderate risk pattern — within acceptable range'];
  } else {
    status = 'safe';
    riskScore = Math.max(2, score * 0.5);
    flagReasons = ['Transaction parameters within normal operating bounds'];
  }

  return {
    status,
    riskScore: Math.round(riskScore),
    reasons: flagReasons,
  };
};


const StatBlock = ({ label, value, highlight = false, isNumeric = false }) => (
  <div className="cyber-panel p-5 flex flex-col justify-between h-28">
    <div className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase">{label}</div>
    <div className={`font-mono text-2xl font-bold ${highlight ? 'text-brand-accent' : 'text-brand-primary'}`}>
      {isNumeric ? <CountUp value={value} /> : value}
    </div>
  </div>
);

const TransactionRow = ({ tx, isNew }) => {
  const [expanded, setExpanded] = useState(false);
  const isHighRisk = tx.status === 'highrisk';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      // Entrance glow flash that fades over 2 seconds if the item is simulated/new
      animate={isNew ? {
        opacity: 1, 
        y: 0, 
        scale: 1,
        borderColor: ["rgba(117, 230, 204, 0.15)", isHighRisk ? "#F47C7C" : "#75E6CC", "rgba(117, 230, 204, 0.15)"],
        boxShadow: [
          "0 0 0px rgba(0,0,0,0)", 
          isHighRisk ? "0 0 15px rgba(244, 124, 124, 0.3)" : "0 0 15px rgba(117, 230, 204, 0.3)", 
          "0 0 0px rgba(0,0,0,0)"
        ]
      } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: isNew ? 2 : 0.35 }}
      layout
      className="cyber-panel overflow-hidden mb-4"
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-brand-surface-light transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded flex items-center justify-center border ${
            isHighRisk 
              ? 'bg-brand-danger-bg border-brand-danger/30 text-brand-danger' 
              : 'bg-brand-success-bg border-brand-primary/30 text-brand-primary'
          }`}>
            {isHighRisk ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm tracking-widest">{tx.id}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-bold border ${
                isHighRisk 
                  ? 'bg-brand-danger-bg text-brand-danger border-brand-danger/50' 
                  : 'bg-brand-success-bg text-brand-primary border-brand-primary/50'
              }`}>
                {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
              </span>
            </div>
            <div className="text-xs text-brand-text-muted">
              {tx.type} <span className="text-brand-text font-medium">{tx.beneficiary}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="font-mono text-xl font-bold mb-1">{tx.amount}</div>
            <div className="text-[9px] font-mono text-brand-text-muted tracking-widest uppercase">{tx.time}</div>
          </div>
          <button className="text-brand-text-muted hover:text-brand-text focus:outline-none">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-brand-primary/10 bg-brand-bg/40 font-mono text-[11px] text-brand-text-muted"
          >
            <div className="p-5 space-y-2">
              <div className="text-brand-primary">// NEURAL GUARD CORRELATION AUDIT</div>
              {tx.reasons && tx.reasons.map((reason, idx) => (
                <div key={idx} className={isHighRisk ? "text-brand-danger" : "text-brand-primary"}>
                  &gt;&gt; {reason}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TransactionMonitor = () => {
  const { 
    transactions, 
    totalFlow, 
    threatsBlocked, 
    activeAnomalies, 
    analyzedCount, 
    newlySimulatedIds, 
    addTransaction 
  } = useSecurity();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSimulateTransaction = async () => {
    setIsLoading(true);
    setErrorMsg('');

    // Randomize incoming details
    const isThreat = Math.random() > 0.6;
    const rawAmount = Math.floor(Math.random() * 85000) + 1500;
    const formattedAmount = `₹${rawAmount.toLocaleString('en-IN')}.00`;
    const txId = `TXN_${Math.floor(100000 + Math.random() * 900000)}_${isThreat ? 'X' : 'L'}`;
    
    const threatBeneficiaries = ['CRYPTO_LOCK_LIQUIDITY', 'ANONYMOUS_P2P_HACK', 'SUSPICIOUS_FOREIGN_REMIT', 'RUSSIA_NODAL_P2P'];
    const safeBeneficiaries = ['Airtel Payment', 'Amazon Online India', 'Zomato Food Delivery', 'Petrol Pump POS', 'Electricity Board'];
    const devices = ['Primary Device', 'iPhone 16 Pro', 'MacBook Air Node', 'Unknown Device (Linux/IP)'];

    const beneficiary = isThreat 
      ? threatBeneficiaries[Math.floor(Math.random() * threatBeneficiaries.length)]
      : safeBeneficiaries[Math.floor(Math.random() * safeBeneficiaries.length)];

    const device = isThreat 
      ? devices[3] // Unknown Device
      : devices[Math.floor(Math.random() * 3)]; // Normal devices

    const hour = isThreat 
      ? [1, 2, 3, 4][Math.floor(Math.random() * 4)] // Night hours
      : [9, 11, 14, 16, 19][Math.floor(Math.random() * 5)]; // Day hours

    // Build timestamp corresponding to that hour
    const d = new Date();
    d.setHours(hour);

    const newTx = {
      id: txId,
      amount: formattedAmount,
      amountVal: rawAmount,
      beneficiary,
      device,
      type: isThreat ? 'Transfer to' : 'Payment to',
      time: `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | TODAY`,
      timestamp: d.toISOString()
    };

    // Client-side risk analysis — no API call needed
    const data = analyzeTransaction(newTx);

    setTimeout(() => {
      addTransaction(newTx, data);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="pb-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-primary">Transaction Stream</h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
          </div>
          <p className="text-brand-text-muted text-sm leading-relaxed">
            Real-time heuristic analysis of incoming financial packets. Automated risk scoring applied via Neural Guard protocol.
          </p>
        </div>
        
        <button 
          onClick={handleSimulateTransaction}
          disabled={isLoading}
          className="cyber-button px-6 py-4 flex items-center gap-3 shrink-0 focus:ring-1 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-brand-bg animate-spin" />
          ) : (
            <PlusCircle className="w-4 h-4 text-brand-bg" />
          )}
          <div className="text-left leading-tight text-xs">
            {isLoading ? 'ANALYZING PACKET...' : 'SIMULATE INCOMING'}<br/>
            {isLoading ? 'PLEASE WAIT' : 'TRANSACTION'}
          </div>
        </button>
      </header>

      {/* Real-time ticker count info */}
      <div className="mb-6 flex justify-between items-center text-[10px] font-mono tracking-widest text-brand-text-muted uppercase">
        <span>Active Audit Ledger</span>
        <span>Transactions Analyzed Today: <span className="text-brand-primary font-bold"><CountUp value={analyzedCount} /></span></span>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-6 p-4 border border-brand-danger/30 bg-brand-danger-bg text-brand-danger rounded text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Total Flow" value={`₹${totalFlow.toLocaleString('en-IN')}`} />
        <StatBlock label="Threats Blocked" value={threatsBlocked} isNumeric />
        <StatBlock label="Active Anomalies" value={activeAnomalies} highlight isNumeric />
        <StatBlock label="Neural Confidence" value="99.8%" />
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {transactions.map(tx => (
            <TransactionRow 
              key={tx.id} 
              tx={tx} 
              isNew={newlySimulatedIds.has(tx.id)} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TransactionMonitor;
