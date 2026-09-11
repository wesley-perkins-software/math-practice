import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { assert, test } from './harness';

// GROWTH-005A: every internal link should point directly at its final
// canonical (trailing-slash) URL rather than a redirecting variant.
const ASSET_EXT = ['.png', '.ico', '.svg', '.webmanifest', '.jpg', '.jpeg', '.gif', '.xml', '.txt'];

function needsSlash(path: string): boolean {
  if (!path.startsWith('/')) return false;
  if (path === '/') return false;
  if (path.endsWith('/')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (ASSET_EXT.some((ext) => path.endsWith(ext))) return false;
  if (path.startsWith('http')) return false;
  return true;
}

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(astro|tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const HREF_PATTERNS = [
  /href="(\/[^"]*)"/g,
  /href='(\/[^']*)'/g,
  /href:\s*"(\/[^"]*)"/g,
  /href:\s*'(\/[^']*)'/g,
  /href:\s*`(\/[^`]*)`/g,
  /href=\{`(\/[^`]*)`\}/g,
];

export const tests = [
  test('no internal link in src/ points at a non-trailing-slash current route', () => {
    const offenders: string[] = [];
    for (const file of collectSourceFiles('src')) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of HREF_PATTERNS) {
        for (const match of source.matchAll(pattern)) {
          if (needsSlash(match[1])) offenders.push(`${file}: ${match[0]}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  }),
];
