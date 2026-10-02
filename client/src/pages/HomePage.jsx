import { PAGE_ROUTES } from '@beatnest/shared';
import { useState } from 'react';
import LibraryPanel from '../components/library/LibraryPanel.jsx';
import PlaylistGrid from '../components/playlists/PlaylistGrid.jsx';
import Button from '../components/ui/Button.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { trackEvent } from '../hooks/useMetrics.js';
import { fetchPlaylist, usePlaylists } from '../hooks/usePlaylists.js';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

const HOME = PAGE_ROUTES.find((r) => r.path === '/');

export default function HomePage() {
  useSeo({ title: HOME.title, description: HOME.description, path: '/' });

  const { playlists, loading, error, retry } = usePlaylists();
  const { actions, hasSource, isPlaying } = usePlayer();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  /** The single primary call to action on this page. */
  const handleStart = async () => {
    trackEvent('cta_start_listening');
    if (hasSource) {
      if (!isPlaying) actions.play();
      document.getElementById('library-heading')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const first = playlists[0];
    if (!first) return;
    setStarting(true);
    setStartError(null);
    try {
      actions.loadPlaylist(await fetchPlaylist(first.slug));
    } catch (err) {
      setStartError(err?.message ?? 'Could not start playback.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="page container">
      <section className="hero" aria-labelledby="hero-title">
        <p className="hero__eyebrow">Free, quiet, no ads.</p>
        <h1 id="hero-title">Press play. Breathe out.</h1>
        <p className="hero__lead">
          Seven gentle playlists and a <strong>Mini Loop</strong> – up to seven songs that repeat for as long
          as you need them to.
        </p>
        <div className="hero__cta">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            loading={starting}
            disabled={loading || Boolean(error)}
          >
            Start listening
          </Button>
          {startError && (
            <p className="hero__error" role="alert">
              {startError}
            </p>
          )}
        </div>
      </section>

      <div className="home-grid">
        <section className="home-grid__main" aria-labelledby="playlists-heading">
          <h2 id="playlists-heading">Playlists</h2>
          <PlaylistGrid playlists={playlists} loading={loading} error={error} onRetry={retry} />
        </section>
        <LibraryPanel />
      </div>
    </div>
  );
}
