import helmet from 'helmet';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Middleware to generate a dynamic cryptographically secure CSP Nonce for inline assets
export const cspNonce = (req: Request, res: Response, next: NextFunction) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
};

// Hardened Helmet header configuration
export const helmetConfig = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res: any) => `'nonce-${res.locals.nonce}'`],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://api.dicebear.com"],
        connectSrc: ["'self'", "https://api.openai.com"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      }
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true
    },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    crossOriginEmbedderPolicy: false, // set false to support standard resources
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' }
  });
};

// Permissions Policy to disable unused hardware devices
export const permissionsPolicy = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), usb=(), midi=()'
  );
  next();
};
