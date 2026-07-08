import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.', code: 'UNAUTHORIZED' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-idbi-suraksha';
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Verify user status in database (Zero Trust checks)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'User account not found.', code: 'USER_NOT_FOUND' });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ error: 'Account is locked due to security anomalies.', code: 'ACCOUNT_LOCKED' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account is suspended.', code: 'ACCOUNT_SUSPENDED' });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (err: any) {
    logger.warn(`JWT validation failed: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired access token.', code: 'INVALID_TOKEN' });
  }
};

// Role authorization guard (RBAC)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      logger.warn(`Access denied for role ${req.user.role} on route ${req.originalUrl}`);
      return res.status(403).json({ error: 'Access denied: insufficient permission.', code: 'FORBIDDEN' });
    }

    next();
  };
};
