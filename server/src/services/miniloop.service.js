import { getDb, transaction } from '../db/connection.js';
import { badRequest } from '../utils/httpError.js';
import { getTracksByIds, toTrack } from './playlists.service.js';

export function getMiniLoop(userId) {
  return getDb()
    .prepare(
      `SELECT t.id, t.title, t.artist, t.position, t.file_name,
              p.slug AS playlist_slug, p.title AS playlist_title, p.folder
         FROM mini_loop_items m
         JOIN tracks t    ON t.id = m.track_id
         JOIN playlists p ON p.id = t.playlist_id
        WHERE m.user_id = ?
        ORDER BY m.position`,
    )
    .all(userId)
    .map(toTrack);
}

/** Replace the user's Mini Loop. Order of `trackIds` is preserved; duplicates dropped. */
export function setMiniLoop(userId, trackIds) {
  const unique = [...new Set(trackIds)];
  const tracks = getTracksByIds(unique);
  if (tracks.length !== unique.length) {
    throw badRequest('Some of those songs no longer exist', { trackIds: 'Unknown song selected' });
  }

  transaction((db) => {
    db.prepare('DELETE FROM mini_loop_items WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT INTO mini_loop_items (user_id, track_id, position) VALUES (?, ?, ?)');
    unique.forEach((trackId, position) => insert.run(userId, trackId, position));
  });

  return tracks;
}

export function clearMiniLoop(userId) {
  return getDb().prepare('DELETE FROM mini_loop_items WHERE user_id = ?').run(userId).changes;
}
