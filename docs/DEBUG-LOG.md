# Debug log – bugs found in v1 and how v2 fixes them

Source: the original `index.html`, `script.js`, `css/`, `miniloop/`, `htmlwaste/` (now in `legacy/`).

## Functional bugs

| # | Bug in v1 | Effect | Fix in v2 |
| --- | --- | --- | --- |
| 1 | `svg/playbar/play.svg` and `pause.svg` contained each other's artwork. | The play bar showed a "play" triangle while music was playing and "pause" bars while paused. | Inline SVG icon components (`components/icons.jsx`) with correct semantics. |
| 2 | `playNextInMiniLoop()` called `playSong(miniLoopQueue[i])` – passing a track **object** where an **index** was expected. | Mini Loop never advanced to the next song (next/prev/ended did nothing). | Player reducer works on indices into one `tracks` array; Mini Loop is just another source. |
| 3 | Two elements with `id="clearMiniLoopBtn"` (play bar and modal). | `getElementById` wired only the first; the modal's Clear button was dead. | React components, no global ids. |
| 4 | `data.json` fetched three separate times (`/data.json` absolute path). | Broke when not served from the web root; extra requests. | Catalogue comes from `/api/playlists`, `/api/tracks`, cached client-side. |
| 5 | `seekbar` click with `audio.duration = NaN` set `currentTime = NaN`. | Console error / no-op before metadata loaded. | `SeekBar` is disabled until duration is known; `seek()` clamps. |
| 6 | Loop mode made "Next" replay the same song. | Confusing: next button appeared broken. | Next always advances; repeat only affects what happens when a song ends. |
| 7 | Shuffle history started as `[current]` and pushed `current` again on every next. | "Previous" in shuffle replayed the same song once before going back. | Shuffled order is an explicit array; prev/next step through it. |
| 8 | Login/signup forms had no submit handler, no validation beyond `required`, no backend. | Buttons did nothing; internal links opened in new tabs. | Real `/api/auth/*` with zod validation on both sides, sessions, CSRF, rate limiting. |
| 9 | `themeToggleBtn` referenced but did not exist; `.enhanced-glow` CSS injected for it. | Dead code. | Removed; single dark theme with `color-scheme: dark`. |
| 10 | `clearLibraryBtn` wrote `<h2>Your Library</h2>` into the list, duplicating the existing heading. | Two "Your Library" headings. | Library state cleared through the reducer; heading is static. |
| 11 | `updateSeekbar()` ran a `requestAnimationFrame` loop **and** a `timeupdate` listener did the same work. | Redundant work every frame while playing. | Single `timeupdate` listener in `PlayerContext`; time lives in its own context so only the seek bar re-renders. |
| 12 | Mini Loop modal re-fetched `data.json` on every open and used `innerHTML` with song titles. | Slow open; XSS-prone pattern. | Tracks fetched once; React escapes all text. |

## Performance / assets

| # | Bug in v1 | Fix in v2 |
| --- | --- | --- |
| 13 | `svg/logo.svg` was a 1.8 MB base64 PNG wrapped in an SVG, loaded as favicon **and** header logo. | Vector `favicon.svg` + generated PNG icons; 0.7 KB inline vector logo in the header. |
| 14 | ColorThief loaded **twice** from a CDN (head and body). | Replaced by a 40-line canvas average in `useDominantColor.js`; no third-party script, stricter CSP. |
| 15 | Covers served as original JPEGs (up to 113 KB, 720×1599 for a 170 px card); `images.jpg` 275×183 used for Eminem. | 200/400 px WebP + JPEG fallback via `<picture>`; Eminem uses the proper artwork. |
| 16 | Background PNGs 259 KB + 263 KB. | WebP 73 KB + 66 KB, same tile dimensions, transform-based animation, `prefers-reduced-motion` respected. |
| 17 | Google Font `@import` placed **after** other rules in `style.css`. | Per CSS spec it was ignored – the font never loaded. v2 links it in `<head>` with `preconnect` + `display=swap`, and uses it for headings only (system font for body text). |

## Layout / accessibility

| # | Bug in v1 | Fix in v2 |
| --- | --- | --- |
| 18 | Play bar `left: 361px; width: 71%`, sidebar `width: 21vw`, `.home ul li { width: 14px }`. | Responsive grid; play bar full-width and fixed; stacks below 1024 px. |
| 19 | Active track colour `rgb(58,125,118)` on `#3a3a3a` ≈ 2.3:1. | Token palette checked by `scripts/check-contrast.mjs` (all pairs ≥ 4.5:1). |
| 20 | `<img>` elements used as buttons with no labels; no `alt` on covers; divider/footer landmarks missing. | `<button aria-label>` everywhere, `alt` from API, landmarks (`header/main/aside/footer`), skip link, focus rings, `aria-live` now-playing region, native `<dialog>` for the modal. |
| 21 | Footer "Privacy / Terms / Cookies" linked to **Spotify's** legal pages. | Own `/privacy` and `/terms` pages + cookie settings. |

## Found while building v2 (caught by tests/checks)

| What | How it was caught | Fix |
| --- | --- | --- |
| Missing hashed asset leaked an `ENOENT` path as a 500. | New `spa.test.js`. | `errorHandler.js` maps any 4xx `status` to a clean JSON error. |
| Gold focus ring invisible on the cyan primary button (1.08:1). | `check-contrast.mjs`. | 2 px page-background gap (`box-shadow`) between element and ring. |
| Page view fired before the cookie decision was dropped. | Analytics report after the signup test. | Undecided consent now queues events instead of discarding them. |
| Vite 8 (Rolldown) + this machine's Application Control policy. | `npm run dev` failed with `UNRESOLVED_ENTRY`. | Only `sharp`'s native binary is blocked; Rolldown native works. `@img/sharp-wasm32` is installed explicitly so sharp falls back to WASM. |
