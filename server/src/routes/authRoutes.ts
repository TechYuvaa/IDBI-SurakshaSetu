import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authGuard } from '../middleware/authGuard.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = Router();

// Rate limited public auth routes
router.post('/register', authLimiter, auditLogger('User Register'), authController.register);
router.post('/login', authLimiter, auditLogger('User Login'), authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.post('/logout', authController.logout);

// 2FA & Verification routes
router.post('/verify-2fa', authLimiter, authController.verify2fa);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected session & MFA management routes
router.post('/setup-totp', authGuard, authController.setupTotp);
router.post('/confirm-totp', authGuard, auditLogger('Setup TOTP MFA'), authController.confirmTotp);
router.post('/logout-all', authGuard, auditLogger('Global Logout'), authController.logoutAll);
router.get('/sessions', authGuard, authController.getSessions);
router.delete('/sessions/:sessionId', authGuard, auditLogger('Revoke Session'), authController.revokeSession);

export default router;
