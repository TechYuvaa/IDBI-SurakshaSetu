import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { prisma } from './config/db.js';
import { cache } from './config/redis.js';
import { logger } from './config/logger.js';
import { helmetConfig, cspNonce, permissionsPolicy } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import crypto from 'crypto';

// Load Environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Cookie Parser is critical for reading JWT Refresh Tokens in HttpOnly cookies
app.use(cookieParser());

// 1. Strict Security Headers (Helmet, CSP Nonces, Permissions-Policy)
app.use(cspNonce);
app.use(helmetConfig());
app.use(permissionsPolicy);

// 2. Dynamic CORS Configuration (Phase 9)
const allowedOrigins = ['http://localhost:8080', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isVercel = origin.endsWith('.vercel.app');
    const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (allowedOrigins.includes(origin) || isVercel || isLocal) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Trace-ID', 'Idempotency-Key']
}));

// 3. Strict Payload Parsing Limits (Max 5MB to protect against Zip/Payload DOS)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 4. Mount API Routes directly matching client routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', securityRoutes);

// 5. Observability: Liveness & Readiness Health Checks (Phase 9/11)
app.get('/health', async (req, res) => {
  let dbStatus = 'HEALTHY';
  let redisStatus = cache.isConnected() ? 'HEALTHY' : 'DEGRADED (FALLBACK ON)';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = 'UNHEALTHY';
  }

  const isHealthy = dbStatus === 'HEALTHY';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      cache: redisStatus
    }
  });
});

// 6. Centralized Error Handler Middleware
app.use(errorHandler);

// Helper to hash default seed passwords
const hashPassword = async (password: string): Promise<string> => {
  try {
    let argon2: any = null;
    try {
      argon2 = await import('argon2');
    } catch(e) {}
    if (argon2) {
      return await argon2.hash(password, { type: 2 });
    }
  } catch (e) {}
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
};

// Seed default users if database is empty
const seedDefaultUser = async () => {
  try {
    // 1. Check/create default customer account
    const customerCount = await prisma.user.count({ where: { email: 'raj.kumar@example.com' } });
    if (customerCount === 0) {
      const defaultHash = await hashPassword('password123');
      await prisma.user.create({
        data: {
          email: 'raj.kumar@example.com',
          passwordHash: defaultHash,
          role: 'CUSTOMER',
          twoFactorEnabled: true,
          twoFactorType: 'EMAIL',
          profile: {
            create: {
              fullName: 'Raj Kumar',
              location: 'Mumbai, India',
              panEncrypted: 'ABCPK1234A',
              aadhaarEncrypted: 'XXXX-XXXX-7890'
            }
          }
        }
      });
      logger.info('Database seeded with customer user: raj.kumar@example.com / password123');
    }

    // 2. Check/create default admin account
    const adminCount = await prisma.user.count({ where: { email: 'admin@surakshasetu.com' } });
    if (adminCount === 0) {
      const adminHash = await hashPassword('Admin@12345');
      await prisma.user.create({
        data: {
          email: 'admin@surakshasetu.com',
          passwordHash: adminHash,
          role: 'ADMIN',
          twoFactorEnabled: true,
          twoFactorType: 'EMAIL',
          profile: {
            create: {
              fullName: 'System Admin',
              location: 'Bangalore, India',
              panEncrypted: 'ADMIP9999Z',
              aadhaarEncrypted: 'XXXX-XXXX-1111'
            }
          }
        }
      });
      logger.info('Database seeded with admin user: admin@surakshasetu.com / Admin@12345');
    }
  } catch (err: any) {
    logger.error(`Database seeding failed: ${err.message}`);
  }
};

// Start Server listening port only when not running as a Vercel Serverless Function
if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    logger.info(`Enterprise Security and Analytics Server listening on port ${PORT}`);
    await seedDefaultUser();
  });
} else {
  // On Vercel, run seed check once during module load, failing silently to prevent container boot crash
  seedDefaultUser().catch(err => {
    logger.error(`Database seeding failed on Vercel: ${err.message}`);
  });
}

export default app;
