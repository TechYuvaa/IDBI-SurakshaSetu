import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';
import { authenticator } from 'otplib';

// Configure otplib details
authenticator.options = { window: [1, 0] }; // allow 30s clock drift

// Hashing Helpers (Argon2id with PBKDF2 Fallback)
let argon2: any = null;
try {
  argon2 = await import('argon2');
} catch (e) {
  logger.warn('Argon2 package not available or failing to load. Falling back to native PBKDF2 crypt.');
}

const hashPassword = async (password: string): Promise<string> => {
  if (argon2) {
    try {
      return await argon2.hash(password, { type: 2 });
    } catch (e) {}
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
    } catch (e) {}
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

// Generate 2FA Temporary Token (Valid for 5 minutes)
const generateTemp2faToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-idbi-suraksha';
  return jwt.sign(
    { id: userId, isTemp: true },
    secret,
    { expiresIn: '5m' }
  );
};

// 12-character Banking Password Policy Checker (Phase 2 / Password Policy)
const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 12) {
    return 'Password must be at least 12 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one numeric digit.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  const commonPasswords = ['password12345', 'administrator123', 'idbibank12345', 'welcome123456'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'Password is too common or matches easily guessable dictionary patterns.';
  }
  return null;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, fullName, phone, location } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required signup fields.' });
  }

  // Validate password policy
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError, code: 'WEAK_PASSWORD' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered.', code: 'EMAIL_TAKEN' });
    }

    const passwordHash = await hashPassword(password);
    
    // Generate recovery backup codes (10 codes of length 12)
    const rawBackupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(6).toString('hex'));
    const hashedBackupCodes = rawBackupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: 'CUSTOMER',
          twoFactorEnabled: true, // Default to true for demo validation
          twoFactorType: 'EMAIL',
          backupCodes: JSON.stringify(hashedBackupCodes)
        }
      });

      await tx.profile.create({
        data: {
          userId: u.id,
          fullName,
          location,
        }
      });
      return { user: u, backupCodes: rawBackupCodes };
    });

    logger.info(`Registered new user account: ${email}`);
    
    // Write success audit log
    await prisma.auditLog.create({
      data: {
        actorId: newUser.user.id,
        action: 'User Register',
        target: `/api/v1/auth/register`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
    });

    return res.status(201).json({
      message: 'Account registered successfully. Please save your recovery backup codes.',
      userId: newUser.user.id,
      backupCodes: newUser.backupCodes
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
        error: `Account locked due to consecutive failures. Try again after ${user.lockoutUntil.toLocaleTimeString()}`,
        code: 'ACCOUNT_LOCKED'
      });
    }

    // Verify credentials
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const updatedCount = user.failedAttempts + 1;
      const data: any = { failedAttempts: updatedCount };

      if (updatedCount >= 5) {
        data.status = 'LOCKED';
        data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        logger.warn(`User locked out: ${email}`);
        
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'Account Locked',
            target: `/api/v1/auth/login`,
            ip: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Unknown',
            correlationId: req.correlationId || '',
            traceId: req.traceId || ''
          }
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data
      });

      // Write failure audit log
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'Login Failure',
          target: `/api/v1/auth/login`,
          ip: req.ip || '127.0.0.1',
          device: req.headers['user-agent'] || 'Unknown',
          correlationId: req.correlationId || '',
          traceId: req.traceId || '',
          riskScore: 30
        }
      });

      return res.status(401).json({ error: 'Invalid security credentials.', code: 'BAD_CREDENTIALS' });
    }

    // Reset failed logs on password success
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockoutUntil: null }
    });

    // Check if 2FA is required (Phase 2 / 2FA redirection)
    if (user.twoFactorEnabled) {
      const tempToken = generateTemp2faToken(user.id);
      let demoOtp = '';

      if (user.twoFactorType === 'EMAIL') {
        // Generate a 6-digit numeric Email OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCode,
            otpExpires,
            otpRetries: 0
          }
        });

        logger.info(`[DEMO MFA OTP] Sent Email OTP to ${email}: ${otpCode}`);
        demoOtp = otpCode; // Return to frontend in demo/dev mode

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'OTP Sent',
            target: `/api/v1/auth/login`,
            ip: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Unknown',
            correlationId: req.correlationId || '',
            traceId: req.traceId || ''
          }
        });
      }

      return res.status(200).json({
        twoFactorRequired: true,
        tempToken,
        twoFactorType: user.twoFactorType,
        // Only return demoOtp in non-production mode
        ...(process.env.NODE_ENV !== 'production' ? { demoOtp } : {})
      });
    }

    // Log success and return token directly if 2FA is bypassed (e.g. disabled)
    return await establishSession(user, req, res);

  } catch (err) {
    next(err);
  }
};

