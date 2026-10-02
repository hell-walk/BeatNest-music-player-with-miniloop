/**
 * Static, indexable pages. This single list drives:
 *  - the client router
 *  - sitemap.xml generation
 *  - the server's decision to answer unknown paths with a real HTTP 404
 */
export const PAGE_ROUTES = [
  {
    path: '/',
    title: 'BeatNest – Free music player with Mini Loop',
    description:
      'Stream curated playlists and build a Mini Loop of up to seven songs that repeat back to back. Free, fast and ad-free.',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    path: '/signup',
    title: 'Create your free BeatNest account',
    description: 'Sign up to save your Mini Loop and pick up where you left off on any device.',
    changefreq: 'monthly',
    priority: 0.6,
  },
  {
    path: '/login',
    title: 'Log in to BeatNest',
    description: 'Log in to BeatNest to access your saved Mini Loop.',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy – BeatNest',
    description: 'How BeatNest collects, uses and protects your data, and the cookies we set.',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    path: '/terms',
    title: 'Terms & Conditions – BeatNest',
    description: 'The terms that apply when you use the BeatNest music player.',
    changefreq: 'yearly',
    priority: 0.3,
  },
];

export const PAGE_PATHS = PAGE_ROUTES.map((r) => r.path);

/** Pattern for the dynamic playlist page: /playlist/<slug> */
export const PLAYLIST_PATH_RE = /^\/playlist\/([a-z0-9-]{1,60})$/;

/** Normalise a pathname: strip query/hash and any trailing slash (except root). */
export function normalizePath(pathname = '/') {
  let p = String(pathname).split(/[?#]/)[0] || '/';
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function isStaticPagePath(pathname) {
  return PAGE_PATHS.includes(normalizePath(pathname));
}

export function playlistSlugFromPath(pathname) {
  const m = PLAYLIST_PATH_RE.exec(normalizePath(pathname));
  return m ? m[1] : null;
}
