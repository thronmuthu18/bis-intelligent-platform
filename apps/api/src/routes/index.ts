import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { productRouter } from './product.routes.js';
import { standardRouter } from './standard.routes.js';
import { knowledgeRouter } from './knowledge.routes.js';
import consumerRouter from './consumer.routes.js';
import i18nRouter from './i18n.routes.js';
import adminRouter from './admin.routes.js';
import { activityRouter } from './activity.routes.js';

// ─────────────────────────────────────────────────────────────────────────────
//  v1 API Router
// ─────────────────────────────────────────────────────────────────────────────

const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/products', productRouter);
v1Router.use('/standards', standardRouter);
v1Router.use('/knowledge', knowledgeRouter);
v1Router.use('/consumer', consumerRouter);
v1Router.use('/i18n', i18nRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/activity', activityRouter);

export { v1Router };
