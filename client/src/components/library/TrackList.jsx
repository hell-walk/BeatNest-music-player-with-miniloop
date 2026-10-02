import { PlayIcon } from '../icons.jsx';
import './library.css';

/**
 * Clickable track rows. `tracks[i].trackIndex` (when present) is the index
 * inside the player's track array – used by the queue, which is a sub-list.
 */
export default function TrackList({ tracks, currentTrackIndex = -1, isPlaying = false, onSelect, emptyMessage }) {
  if (!tracks.length) {
    return <p className="tracklist__empty">{emptyMessage}</p>;
  }

  return (
    <ol className="tracklist">
      {tracks.map((track, i) => {
        const index = track.trackIndex ?? i;
        const active = index === currentTrackIndex;
        const verb = active ? (isPlaying ? 'Pause' : 'Play') : 'Play';
        return (
          <li key={`${track.id}-${index}`}>
            <button
              type="button"
              className={`track${active ? ' is-active' : ''}`}
              onClick={() => onSelect(index)}
              aria-current={active ? 'true' : undefined}
              aria-label={`${verb} ${track.title} by ${track.artist}`}
            >
              <span className="track__num" aria-hidden="true">
                {active && isPlaying ? (
                  <span className="eq">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : active ? (
                  <PlayIcon size={16} />
                ) : (
                  i + 1
                )}
              </span>
              <span className="track__meta">
                <span className="track__title">{track.title}</span>
                <span className="track__artist">{track.artist}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
