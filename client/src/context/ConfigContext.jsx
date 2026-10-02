import { MINI_LOOP_MAX } from '@beatnest/shared';
import { createContext, useContext, useEffect, useState } from 'react';
import { configureAnalytics } from '../lib/metrics.js';
import { api } from '../lib/api.js';

const DEFAULT_CONFIG = {
  siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
  miniLoopMax: MINI_LOOP_MAX,
  analytics: { provider: 'none', plausibleDomain: null, gaMeasurementId: null },
  loaded: false,
};

const ConfigContext = createContext(DEFAULT_CONFIG);

/** Public, non-secret runtime settings fetched from the API once per load. */
export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    const ac = new AbortController();
    api
      .getConfig(ac.signal)
      .then((cfg) => {
        setConfig({ ...DEFAULT_CONFIG, ...cfg, loaded: true });
        configureAnalytics(cfg.analytics);
      })
      .catch(() => {
        // Offline / API down: keep defaults, analytics stays off.
        configureAnalytics({ provider: 'none' });
      });
    return () => ac.abort();
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
