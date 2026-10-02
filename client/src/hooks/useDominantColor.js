import { useEffect, useState } from 'react';

const cache = new Map();
const SAMPLE = 12;

/**
 * Average colour of a (same-origin) image, biased away from near-black and
 * near-white pixels so the glow picks up the artwork's actual hue.
 * Replaces the 20 KB ColorThief CDN script from v1 with ~40 lines.
 */
function extract(img) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const w = lum < 24 || lum > 232 ? 0.15 : 1;
    r += data[i] * w;
    g += data[i + 1] * w;
    b += data[i + 2] * w;
    weight += w;
  }
  if (!weight) return null;
  return `rgba(${Math.round(r / weight)}, ${Math.round(g / weight)}, ${Math.round(b / weight)}, 0.35)`;
}

/**
 * Returns the cached colour for `src` (null until extracted). The module-level
 * cache is the source of truth; the state only exists to trigger a re-render
 * once the image has been analysed.
 */
export function useDominantColor(src) {
  const [, rerender] = useState(0);

  useEffect(() => {
    if (!src || cache.has(src)) return undefined;
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        cache.set(src, extract(img));
      } catch {
        cache.set(src, null); // tainted canvas or unsupported – keep default glow
      }
      if (!cancelled) rerender((n) => n + 1);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return src ? (cache.get(src) ?? null) : null;
}
