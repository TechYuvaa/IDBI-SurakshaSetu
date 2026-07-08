import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';
import { cache } from '../config/redis.js';

// Try to dynamically load Argon2 for hashing. Fallback to PBKDF2 if compiled binaries fail locally.
let argon2: any = null;
try {
  // Node ES module dynamic import
  argon2 = await import('argon2');
} catch (e) {
  logger.warn('Argon2 package not available or failing to load. Falling back to native PBKDF2 crypt.');
}

const hashPassword = async (password: string): Promise<string> => {
  if (argon2) {
    try {
      return await argon2.hash(password, { type: 2 }); // Argon2id
    } catch (e) {
      // fallback
    }
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (hash.startsWith('pbkdf2$')) {
    const parts = hash.split('$');
    const salt = parts[1];
    const originalHash = parts[2];
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return originalHash === testHash;
  }
  if (argon2) {
    try {
      return await argon2.verify(hash, password);
    } catch (e) {
      // fallback
    }
  }
  return false;
};

// Access Token generator (Short-lived 15m)
const generateAccessToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-idbi-suraksha';
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (Long-lived 7d)
const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, fullName, phone, location } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required signup fields.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered.', code: 'EMAIL_TAKEN' });
    }

    const passwordHash = await hashPassword(password);
    
    // Create transaction to enforce atomic user + profile inserts
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: 'CUSTOMER'
        }
      });

      await tx.profile.create({
        data: {
          userId: u.id,
          fullName,
          location,
          panEncrypted: null,
          aadhaarEncrypted: null
        }
      });
      return u;
    });

    logger.info(`Registered new user account: ${email}`);
    return res.status(201).json({
      message: 'Account registered successfully.',
      userId: newUser.id
    });

  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, deviceFingerprint, deviceName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid security credentials.', code: 'BAD_CREDENTIALS' });
    }

    // Lockout verification
    if (user.status === 'LOCKED' && user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({
        error: `Account locked. Please try again after ${user.lockoutUntil.toLocaleTimeString()}`,
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Verify password hash
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      // Increment failed count
      const updatedCount = user.failedAttempts + 1;
      const data: any = { failedAttempts: updatedCount };

      // Set a lockout timer if it reaches 5 attempts
      if (updatedCount >= 5) {
        data.status = 'LOCKED';
        data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        logger.warn(`User locked out due to consecutive failed logons: ${email}`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data
      });

      return res.status(401).json({ error: 'Invalid security credentials.', code: 'BAD_CREDENTIALS' });
    }

    // Reset failed logs on success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockoutUntil: null }
    });

    // Create session parameters
    const fingerprint = deviceFingerprint || 'Unknown-Device';
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        deviceFingerprint: fingerprint,
        deviceName: deviceName || 'Web Browser',
        ipAddress: req.ip || '127.0.0.1',
        expiresAt: sessionExpiry
      }
    });

    // Configure refresh token in HttpOnly secure cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: sessionExpiry
    });

    // Generate access token
    const accessToken = generateAccessToken(user);

    logger.info(`Session authenticated for user: ${email}`);
    
    // Return profile & access token
    return res.status(200).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName || 'N/A'
      }
    });

  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Session cookie missing.', code: 'MISSING_REFRESH_TOKEN' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Find active session matching refresh token hash
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: { include: { profile: true } } }
    });

    // RTR Security check: If token is not found or is revoked, it might be a reuse attack!
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      if (session && session.isRevoked) {
        // Attack detected: Revoke all other active sessions in the token family
        logger.warn(`Refresh Token Replay detected! Revoking token family: ${session.tokenFamily}`);
        await prisma.session.updateMany({
          where: { tokenFamily: session.tokenFamily },
          data: { isRevoked: true }
        });
      }
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Session expired or invalid.', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Rotate refresh token (RTR)
    const newRefreshToken = generateRefreshToken();
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update existing session mapping new token, maintaining same family
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newHash,
        expiresAt: sessionExpiry,
        ipAddress: req.ip || '127.0.0.1'
      }
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: sessionExpiry
    });

    const accessToken = generateAccessToken(session.user);

    return res.status(200).json({
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        fullName: session.user.profile?.fullName || 'N/A'
      }
    });

  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(200).json({ message: 'Session logged out.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    await prisma.session.update({
      where: { refreshTokenHash: tokenHash },
      data: { isRevoked: true }
    });

    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Session logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    // Revoke all sessions for user
    await prisma.session.updateMany({
      where: { userId: req.user.id, isRevoked: false },
      data: { isRevoked: true }
    });

    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out of all active devices.' });
  } catch (err) {
    next(err);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const active = await prisma.session.findMany({
      where: { userId: req.user.id, isRevoked: false, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        createdAt: true
      }
    });

    return res.status(200).json({ sessions: active });
  } catch (err) {
    next(err);
  }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found.', code: 'NOT_FOUND' });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true }
    });

    return res.status(200).json({ message: 'Session revoked successfully.' });
  } catch (err) {
    next(err);
  }
};
