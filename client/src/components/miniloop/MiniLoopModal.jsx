import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfig } from '../../context/ConfigContext.jsx';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { api } from '../../lib/api.js';
import { CloseIcon } from '../icons.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import './MiniLoopModal.css';

function groupByPlaylist(tracks) {
  const groups = new Map();
  for (const track of tracks) {
    if (!groups.has(track.playlistSlug)) {
      groups.set(track.playlistSlug, { slug: track.playlistSlug, title: track.playlistTitle, tracks: [] });
    }
    groups.get(track.playlistSlug).tracks.push(track);
  }
  return [...groups.values()];
}

/**
 * Pick up to MINI_LOOP_MAX songs from the whole catalogue. Uses the native
 * <dialog> element: focus trapping, Esc and backdrop come for free.
 */
export default function MiniLoopModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const [tracks, setTracks] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // keep the <dialog> element in sync with the `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // load the catalogue once, the first time the dialog opens
  useEffect(() => {
    if (!open || tracks) return undefined;
    const ac = new AbortController();
    api
      .getTracks(ac.signal)
      .then((data) => {
        setTracks(data.tracks);
        setLoadError(null);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setLoadError(err.message);
      });
    return () => ac.abort();
  }, [open, tracks]);

  return (
    <dialog
      ref={dialogRef}
      className="miniloop-modal"
      aria-labelledby="miniloop-title"
      aria-describedby="miniloop-desc"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {/* Mounted only while open, so selection state resets on every open. */}
      {open && <MiniLoopForm tracks={tracks} loadError={loadError} onClose={onClose} />}
    </dialog>
  );
}

function MiniLoopForm({ tracks, loadError, onClose }) {
  const { miniLoop, actions } = usePlayer();
  const { miniLoopMax } = useConfig();
  const [selected, setSelected] = useState(() => miniLoop.map((t) => t.id));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const groups = useMemo(() => (tracks ? groupByPlaylist(tracks) : []), [tracks]);
  const atMax = selected.length >= miniLoopMax;

  const toggleTrack = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return prev.length >= miniLoopMax ? prev : [...prev, id];
    });
  };

  const handleSave = async () => {
    const chosen = selected.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    setSaving(true);
    setSaveError(null);
    try {
      await actions.saveMiniLoop(chosen, { activate: true });
      onClose();
    } catch (err) {
      setSaveError(err?.message ?? 'Could not save your Mini Loop.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await actions.clearMiniLoop();
      onClose();
    } catch (err) {
      setSaveError(err?.message ?? 'Could not clear your Mini Loop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="miniloop-modal__panel">
      <header className="miniloop-modal__header">
        <div>
          <h2 id="miniloop-title">Build your Mini Loop</h2>
          <p id="miniloop-desc">Pick up to {miniLoopMax} songs from any playlist. They play back to back, on repeat.</p>
        </div>
        <Button variant="icon" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </Button>
      </header>

      {/* ordered "tape slots" – the loop plays in this order and wraps back to 01 */}
      <ol className="loop-ribbon" aria-label={`${selected.length} of ${miniLoopMax} slots filled`}>
        {Array.from({ length: miniLoopMax }, (_, i) => {
          const track = tracks?.find((t) => t.id === selected[i]);
          return (
            <li key={i} className={`loop-ribbon__slot${track ? ' is-filled' : ''}`}>
              <span className="loop-ribbon__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="loop-ribbon__title">{track ? track.title : 'Empty'}</span>
            </li>
          );
        })}
      </ol>

      <div className="miniloop-modal__body">
        {loadError && <Alert tone="error">Could not load songs: {loadError}</Alert>}
        {!loadError && !tracks && (
          <div className="miniloop-modal__loading">
            <Spinner label="Loading songs" />
          </div>
        )}
        {groups.map((group) => (
          <fieldset key={group.slug} className="miniloop-group">
            <legend>{group.title}</legend>
            <ul>
              {group.tracks.map((track) => {
                const checked = selected.includes(track.id);
                const disabled = !checked && atMax;
                return (
                  <li key={track.id}>
                    <label className={`miniloop-option${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        aria-label={`${track.title} by ${track.artist}`}
                        onChange={() => toggleTrack(track.id)}
                      />
                      <span className="miniloop-option__title">{track.title}</span>
                      <span className="miniloop-option__artist">{track.artist}</span>
                      {checked && (
                        <span className="miniloop-option__slot">
                          Slot {String(selected.indexOf(track.id) + 1).padStart(2, '0')}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>

      <footer className="miniloop-modal__footer">
        <p className="miniloop-modal__count" aria-live="polite">
          {selected.length} / {miniLoopMax} selected{atMax ? ' – that is the maximum' : ''}
        </p>
        {saveError && <Alert tone="error">{saveError}</Alert>}
        <div className="miniloop-modal__actions">
          {miniLoop.length > 0 && (
            <Button variant="danger" onClick={handleClear} disabled={saving}>
              Clear saved loop
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!selected.length || !tracks} loading={saving}>
            Save &amp; play
          </Button>
        </div>
      </footer>
    </div>
  );
}
