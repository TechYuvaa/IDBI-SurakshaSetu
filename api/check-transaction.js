// Historical Seed History (15 transactions) to compute baseline statistics
const transactionHistory = [
  { amountVal: 15000, beneficiary: 'Raj Kumar', device: 'Primary Device', hour: 14 },
  { amountVal: 3200, beneficiary: 'Electricity Board', device: 'Primary Device', hour: 10 },
  { amountVal: 1500, beneficiary: 'Amazon Online India', device: 'Primary Device', hour: 18 },
  { amountVal: 800, beneficiary: 'Zomato Food Delivery', device: 'Primary Device', hour: 21 },
  { amountVal: 20000, beneficiary: 'Raj Kumar', device: 'Primary Device', hour: 11 },
  { amountVal: 12000, beneficiary: 'Airtel Payment', device: 'Primary Device', hour: 9 },
  { amountVal: 450, beneficiary: 'Zomato Food Delivery', device: 'Primary Device', hour: 13 },
  { amountVal: 25000, beneficiary: 'HDFC Transfer', device: 'Primary Device', hour: 16 },
  { amountVal: 1800, beneficiary: 'Petrol Pump POS', device: 'Primary Device', hour: 15 },
  { amountVal: 15000, beneficiary: 'Raj Kumar', device: 'Primary Device', hour: 12 },
  { amountVal: 500, beneficiary: 'Amazon Online India', device: 'Primary Device', hour: 19 },
  { amountVal: 1000, beneficiary: 'Zomato Food Delivery', device: 'Primary Device', hour: 20 },
  { amountVal: 14000, beneficiary: 'Airtel Payment', device: 'Primary Device', hour: 8 },
  { amountVal: 3500, beneficiary: 'Electricity Board', device: 'Primary Device', hour: 10 },
  { amountVal: 22000, beneficiary: 'Raj Kumar', device: 'Primary Device', hour: 17 }
];

export default function handler(req, res) {
  // Method Verification
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const tx = req.body;

  // Validation
  if (!tx) {
    return res.status(400).json({ error: 'Transaction body is required.' });
  }

  if (typeof tx.amountVal !== 'number' || isNaN(tx.amountVal) || tx.amountVal <= 0) {
    return res.status(400).json({ error: 'Invalid or missing field: amountVal must be a positive number.' });
  }

  if (!tx.beneficiary || typeof tx.beneficiary !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing field: beneficiary.' });
  }

  if (!tx.device || typeof tx.device !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing field: device.' });
  }

  // Parse time of day from timestamp
  let txHour = 12; // default
  if (tx.timestamp) {
    try {
      const d = new Date(tx.timestamp);
      if (!isNaN(d.getTime())) {
        txHour = d.getHours();
      }
    } catch (e) {
      // fallback
    }
  }

  // --- DYNAMIC BASELINE CALCULATION ---
  const totalCount = transactionHistory.length;
  const sumAmount = transactionHistory.reduce((sum, item) => sum + item.amountVal, 0);
  const averageAmount = Math.round(sumAmount / totalCount);

  // Beneficiaries
  const knownBeneficiaries = new Set(transactionHistory.map(item => item.beneficiary.toLowerCase()));
  
  // Devices
  const knownDevices = new Set(transactionHistory.map(item => item.device.toLowerCase()));

  // Active hours checklist (baseline typical hours are 6 AM to 11 PM)
  const typicalStartHour = 6;
  const typicalEndHour = 23;

  // --- SCORING ENGINE ---
  let score = 100;
  const reasons = [];

  // Anomaly 1: Amount Ratio relative to average
  const amountRatio = tx.amountVal / averageAmount;
  if (amountRatio >= 4.0) {
    score -= 35;
    reasons.push(`High amount anomaly: Value of ₹${tx.amountVal.toLocaleString('en-IN')} is over 4x your average transaction (₹${averageAmount.toLocaleString('en-IN')}).`);
  } else if (amountRatio >= 2.0) {
    score -= 15;
    reasons.push(`Elevated amount alert: Value of ₹${tx.amountVal.toLocaleString('en-IN')} is double your normal average (₹${averageAmount.toLocaleString('en-IN')}).`);
  }

  // Anomaly 2: New Beneficiary
  const isNewBeneficiary = !knownBeneficiaries.has(tx.beneficiary.toLowerCase());
  if (isNewBeneficiary) {
    score -= 20;
    reasons.push(`Unknown beneficiary: First-time transfer initiated to "${tx.beneficiary}".`);
    
    // Compounding Risk: Large amount to new beneficiary
    if (amountRatio >= 2.0) {
      score -= 25;
      reasons.push("Compounding risk factor: High transaction amount directed to an unknown beneficiary.");
    }
  }

  // Anomaly 3: Device mismatch
  const isNewDevice = !knownDevices.has(tx.device.toLowerCase());
  if (isNewDevice) {
    score -= 30;
    reasons.push(`Unrecognized node: Transaction requested from untrusted device identifier "${tx.device}".`);
  }

  // Anomaly 4: Unusual hours (Midnight to 5 AM)
  const isAnomalousHour = txHour >= 0 && txHour <= 5;
  if (isAnomalousHour) {
    score -= 20;
    reasons.push("Unusual active hour: Transfer requested during typical sleeping period (midnight to 5 AM).");
  }

  // Add current transaction to history to shift the baseline dynamically
  transactionHistory.push({
    amountVal: tx.amountVal,
    beneficiary: tx.beneficiary,
    device: tx.device,
    hour: txHour
  });

  // Bound score
  const finalScore = Math.max(0, score);
  const status = finalScore <= 55 ? 'flagged' : 'safe';

  // Fallback description if no anomalies triggered
  if (reasons.length === 0) {
    reasons.push("All security parameters verify. Transaction amount, device footprint, and recipient match known baseline.");
  }

  return res.status(200).json({
    status,
    score: finalScore,
    reasons,
    baselineStats: {
      historicalAverage: averageAmount,
      totalAudited: transactionHistory.length
    }
  });
}
