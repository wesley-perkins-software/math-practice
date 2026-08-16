/**
 * Build-output validation for the carrying/borrowing -> regrouping URL
 * migration. Run against a fresh `dist/` (run `npm run build` first):
 *   node --experimental-strip-types scripts/test-regrouping-migration.ts
 *
 * Regex/string based on purpose (no HTML/XML parser dependency), consistent
 * with this repo's existing plain-Node-script test convention.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const errors: string[] = [];

const OLD_SLUGS = [
  '/addition/2-digit-no-carrying',
  '/addition/2-digit-with-carrying',
  '/subtraction/2-digit-no-borrowing',
  '/subtraction/2-digit-with-borrowing',
];

const NEW_PAGES = [
  {
    old: '/addition/2-digit-no-carrying',
    dir: 'addition/2-digit-without-regrouping',
    url: 'https://mathpracticeonline.com/addition/2-digit-without-regrouping',
  },
  {
    old: '/addition/2-digit-with-carrying',
    dir: 'addition/2-digit-with-regrouping',
    url: 'https://mathpracticeonline.com/addition/2-digit-with-regrouping',
  },
  {
    old: '/subtraction/2-digit-no-borrowing',
    dir: 'subtraction/2-digit-without-regrouping',
    url: 'https://mathpracticeonline.com/subtraction/2-digit-without-regrouping',
  },
  {
    old: '/subtraction/2-digit-with-borrowing',
    dir: 'subtraction/2-digit-with-regrouping',
    url: 'https://mathpracticeonline.com/subtraction/2-digit-with-regrouping',
  },
];

if (!existsSync(DIST)) {
  console.error(`dist/ not found at ${DIST}. Run "npm run build" first.`);
  process.exit(1);
}

// ─── 1. New routes build ───────────────────────────────────────────────────

for (const page of NEW_PAGES) {
  const htmlPath = join(DIST, page.dir, 'index.html');
  if (!existsSync(htmlPath)) {
    errors.push(`Missing built page: dist/${page.dir}/index.html`);
  }
}

// ─── 2. Old routes redirect via public/_redirects, no chain ───────────────

const redirectsPath = join(DIST, '_redirects');
if (!existsSync(redirectsPath)) {
  errors.push('dist/_redirects not found — expected the 4 old-slug 301 redirects here.');
} else {
  const redirectsText = readFileSync(redirectsPath, 'utf-8');
  const redirectLines = redirectsText.split('\n').map((l) => l.trim()).filter(Boolean);
  const redirectMap = new Map<string, { dest: string; status: string }>();
  for (const line of redirectLines) {
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      redirectMap.set(parts[0], { dest: parts[1], status: parts[2] });
    }
  }

  for (const page of NEW_PAGES) {
    const src = `${page.old}/`;
    const entry = redirectMap.get(src);
    if (!entry) {
      errors.push(`No dist/_redirects entry found for ${src}`);
      continue;
    }
    if (entry.status !== '301' && entry.status !== '308') {
      errors.push(`Redirect for ${src} has status ${entry.status}, expected a permanent 301/308.`);
    }
    const expectedDest = `${page.url.replace('https://mathpracticeonline.com', '')}/`;
    if (entry.dest !== expectedDest) {
      errors.push(`Redirect for ${src} points to ${entry.dest}, expected ${expectedDest}.`);
    }
    // No-chain check: the redirect destination must not itself be an old slug.
    if (OLD_SLUGS.some((slug) => entry.dest.startsWith(slug))) {
      errors.push(`Redirect for ${src} chains through another old slug: ${entry.dest}`);
    }
  }
}

// ─── 3. Sitemap contains new URLs, excludes old URLs ───────────────────────

const sitemapPath = join(DIST, 'sitemap-0.xml');
if (!existsSync(sitemapPath)) {
  errors.push('dist/sitemap-0.xml not found.');
} else {
  const sitemapText = readFileSync(sitemapPath, 'utf-8');
  for (const page of NEW_PAGES) {
    if (!sitemapText.includes(`<loc>${page.url}/</loc>`)) {
      errors.push(`Sitemap missing new URL: ${page.url}/`);
    }
  }
  for (const slug of OLD_SLUGS) {
    if (sitemapText.includes(`mathpracticeonline.com${slug}/</loc>`)) {
      errors.push(`Sitemap still contains old URL: ${slug}/`);
    }
  }
}

// ─── 4. No internal links to old slugs anywhere in built HTML ─────────────
// ─── 5. Canonicals use new URLs on the 4 new pages ─────────────────────────
// ─── 6. Breadcrumb/structured-data URLs use new URLs on the 4 new pages ───

function walkHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const allHtmlFiles = walkHtmlFiles(DIST);

for (const file of allHtmlFiles) {
  const relPath = file.slice(DIST.length);
  // The old-slug redirect stub pages Astro generates are expected to
  // self-reference their own (old) path in the human-readable fallback link
  // and in their own canonical (which Astro points at the destination) —
  // skip those 4 known stub files, they are not "internal links" in the
  // active site graph.
  const isOldStub = OLD_SLUGS.some((slug) => relPath === `${slug}/index.html`);
  if (isOldStub) continue;

  const html = readFileSync(file, 'utf-8');
  for (const slug of OLD_SLUGS) {
    if (html.includes(`href="${slug}"`) || html.includes(`"url":"https://mathpracticeonline.com${slug}"`) || html.includes(`"item":"https://mathpracticeonline.com${slug}"`)) {
      errors.push(`${relPath} contains a reference to old slug ${slug}`);
    }
  }
}

for (const page of NEW_PAGES) {
  const htmlPath = join(DIST, page.dir, 'index.html');
  if (!existsSync(htmlPath)) continue;
  const html = readFileSync(htmlPath, 'utf-8');

  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) {
    errors.push(`${page.dir}/index.html: no canonical <link> found.`);
  } else if (canonicalMatch[1] !== `${page.url}/`) {
    errors.push(`${page.dir}/index.html: canonical is "${canonicalMatch[1]}", expected "${page.url}/".`);
  }

  const ogUrlMatch = html.match(/<meta property="og:url" content="([^"]+)"/);
  if (!ogUrlMatch) {
    errors.push(`${page.dir}/index.html: no og:url <meta> found.`);
  } else if (ogUrlMatch[1] !== `${page.url}/`) {
    errors.push(`${page.dir}/index.html: og:url is "${ogUrlMatch[1]}", expected "${page.url}/".`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
    JSON.parse(m[1])
  );
  const breadcrumb = jsonLdBlocks.find((b) => b['@type'] === 'BreadcrumbList');
  if (!breadcrumb) {
    errors.push(`${page.dir}/index.html: no BreadcrumbList JSON-LD found.`);
  } else {
    const items: any[] = breadcrumb.itemListElement;
    for (const slug of OLD_SLUGS) {
      if (items.some((it) => it.item === `https://mathpracticeonline.com${slug}`)) {
        errors.push(`${page.dir}/index.html: BreadcrumbList references old slug ${slug}`);
      }
    }
  }

  const learningResource = jsonLdBlocks.find((b) => b['@type'] === 'LearningResource');
  if (!learningResource) {
    errors.push(`${page.dir}/index.html: no LearningResource JSON-LD found.`);
  } else if (learningResource.url !== `${page.url}`) {
    errors.push(`${page.dir}/index.html: LearningResource.url is "${learningResource.url}", expected "${page.url}".`);
  }
}

// ─── Report ─────────────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error(`Regrouping migration validation FAILED (${errors.length} issue(s)):`);
  for (const error of errors) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log(
  `Regrouping migration validation passed: 4 new routes built, 4 old routes redirect (301, no chain), ` +
    `sitemap correct, no stale internal links, canonicals/breadcrumb/structured-data use new URLs.`
);
