/**
 * Image compression pipeline.
 *   assets-src/covers/<slug>.jpg      -> client/public/images/covers/<slug>-{200,400}.webp + <slug>-400.jpg
 *   assets-src/backgrounds/*.png      -> client/public/images/backgrounds/*.webp (same pixel size: the
 *                                        CSS animation relies on the tile dimensions)
 * Run with `npm run assets` (also part of `npm run build`). Idempotent and fast to re-run.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets-src');
const OUT = path.join(ROOT, 'client', 'public', 'images');

const COVER_SIZES = [200, 400];
const rows = [];

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function sizeOf(file) {
  return (await fs.stat(file)).size;
}

async function coverVariants(file) {
  const slug = path.parse(file).name;
  const input = sharp(file).rotate();
  const before = await sizeOf(file);
  let after = 0;

  for (const size of COVER_SIZES) {
    const base = input.clone().resize(size, size, { fit: 'cover', position: 'attention' });
    const webpOut = path.join(OUT, 'covers', `${slug}-${size}.webp`);
    await base.clone().webp({ quality: 80, effort: 4 }).toFile(webpOut);
    after += await sizeOf(webpOut);

    if (size === 400) {
      const jpgOut = path.join(OUT, 'covers', `${slug}-${size}.jpg`);
      await base.clone().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(jpgOut);
      after += await sizeOf(jpgOut);
    }
  }
  rows.push({ asset: `covers/${slug}`, before: kb(before), after: kb(after) });
}

async function background(file) {
  const name = path.parse(file).name;
  const before = await sizeOf(file);
  const meta = await sharp(file).metadata();
  const out = path.join(OUT, 'backgrounds', `${name}.webp`);
  // The twinkle tile is tiny and must stay pixel-exact; the others can be lossy.
  const encoder = meta.width <= 200 ? { lossless: true } : { quality: 72, alphaQuality: 80, effort: 4 };
  await sharp(file).webp(encoder).toFile(out);
  rows.push({ asset: `backgrounds/${name} (${meta.width}x${meta.height})`, before: kb(before), after: kb(await sizeOf(out)) });
}

async function main() {
  await fs.mkdir(path.join(OUT, 'covers'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'backgrounds'), { recursive: true });

  const covers = (await fs.readdir(path.join(SRC, 'covers'))).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const f of covers) await coverVariants(path.join(SRC, 'covers', f));

  const backgrounds = (await fs.readdir(path.join(SRC, 'backgrounds'))).filter((f) => /\.png$/i.test(f));
  for (const f of backgrounds) await background(path.join(SRC, 'backgrounds', f));

  console.table(rows);
  console.log(`Wrote optimised images to ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
