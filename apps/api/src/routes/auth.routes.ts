import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  getMeHandler,
} from '../controllers/auth.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Authentication Router (/api/v1/auth)
// ─────────────────────────────────────────────────────────────────────────────

const authRouter = Router();

authRouter.post('/register', authRateLimiter, registerHandler);
authRouter.post('/login', authRateLimiter, loginHandler);
authRouter.post('/logout', optionalAuth, logoutHandler);
authRouter.get('/me', requireAuth, getMeHandler);

export { authRouter };
