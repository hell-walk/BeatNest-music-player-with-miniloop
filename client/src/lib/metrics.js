/**
 * Consent-gated analytics façade.
 *
 *  - Nothing is loaded or sent until the user accepts analytics cookies.
 *  - Provider (first-party / plausible / ga4 / none) comes from GET /api/config,
 *    so the server's Content-Security-Policy always matches what we load.
 *  - Events fired before consent/config are known are queued briefly and
 *    flushed on acceptance, or dropped on refusal.
 */
import { api } from './api.js';

const SESSION_KEY = 'bn_sid';
const MAX_QUEUE = 20;

let providerConfig = null; // { provider, plausibleDomain, gaMeasurementId }
let consentGranted = null; // null = undecided, true / false
let started = false;
let queue = [];

export function configureAnalytics(config) {
  providerConfig = config ?? { provider: 'none' };
  maybeStart();
}

/** granted: true (accepted), false (declined), null (not decided yet – keep queueing). */
export function setAnalyticsConsent(granted) {
  consentGranted = granted === true ? true : granted === false ? false : null;
  if (consentGranted === false) {
    queue = [];
    started = false;
  }
  maybeStart();
}

export function isAnalyticsActive() {
  return started;
}

function maybeStart() {
  if (started || !providerConfig || consentGranted !== true) return;
  if (providerConfig.provider === 'none') {
    queue = [];
    return;
  }
  started = true;
  loadProvider(providerConfig);
  flush();
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function injectScript(src, attrs = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) s.setAttribute(k, '');
    else s.setAttribute(k, v);
  }
  document.head.appendChild(s);
}

function loadProvider(cfg) {
  if (cfg.provider === 'plausible' && cfg.plausibleDomain) {
    injectScript('https://plausible.io/js/script.js', { 'data-domain': cfg.plausibleDomain, defer: true });
  }
  if (cfg.provider === 'ga4' && cfg.gaMeasurementId) {
    window.dataLayer = window.dataLayer || [];
    // gtag.js requires the real `arguments` object to be pushed, not an array.
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', cfg.gaMeasurementId, { anonymize_ip: true, send_page_view: false });
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.gaMeasurementId)}`, {
      async: true,
    });
  }
}

const KEY_RE = /^[a-z][a-z0-9_]{0,39}$/;

function sanitizeProps(props) {
  if (!props || typeof props !== 'object') return undefined;
  const out = {};
  for (const [key, value] of Object.entries(props).slice(0, 10)) {
    if (!KEY_RE.test(key)) continue;
    if (typeof value === 'string') out[key] = value.slice(0, 200);
    else if (typeof value === 'number' || typeof value === 'boolean') out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function send({ name, path, props }) {
  switch (providerConfig?.provider) {
    case 'plausible':
      // The Plausible script tracks SPA page views itself; only forward custom events.
      if (name !== 'page_view') window.plausible?.(name, { props });
      break;
    case 'ga4':
      window.gtag?.('event', name, { ...props, page_path: path });
      break;
    case 'first-party':
      api.trackEvent({ name, path, sessionId: getSessionId(), ...(props ? { props } : {}) }).catch(() => {});
      break;
    default:
      break;
  }
}

function flush() {
  const pending = queue;
  queue = [];
  pending.forEach(send);
}

function enqueueOrSend(event) {
  if (started) send(event);
  else if (consentGranted !== false && queue.length < MAX_QUEUE) queue.push(event);
}

/** Custom event, e.g. trackEvent('play_track', { playlist: 'eminem' }). */
export function trackEvent(name, props) {
  if (!KEY_RE.test(name)) return;
  enqueueOrSend({ name, path: window.location.pathname, props: sanitizeProps(props) });
}

export function trackPageView(path = window.location.pathname) {
  enqueueOrSend({ name: 'page_view', path, props: undefined });
}
