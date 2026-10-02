import * as analyticsService from '../services/analytics.service.js';

/** POST /api/events – only called by the client after cookie consent. */
export function collect(req, res) {
  analyticsService.recordEvent(req.validated);
  res.status(202).end();
}
