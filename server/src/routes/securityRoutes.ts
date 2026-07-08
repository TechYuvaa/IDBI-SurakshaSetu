import { Router } from 'express';
import * as messageController from '../controllers/messageController.js';
import * as transactionController from '../controllers/transactionController.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { auditLogger } from '../middleware/auditLogger.js';
import { authGuard } from '../middleware/authGuard.js';

const router = Router();

// Message checker (rate limited, audited)
router.post('/check-message', apiLimiter, auditLogger('Message Check'), messageController.checkMessage);

// Transaction monitors (supporting both guest simulation logs and authenticated audits)
router.post('/check-transaction', apiLimiter, auditLogger('Transaction Check'), transactionController.checkTransaction);
router.get('/transactions', apiLimiter, transactionController.getTransactions);

export default router;
