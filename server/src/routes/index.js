import { Router } from 'express';
import { health, publicConfig } from '../controllers/meta.controller.js';
import { listTracks } from '../controllers/playlists.controller.js';
import analyticsRoutes from './analytics.routes.js';
import authRoutes from './auth.routes.js';
import miniLoopRoutes from './miniloop.routes.js';
import playlistsRoutes from './playlists.routes.js';

const router = Router();

router.get('/health', health);
router.get('/config', publicConfig);
router.get('/tracks', listTracks);

router.use('/auth', authRoutes);
router.use('/playlists', playlistsRoutes);
router.use('/me/mini-loop', miniLoopRoutes);
router.use('/events', analyticsRoutes);

export default router;
