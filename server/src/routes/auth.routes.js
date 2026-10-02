import { loginSchema, signupSchema } from '@beatnest/shared';
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { antiSpam } from '../middleware/antiSpam.js';
import { authLimiter, signupLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/form-token', auth.formToken);
router.get('/me', auth.me);

// Order matters: rate-limit -> bot checks -> schema validation -> handler
router.post('/signup', signupLimiter, antiSpam, validateBody(signupSchema), auth.signup);
router.post('/login', authLimiter, antiSpam, validateBody(loginSchema), auth.login);
router.post('/logout', auth.logout);

export default router;
