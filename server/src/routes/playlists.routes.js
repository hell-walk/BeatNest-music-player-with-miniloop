import { Router } from 'express';
import * as playlists from '../controllers/playlists.controller.js';
import { notFound } from '../utils/httpError.js';

const router = Router();

router.get('/', playlists.list);

// Slugs are lower-case kebab-case; anything else is a 404 rather than a DB query.
router.get('/:slug', (req, _res, next) => {
  if (!/^[a-z0-9-]{1,60}$/.test(req.params.slug)) return next(notFound('Playlist not found'));
  next();
}, playlists.getBySlug);

export default router;
