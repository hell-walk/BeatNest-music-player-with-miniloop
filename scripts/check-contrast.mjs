/**
 * WCAG 2.1 contrast check for the colour tokens in client/src/styles/tokens.css,
 * run once per theme (:root default + every :root[data-theme='…'] override).
 * Text pairs must reach AA 4.5:1; UI pairs 3:1. Exit code 1 on failure.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'client', 'src', 'styles', 'tokens.css'), 'utf8');

/* ---- parse ":root { … }" and ":root[data-theme='x'] { … }" blocks ---- */
const themes = { base: {} };
for (const m of css.matchAll(/:root(?:\[data-theme='([a-z-]+)'\])?\s*\{([^}]*)\}/g)) {
  const name = m[1] ?? 'base';
  themes[name] ??= {};
  for (const t of m[2].matchAll(/--(color-[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)) themes[name][t[1]] = t[2].toLowerCase();
}
const { base, ...overrides } = themes;
const themeNames = ['soothing (default)', ...Object.keys(overrides)];
const palettes = [base, ...Object.values(overrides).map((o) => ({ ...base, ...o }))];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [foreground, background, minimum, what it is used for]
const PAIRS = [
  ['color-text', 'color-bg', 4.5, 'body text'],
  ['color-text', 'color-surface-1', 4.5, 'text on cards'],
  ['color-text', 'color-surface-2', 4.5, 'text on inputs / hover rows'],
  ['color-text', 'color-surface-3', 4.5, 'text on raised surfaces'],
  ['color-text-muted', 'color-bg', 4.5, 'secondary text'],
  ['color-text-muted', 'color-surface-1', 4.5, 'secondary text on cards'],
  ['color-text-muted', 'color-surface-2', 4.5, 'secondary text on hover rows'],
  ['color-text-faint', 'color-bg', 4.5, 'placeholders / timestamps'],
  ['color-text-faint', 'color-surface-2', 4.5, 'input placeholder'],
  ['color-accent', 'color-bg', 4.5, 'links / active track'],
  ['color-accent', 'color-surface-1', 4.5, 'links on cards'],
  ['color-accent', 'color-surface-2', 4.5, 'active row title'],
  ['color-on-accent', 'color-accent', 4.5, 'primary button label'],
  ['color-danger', 'color-bg', 4.5, 'error text'],
  ['color-danger', 'color-surface-1', 4.5, 'error text on cards'],
  ['color-danger', 'color-danger-bg', 4.5, 'error alert'],
  ['color-success', 'color-bg', 4.5, 'success text'],
  // The focus ring is separated from the element by a 2px --color-bg gap (base.css).
  ['color-focus', 'color-bg', 3, 'focus ring (UI)'],
  ['color-border-strong', 'color-surface-2', 1.5, 'input border (decorative, informational only)'],
];

let failed = false;
themeNames.forEach((name, i) => {
  const tokens = palettes[i];
  const rows = PAIRS.map(([fg, bg, min, use]) => {
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failed = true;
    return { pair: `${fg} on ${bg}`, ratio: `${r.toFixed(2)}:1`, min: `${min}:1`, result: ok ? 'PASS' : 'FAIL', use };
  });
  const fails = rows.filter((r) => r.result === 'FAIL');
  console.log(`\nTheme: ${name} – ${rows.length - fails.length}/${rows.length} pairs pass`);
  if (fails.length || process.env.VERBOSE) console.table(fails.length ? fails : rows);
});

if (failed) {
  console.error('\nContrast check failed – adjust tokens.css');
  process.exit(1);
}
console.log('\nAll colour pairs in all themes meet WCAG AA.');
