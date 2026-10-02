import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { fetchPlaylist } from '../../hooks/usePlaylists.js';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import PlaylistCard from './PlaylistCard.jsx';
import './playlists.css';

const SKELETONS = Array.from({ length: 6 }, (_, i) => i);

export default function PlaylistGrid({ playlists, loading, error, onRetry, exclude }) {
  const { source, isPlaying, actions } = usePlayer();
  const [busySlug, setBusySlug] = useState(null);
  const [playError, setPlayError] = useState(null);

  const handlePlay = async (summary) => {
    if (source?.type === 'playlist' && source.slug === summary.slug) {
      actions.toggle();
      return;
    }
    setBusySlug(summary.slug);
    setPlayError(null);
    try {
      const playlist = await fetchPlaylist(summary.slug);
      actions.loadPlaylist(playlist);
    } catch (err) {
      setPlayError(err?.message ?? 'Could not load that playlist.');
    } finally {
      setBusySlug(null);
    }
  };

  if (error) {
    return (
      <Alert tone="error" className="pgrid__alert">
        Could not load playlists ({error.message}).{' '}
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </Alert>
    );
  }

  if (loading) {
    return (
      <ul className="pgrid" aria-busy="true" aria-label="Loading playlists">
        {SKELETONS.map((i) => (
          <li key={i} className="pcard pcard--skeleton" aria-hidden="true">
            <div className="pcard__img" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--short" />
          </li>
        ))}
      </ul>
    );
  }

  const visible = exclude ? playlists.filter((p) => p.slug !== exclude) : playlists;

  return (
    <>
      {playError && <Alert tone="error">{playError}</Alert>}
      <ul className="pgrid">
        {visible.map((playlist) => (
          <li key={playlist.slug}>
            <PlaylistCard
              playlist={playlist}
              onPlay={handlePlay}
              isActive={source?.type === 'playlist' && source.slug === playlist.slug}
              isPlaying={isPlaying}
              busy={busySlug === playlist.slug}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
