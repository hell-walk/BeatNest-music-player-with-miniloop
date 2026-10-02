import * as miniLoopService from '../services/miniloop.service.js';

/** GET /api/me/mini-loop */
export function get(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ tracks: miniLoopService.getMiniLoop(req.user.id) });
}

/** PUT /api/me/mini-loop  { trackIds: number[] } */
export function set(req, res) {
  const tracks = miniLoopService.setMiniLoop(req.user.id, req.validated.trackIds);
  res.json({ tracks });
}

/** DELETE /api/me/mini-loop */
export function clear(req, res) {
  miniLoopService.clearMiniLoop(req.user.id);
  res.status(204).end();
}
