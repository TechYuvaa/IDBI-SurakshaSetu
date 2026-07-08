// Vercel Serverless Function Entry Point
// This file MUST be CommonJS (.js) so Vercel's Node.js runtime can execute it directly.
// It dynamically imports the compiled Express app from server/dist/app.js
// which is generated during the build step (npm run build --prefix server).

import { createRequire } from 'module';

// Load dotenv first to ensure DATABASE_URL and JWT_SECRET are available
// before Prisma or JWT modules initialize.
const require = createRequire(import.meta.url);
const path = require('path');
const dotenv = require('dotenv');

// Load .env from the server directory
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Set VERCEL flag so the Express app skips app.listen() and file-based logging
process.env.VERCEL = '1';

// Dynamically import the compiled Express app from server/dist/app.js
// (TypeScript compiled output, generated during build step)
let appHandler = null;

const getApp = async () => {
  if (appHandler) return appHandler;
  const mod = await import('../server/dist/app.js');
  appHandler = mod.default;
  return appHandler;
};

// Vercel serverless handler - receives every /api/* request
export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('[Vercel Handler] Failed to load Express app:', err);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      code: 'HANDLER_LOAD_FAILED',
      message: process.env.NODE_ENV !== 'production' ? err.message : 'Service temporarily unavailable.'
    });
  }
}
