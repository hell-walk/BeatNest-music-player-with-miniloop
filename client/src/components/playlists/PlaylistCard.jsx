import { Link } from 'react-router';
import { useDominantColor } from '../../hooks/useDominantColor.js';
import { PauseIcon, PlayIcon } from '../icons.jsx';
import Button from '../ui/Button.jsx';
import './playlists.css';

export default function PlaylistCard({ playlist, onPlay, isActive = false, isPlaying = false, busy = false }) {
  const glow = useDominantColor(playlist.cover.src);
  const playing = isActive && isPlaying;

  return (
    <article className={`pcard${isActive ? ' is-active' : ''}`} style={glow ? { '--glow': glow } : undefined}>
      <Link to={playlist.href} className="pcard__link">
        <picture>
          <source type="image/webp" srcSet={playlist.cover.srcSet} sizes="(max-width: 639px) 45vw, 220px" />
          <img
            src={playlist.cover.fallback}
            alt={playlist.cover.alt}
            width={playlist.cover.width}
            height={playlist.cover.height}
            loading="lazy"
            decoding="async"
            className="pcard__img"
          />
        </picture>
        <h3 className="pcard__title">{playlist.title}</h3>
        <p className="pcard__desc">
          {playlist.description} · {playlist.trackCount} songs
        </p>
      </Link>
      <Button
        variant="icon"
        size="lg"
        className="pcard__play"
        aria-label={`${playing ? 'Pause' : 'Play'} ${playlist.title}`}
        onClick={() => onPlay(playlist)}
        loading={busy}
      >
        {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
      </Button>
    </article>
  );
}
