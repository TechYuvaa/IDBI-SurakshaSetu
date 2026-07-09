import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldX, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  BookOpen,
  Info
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { Link } from 'react-router-dom';

// Section 1: Scam Case File Definitions
const SCAM_CASE_FILES = [
  {
    id: 'kyc',
    name: 'Fake KYC Update',
    teaser: 'Scammers claim your account or debit card is suspended due to missing PAN/Aadhaar details.',
    description: 'Fraudsters send spoofed SMS alerts (looking like bank handles) prompting you to click a link to complete KYC. The link leads to a phishing portal mimicking IDBI Netbanking to harvest login PINs, OTPs, and passwords.',
    flags: [
      'Links containing unusual domains (e.g., .net, .in/verify, shortlinks)',
      'Threats of immediate account freezing within 24 hours',
      'Requests for full password or debit card CVV verification'
    ],
    severity: 'High Risk',
    prevalence: 'Very Common'
  },
  {
    id: 'loan',
    name: 'Loan App Blackmail',
    teaser: 'Instant loan apps offer fast approvals, then harvest contact books to threaten borrowers.',
    description: 'Malicious mobile applications offer collateral-free loans instantly. Upon installation, they secretly clone your entire contact list and gallery, using morphed photos to threaten and blackmail you and your relatives for exorbitant repayments.',
    flags: [
      'Apps demanding access to contacts and gallery before approval',
      'Unreasonable interest rates and processing fees deducted upfront',
      'Threats and abusive calls from unknown WhatsApp numbers'
    ],
    severity: 'Critical Threat',
    prevalence: 'Rising Trend'
  },
  {
    id: 'upi',
    name: 'UPI QR Code Scams',
    teaser: 'Victims scan QR codes believing they are receiving money, only to have funds debited.',
    description: 'Scammers pose as online buyers or lottery coordinators and send you a QR code, stating that scanning it is required to "receive" the payment. Scanning a QR code always debits money from your UPI app, never deposits it.',
    flags: [
      'Being asked to enter your UPI PIN to receive money',
      'Codes sent via private WhatsApp chats to speed up transactions',
      'Unsolicited payment requests showing up on Google Pay/PhonePe'
    ],
    severity: 'Moderate Risk',
    prevalence: 'Very Common'
  },
  {
    id: 'job',
    name: 'Fake Bank Job Offers',
    teaser: 'Job portals spoof bank HR departments and demand security deposits or training fees.',
    description: 'Fake recruitment consultants contact candidates via email/SMS offering job placements at major banks. They conduct dummy phone interviews and issue fake offer letters, demanding security deposits or mandatory laptop training fees.',
    flags: [
      'Emails sent from free domains (e.g., @gmail.com) instead of @idbi.co.in',
      'Mandatory payments for training, registration, or document checks',
      'No official recruitment notification matching on the bank website'
    ],
    severity: 'High Risk',
    prevalence: 'Rising Trend'
  },
  {
    id: 'sim',
    name: 'SIM Swap Hijacking',
    teaser: 'Fraudsters clone your phone SIM card to hijack secure 2FA authentication alerts.',
    description: 'Scammers obtain your personal credentials through phishing, then request your telecom operator to issue a replacement SIM by posing as you. Once active, your original SIM loses network connection, and the fraudster receives all bank OTPs.',
    flags: [
      'Sudden, unexplained loss of network signal for several hours',
      'Unsolicited carrier messages regarding SIM swap requests',
      'Multiple missed calls from unknown international handles'
    ],
    severity: 'Critical Threat',
    prevalence: 'High Risk'
  },
  {
    id: 'arrest',
    name: 'Digital Arrest Scam',
    teaser: 'Impersonators posing as CBI or Custom officials put victims under fake virtual custody.',
    description: 'Scammers video call you via Skype posing as law enforcement (CBI, Customs, or Police). They claim your Aadhaar was linked to illegal drug parcels or money laundering, putting you under "digital arrest" on video until you transfer money.',
    flags: [
      'Police officers demanding Skype/WhatsApp video calls for statement recording',
      'Demands to keep the call secret and not inform family members',
      'Directives to transfer funds to a "government vault account" for clearance'
    ],
    severity: 'Critical Threat',
    prevalence: 'Rising Trend'
  }
];

