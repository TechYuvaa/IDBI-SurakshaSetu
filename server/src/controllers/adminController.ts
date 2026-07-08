import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    // 1. Active sessions count
    const activeSessionsCount = await prisma.session.count({
      where: { isRevoked: false, expiresAt: { gt: now } }
    });

    // 2. Count of unique users currently authenticated
    const activeUsersList = await prisma.session.groupBy({
      by: ['userId'],
      where: { isRevoked: false, expiresAt: { gt: now } }
    });
    const activeUsersCount = activeUsersList.length;

    // 3. Total failed logon attempts
    const aggregateFailed = await prisma.user.aggregate({
      _sum: { failedAttempts: true }
    });
    const totalFailedLogins = aggregateFailed._sum.failedAttempts || 0;

    // 4. Locked accounts count
    const lockedAccountsCount = await prisma.user.count({
      where: { status: 'LOCKED' }
    });

    // 5. Total users with active OTPs
    const activeOtpsCount = await prisma.user.count({
      where: {
        otpCode: { not: null },
        otpExpires: { gt: now }
      }
    });

    // 6. Detailed Active Session List
    const sessions = await prisma.session.findMany({
      where: { isRevoked: false, expiresAt: { gt: now } },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 7. Security Logs Feed
    const securityEvents = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        actor: {
          select: {
            email: true
          }
        }
      }
    });

    // Format events for client ingestion
    const formattedEvents = securityEvents.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      actor: event.actor?.email || 'SYSTEM/ANONYMOUS',
      action: event.action,
      target: event.target,
      ip: event.ip,
      device: event.device || 'Unknown',
      riskScore: event.riskScore,
      correlationId: event.correlationId,
      traceId: event.traceId
    }));

    return res.status(200).json({
      metrics: {
        activeSessions: activeSessionsCount,
        loggedInUsers: activeUsersCount,
        failedLogins: totalFailedLogins,
        lockedAccounts: lockedAccountsCount,
        activeOtps: activeOtpsCount
      },
      sessions: sessions.map(s => ({
        id: s.id,
        email: s.user.email,
        role: s.user.role,
        deviceName: s.deviceName || 'Web Browser',
        ipAddress: s.ipAddress,
        createdAt: s.createdAt
      })),
      events: formattedEvents
    });

  } catch (err) {
    next(err);
  }
};

export const forceLogoutSession = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session record not found.' });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true }
    });

    logger.warn(`Admin forcefully terminated session ${sessionId} for user ${session.user.email}`);

    // Audit log record
    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'Admin Force Logout Session',
        target: `/api/v1/admin/sessions/${sessionId}/revoke`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
    });

    return res.status(200).json({ message: 'Session revoked successfully.' });

  } catch (err) {
    next(err);
  }
};