// Establish user session, rotaterefresh tokens and return access tokens
const establishSession = async (user: any, req: Request, res: Response) => {
  const fingerprint = (req.body.deviceFingerprint as string) || 'Unknown-Device';
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Check if session is from a new device (Phase 2 / New Device Detection)
  const previousSession = await prisma.session.findFirst({
    where: { userId: user.id, deviceFingerprint: fingerprint }
  });

  if (!previousSession) {
    logger.warn(`New device login detected for user: ${user.email} from fingerprint ${fingerprint}`);
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'New Device Login',
        target: `/api/v1/auth/login`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || '',
        riskScore: 20
      }
    });
  }

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      deviceFingerprint: fingerprint,
      deviceName: (req.body.deviceName as string) || 'Web Browser',
      ipAddress: req.ip || '127.0.0.1',
      expiresAt: sessionExpiry
    }
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: sessionExpiry
  });

  const accessToken = generateAccessToken(user);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'Login Success',
      target: `/api/v1/auth/login`,
      ip: req.ip || '127.0.0.1',
      device: req.headers['user-agent'] || 'Unknown',
      correlationId: req.correlationId || '',
      traceId: req.traceId || ''
    }
  });

  logger.info(`Session verified for user: ${user.email}`);

  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.profile?.fullName || 'N/A'
    }
  });
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'Session cookie missing.', code: 'MISSING_REFRESH_TOKEN' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: { include: { profile: true } } }
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      if (session && session.isRevoked) {
        logger.warn(`Refresh Token Replay detected! Revoking token family: ${session.tokenFamily}`);
        await prisma.session.updateMany({
          where: { tokenFamily: session.tokenFamily },
          data: { isRevoked: true }
        });
      }
      res.clearCookie('refreshToken');
      return res.status(401).json({ error: 'Session expired or invalid.', code: 'INVALID_REFRESH_TOKEN' });
    }

    const newRefreshToken = generateRefreshToken();
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

export const verify2fa = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;
  const authHeader = req.headers['authorization'];
  const tempToken = authHeader && authHeader.split(' ')[1];

  if (!tempToken) {
    return res.status(401).json({ error: 'Temporary 2FA token required.', code: 'UNAUTHORIZED' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-idbi-suraksha';
    const decoded = jwt.verify(tempToken, secret) as { id: string; isTemp: boolean };

    if (!decoded.isTemp) {
      return res.status(401).json({ error: 'Invalid 2FA token sequence.', code: 'INVALID_TOKEN' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User account not found.', code: 'USER_NOT_FOUND' });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({ error: 'Account is locked.', code: 'ACCOUNT_LOCKED' });
    }

    let isCodeValid = false;

    // 1. Verify standard OTP code (Email 2FA)
    if (user.twoFactorType === 'EMAIL') {
      if (user.otpCode && user.otpExpires && user.otpExpires > new Date()) {
        isCodeValid = (user.otpCode === code.trim());
      }
    } 
    // 2. Verify Authenticator Code (TOTP 2FA)
    else if (user.twoFactorType === 'TOTP') {
      if (user.twoFactorSecret) {
        isCodeValid = authenticator.verify({
          token: code.trim(),
          secret: user.twoFactorSecret
        });
      }
    }

    // 3. Fallback: Verify backup codes (Phase 2 / Backup Codes)
    if (!isCodeValid && user.backupCodes) {
      const hashedCode = crypto.createHash('sha256').update(code.trim()).digest('hex');
      const backupList: string[] = JSON.parse(user.backupCodes);
      const matchedIndex = backupList.indexOf(hashedCode);
      
      if (matchedIndex !== -1) {
        isCodeValid = true;
        // Revoke backup code (single-use)
        backupList.splice(matchedIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { backupCodes: JSON.stringify(backupList) }
        });
        logger.info(`Backup code used successfully to authenticate: ${user.email}`);
      }
    }

    if (!isCodeValid) {
      const retries = user.otpRetries + 1;
      const data: any = { otpRetries: retries };

      if (retries >= 3) {
        data.status = 'LOCKED';
        data.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15m
        logger.warn(`User locked out after repeated OTP failures: ${user.email}`);
        
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: 'Account Locked',
            target: `/api/v1/auth/verify-2fa`,
            ip: req.ip || '127.0.0.1',
            device: req.headers['user-agent'] || 'Unknown',
            correlationId: req.correlationId || '',
            traceId: req.traceId || ''
          }
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'OTP Failure',
          target: `/api/v1/auth/verify-2fa`,
          ip: req.ip || '127.0.0.1',
          device: req.headers['user-agent'] || 'Unknown',
          correlationId: req.correlationId || '',
          traceId: req.traceId || '',
          riskScore: 25
        }
      });

      return res.status(401).json({ error: 'Verification code is incorrect or expired.', code: 'INVALID_CODE' });
    }

    // Reset OTP fields on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpires: null,
        otpRetries: 0
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'OTP Verified',
        target: `/api/v1/auth/verify-2fa`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
    });

    return await establishSession(user, req, res);

  } catch (err) {
    logger.warn(`Temp token validation failed: ${err}`);
    return res.status(401).json({ error: 'Invalid or expired 2FA token sequence.', code: 'INVALID_TOKEN' });
  }
};

