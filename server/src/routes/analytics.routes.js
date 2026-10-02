import { analyticsEventSchema } from '@beatnest/shared';
import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller.js';
import { analyticsLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.post('/', analyticsLimiter, validateBody(analyticsEventSchema), analytics.collect);

export default router;
