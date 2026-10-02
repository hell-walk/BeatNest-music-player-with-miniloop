// Side-effect module: point CLIENT_DIST at a temp folder containing the real
// client/index.html so the SPA fallback + meta injection can be tested without
// a full Vite build. Must be imported BEFORE ./helpers.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'beatnest-dist-'));
fs.mkdirSync(path.join(dist, 'assets'));
fs.copyFileSync(path.join(import.meta.dirname, '../../../client/index.html'), path.join(dist, 'index.html'));
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\n');
process.env.CLIENT_DIST = dist;

export const DIST = dist;
