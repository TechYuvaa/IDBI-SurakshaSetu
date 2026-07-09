/**
 * Vercel Serverless Function - Primary API Handler
 * 
 * This file is the single entrypoint for all /api/* requests on Vercel.
 * It imports the compiled Express app from server/dist/app.js which is
 * generated during the build step by TypeScript compiler.
 * 
 * IMPORTANT: This file must remain as .js (not .ts) so Vercel's
 * Node.js 20.x runtime can execute it directly without transpilation.
 */

// Ensure VERCEL env flag is set before any module loads
process.env.VERCEL = '1';

// Cache the Express app instance across warm invocations
let expressApp = null;

async function loadApp() {
  if (expressApp) return expressApp;

  try {
    // Import compiled Express server from server/dist/app.js
    // This path is relative to /var/task/ on Vercel (project root)
    const mod = await import('../server/dist/app.js');
    expressApp = mod.default;
    return expressApp;
  } catch (err) {
    console.error('[Vercel] CRITICAL: Failed to load Express app:', err.message);
    console.error('[Vercel] Stack:', err.stack);
    throw err;
  }
}

// Export the Vercel-compatible serverless handler
export default async function handler(req, res) {
  // Always set JSON content type before anything else
  // This ensures even crash errors return JSON not HTML
  res.setHeader('Content-Type', 'application/json');

  try {
    const app = await loadApp();
    
    // Delegate the request to the Express app
    return await new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err) {
    console.error('[Vercel Handler] Unhandled error:', err.message);
    
    // Prevent double-send if Express already wrote headers
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        code: 'FUNCTION_INVOCATION_FAILED',
        message: process.env.NODE_ENV !== 'production'
          ? err.message
          : 'The server encountered an unexpected error. Please try again.'
      });
    }
  }
}
