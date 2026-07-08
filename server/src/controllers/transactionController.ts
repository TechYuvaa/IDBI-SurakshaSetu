import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

export const checkTransaction = async (req: Request, res: Response, next: NextFunction) => {
  const tx = req.body;

  // Input sanitization and validation (Phase 4)
  if (!tx) {
    return res.status(400).json({ error: 'Transaction payload is required.', code: 'INVALID_INPUT' });
  }

  if (typeof tx.amountVal !== 'number' || isNaN(tx.amountVal) || tx.amountVal <= 0) {
    return res.status(400).json({ error: 'Field amountVal must be a positive number.', code: 'INVALID_INPUT' });
  }

  if (!tx.beneficiary || typeof tx.beneficiary !== 'string') {
    return res.status(400).json({ error: 'Field beneficiary is required.', code: 'INVALID_INPUT' });
  }

  if (!tx.device || typeof tx.device !== 'string') {
    return res.status(400).json({ error: 'Field device is required.', code: 'INVALID_INPUT' });
  }

  try {
    const actorId = req.user?.id || null;

    // Resolve hour parameter
    let txHour = 12;
    if (tx.timestamp) {
      const d = new Date(tx.timestamp);
      if (!isNaN(d.getTime())) {
        txHour = d.getHours();
      }
    }

    // --- DYNAMIC BASELINE RESOLUTION ---
    const historyClause = actorId ? { userId: actorId } : {};
    const historicalTx = await prisma.transaction.findMany({
      where: historyClause,
      take: 20,
      orderBy: { timestamp: 'desc' }
    });

    const totalCount = historicalTx.length;
    let averageAmount = 15000;
    const knownBeneficiaries = new Set<string>();
    const knownDevices = new Set<string>();

    if (totalCount > 0) {
      const sum = historicalTx.reduce((acc, item) => acc + item.amountVal, 0);
      averageAmount = Math.round(sum / totalCount);
      historicalTx.forEach(item => {
        knownBeneficiaries.add(item.beneficiary.toLowerCase());
        knownDevices.add(item.device.toLowerCase());
      });
    }

    // --- ANOMALY SCORING ENGINE ---
    let score = 100;
    const reasons: string[] = [];

    const amountRatio = tx.amountVal / averageAmount;
    if (amountRatio >= 4.0) {
      score -= 35;
      reasons.push(`High amount anomaly: Value of ₹${tx.amountVal.toLocaleString('en-IN')} is over 4x your average transaction (₹${averageAmount.toLocaleString('en-IN')}).`);
    } else if (amountRatio >= 2.0) {
      score -= 15;
      reasons.push(`Elevated amount alert: Value of ₹${tx.amountVal.toLocaleString('en-IN')} is double your normal average (₹${averageAmount.toLocaleString('en-IN')}).`);
    }

    const isNewBeneficiary = !knownBeneficiaries.has(tx.beneficiary.toLowerCase());
    if (isNewBeneficiary) {
      score -= 20;
      reasons.push(`Unknown beneficiary: First-time transfer initiated to "${tx.beneficiary}".`);
      
      if (amountRatio >= 2.0) {
        score -= 25;
        reasons.push("Compounding risk factor: High transaction amount directed to an unknown beneficiary.");
      }
    }

    const isNewDevice = !knownDevices.has(tx.device.toLowerCase());
    if (isNewDevice) {
      score -= 30;
      reasons.push(`Unrecognized node: Transaction requested from untrusted device identifier "${tx.device}".`);
    }

    const isAnomalousHour = txHour >= 0 && txHour <= 5;
    if (isAnomalousHour) {
      score -= 20;
      reasons.push("Unusual active hour: Transfer requested during typical sleeping period (midnight to 5 AM).");
    }

    const finalScore = Math.max(0, score);
    const status = finalScore <= 55 ? 'flagged' : 'safe';

    if (reasons.length === 0) {
      reasons.push("All security parameters verify. Transaction amount, device footprint, and recipient match known baseline.");
    }

    let targetUserId = actorId;
    if (!targetUserId) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        targetUserId = defaultUser.id;
      }
    }

    if (targetUserId) {
      await prisma.transaction.create({
        data: {
          userId: targetUserId,
          amountVal: tx.amountVal,
          beneficiary: tx.beneficiary,
          device: tx.device,
          ipAddress: req.ip || '127.0.0.1',
          status,
          riskScore: 100 - finalScore,
          reasons: JSON.stringify(reasons) // Serialize to JSON string
        }
      });
    }

    res.locals.riskScore = 100 - finalScore;

    return res.status(200).json({
      status,
      score: finalScore,
      reasons,
      baselineStats: {
        historicalAverage: averageAmount,
        totalAudited: totalCount + 1
      }
    });

  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  const actorId = req.user?.id || null;
  try {
    const historyClause = actorId ? { userId: actorId } : {};
    const list = await prisma.transaction.findMany({
      where: historyClause,
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    
    // Parse stringified JSON reasons back to array for cross-database engine safety
    const parsedList = list.map(item => {
      let parsedReasons = [];
      try {
        parsedReasons = JSON.parse(item.reasons);
      } catch (e) {
        parsedReasons = [item.reasons];
      }
      return {
        ...item,
        reasons: parsedReasons
      };
    });
    
    return res.status(200).json({ transactions: parsedList });
  } catch (err) {
    next(err);
  }
};
