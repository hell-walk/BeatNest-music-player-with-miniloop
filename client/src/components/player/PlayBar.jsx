import { useEffect, useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import {
  MiniLoopIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from '../icons.jsx';
import MiniLoopModal from '../miniloop/MiniLoopModal.jsx';
import Button from '../ui/Button.jsx';
import SeekBar from './SeekBar.jsx';
import VolumeControl from './VolumeControl.jsx';
import './PlayBar.css';

const REPEAT_LABEL = { off: 'Repeat: off', all: 'Repeat: all', one: 'Repeat: this song' };

export default function PlayBar() {
  const { currentTrack, isPlaying, status, hasSource, shuffle, repeat, autoplayBlocked, error, source, miniLoop, actions } =
    usePlayer();
  const [miniLoopOpen, setMiniLoopOpen] = useState(false);

  // Space bar toggles playback when focus is not inside a control.
  useEffect(() => {
    const onKey = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      const target = event.target;
      if (target?.closest?.('input, textarea, select, button, a, dialog, [contenteditable]')) return;
      event.preventDefault();
      actions.toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);

  const playLabel = isPlaying ? 'Pause' : 'Play';

  return (
    <section className="playbar" aria-label="Now playing" data-status={status}>
      <SeekBar />
      <div className="playbar__inner container">
        <div className="playbar__info" aria-live="polite" aria-atomic="true">
          {currentTrack ? (
            <>
              <p className="playbar__title">{currentTrack.title}</p>
              <p className="playbar__artist">
                {currentTrack.artist}
                {source?.title ? <span className="playbar__source"> · {source.title}</span> : null}
              </p>
            </>
          ) : (
            <p className="playbar__artist">Pick a playlist to start listening</p>
          )}
          {error && (
            <p className="playbar__notice" role="alert">
              {error}
            </p>
          )}
          {!error && autoplayBlocked && (
            <p className="playbar__notice">Your browser blocked autoplay – press play to start.</p>
          )}
        </div>

        <div className="playbar__controls" role="group" aria-label="Playback controls">
          <Button
            variant="icon"
            aria-label={shuffle ? 'Shuffle: on' : 'Shuffle: off'}
            aria-pressed={shuffle}
            active={shuffle}
            onClick={actions.toggleShuffle}
            disabled={!hasSource}
          >
            <ShuffleIcon size={20} />
          </Button>
          <Button variant="icon" aria-label="Previous song" onClick={actions.prev} disabled={!hasSource}>
            <PrevIcon />
          </Button>
          <Button
            variant="icon"
            size="lg"
            className="playbar__play"
            aria-label={playLabel}
            onClick={actions.toggle}
            disabled={!hasSource}
          >
            {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
          </Button>
          <Button variant="icon" aria-label="Next song" onClick={actions.next} disabled={!hasSource}>
            <NextIcon />
          </Button>
          <Button
            variant="icon"
            aria-label={REPEAT_LABEL[repeat]}
            active={repeat !== 'off'}
            onClick={actions.cycleRepeat}
            disabled={!hasSource}
          >
            {repeat === 'one' ? <RepeatOneIcon size={20} /> : <RepeatIcon size={20} />}
          </Button>
        </div>

        <div className="playbar__extras">
          <Button
            variant="secondary"
            size="sm"
            className="playbar__miniloop"
            onClick={() => setMiniLoopOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Mini Loop${miniLoop.length ? ` (${miniLoop.length} songs saved)` : ''}`}
            active={source?.type === 'miniloop'}
          >
            <MiniLoopIcon size={18} />
            <span>Mini Loop{miniLoop.length ? ` (${miniLoop.length})` : ''}</span>
          </Button>
          <VolumeControl />
        </div>
      </div>

      <MiniLoopModal open={miniLoopOpen} onClose={() => setMiniLoopOpen(false)} />
    </section>
  );
}
