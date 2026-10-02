import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageView } from '../lib/metrics.js';

/** Fire a page_view on every client-side navigation (consent-gated inside). */
export function usePageViews() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
}

export { trackEvent } from '../lib/metrics.js';
