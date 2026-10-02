import { GUEST_MINI_LOOP_KEY } from '@beatnest/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { trackEvent } from '../lib/metrics.js';
import { api } from '../lib/api.js';
import { readJson, writeJson } from '../lib/storage.js';
import { useAuth } from './AuthContext.jsx';

const PlayerContext = createContext(null);
const PlayerTimeContext = createContext({ currentTime: 0, duration: 0 });

const PREFS_KEY = 'bn_player_prefs_v1';
const REPEAT_CYCLE = { off: 'all', all: 'one', one: 'off' };

function createAudioElement() {
  if (typeof Audio === 'undefined') return null;
  const audio = new Audio();
  audio.preload = 'metadata';
  return audio;
}

/* ----------------------------- pure helpers ----------------------------- */

function shuffleArray(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Play order as indices into `tracks`; the current track always comes first when shuffled. */
function buildOrder(count, shuffle, startIndex) {
  const natural = Array.from({ length: count }, (_, i) => i);
  if (!shuffle) return natural;
  return [startIndex, ...shuffleArray(natural.filter((i) => i !== startIndex))];
}

function loadPrefs() {
  const saved = readJson(PREFS_KEY, {});
  return {
    volume: typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 1,
    muted: Boolean(saved.muted),
    shuffle: Boolean(saved.shuffle),
    repeat: ['off', 'all', 'one'].includes(saved.repeat) ? saved.repeat : 'off',
  };
}

const initialState = {
  /** { type: 'playlist' | 'miniloop', slug?, title, cover? } */
  source: null,
  tracks: [],
  order: [],
  position: -1,
  /** idle | loading | playing | paused */
  status: 'idle',
  /** what the user asked for; the <audio> element follows this */
  pendingPlay: false,
  autoplayBlocked: false,
  error: null,
  /** saved Mini Loop (may or may not be the active source) */
  miniLoop: [],
  ...loadPrefs(),
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_SOURCE': {
      const { source, tracks, startIndex = 0, autoplay = true, repeat } = action;
      if (!tracks.length) {
        return { ...state, source, tracks: [], order: [], position: -1, status: 'idle', pendingPlay: false, error: null };
      }
      const safeStart = Math.min(Math.max(startIndex, 0), tracks.length - 1);
      const order = buildOrder(tracks.length, state.shuffle, safeStart);
      return {
        ...state,
        source,
        tracks,
        order,
        position: order.indexOf(safeStart),
        status: autoplay ? 'loading' : 'paused',
        pendingPlay: autoplay,
        autoplayBlocked: false,
        error: null,
        repeat: repeat ?? state.repeat,
      };
    }

    case 'PLAY_TRACK': {
      const { trackIndex } = action;
      if (!state.tracks[trackIndex]) return state;
      let { order } = state;
      let position = order.indexOf(trackIndex);
      if (position === -1) {
        // The track was removed from the queue earlier – append it back.
        order = [...order, trackIndex];
        position = order.length - 1;
      }
      return { ...state, order, position, status: 'loading', pendingPlay: true, error: null };
    }

    case 'STEP': {
      const { delta, fromEnded = false } = action;
      if (state.position < 0 || !state.order.length) return state;
      let next = state.position + delta;
      if (next >= state.order.length) {
        if (fromEnded && state.repeat === 'off') {
          return { ...state, status: 'paused', pendingPlay: false };
        }
        next = 0;
      }
      if (next < 0) next = state.order.length - 1;
      return { ...state, position: next, status: 'loading', pendingPlay: true, error: null };
    }

    case 'REQUEST_PLAY':
      return state.position < 0 ? state : { ...state, pendingPlay: true, error: null };
    case 'REQUEST_PAUSE':
      return { ...state, pendingPlay: false };

    case 'STATUS':
      return {
        ...state,
        status: action.status,
        autoplayBlocked: action.status === 'playing' ? false : state.autoplayBlocked,
      };
    case 'AUTOPLAY_BLOCKED':
      return { ...state, status: 'paused', pendingPlay: false, autoplayBlocked: true };
    case 'ERROR':
      return { ...state, status: 'paused', pendingPlay: false, error: action.message };

    case 'TOGGLE_SHUFFLE': {
      const shuffle = !state.shuffle;
      if (state.position < 0) return { ...state, shuffle };
      const current = state.order[state.position];
      const order = shuffle
        ? [current, ...shuffleArray(state.tracks.map((_, i) => i).filter((i) => i !== current))]
        : state.tracks.map((_, i) => i);
      return { ...state, shuffle, order, position: order.indexOf(current) };
    }

    case 'CYCLE_REPEAT':
      return { ...state, repeat: REPEAT_CYCLE[state.repeat] };
    case 'SET_VOLUME': {
      const volume = Math.min(1, Math.max(0, action.volume));
      return { ...state, volume, muted: volume === 0 ? state.muted : false };
    }
    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    case 'CLEAR_QUEUE':
      return state.position < 0 ? state : { ...state, order: state.order.slice(0, state.position + 1) };

    case 'CLEAR_LIBRARY':
      return {
        ...state,
        source: null,
        tracks: [],
        order: [],
        position: -1,
        status: 'idle',
        pendingPlay: false,
        error: null,
      };

    case 'SET_MINI_LOOP':
      return { ...state, miniLoop: action.tracks };

    default:
      return state;
  }
}

