/**
 * Favicon / app-icon / social-preview generation from assets-src/logo.png.
 * Outputs into client/public:
 *   favicon.svg, favicon.ico (16/32/48 PNG-in-ICO), apple-touch-icon.png (180),
 *   icon-192.png, icon-512.png, og-image.png (1200x630), site.webmanifest
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const LOGO = path.join(ROOT, 'assets-src', 'logo.png');
const OUT = path.join(ROOT, 'client', 'public');

const BG = '#07080c';
const ACCENT = '#2ee6e0';

/** Vector mark – same geometry as client/src/components/icons.jsx LogoMark. */
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${BG}"/>
  <g fill="${ACCENT}" stroke="${ACCENT}">
    <circle cx="32" cy="32" r="22" fill="none" stroke-width="4"/>
    <path d="M14 30a18 18 0 0 1 36 0" fill="none" stroke-width="4" stroke-linecap="round"/>
    <rect x="9" y="28" width="9" height="14" rx="3.5" stroke="none"/>
    <rect x="46" y="28" width="9" height="14" rx="3.5" stroke="none"/>
    <path d="M34 20v15.5a4.5 4.5 0 1 0 3 4.2V26l6-1.6v6a4.5 4.5 0 1 0 3 4.2V18l-12 3z" stroke="none"/>
    <path d="M22 36v4M25.5 33v7M29 35v5" fill="none" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>
`;

/** Wrap PNG buffers in an ICO container (Vista+ supports PNG entries). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function pngIcon(size, pad = 0) {
  // The source already sits on the brand's black background; just resize.
  return sharp(LOGO)
    .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: BG })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function ogImage() {
  const W = 1200;
  const H = 630;
  const logo = await sharp(LOGO).resize(420, 420).png().toBuffer();

  const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#07080c"/>
        <stop offset="1" stop-color="#0f1d22"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <circle cx="300" cy="315" r="260" fill="${ACCENT}" opacity="0.08"/>
    <text x="560" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="96" font-weight="700" fill="#eef0f6">BeatNest</text>
    <text x="564" y="360" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="${ACCENT}">Free music player with Mini Loop</text>
    <text x="564" y="416" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#a3a9ba">Seven playlists. Seven songs on repeat. No ads.</text>
  </svg>`;

  // 'screen' blend drops the logo's black background so the glow sits on the gradient.
  return sharp(Buffer.from(textSvg))
    .composite([{ input: logo, left: 90, top: 105, blend: 'screen' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  await fs.writeFile(path.join(OUT, 'favicon.svg'), FAVICON_SVG);

  const icoPngs = [];
  for (const size of [16, 32, 48]) icoPngs.push({ size, data: await pngIcon(size) });
  await fs.writeFile(path.join(OUT, 'favicon.ico'), buildIco(icoPngs));

  await fs.writeFile(path.join(OUT, 'apple-touch-icon.png'), await pngIcon(180));
  await fs.writeFile(path.join(OUT, 'icon-192.png'), await pngIcon(192));
  await fs.writeFile(path.join(OUT, 'icon-512.png'), await pngIcon(512));
  await fs.writeFile(path.join(OUT, 'og-image.png'), await ogImage());

  const manifest = {
    name: 'BeatNest',
    short_name: 'BeatNest',
    description: 'Free music player with Mini Loop',
    start_url: '/',
    display: 'standalone',
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
  await fs.writeFile(path.join(OUT, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);

  const files = ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-image.png', 'site.webmanifest'];
  for (const f of files) {
    const { size } = await fs.stat(path.join(OUT, f));
    console.log(`${f.padEnd(22)} ${(size / 1024).toFixed(1)} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
