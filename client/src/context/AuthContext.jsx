import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../lib/metrics.js';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Session state. The session itself is an httpOnly cookie the JS can't read;
 * we only hold the public user object returned by the API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | guest | authed
  const [serverMiniLoop, setServerMiniLoop] = useState(null);

  useEffect(() => {
    const ac = new AbortController();
    api
      .me(ac.signal)
      .then(({ user: me, miniLoop }) => {
        setUser(me);
        setServerMiniLoop(me ? miniLoop : null);
        setStatus(me ? 'authed' : 'guest');
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setStatus('guest');
      });
    return () => ac.abort();
  }, []);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setServerMiniLoop(data.miniLoop ?? []);
    setStatus('authed');
    return data;
  }, []);

  const login = useCallback(
    async (payload) => {
      const data = await api.login(payload);
      trackEvent('login');
      return applySession(data);
    },
    [applySession],
  );

  const signup = useCallback(
    async (payload) => {
      const data = await api.signup(payload);
      trackEvent('signup_completed');
      return applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setServerMiniLoop(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthed: status === 'authed', serverMiniLoop, login, signup, logout }),
    [user, status, serverMiniLoop, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
