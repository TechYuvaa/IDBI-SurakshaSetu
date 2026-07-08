import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authGuard, requireRole } from '../middleware/authGuard.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = Router();

// Secure admin actions protected with JWT Auth and RBAC Role checks
router.get('/metrics', authGuard, requireRole(['ADMIN', 'SUPER_ADMIN']), adminController.getMetrics);
router.delete('/sessions/:sessionId', authGuard, requireRole(['ADMIN', 'SUPER_ADMIN']), auditLogger('Force Logout Session'), adminController.forceLogoutSession);

export default router;
