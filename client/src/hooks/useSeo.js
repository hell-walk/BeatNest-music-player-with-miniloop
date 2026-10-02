import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const SITE_NAME = 'BeatNest';
const DEFAULT_IMAGE = '/og-image.png';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Keep <title>, description, canonical and social tags in sync with the
 * current page. Updates the existing tags from index.html in place, so there
 * is a single source of truth for crawlers and for the running app.
 */
export function useSeo({ title, description, path, image, imageAlt, type = 'website', noindex = false }) {
  const { siteUrl } = useConfig();

  useEffect(() => {
    const base = (siteUrl || window.location.origin).replace(/\/+$/, '');
    const pathname = path ?? window.location.pathname;
    const url = `${base}${pathname === '/' ? '/' : pathname}`;
    const fullTitle = title ? (title.includes(SITE_NAME) ? title : `${title} – ${SITE_NAME}`) : SITE_NAME;
    const img = new URL(image || DEFAULT_IMAGE, base + '/').href;

    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:image:alt', imageAlt ?? 'BeatNest logo – headphones around a music note');

    upsertMeta('name', 'twitter:card', image ? 'summary' : 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', img);

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : null);
  }, [siteUrl, title, description, path, image, imageAlt, type, noindex]);
}
