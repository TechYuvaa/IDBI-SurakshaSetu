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
  // Starts with base baseline of 78 (Moderate Risk).
  // +1.5 for every scam caught/blocked in the checker.
  // +0.5 for every safe message checked.
  // +0.1 for every transaction monitored.
  // -3.0 for every active anomaly/threat.
  const calculateSafetyScore = () => {
    let score = 78;

    // From session activity:
    const sessionScamsCaught = checkedMessages.filter(m => m.verdict === 'scam').length;
    const sessionSuspiciousCaught = checkedMessages.filter(m => m.verdict === 'suspicious').length;
    const sessionSafeChecked = checkedMessages.filter(m => m.verdict === 'safe').length;

    score += (sessionScamsCaught * 2.0);
    score += (sessionSuspiciousCaught * 1.0);
    score += (sessionSafeChecked * 0.5);

    // From transactions in session:
    const sessionTransactionsCount = transactions.length - 2; // subtract the initial 2 mock entries
    if (sessionTransactionsCount > 0) {
      score += (sessionTransactionsCount * 0.2);
    }

    // Active threats deduct score
    score -= (activeThreats * 1.5);
    score -= (activeAnomalies * 2.0);

    // Keep it between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const safetyScore = calculateSafetyScore();

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

    // Update global counters
    if (apiResult.verdict === 'scam') {
      setScamsBlocked(prev => prev + 1);
      // Prepend to activities
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
    }
  };

  // Expose function to add a simulated/monitored transaction
  const addTransaction = (newTx, apiResult) => {
    const txId = newTx.id;
    const isHighRisk = apiResult.status === 'flagged';

    const txItem = {
      ...newTx,
      status: isHighRisk ? 'highrisk' : 'lowrisk',
      reasons: apiResult.reasons
    };

    setTransactions(prev => [txItem, ...prev]);
    
    // Track for entry animation glow
    setNewlySimulatedIds(prev => {
      const copy = new Set(prev);
      copy.add(txId);
      return copy;
    });

    // Update statistics
    setTotalFlow(prev => prev + newTx.amountVal);
    setAnalyzedCount(prev => prev + 1);
    setTxMonitored(prev => prev + 1);

    if (isHighRisk) {
      setThreatsBlocked(prev => prev + 1);
      setActiveAnomalies(prev => prev + 1);
      
      // Auto-settle active anomaly threat count after 6 seconds
      setTimeout(() => {
        setActiveAnomalies(prev => Math.max(0, prev - 1));
      }, 6000);

      // Prepend to Dashboard Activity Feed
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
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setBridgeStatus(isHighRisk ? 'flagged' : 'safe');
      setLastEventTime(Date.now());
      setTimeout(() => setBridgeStatus('safe'), 2500);
    }
  };

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
        addCheckedMessage,
        addTransaction,
        triggerSimulatedBackgroundActivity,
        setActiveThreats
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};
