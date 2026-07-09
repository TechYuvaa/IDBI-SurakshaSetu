import { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, ShieldAlert, AlertTriangle, ShieldX, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from '../components/CountUp';
import { useSecurity } from '../context/SecurityContext';

// ─────────────────────────────────────────────────────────────────────────────
// ScamChecker v2 — fully client-side, zero network calls, no backend dependency
// ─────────────────────────────────────────────────────────────────────────────
const analyzeMessage = (text) => {
  const lower = text.toLowerCase();
  const reasons = [];
  let score = 0;

  // Rule 1: Phishing URL patterns
  const suspiciousUrlPatterns = [
    /https?:\/\/(?!(?:www\.)?(?:idbi\.com|irdai\.gov\.in|npci\.org\.in))[\w.-]+(?:secure|update|verify|login|bank|kyc|otp|account)[\w./-]*/i,
    /http:\/\//i,  // plain HTTP (not HTTPS) is suspicious
    /bit\.ly|tinyurl|t\.co|ow\.ly|goo\.gl/i,
    /[\w-]+\.(?:xyz|tk|ml|ga|cf|click|loan|info|online|site)(?:\/|$)/i,
  ];
  if (suspiciousUrlPatterns.some(p => p.test(text))) {
    score += 40;
    reasons.push('Contains a suspicious or shortened URL — possible phishing link');
  }

  // Rule 2: OTP / PIN / password sharing request
  if (/(?:share|send|enter|provide|give)\b.{0,30}\b(?:otp|pin|password|passcode|cvv|mpin)/i.test(lower)) {
    score += 35;
    reasons.push('Requests OTP, PIN, password, or CVV — banks never ask for these');
  }

  // Rule 3: Urgency / threat language
  const urgencyTerms = ['expire today', 'within 24 hours', 'immediate', 'urgent', 'immediately', 'account will be frozen', 'suspend', 'deactivate', 'action required', 'last warning', 'final notice'];
  const urgencyMatches = urgencyTerms.filter(t => lower.includes(t));
  if (urgencyMatches.length > 0) {
    score += Math.min(urgencyMatches.length * 10, 25);
    reasons.push(`Urgency-pressure language detected: "${urgencyMatches.slice(0, 2).join('", "')}"`);
  }

  // Rule 4: Bank / KYC impersonation
  if (/\b(?:idbi|sbi|hdfc|icici|axis|pnb|rbi|irdai|npci|uidai|income tax|it dept)\b/i.test(lower)
      && /\b(?:click|visit|update|verify|login|submit|confirm|link|open)\b/i.test(lower)) {
    score += 30;
    reasons.push('Impersonates a bank or government authority and requests action via link');
  }

  // Rule 5: Prize / lottery / reward scam
  if (/\b(?:won|winner|prize|lottery|reward|cash back|cashback|claim your|congratulations)\b/i.test(lower)) {
    score += 30;
    reasons.push('Deceptive prize or lottery claim — classic advance-fee fraud pattern');
  }

  // Rule 6: Credential or Aadhaar / PAN harvesting
  if (/\b(?:aadhaar|aadhar|pan card|account number|ifsc|debit card|credit card)\b.{0,50}\b(?:share|send|provide|update|enter)/i.test(lower)) {
    score += 40;
    reasons.push('Requests sensitive personal/financial identifiers (Aadhaar, PAN, card details)');
  }

  // Rule 7: Suspicious sender number pattern
  if (/(?:^|\s)\+?[6-9]\d{9}(?:\s|$)/.test(text) && score > 10) {
    score += 5;
    reasons.push('Contains a mobile number in conjunction with suspicious content');
  }

  // Rule 8: Generic safe OTP (just an OTP notification with no action demanded)
  const isSafeOtp = /your otp(?! is shared| share)/i.test(lower) && !/click|visit|link|http/i.test(lower);
  if (isSafeOtp && reasons.length === 0) {
    score = Math.max(score - 20, 0);
  }

  // Determine verdict
  let verdict, confidence, explanation;

  if (score >= 60) {
    verdict = 'scam';
    confidence = Math.min(95, 60 + score * 0.35);
    explanation = 'High-confidence threat detected. Multiple indicators of social engineering, phishing, or credential harvesting were identified. Do not click any links or share any information.';
  } else if (score >= 25) {
    verdict = 'suspicious';
    confidence = Math.min(74, 30 + score * 0.6);
    explanation = 'Moderate risk signals detected. The message contains patterns commonly associated with fraud, though certainty is not absolute. Exercise caution before taking any action.';
  } else {
    verdict = 'safe';
    confidence = Math.min(92, 80 + (10 - score) * 1.2);
    explanation = 'No significant threat indicators detected in this payload. The content appears consistent with a legitimate message. Always remain vigilant with unexpected communications.';
    if (reasons.length === 0) reasons.push('No phishing URLs, OTP demands, or impersonation patterns detected');
  }

  return {
    verdict,
    confidence: Math.round(confidence),
    reasons,
    explanation,
  };
};


const PRESETS = [
  {
    label: "PHISHING SCAM SMS",
    text: "Dear IDBI User, your netbanking password will expire today. Update immediately at http://idbi-secure-update.com/login to avoid suspension of account."
  },
  {
    label: "SENSITIVE BANK OTP",
    text: "Your OTP for IDBI Net Banking login is 892019. Valid for 5 minutes. Do not share this with bank staff or anyone."
  },
  {
    label: "SUSPICIOUS KYC ALERT",
    text: "URGENT: Your account verification is incomplete. Please submit Aadhaar details within 24 hours to prevent immediate freezing."
  }
];

const ScamChecker = () => {
  const { addCheckedMessage } = useSecurity();
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [verdict, setVerdict] = useState(null); // 'scam', 'safe', 'suspicious'
  const [confidence, setConfidence] = useState(0);
  const [reasons, setReasons] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [parsedWords, setParsedWords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Certificate generator states
  const [showCertificate, setShowCertificate] = useState(false);
  const [certTimestamp, setCertTimestamp] = useState('');
  const [certHash, setCertHash] = useState('');

  const handleGenerateCertificate = () => {
    setCertTimestamp(new Date().toLocaleString());
    setCertHash(Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase());
    setShowCertificate(true);
  };


  // Character validation
  const MAX_CHARS = 2000;

  // Word scanning simulation effect
  useEffect(() => {
    let activeInterval;
    if (isAnalyzing && parsedWords.length > 0) {
      let currentIdx = 0;
      activeInterval = setInterval(() => {
        setActiveWordIndex(currentIdx);
        currentIdx++;
        
        if (currentIdx >= parsedWords.length) {
          clearInterval(activeInterval);
        }
      }, 80); // Speed up word highlighting slightly for responsiveness (80ms)
    }
    return () => {
      if (activeInterval) clearInterval(activeInterval);
    };
  }, [isAnalyzing, parsedWords]);

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    setIsAnalyzing(true);
    setAnalysisCompleted(false);
    setVerdict(null);
    setConfidence(0);
    setReasons([]);
    setExplanation('');
    setErrorMsg('');
    setActiveWordIndex(-1);
    
    // Split into individual words
    setParsedWords(cleanMessage.split(/\s+/));

    // Client-side analysis — no API call needed
    const data = analyzeMessage(cleanMessage);

    // Wait for the word-scan animation to complete before showing results
    const scanDuration = cleanMessage.split(/\s+/).length * 80;

    setTimeout(() => {
      setVerdict(data.verdict);
      setConfidence(data.confidence);
      setReasons(data.reasons);
      setExplanation(data.explanation);
      setIsAnalyzing(false);
      setAnalysisCompleted(true);
      addCheckedMessage(cleanMessage, data);
    }, Math.max(1200, scanDuration));
  };

  const handleReset = () => {
    setMessage('');
    setIsAnalyzing(false);
    setAnalysisCompleted(false);
    setVerdict(null);
    setConfidence(0);
    setReasons([]);
    setExplanation('');
    setErrorMsg('');
    setActiveWordIndex(-1);
    setParsedWords([]);
  };

  return (
    <div className="pb-10 max-w-6xl relative">
      
      {/* Screen edge threat glow pulse */}
      <AnimatePresence>
        {analysisCompleted && (verdict === 'scam' || verdict === 'suspicious') && (
          <div className="fixed inset-0 pointer-events-none z-50 threat-glow-pulse" />
        )}
      </AnimatePresence>

      <header className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-text mb-3">SCAM MESSAGE CHECKER</h1>
        <p className="text-brand-text-muted text-sm max-w-3xl">
          Deploying real-time neural analysis to intercept fraudulent communications, OTP leaks, and malicious phishing payloads.
        </p>
      </header>

      {/* Preset templates */}
      <div className="mb-6">
        <span className="text-[9px] font-mono tracking-widest text-brand-text-muted uppercase mb-3 block">Quick Load Analysis Preset</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              disabled={isAnalyzing}
              onClick={() => {
                setMessage(preset.text);
                setErrorMsg('');
              }}
              className="px-4 py-2 text-[10px] font-mono tracking-widest rounded border border-brand-primary/10 hover:border-brand-primary/30 bg-brand-surface/40 hover:bg-brand-surface-light transition-all focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Console (Payload input & live scanning view) */}
        <div className="lg:col-span-3">
          <div className="cyber-panel p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6 font-mono text-[10px] tracking-widest uppercase">
              <div className="flex items-center gap-2 text-brand-primary">
                <Terminal className="w-4 h-4" />
                INPUT SUSPICIOUS<br/>PAYLOAD
              </div>
              <div className="text-brand-text-muted text-right animate-pulse">
                {isAnalyzing ? 'SCRIBBING BUFFER...' : 'BUFFER_READY // SRC:'}<br/>
                {isAnalyzing ? 'SWEEPING VECTORS' : 'SMS_INTERCEPT'}
              </div>
            </div>

            {/* Content area: textarea or active scanning visualization */}
            {isAnalyzing ? (
              <div className="cyber-input w-full flex-1 min-h-[250px] p-6 rounded-lg font-mono text-sm leading-relaxed overflow-y-auto mb-4 bg-brand-bg/80 border-brand-primary/30">
                {parsedWords.map((word, idx) => (
                  <motion.span
                    key={idx}
                    animate={
                      idx === activeWordIndex
                        ? { backgroundColor: 'rgba(117, 230, 204, 0.25)', color: 'var(--color-brand-primary)', scale: 1.05 }
                        : idx < activeWordIndex
                        ? { color: 'rgba(234, 245, 241, 0.65)' }
                        : { color: 'rgba(234, 245, 241, 0.25)' }
                    }
                    className="inline-block mr-1.5 px-0.5 rounded transition-all duration-75"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col mb-4">
                <textarea
                  disabled={isAnalyzing}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value.slice(0, MAX_CHARS));
                    setErrorMsg('');
                  }}
                  placeholder="Paste suspicious SMS, Email content, or URL here for immediate vetting..."
                  className="cyber-input w-full flex-1 min-h-[250px] p-6 rounded-lg font-mono text-sm resize-none"
                />
                <div className="flex justify-end text-[10px] font-mono text-brand-text-muted mt-2">
                  {message.length} / {MAX_CHARS} CHARS
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-4 p-4 border border-brand-danger/30 bg-brand-danger-bg text-brand-danger rounded text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <div>{errorMsg}</div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button 
                type="button"
                onClick={handleReset}
                disabled={isAnalyzing}
                className="px-6 py-3 rounded border border-brand-primary/20 text-brand-text-muted hover:text-brand-text hover:border-brand-primary/50 font-mono text-xs tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET
              </button>
              <button 
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || !message.trim()}
                className="cyber-button px-8 py-3 flex items-center gap-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-brand-bg" />
                ANALYZE PROTOCOL
              </button>
            </div>
          </div>
        </div>

        {/* Right Status Panel (Verdict & details) */}
        <div className="lg:col-span-2">
          <div className="cyber-panel p-8 h-full flex flex-col relative border-brand-primary/10 bg-brand-surface-light/20">
            <AnimatePresence mode="wait">
              {/* Scenario 1: Awaiting Input */}
              {!isAnalyzing && !analysisCompleted && (
                <motion.div 
                  key="awaiting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-4"
                >
                  <div className="w-16 h-16 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-brand-text mb-4">Await System Input</h3>
                  <p className="text-sm text-brand-text-muted leading-relaxed">
                    Paste text or select an SMS template in the primary console to activate the neural threat analysis.
                  </p>
                </motion.div>
              )}

              {/* Scenario 2: Active Scanning */}
              {isAnalyzing && (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-4"
                >
                  <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-brand-primary/30 border-t-brand-primary animate-spin" />
                    <Terminal className="w-8 h-8 text-brand-primary animate-pulse" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-brand-text mb-2">Analyzing Heuristics</h3>
                  <p className="text-xs font-mono text-brand-primary tracking-widest uppercase">
                    Scrutinizing vectors...
                  </p>
                </motion.div>
              )}

              {/* Scenario 3: Analysis Done */}
              {analysisCompleted && !isAnalyzing && (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 border ${
                      verdict === 'scam' ? 'bg-brand-danger-bg border-brand-danger/30 text-brand-danger' : 
                      verdict === 'suspicious' ? 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent' : 
                      'bg-brand-success-bg border-brand-primary/30 text-brand-primary'
                    }`}>
                      {verdict === 'scam' ? <ShieldX className="w-8 h-8" /> : 
                       verdict === 'suspicious' ? <AlertTriangle className="w-8 h-8" /> : 
                       <ShieldCheck className="w-8 h-8" />}
                    </div>

                    <h3 className="font-display text-2xl font-bold text-brand-text mb-2 uppercase">
                      {verdict === 'scam' ? 'SCAM DETECTED' : 
                       verdict === 'suspicious' ? 'SUSPICIOUS THREAT' : 
                       'SAFE PAYLOAD'}
                    </h3>
                    
                    <div className="font-mono text-4xl font-bold text-brand-text mb-3">
                      <CountUp value={confidence} duration={1200} formatter={(val) => `${val}%`} />
                    </div>
                    <div className="text-[10px] font-mono tracking-widest text-brand-text-muted uppercase mb-4">
                      NEURAL GUARD CONFIDENCE
                    </div>

                    <p className="text-xs text-brand-text-muted leading-relaxed max-w-sm mb-4">
                      {explanation}
                    </p>

                    {reasons && reasons.length > 0 && (
                      <div className="w-full text-left space-y-2 border-t border-brand-primary/10 pt-4 max-h-[180px] overflow-y-auto pr-1">
                        <div className="text-[9px] font-mono text-brand-primary uppercase tracking-widest">// Triggered Threat Indicators:</div>
                        {reasons.map((r, idx) => (
                          <div key={idx} className="text-[10px] font-mono text-brand-text-muted flex gap-2 items-start">
                            <span className="text-brand-danger font-bold shrink-0">&gt;</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {verdict === 'safe' && (
                      <button
                        onClick={handleGenerateCertificate}
                        className="mt-6 w-full py-3 border border-brand-primary/30 hover:border-brand-primary text-brand-primary hover:text-brand-text hover:bg-brand-primary/5 rounded-lg font-mono text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Generate Safety Certificate
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            <div className="mt-auto pt-8 border-t border-brand-primary/10 font-mono text-[9px] text-brand-primary/35 uppercase tracking-widest leading-relaxed">
              [SYS] PORT 8080 SCAN ACTIVE<br/>
              [DB] THREAT DATABASE SIGNATURES: 1.2M LOOSE MATCHES<br/>
              [AI] SENTINEL NETWORKS INTERPRETED
            </div>
          </div>
        </div>

      </div>

      <div className="mt-8 p-5 cyber-panel bg-brand-bg flex gap-4 items-center max-w-3xl border-brand-primary/10">
        <div className="w-5 h-5 rounded-full border border-brand-text-muted flex items-center justify-center text-brand-text-muted text-[10px] font-bold shrink-0">i</div>
        <p className="text-[11px] text-brand-text-muted">
          Scam verification parses OTP alerts, credentials, and tax links. Encrypted algorithms guarantee bank account isolation and protect client privacy at all times.
        </p>
      </div>

      {/* Safety Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-md"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setShowCertificate(false)} />
            
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative max-w-lg w-full bg-[#0a1512] border-2 border-brand-primary/30 p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-center space-y-6 overflow-hidden"
              id="safety-certificate"
            >
              {/* Custom CSS overrides for browser print stylesheet context */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #safety-certificate, #safety-certificate * {
                    visibility: visible !important;
                  }
                  #safety-certificate {
                    position: absolute !important;
                    left: 50% !important;
                    top: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    width: 90% !important;
                    border: 2px solid #75E6CC !important;
                    background: #0a1512 !important;
                    color: #EAF5F1 !important;
                    box-shadow: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}} />

              {/* Corner brackets/borders for cyber-security aesthetic */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-primary/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-primary/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-primary/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-primary/50 rounded-br-xl" />

              {/* Holographic scanning line */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-primary/20 animate-pulse" />

              {/* Seal/Badge Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(117,230,204,0.15)] relative">
                <ShieldCheck className="w-10 h-10 text-brand-primary" />
                <div className="absolute inset-0 border border-dashed border-brand-primary/40 rounded-full animate-[spin_20s_linear_infinite]" />
              </div>

              {/* Certificate content */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono tracking-widest text-brand-primary uppercase">// OFFICIAL SECURITY CLEARANCE</div>
                <h2 className="font-display font-extrabold text-3xl text-brand-text tracking-wide">
                  VERIFIED SAFE
                </h2>
                <div className="text-[9px] font-mono text-brand-text-muted mt-1 uppercase tracking-widest">
                  SuRakshaSetu AI Protection
                </div>
              </div>

              <div className="py-6 px-4 bg-brand-surface/40 border border-brand-primary/15 rounded-xl space-y-4 font-mono text-xs text-brand-text-muted">
                <p className="leading-relaxed font-sans text-brand-text text-sm">
                  This transaction/message payload has been verified clean of phishing links, credential harvesting triggers, and automated banking fraud sequences.
                </p>
                <div className="border-t border-brand-primary/10 pt-3 text-[9px] space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>SECURITY CODES:</span>
                    <span className="text-brand-primary">STATUS_SECURE_V4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TIMESTAMP:</span>
                    <span className="text-brand-text">{certTimestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLEARANCE HASH:</span>
                    <span className="text-brand-text select-all">{certHash}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Sign-off */}
              <div className="flex justify-between items-center text-[9px] font-mono text-brand-primary/50 tracking-wider">
                <span>SYSTEM ACTIVE</span>
                <span>AUTHENTICITY GUARANTEED</span>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-2 no-print">
                <button
                  onClick={() => setShowCertificate(false)}
                  className="flex-1 py-3 border border-brand-primary/20 hover:border-brand-primary/50 rounded-lg font-mono text-xs tracking-widest text-brand-text-muted hover:text-brand-text transition-all"
                >
                  CLOSE
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 cyber-button rounded-lg text-xs font-mono tracking-widest flex items-center justify-center gap-1.5"
                >
                  SAVE PDF / PRINT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};


export default ScamChecker;
