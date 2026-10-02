import { miniLoopSchema } from '@beatnest/shared';
import { Router } from 'express';
import * as miniLoop from '../controllers/miniloop.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', miniLoop.get);
router.put('/', validateBody(miniLoopSchema), miniLoop.set);
router.delete('/', miniLoop.clear);

export default router;
