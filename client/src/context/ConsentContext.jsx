import { CONSENT_STORAGE_KEY } from '@beatnest/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setAnalyticsConsent } from '../lib/metrics.js';
import { readJson, writeJson } from '../lib/storage.js';

const ConsentContext = createContext(null);

/**
 * Cookie / analytics consent.
 * `consent` is null until the visitor decides; the decision is stored in
 * localStorage (not a cookie) so the banner itself needs no consent.
 */
export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => readJson(CONSENT_STORAGE_KEY, null));
  const [isOpen, setIsOpen] = useState(() => consent === null);

  useEffect(() => {
    // null while undecided: analytics stays off but early page views are queued
    // so they are not lost if the visitor accepts a moment later.
    setAnalyticsConsent(consent ? consent.analytics === true : null);
  }, [consent]);

  const decide = useCallback((analytics) => {
    const next = { version: 1, analytics, decidedAt: new Date().toISOString() };
    writeJson(CONSENT_STORAGE_KEY, next);
    setConsent(next);
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      isOpen,
      analyticsAllowed: consent?.analytics === true,
      acceptAll: () => decide(true),
      essentialOnly: () => decide(false),
      reopen: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [consent, isOpen, decide],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used inside <ConsentProvider>');
  return ctx;
}
