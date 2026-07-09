import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext();

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  // Session Metrics (initialized with realistic historical baselines)
  const [scamsBlocked, setScamsBlocked] = useState(1248);
  const [txMonitored, setTxMonitored] = useState(45920);
  const [activeThreats, setActiveThreats] = useState(3);
  
  const [totalFlow, setTotalFlow] = useState(1248290);
  const [threatsBlocked, setThreatsBlocked] = useState(42);
  const [activeAnomalies, setActiveAnomalies] = useState(3);
  const [analyzedCount, setAnalyzedCount] = useState(242);

  // Checked messages in this session
  const [checkedMessages, setCheckedMessages] = useState([]);
  
  // Real-time Notification Feed
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Zero-Trust Protocol Active',
      message: 'IDBI SuRakshaSetu endpoint defense initialized on current browser session.',
      type: 'security',
      severity: 'info',
      timestamp: '10 mins ago',
      read: false
    },
    {
      id: 2,
      title: 'Suspicious Login Intercepted',
      message: 'Unusual access attempt from IP 185.220.101.43 (TOR Node) successfully blocked.',
      type: 'security',
      severity: 'warning',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: 3,
      title: 'High-Risk Transaction Hold',
      message: 'UPI Transfer of ₹45,000 to CRYPTO_GATEWAY_V4 placed on hold due to device anomaly.',
      type: 'tx',
      severity: 'critical',
      timestamp: '2 hours ago',
      read: false
    }
  ]);
  
  // Transaction ledger in this session
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN_99283_X',
      amount: '₹45,000.00',
      amountVal: 45000,
      beneficiary: 'CRYPTO_GATEWAY_V4',
      type: 'Transfer to',
      time: '02:45:11 PM | TODAY',
      status: 'highrisk',
      reasons: ["Amount is significantly higher than historical average.", "Transaction initiated from an unrecognized device."]
    },
    {
      id: 'TXN_99281_L',
      amount: '₹3,420.00',
      amountVal: 3420,
      beneficiary: 'Electricity Board',
      type: 'Payment to',
      time: '01:12:45 PM | TODAY',
      status: 'lowrisk',
      reasons: ["Merchant signature verified with cryptographic consensus."]
    }
  ]);

  // Live Activity Feed
  const [activities, setActivities] = useState([
    { id: 1, type: 'scam', title: 'Phishing SMS Blocked', amount: null, time: '2 mins ago', status: 'blocked' },
    { id: 2, type: 'tx', title: 'UPI Transfer to Raj Kumar', amount: '₹15,000', time: '15 mins ago', status: 'safe' },
    { id: 3, type: 'tx', title: 'NEFT Transfer to Vendor', amount: '₹2,50,000', time: '1 hour ago', status: 'flagged' },
    { id: 4, type: 'scam', title: 'Fake KYC Link Intercepted', amount: null, time: '3 hours ago', status: 'blocked' },
  ]);

  // Track ID of newly simulated transactions for entrance effects
  const [newlySimulatedIds, setNewlySimulatedIds] = useState(new Set());
  
  // For pulsing the visualization bridge in Dashboard
  const [lastEventTime, setLastEventTime] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState('safe');

  // Dynamic Safety Score Calculation
  const calculateSafetyScore = () => {
    let score = 78;
    const sessionScamsCaught = checkedMessages.filter(m => m.verdict === 'scam').length;
    const sessionSuspiciousCaught = checkedMessages.filter(m => m.verdict === 'suspicious').length;
    const sessionSafeChecked = checkedMessages.filter(m => m.verdict === 'safe').length;

    score += (sessionScamsCaught * 2.0);
    score += (sessionSuspiciousCaught * 1.0);
    score += (sessionSafeChecked * 0.5);

    const sessionTransactionsCount = transactions.length - 2;
    if (sessionTransactionsCount > 0) {
      score += (sessionTransactionsCount * 0.2);
    }

    score -= (activeThreats * 1.5);
    score -= (activeAnomalies * 2.0);

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const safetyScore = calculateSafetyScore();

  // Helper to add fresh notifications
  const pushNotification = (title, message, type, severity) => {
    const newNotif = {
      id: Date.now() + Math.random(),
      title,
      message,
      type,
      severity,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Expose function to add a checked message
  const addCheckedMessage = (text, apiResult) => {
    const newMessage = {
      id: Date.now(),
      text,
      verdict: apiResult.verdict,
      confidence: apiResult.confidence,
      reasons: apiResult.reasons,
      explanation: apiResult.explanation,
      timestamp: new Date().toLocaleTimeString()
    };

    setCheckedMessages(prev => [newMessage, ...prev]);

    // Update global counters and generate dynamic notification
    if (apiResult.verdict === 'scam') {
      setScamsBlocked(prev => prev + 1);
      
      const newActivity = {
        id: Date.now(),
        type: 'scam',
        title: 'SMS Scam Intercepted',
        amount: null,
        time: 'Just now',
        status: 'blocked'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('blocked');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      pushNotification(
        'Phishing Threat Blocked',
        `Intercepted phishing message: "${text.substring(0, 45)}..."`,
        'scam',
        'critical'
      );
    } else if (apiResult.verdict === 'suspicious') {
      setActiveThreats(prev => prev + 1);
      
      const newActivity = {
        id: Date.now(),
        type: 'scam',
        title: 'Suspicious SMS Flagged',
        amount: null,
        time: 'Just now',
        status: 'blocked'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('flagged');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      pushNotification(
        'Suspicious Threat Flagged',
        `Identified moderate risk payload: "${text.substring(0, 45)}..."`,
        'scam',
        'warning'
      );
    } else {
      const newActivity = {
        id: Date.now(),
        type: 'scam',
        title: 'SMS Message Cleared',
        amount: null,
        time: 'Just now',
        status: 'safe'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('safe');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      pushNotification(
        'Message Inspected',
        'Scam checker scan cleared message payload as safe.',
        'scam',
        'info'
      );
    }
  };

  // Expose function to add a simulated/monitored transaction
  const addTransaction = (newTx, apiResult) => {
    const txId = newTx.id;
    const isHighRisk = apiResult.status === 'highrisk';

    const txItem = {
      ...newTx,
      status: isHighRisk ? 'highrisk' : 'lowrisk',
      reasons: apiResult.reasons
    };

    setTransactions(prev => [txItem, ...prev]);
    
    setNewlySimulatedIds(prev => {
      const copy = new Set(prev);
      copy.add(txId);
      return copy;
    });

    setTotalFlow(prev => prev + newTx.amountVal);
    setAnalyzedCount(prev => prev + 1);
    setTxMonitored(prev => prev + 1);

    if (isHighRisk) {
      setThreatsBlocked(prev => prev + 1);
      setActiveAnomalies(prev => prev + 1);
      
      setTimeout(() => {
        setActiveAnomalies(prev => Math.max(0, prev - 1));
      }, 6000);

      const newActivity = {
        id: Date.now(),
        type: 'tx',
        title: `High-Risk UPI Hold (${newTx.beneficiary})`,
        amount: newTx.amount,
        time: 'Just now',
        status: 'flagged'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('flagged');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      pushNotification(
        'Fraud Alert: UPI Hold',
        `High-Risk transfer of ${newTx.amount} to ${newTx.beneficiary} intercepted and blocked.`,
        'tx',
        'critical'
      );
    } else {
      const newActivity = {
        id: Date.now(),
        type: 'tx',
        title: `UPI Transfer to ${newTx.beneficiary}`,
        amount: newTx.amount,
        time: 'Just now',
        status: 'safe'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('safe');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      pushNotification(
        'Transaction Cleared',
        `UPI payment of ${newTx.amount} to ${newTx.beneficiary} verified and completed.`,
        'tx',
        'info'
      );
    }
  };

  // Background activity simulator loop (runs on Dashboard every 8 seconds, updating shared state)
  const triggerSimulatedBackgroundActivity = () => {
    const isScam = Math.random() > 0.5;
    if (isScam) {
      setScamsBlocked(prev => prev + 1);
      const newActivity = {
        id: Date.now(),
        type: 'scam',
        title: 'SMS Phishing Intercepted',
        amount: null,
        time: 'Just now',
        status: 'blocked'
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus('blocked');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);

      // Random alert title/message
      const scamAlerts = [
        { title: 'Tax Refund Phishing SMS', desc: 'Blocked text containing suspicious IT-Dept link.' },
        { title: 'Fraudulent Lottery Message', desc: 'Blocked SMS offering unverified reward payout.' },
        { title: 'KYC Expiry Impersonation', desc: 'Intercepted malicious update verification threat.' }
      ];
      const alertItem = scamAlerts[Math.floor(Math.random() * scamAlerts.length)];
      
      pushNotification(
        `Threat Blocked: ${alertItem.title}`,
        alertItem.desc,
        'scam',
        'critical'
      );
    } else {
      setTxMonitored(prev => prev + 1);
      const isHighRisk = Math.random() > 0.7;
      const rawAmount = Math.floor(Math.random() * 45000) + 500;
      const formattedAmount = `₹${rawAmount.toLocaleString('en-IN')}`;
      
      const newActivity = {
        id: Date.now(),
        type: 'tx',
        title: isHighRisk ? 'Suspicious Transaction Hold' : 'Merchant POS Verified',
        amount: formattedAmount,
        time: 'Just now',
        status: isHighRisk ? 'flagged' : 'safe'
      };

      if (isHighRisk) {
        setActiveAnomalies(prev => prev + 1);
        setTimeout(() => {
          setActiveAnomalies(prev => Math.max(0, prev - 1));
        }, 5000);

        pushNotification(
          'Anomalous Transaction Hold',
          `POS Payment of ${formattedAmount} placed on hold for multi-factor validation.`,
          'tx',
          'warning'
        );
      } else {
        pushNotification(
          'POS Payment Verified',
          `Monitored contactless payment of ${formattedAmount} successfully cleared.`,
          'tx',
          'info'
        );
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus(isHighRisk ? 'flagged' : 'safe');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);
    }
  };

  // Set up background simulation globally so notifications arrive even if user is on other pages
  useEffect(() => {
    const interval = setInterval(() => {
      triggerSimulatedBackgroundActivity();
    }, 5000); // 5 seconds for fast hackathon demo updates!

    return () => clearInterval(interval);
  }, []);

  return (

    <SecurityContext.Provider
      value={{
        scamsBlocked,
        txMonitored,
        activeThreats,
        totalFlow,
        threatsBlocked,
        activeAnomalies,
        analyzedCount,
        checkedMessages,
        transactions,
        activities,
        safetyScore,
        newlySimulatedIds,
        lastEventTime,
        bridgeStatus,
        notifications,
        addCheckedMessage,
        addTransaction,
        triggerSimulatedBackgroundActivity,
        setActiveThreats,
        markAllNotificationsRead
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};