/* ------------------------------- provider ------------------------------- */

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState);
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const { status: authStatus, isAuthed, serverMiniLoop } = useAuth();

  const audioRef = useRef(null);
  if (audioRef.current == null) {
    audioRef.current = createAudioElement();
  }

  const currentTrackIndex = state.position >= 0 ? state.order[state.position] : -1;
  const currentTrack = currentTrackIndex >= 0 ? state.tracks[currentTrackIndex] : null;
  const currentUrl = currentTrack?.url ?? null;

  // Latest state for event handlers / actions created once (updated after each commit).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  /* ---- <audio> event wiring (once) ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const update = () =>
      setTime({
        currentTime: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    const onPlaying = () => dispatch({ type: 'STATUS', status: 'playing' });
    const onPause = () => {
      if (!audio.ended) dispatch({ type: 'STATUS', status: 'paused' });
    };
    const onWaiting = () => dispatch({ type: 'STATUS', status: 'loading' });
    const onEnded = () => dispatch({ type: 'STEP', delta: 1, fromEnded: true });
    const onError = () => {
      if (!audio.getAttribute('src')) return;
      dispatch({ type: 'ERROR', message: 'This track could not be loaded. Skip to the next one or try again.' });
    };

    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('durationchange', update);
    audio.addEventListener('loadstart', update);
    audio.addEventListener('emptied', update);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('durationchange', update);
      audio.removeEventListener('loadstart', update);
      audio.removeEventListener('emptied', update);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  /* ---- source url ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Time display resets through the audio 'emptied'/'loadstart' events.
    if (!currentUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }
    const absolute = new URL(currentUrl, window.location.href).href;
    if (audio.src !== absolute) {
      audio.src = currentUrl;
      audio.load();
    }
  }, [currentUrl]);

  /* ---- play / pause intent ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentUrl) return;
    if (!state.pendingPlay) {
      audio.pause();
      return;
    }
    const promise = audio.play();
    if (promise?.catch) {
      promise.catch((err) => {
        if (err?.name === 'NotAllowedError') dispatch({ type: 'AUTOPLAY_BLOCKED' });
        else if (err?.name !== 'AbortError') {
          dispatch({ type: 'ERROR', message: 'This track could not be played.' });
        }
      });
    }
  }, [state.pendingPlay, currentUrl, state.position]);

  /* ---- repeat-one / volume ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = state.repeat === 'one';
  }, [state.repeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = state.muted ? 0 : state.volume;
  }, [state.volume, state.muted]);

  /* ---- persist preferences ---- */
  useEffect(() => {
    writeJson(PREFS_KEY, {
      volume: state.volume,
      muted: state.muted,
      shuffle: state.shuffle,
      repeat: state.repeat,
    });
  }, [state.volume, state.muted, state.shuffle, state.repeat]);

  /* ---- Mini Loop: server for members, localStorage for guests ---- */
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'authed') {
      if (serverMiniLoop?.length) {
        dispatch({ type: 'SET_MINI_LOOP', tracks: serverMiniLoop });
      } else {
        // Carry a guest's loop over to the new account.
        const local = readJson(GUEST_MINI_LOOP_KEY, []);
        if (Array.isArray(local) && local.length) {
          dispatch({ type: 'SET_MINI_LOOP', tracks: local });
          api.setMiniLoop(local.map((t) => t.id)).catch(() => {});
        } else {
          dispatch({ type: 'SET_MINI_LOOP', tracks: [] });
        }
      }
    } else {
      const local = readJson(GUEST_MINI_LOOP_KEY, []);
      dispatch({ type: 'SET_MINI_LOOP', tracks: Array.isArray(local) ? local : [] });
    }
  }, [authStatus, serverMiniLoop]);

  /* ---- lock-screen / hardware media keys ---- */
  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;
    const ms = navigator.mediaSession;
    if (!currentTrack) {
      ms.metadata = null;
      return undefined;
    }
    const artwork = state.source?.cover?.src ?? '/icon-512.png';
    ms.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: state.source?.title ?? 'BeatNest',
      artwork: [{ src: artwork, sizes: '400x400', type: artwork.endsWith('.png') ? 'image/png' : 'image/webp' }],
    });
    const handlers = {
      play: () => dispatch({ type: 'REQUEST_PLAY' }),
      pause: () => dispatch({ type: 'REQUEST_PAUSE' }),
      previoustrack: () => dispatch({ type: 'STEP', delta: -1 }),
      nexttrack: () => dispatch({ type: 'STEP', delta: 1 }),
    };
    for (const [name, fn] of Object.entries(handlers)) {
      try {
        ms.setActionHandler(name, fn);
      } catch {
        /* unsupported action */
      }
    }
    return () => {
      for (const name of Object.keys(handlers)) {
        try {
          ms.setActionHandler(name, null);
        } catch {
          /* ignore */
        }
      }
    };
  }, [currentTrack, state.source]);

  /* ------------------------------- actions ------------------------------- */

  const persistMiniLoop = useCallback(
    async (tracks) => {
      if (isAuthed) {
        if (tracks.length) await api.setMiniLoop(tracks.map((t) => t.id));
        else await api.clearMiniLoop();
      } else {
        writeJson(GUEST_MINI_LOOP_KEY, tracks);
      }
    },
    [isAuthed],
  );

  const actions = useMemo(
    () => ({
      loadPlaylist(playlist, { startIndex = 0, autoplay = true } = {}) {
        dispatch({
          type: 'LOAD_SOURCE',
          source: { type: 'playlist', slug: playlist.slug, title: playlist.title, cover: playlist.cover },
          tracks: playlist.tracks,
          startIndex,
          autoplay,
        });
        if (autoplay) trackEvent('play_playlist', { playlist: playlist.slug });
      },
      playTrack(trackIndex) {
        const s = stateRef.current;
        const isCurrent = s.position >= 0 && s.order[s.position] === trackIndex;
        if (isCurrent) {
          dispatch({ type: s.pendingPlay ? 'REQUEST_PAUSE' : 'REQUEST_PLAY' });
          return;
        }
        dispatch({ type: 'PLAY_TRACK', trackIndex });
        const track = s.tracks[trackIndex];
        if (track) trackEvent('play_track', { playlist: s.source?.slug ?? 'miniloop', track: track.title });
      },
      play: () => dispatch({ type: 'REQUEST_PLAY' }),
      pause: () => dispatch({ type: 'REQUEST_PAUSE' }),
      toggle() {
        const s = stateRef.current;
        if (s.position < 0) return;
        dispatch({ type: s.pendingPlay ? 'REQUEST_PAUSE' : 'REQUEST_PLAY' });
      },
      next: () => dispatch({ type: 'STEP', delta: 1 }),
      prev() {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
        }
        dispatch({ type: 'STEP', delta: -1 });
      },
      seek(seconds) {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(audio.duration)) return;
        audio.currentTime = Math.min(Math.max(seconds, 0), audio.duration);
        setTime({ currentTime: audio.currentTime, duration: audio.duration });
      },
      setVolume: (volume) => dispatch({ type: 'SET_VOLUME', volume }),
      toggleMute: () => dispatch({ type: 'TOGGLE_MUTE' }),
      toggleShuffle: () => dispatch({ type: 'TOGGLE_SHUFFLE' }),
      cycleRepeat: () => dispatch({ type: 'CYCLE_REPEAT' }),
      clearQueue: () => dispatch({ type: 'CLEAR_QUEUE' }),
      clearLibrary: () => dispatch({ type: 'CLEAR_LIBRARY' }),

      async saveMiniLoop(tracks, { activate = true } = {}) {
        dispatch({ type: 'SET_MINI_LOOP', tracks });
        if (activate) {
          dispatch({
            type: 'LOAD_SOURCE',
            source: { type: 'miniloop', title: 'Mini Loop' },
            tracks,
            startIndex: 0,
            autoplay: true,
            repeat: 'all',
          });
        }
        trackEvent('mini_loop_saved', { count: tracks.length });
        await persistMiniLoop(tracks);
      },
      activateMiniLoop() {
        const { miniLoop } = stateRef.current;
        if (!miniLoop.length) return;
        dispatch({
          type: 'LOAD_SOURCE',
          source: { type: 'miniloop', title: 'Mini Loop' },
          tracks: miniLoop,
          startIndex: 0,
          autoplay: true,
          repeat: 'all',
        });
        trackEvent('mini_loop_played', { count: miniLoop.length });
      },
      async clearMiniLoop() {
        dispatch({ type: 'SET_MINI_LOOP', tracks: [] });
        if (stateRef.current.source?.type === 'miniloop') dispatch({ type: 'CLEAR_LIBRARY' });
        await persistMiniLoop([]);
      },
    }),
    [persistMiniLoop],
  );

  const queue = useMemo(
    () => state.order.slice(state.position + 1).map((i) => ({ ...state.tracks[i], trackIndex: i })),
    [state.order, state.position, state.tracks],
  );

  const value = useMemo(
    () => ({
      ...state,
      currentTrack,
      currentTrackIndex,
      queue,
      isPlaying: state.status === 'playing' || (state.pendingPlay && state.status === 'loading'),
      hasSource: state.tracks.length > 0,
      actions,
    }),
    [state, currentTrack, currentTrackIndex, queue, actions],
  );

  return (
    <PlayerContext.Provider value={value}>
      <PlayerTimeContext.Provider value={time}>{children}</PlayerTimeContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

/** Separate context so only the seek bar re-renders four times a second. */
export function usePlayerTime() {
  return useContext(PlayerTimeContext);
}
