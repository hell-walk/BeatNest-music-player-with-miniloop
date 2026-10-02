import { useParams } from 'react-router';
import { PauseIcon, PlayIcon } from '../components/icons.jsx';
import LibraryPanel from '../components/library/LibraryPanel.jsx';
import TrackList from '../components/library/TrackList.jsx';
import PlaylistGrid from '../components/playlists/PlaylistGrid.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import PageLoader from '../components/ui/PageLoader.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import { usePlaylist, usePlaylists } from '../hooks/usePlaylists.js';
import { useSeo } from '../hooks/useSeo.js';
import NotFoundPage from './NotFoundPage.jsx';
import './pages.css';

export default function PlaylistPage() {
  const { slug } = useParams();
  const { playlist, loading, error, notFound } = usePlaylist(slug);
  const others = usePlaylists();
  const { actions, source, isPlaying, currentTrackIndex } = usePlayer();

  useSeo({
    title: playlist ? `${playlist.title} playlist` : 'Playlist',
    description: playlist
      ? `${playlist.description}. ${playlist.trackCount} songs to stream free on BeatNest.`
      : 'A playlist on BeatNest.',
    path: `/playlist/${slug}`,
    image: playlist?.cover.fallback,
    imageAlt: playlist?.cover.alt,
    type: 'music.playlist',
    noindex: notFound,
  });

  if (notFound) return <NotFoundPage />;
  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="page container">
        <Alert tone="error">Could not load this playlist ({error.message}).</Alert>
      </div>
    );
  }

  const isActive = source?.type === 'playlist' && source.slug === slug;
  const playing = isActive && isPlaying;

  const handlePlayAll = () => (isActive ? actions.toggle() : actions.loadPlaylist(playlist));
  const handleSelect = (index) =>
    isActive ? actions.playTrack(index) : actions.loadPlaylist(playlist, { startIndex: index });

  return (
    <div className="page container">
      <header className="playlist-hero">
        <picture>
          <source type="image/webp" srcSet={playlist.cover.srcSet} sizes="240px" />
          <img
            src={playlist.cover.fallback}
            alt={playlist.cover.alt}
            width={playlist.cover.width}
            height={playlist.cover.height}
            className="playlist-hero__cover"
            fetchPriority="high"
          />
        </picture>
        <div>
          <p className="hero__eyebrow">Playlist</p>
          <h1>{playlist.title}</h1>
          <p className="text-muted">
            {playlist.description} · {playlist.trackCount} songs
          </p>
          <div className="hero__cta">
            <Button variant="primary" size="lg" onClick={handlePlayAll}>
              {playing ? <PauseIcon /> : <PlayIcon />}
              {playing ? 'Pause' : 'Play all'}
            </Button>
          </div>
        </div>
      </header>

      <div className="home-grid">
        <section className="home-grid__main" aria-labelledby="songs-heading">
          <h2 id="songs-heading">Songs</h2>
          <TrackList
            tracks={playlist.tracks}
            currentTrackIndex={isActive ? currentTrackIndex : -1}
            isPlaying={isPlaying}
            onSelect={handleSelect}
          />

          <h2 className="more-heading">More playlists</h2>
          <PlaylistGrid
            playlists={others.playlists}
            loading={others.loading}
            error={others.error}
            onRetry={others.retry}
            exclude={slug}
          />
        </section>
        <LibraryPanel />
      </div>
    </div>
  );
}
