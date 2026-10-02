import * as playlistsService from '../services/playlists.service.js';
import { notFound } from '../utils/httpError.js';

const CATALOGUE_CACHE = 'public, max-age=300, stale-while-revalidate=600';

/** GET /api/playlists */
export function list(_req, res) {
  res.setHeader('Cache-Control', CATALOGUE_CACHE);
  res.json({ playlists: playlistsService.listPlaylists() });
}

/** GET /api/playlists/:slug */
export function getBySlug(req, res) {
  const playlist = playlistsService.getPlaylistBySlug(req.params.slug);
  if (!playlist) throw notFound('Playlist not found');
  res.setHeader('Cache-Control', CATALOGUE_CACHE);
  res.json({ playlist });
}

/** GET /api/tracks – flat list used by the Mini Loop picker. */
export function listTracks(_req, res) {
  res.setHeader('Cache-Control', CATALOGUE_CACHE);
  res.json({ tracks: playlistsService.listAllTracks() });
}