// Interactive Case File Card Component
const CaseFileCard = ({ file, prefersReducedMotion }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      className={`cyber-panel p-6 cursor-pointer transition-all duration-300 ${
        isOpen ? 'border-brand-primary/45 bg-brand-surface-light/45' : 'hover:border-brand-primary/30 hover:bg-brand-surface-light/10'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded uppercase tracking-wider font-bold">
            {file.prevalence}
          </span>
          <h3 className="font-display font-bold text-xl text-brand-text mt-2">{file.name}</h3>
        </div>
        <span className={`text-[8px] font-mono px-2 py-0.5 border rounded uppercase font-bold ${
          file.severity.includes('Critical') ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger' : 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent'
        }`}>
          {file.severity}
        </span>
      </div>

      <p className="text-xs text-brand-text-muted mt-3 leading-relaxed">
        {file.teaser}
      </p>

      {/* Expandable Section */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-brand-primary/10 mt-4 pt-4 space-y-4"
          >
            <div className="space-y-1">
              <h4 className="text-[10px] font-mono text-brand-primary tracking-widest uppercase">// SCAM MECHANICS</h4>
              <p className="text-xs text-brand-text leading-relaxed">{file.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-mono text-brand-danger tracking-widest uppercase">// TRIGGER RED FLAGS</h4>
              <ul className="space-y-1">
                {file.flags.map((flag, idx) => (
                  <li key={idx} className="text-[11px] text-brand-text-muted flex gap-2 items-start font-mono">
                    <span className="text-brand-danger font-bold">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center text-[8px] font-mono text-brand-text-muted/40 uppercase mt-4 border-t border-brand-primary/5 pt-3">
        <span>CLICK TO {isOpen ? 'COLLAPSE' : 'EXPAND'}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>
    </div>
  );
};

// Reusable Local Safety Certificate Render Card
const SafetyCertificateCard = ({ cert }) => {
  const handlePrint = (e) => {
    e.stopPropagation();
    // Temporary printable wrapper
    const printFrame = document.createElement('div');
    printFrame.id = 'print-cert-wrapper';
    printFrame.innerHTML = `
      <div style="
        font-family: serif; 
        border: 2px solid #75E6CC; 
        background: #0a1512; 
        color: #EAF5F1; 
        padding: 40px; 
        text-align: center;
        max-width: 500px;
        margin: 40px auto;
        border-radius: 12px;
      ">
        <h2 style="font-size: 24px; letter-spacing: 2px; margin-bottom: 5px;">VERIFIED SAFE</h2>
        <p style="font-size: 11px; font-family: monospace; color: #839F95;">SuRakshaSetu AI Protection</p>
        <hr style="border-color: rgba(117, 230, 204, 0.2); margin: 20px 0;" />
        <p style="font-size: 14px; line-height: 1.6;">
          This transaction/message payload has been verified clean of phishing links, credential harvesting triggers, and automated banking fraud sequences.
        </p>
        <div style="font-size: 10px; font-family: monospace; text-align: left; margin-top: 30px;">
          <div>TIMESTAMP: ${cert.timestamp || new Date().toLocaleTimeString()}</div>
          <div>VERDICT HASH: CERT-${cert.id || 'N/A'}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(printFrame);
    
    // Add print style helper
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #print-cert-wrapper, #print-cert-wrapper * { visibility: visible !important; }
        #print-cert-wrapper {
          position: absolute !important;
          left: 50% !important;
          top: 30% !important;
          transform: translate(-50%, -30%) !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up
    printFrame.remove();
    style.remove();
  };

  return (
    <div className="cyber-panel p-6 bg-[#0a1512] border border-brand-primary/25 rounded-xl text-center space-y-4 relative flex flex-col justify-between h-full group hover:border-brand-primary/50 transition-all duration-300">
      {/* Corner bracket decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-primary/30 rounded-tl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-brand-primary/30 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-primary/30 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-brand-primary/30 rounded-br" />

      <div>
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-primary/10 border border-brand-primary/25 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-brand-primary" />
        </div>

        <div className="text-[8px] font-mono tracking-widest text-brand-primary uppercase">// CLEARANCE BADGE</div>
        <h4 className="font-display font-extrabold text-lg text-brand-text mt-1">VERIFIED SAFE</h4>
        <div className="text-[8px] font-mono text-brand-text-muted mt-0.5 uppercase tracking-widest">
          AUDIT ID: #{cert.id.toString().substring(cert.id.toString().length - 6)}
        </div>
      </div>

      <div className="space-y-2 border-t border-brand-primary/10 pt-3">
        <div className="text-[8px] font-mono text-brand-text-muted text-left space-y-1">
          <div className="flex justify-between">
            <span>AUDITED AT:</span>
            <span className="text-brand-text">{cert.timestamp}</span>
          </div>
          <div className="flex justify-between">
            <span>PAYLOAD SIZE:</span>
            <span className="text-brand-primary">{cert.text?.length || 0} CHARS</span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="w-full py-2 bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/20 rounded font-mono text-[9px] tracking-wider uppercase text-brand-primary group-hover:text-brand-text transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          <Download className="w-3 h-3" /> Save/Print PDF
        </button>
      </div>
    </div>
  );
};

const Vault = () => {
  const { checkedMessages } = useSecurity();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Filter messages checked as safe to display in "My Certificates" section
  const safeCertificates = checkedMessages ? checkedMessages.filter(msg => msg.verdict === 'safe') : [];

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <div className="space-y-12 pb-12 relative">
      {/* Decorative Vault grid background pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `linear-gradient(to right, #75E6CC 1px, transparent 1px), linear-gradient(to bottom, #75E6CC 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          zIndex: 0
        }}
      />

      <header className="relative z-10 max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-brand-text mb-3">
          The Vault
        </h1>
        <p className="text-brand-text-muted text-sm leading-relaxed">
          Your personal armory of saved clearances and verified threat intel. Review banking attack vectors, verify digital alerts, and download certified safety badges.
        </p>
      </header>

      {/* Section 1: Threat Intelligence Archive */}
      <section className="relative z-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-3">
          <BookOpen className="w-5 h-5 text-brand-primary" />
          <h2 className="font-mono text-xs font-bold tracking-widest text-brand-primary uppercase">
            Threat Intelligence Archive
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCAM_CASE_FILES.map((file) => (
            <CaseFileCard key={file.id} file={file} prefersReducedMotion={prefersReducedMotion} />
          ))}
        </div>
      </section>

      {/* Section 2: My Certificates */}
      <section className="relative z-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-3">
          <ShieldCheck className="w-5 h-5 text-brand-primary" />
          <h2 className="font-mono text-xs font-bold tracking-widest text-brand-primary uppercase">
            My Safety Certificates
          </h2>
        </div>

        {safeCertificates.length === 0 ? (
          <div className="cyber-panel p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto border-dashed border-brand-primary/20 bg-brand-surface/20">
            <div className="w-12 h-12 rounded-full border border-brand-text-muted/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-brand-text-muted/40" />
            </div>
            <h3 className="font-display font-bold text-lg text-brand-text mb-2">No Certificates Generated Yet</h3>
            <p className="text-xs text-brand-text-muted max-w-sm mb-6 leading-relaxed">
              Verify an SMS transaction or chat payload inside the Scam Checker to produce downloadable certificates.
            </p>
            <Link
              to="/check"
              className="cyber-button px-6 py-2.5 flex items-center gap-2 text-xs"
            >
              Scan Payload <ArrowRight className="w-3.5 h-3.5 text-brand-bg" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {safeCertificates.map((cert) => (
              <SafetyCertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Security Toolkit */}
      <section className="relative z-10 space-y-6">
        <div className="flex items-center gap-3 border-b border-brand-primary/10 pb-3">
          <Info className="w-5 h-5 text-brand-primary" />
          <h2 className="font-mono text-xs font-bold tracking-widest text-brand-primary uppercase">
            Security Toolkit
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: How to Report */}
          <div className="cyber-panel p-6 flex flex-col justify-between hover:border-brand-primary/35 transition-all">
            <div className="space-y-3">
              <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded uppercase tracking-wider font-bold">
                INCIDENT REPORTING
              </span>
              <h3 className="font-display font-bold text-lg text-brand-text">How to Report a Scam</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                If you have been defrauded online, instantly contact the official Government **National Cyber Crime Helpline at 1930** or register the claim officially on the national portal website at **cybercrime.gov.in**.
              </p>
            </div>
            <a 
              href="https://cybercrime.gov.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-brand-primary hover:text-brand-text uppercase transition-all"
            >
              Launch Government Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 2: Verify Bank Number */}
          <div className="cyber-panel p-6 flex flex-col justify-between hover:border-brand-primary/35 transition-all">
            <div className="space-y-3">
              <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded uppercase tracking-wider font-bold">
                VERIFICATION CHANNEL
              </span>
              <h3 className="font-display font-bold text-lg text-brand-text">Verify a Bank Number</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Confirm IDBI Bank messages only from designated bank titles (like **"IDBIBK"**, **"IDBIPG"**). Official helpline lines are **1800-209-4324** / **1800-22-1070**. Do not call mobile handles listing inside custom alert details.
              </p>
            </div>
            <a 
              href="https://www.idbibank.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-brand-primary hover:text-brand-text uppercase transition-all"
            >
              IDBI Channels Directory <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 3: Enable Extra Protection */}
          <div className="cyber-panel p-6 flex flex-col justify-between hover:border-brand-primary/35 transition-all">
            <div className="space-y-3">
              <span className="text-[8px] font-mono px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded uppercase tracking-wider font-bold">
                PERIMETER CONTROL
              </span>
              <h3 className="font-display font-bold text-lg text-brand-text">Enable Extra Protection</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Access custom settings toggles, check security node configurations, or examine device permissions inside the Admin Control panel to unlock multi-factor and session checks.
              </p>
            </div>
            <Link 
              to="/admin/auth" 
              className="mt-6 flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-brand-primary hover:text-brand-text uppercase transition-all"
            >
              Open Admin Settings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Vault;
