import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { log } from './config/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { inputSanitizer } from './middleware/inputSanitizer.js';
import { v1Router } from './routes/index.js';
import { API_PREFIX } from '@bis/shared';

// Health-check path bypasses rate limiter
const HEALTH_CHECK_PATH = `${API_PREFIX}/health`;

// ─────────────────────────────────────────────────────────────────────────────
//  Express Application
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ── Trust Proxy (must come first for accurate IP on rate-limiting) ────────────
// Set to 1 to trust the first reverse proxy (nginx/load-balancer). Change to 0
// in pure local setups without a proxy.
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);

// ── Remove server fingerprint header ─────────────────────────────────────────
app.disable('x-powered-by');

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // Content Security Policy: strict in production, relaxed in dev
    contentSecurityPolicy:
      env.NODE_ENV === 'production'
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'https:'],
              objectSrc: ["'none'"],
              mediaSrc: ["'none'"],
              frameSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    // Prevent MIME-type sniffing
    noSniff: true,
    // Strict transport security (only meaningful in production TLS)
    hsts:
      env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    // Prevent iframe embedding
    frameguard: { action: 'deny' },
    // Disable DNS prefetch
    dnsPrefetchControl: { allow: false },
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

// ── Permissions Policy (geolocation, camera, etc. disabled by default) ────────
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  );
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400, // 24h preflight cache
  }),
);

// ── Cookie Parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Body Parsing (with size limits) ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global Rate Limiting (all routes, health excluded) ───────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip health checks so load-balancers and probe monitors are not rate-limited
  skip: (req) => req.path.startsWith(HEALTH_CHECK_PATH) || req.path.startsWith('/health'),
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP address. Please try again later.',
    },
  },
});
app.use(limiter);

// ── Input Sanitization (strip HTML tags & null bytes from all JSON body fields) ──
app.use(inputSanitizer);

// ── Request Logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use(API_PREFIX, v1Router);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

log.info(`Application configured`, {
  environment: env.NODE_ENV,
  apiPrefix: API_PREFIX,
  corsOrigin: env.FRONTEND_URL,
});

export { app };