export const setupTotp = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(req.user.email, 'SuRakshaSetu', secret);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret }
    });

    return res.status(200).json({
      secret,
      otpauthUrl // QR code generator input URL
    });
  } catch (err) {
    next(err);
  }
};

export const confirmTotp = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  if (!req.user || !req.user.twoFactorSecret) {
    return res.status(400).json({ error: 'TOTP setup not initialized.' });
  }

  try {
    const isCodeValid = authenticator.verify({
      token: code.trim(),
      secret: req.user.twoFactorSecret
    });

    if (!isCodeValid) {
      return res.status(400).json({ error: 'Verification code is incorrect.' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorType: 'TOTP'
      }
    });

    logger.info(`TOTP successfully enabled for: ${req.user.email}`);
    return res.status(200).json({ message: 'TOTP Google Authenticator configured successfully.' });

  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent user enumeration security disclosures (NIST criteria)
      return res.status(200).json({ message: 'If the email exists, a password reset code has been sent.' });
    }

    // Generate a 6-digit verification code
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetOtp,
        resetTokenExpires: expires
      }
    });

    logger.info(`[DEMO PASSWORD RESET] Sent recovery OTP to ${email}: ${resetOtp}`);

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'Forgot Password Request',
        target: `/api/v1/auth/forgot-password`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
    });

    return res.status(200).json({
      message: 'Password reset code generated.',
      // Expose OTP in dev mode only
      ...(process.env.NODE_ENV !== 'production' ? { demoOtp: resetOtp } : {})
    });

  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    return res.status(400).json({ error: strengthError, code: 'WEAK_PASSWORD' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.resetToken || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Reset code is incorrect or has expired.', code: 'INVALID_TOKEN' });
    }

    if (user.resetToken !== code.trim()) {
      return res.status(400).json({ error: 'Reset code is incorrect or has expired.', code: 'INVALID_TOKEN' });
    }

    // Prevent password reuse (Phase 2 / Password History validation)
    const isSame = await verifyPassword(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: 'Cannot reuse your current security password.', code: 'PASSWORD_REUSE' });
    }

    const hashed = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed,
        resetToken: null,
        resetTokenExpires: null,
        failedAttempts: 0,
        status: 'ACTIVE'
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'Password Reset',
        target: `/api/v1/auth/reset-password`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
    });

    logger.info(`Password updated successfully for: ${email}`);
    return res.status(200).json({ message: 'Security password updated successfully.' });

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
    const session = await prisma.session.findUnique({ where: { refreshTokenHash: tokenHash } });
    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true }
      });
      
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'Logout',
          target: `/api/v1/auth/logout`,
          ip: req.ip || '127.0.0.1',
          device: req.headers['user-agent'] || 'Unknown',
          correlationId: req.correlationId || '',
          traceId: req.traceId || ''
        }
      });
    }

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
    await prisma.session.updateMany({
      where: { userId: req.user.id, isRevoked: false },
      data: { isRevoked: true }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'Global Logout',
        target: `/api/v1/auth/logout-all`,
        ip: req.ip || '127.0.0.1',
        device: req.headers['user-agent'] || 'Unknown',
        correlationId: req.correlationId || '',
        traceId: req.traceId || ''
      }
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

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        action: 'Force Logout',
        target: `/api/v1/auth/sessions/${sessionId}`,
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
