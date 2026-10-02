import { usePlayer } from '../../context/PlayerContext.jsx';
import Button from '../ui/Button.jsx';
import TrackList from './TrackList.jsx';
import './library.css';

/** Sidebar with the loaded library (current source) and the upcoming queue. */
export default function LibraryPanel() {
  const { source, tracks, queue, currentTrackIndex, isPlaying, miniLoop, hasSource, actions } = usePlayer();

  return (
    <aside className="library" aria-label="Library and queue">
      <section className="library__section" aria-labelledby="library-heading">
        <div className="library__head">
          <h2 id="library-heading">Your Library</h2>
          {hasSource && (
            <Button variant="ghost" size="sm" onClick={actions.clearLibrary}>
              Clear
            </Button>
          )}
        </div>
        {source && (
          <p className="library__source">
            {source.type === 'miniloop' ? 'Mini Loop' : source.title}
            <span className="text-muted"> · {tracks.length} songs</span>
          </p>
        )}
        <TrackList
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          onSelect={actions.playTrack}
          emptyMessage={
            miniLoop.length ? (
              <>
                Nothing loaded yet.{' '}
                <button type="button" className="link-button" onClick={actions.activateMiniLoop}>
                  Play your Mini Loop
                </button>{' '}
                or choose a playlist.
              </>
            ) : (
              'Choose a playlist and its songs will appear here.'
            )
          }
        />
      </section>

      <section className="library__section" aria-labelledby="queue-heading">
        <div className="library__head">
          <h2 id="queue-heading">Up next</h2>
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={actions.clearQueue}>
              Clear
            </Button>
          )}
        </div>
        <TrackList
          tracks={queue}
          onSelect={actions.playTrack}
          emptyMessage={
            hasSource ? 'The queue is empty – this is the last song.' : 'Songs you play will line up here.'
          }
        />
      </section>
    </aside>
  );
}
