/**
 * Guard against secrets leaking into the browser bundle.
 * Scans client source, the built bundle (if present) and shared code for
 * well-known credential patterns, and verifies .env files are git-ignored.
 * Exit code 1 on any finding.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const TARGETS = ['client/src', 'client/index.html', 'client/dist', 'shared/src'].map((p) => path.join(ROOT, p));

const PATTERNS = [
  [/sk_(live|test)_[0-9a-zA-Z]{10,}/, 'Stripe secret key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'private key'],
  [/ghp_[A-Za-z0-9]{36}/, 'GitHub token'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/xox[baprs]-[0-9A-Za-z-]{10,}/, 'Slack token'],
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, 'JWT'],
  [/\b(api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*['"`][^'"`]{8,}['"`]/i, 'hard-coded credential'],
];

const PLACEHOLDER = /(example|change-me|placeholder|your[-_ ]|dummy|test-only|\$\{|\bimport\.meta\.env\b)/i;
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.mp3', '.map']);

const findings = [];

function scanFile(file) {
  if (SKIP_EXT.has(path.extname(file))) return;
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const [re, label] of PATTERNS) {
      const m = re.exec(line);
      if (m && !PLACEHOLDER.test(line)) {
        findings.push({ file: path.relative(ROOT, file), line: i + 1, type: label, match: m[0].slice(0, 40) });
      }
    }
  });
}

function walk(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) return scanFile(target);
  for (const entry of fs.readdirSync(target)) walk(path.join(target, entry));
}

TARGETS.forEach(walk);

// .env files must never be committed
for (const envFile of ['server/.env', 'client/.env', '.env']) {
  try {
    execSync(`git check-ignore -q ${envFile}`, { cwd: ROOT, stdio: 'ignore' });
  } catch {
    findings.push({ file: envFile, line: 0, type: 'not git-ignored', match: 'add to .gitignore' });
  }
}

// VITE_ variables are public by design – make sure none look secret
for (const envFile of ['client/.env', 'client/.env.local', 'client/.env.production']) {
  const p = path.join(ROOT, envFile);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    if (/^VITE_[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|TOKEN)/i.test(line)) {
      findings.push({ file: envFile, line: 0, type: 'secret-looking VITE_ var (shipped to browser!)', match: line.split('=')[0] });
    }
  }
}

if (findings.length) {
  console.table(findings);
  console.error(`${findings.length} potential secret(s) found in client-visible code.`);
  process.exit(1);
}
console.log('No secrets found in client-visible code; .env files are git-ignored.');
