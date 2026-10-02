import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx';
import { usePlaylists } from '../../hooks/usePlaylists.js';
import { formatTime } from '../../lib/format.js';
import { LogoMark } from '../icons.jsx';
import './NowPlayingCard.css';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * "Tape reel" now-playing card: the cover spins slowly like a record while a
 * ring around it fills with the song's progress. Shown at the top of the
 * library panel whenever something is loaded.
 */
export default function NowPlayingCard() {
  const { currentTrack, currentTrackIndex, tracks, source, isPlaying } = usePlayer();
  const { currentTime, duration } = usePlayerTime();
  const { playlists } = usePlaylists();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const isLoop = source?.type === 'miniloop';
  // A Mini Loop has no artwork of its own – borrow the current song's playlist cover.
  const cover = source?.cover ?? playlists.find((p) => p.slug === currentTrack.playlistSlug)?.cover;

  return (
    <section className={`npc${isPlaying ? ' is-playing' : ''}`} aria-label="Now playing">
      <div className="npc__reel">
        <svg className="npc__ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="npc__ring-track" cx="60" cy="60" r={RADIUS} />
          <circle
            className="npc__ring-progress"
            cx="60"
            cy="60"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="npc__disc">
          {cover ? (
            <img src={cover.src} alt="" width="92" height="92" decoding="async" />
          ) : (
            <LogoMark size={44} />
          )}
          <span className="npc__hole" aria-hidden="true" />
        </div>
      </div>

      <p className="npc__label">
        Track {currentTrackIndex + 1} of {tracks.length}
        {isLoop ? ' · Mini Loop' : source?.title ? ` · ${source.title}` : ''}
      </p>
      <p className="npc__title">{currentTrack.title}</p>
      <p className="npc__artist">{currentTrack.artist}</p>
      <p className="npc__time" aria-hidden="true">
        {formatTime(currentTime)} / {formatTime(duration)}
      </p>
      {isLoop && tracks.length > 1 && (
        <p className="npc__note">Loops back to {tracks[0].title}</p>
      )}
    </section>
  );
}
