import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Tiny in-memory cache: the catalogue rarely changes within a session.
const cache = { list: null, bySlug: new Map() };

export async function fetchPlaylist(slug, signal) {
  if (cache.bySlug.has(slug)) return cache.bySlug.get(slug);
  const { playlist } = await api.getPlaylist(slug, signal);
  cache.bySlug.set(slug, playlist);
  return playlist;
}

export function usePlaylists() {
  const [state, setState] = useState(() => ({ data: cache.list, loading: !cache.list, error: null }));

  const load = useCallback(async (signal) => {
    setState((s) => ({ ...s, loading: !cache.list, error: null }));
    try {
      const { playlists } = await api.getPlaylists(signal);
      cache.list = playlists;
      setState({ data: playlists, loading: false, error: null });
    } catch (err) {
      if (err?.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return { playlists: state.data ?? [], loading: state.loading, error: state.error, retry: () => load() };
}

export function usePlaylist(slug) {
  // State is keyed by slug; when the route changes the stale entry is simply
  // ignored (derived below) instead of being reset inside an effect.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (cache.bySlug.has(slug)) return undefined;
    const ac = new AbortController();
    fetchPlaylist(slug, ac.signal)
      .then((playlist) => setResult({ slug, data: playlist, error: null }))
      .catch((err) => {
        if (err?.name !== 'AbortError') setResult({ slug, data: null, error: err });
      });
    return () => ac.abort();
  }, [slug]);

  const cached = cache.bySlug.get(slug);
  const current = cached
    ? { data: cached, error: null, loading: false }
    : result?.slug === slug
      ? { data: result.data, error: result.error, loading: false }
      : { data: null, error: null, loading: true };

  return {
    playlist: current.data,
    loading: current.loading,
    error: current.error,
    notFound: current.error?.status === 404,
  };
}
