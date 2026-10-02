import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { closeDb, getDb, transaction } from './connection.js';

const SEED_FILE = path.join(import.meta.dirname, '../../data/seed/playlists.json');

/**
 * Upsert playlists and tracks from data/seed/playlists.json.
 * Safe to run repeatedly: existing rows are updated in place, so user
 * Mini Loops that reference track ids survive a re-seed.
 */
export function seedDatabase({ seedFile = SEED_FILE, mediaDir = env.MEDIA_DIR } = {}) {
  const playlists = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  const stats = { playlists: 0, tracks: 0, missingFiles: [] };

  transaction((db) => {
    const upsertPlaylist = db.prepare(`
      INSERT INTO playlists (slug, title, description, cover_slug, folder, position)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        cover_slug = excluded.cover_slug,
        folder = excluded.folder,
        position = excluded.position
    `);
    const getPlaylistId = db.prepare('SELECT id FROM playlists WHERE slug = ?');
    const upsertTrack = db.prepare(`
      INSERT INTO tracks (playlist_id, title, artist, file_name, position)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(playlist_id, file_name) DO UPDATE SET
        title = excluded.title,
        artist = excluded.artist,
        position = excluded.position
    `);

    playlists.forEach((pl, index) => {
      upsertPlaylist.run(pl.slug, pl.title, pl.description ?? '', pl.cover ?? pl.slug, pl.folder, index);
      const { id: playlistId } = getPlaylistId.get(pl.slug);
      stats.playlists += 1;

      pl.tracks.forEach((track, position) => {
        const absolute = path.join(mediaDir, 'music', pl.folder, track.file);
        if (!fs.existsSync(absolute)) {
          stats.missingFiles.push(path.relative(mediaDir, absolute));
        }
        upsertTrack.run(playlistId, track.title, track.artist ?? '', track.file, position);
        stats.tracks += 1;
      });
    });
  });

  return stats;
}

/** Seed only when the catalogue is empty (used at server start-up). */
export function seedIfEmpty() {
  const db = getDb();
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM playlists').get();
  if (n > 0) return null;
  const stats = seedDatabase();
  logger.info('seeded empty database', stats);
  return stats;
}

// Allow `npm run seed`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  getDb();
  const stats = seedDatabase();
  logger.info('seed complete', { playlists: stats.playlists, tracks: stats.tracks });
  if (stats.missingFiles.length) {
    logger.warn('seeded tracks whose audio file is missing on disk', { files: stats.missingFiles });
  }
  closeDb();
}
