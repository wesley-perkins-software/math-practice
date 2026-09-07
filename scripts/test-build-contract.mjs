import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
const site='https://mathpracticeonline.com';
const expected=['addition/index.html','addition/1-digit/index.html','addition/2-digit-without-regrouping/index.html','addition/2-digit-with-regrouping/index.html','subtraction/index.html','multiplication/facts/index.html','division/facts/index.html','division/remainders/index.html','arithmetic-speed-drill/index.html','math-facts/index.html','progress/index.html','math-worksheets/index.html'];
for(const file of expected) assert.ok(existsSync(`dist/${file}`),`missing ${file}`);
for(const family of ['multiplication/times-tables','division/divide-by']) { const leaves=readdirSync(`dist/${family}`,{withFileTypes:true}).filter(x=>x.isDirectory()&&/^([1-9]|1[0-2])$/.test(x.name));assert.equal(leaves.length,12,`${family} leaf count`); }
const html=readFileSync('dist/addition/1-digit/index.html','utf8');
assert.match(html,/<h1[^>]*>[\s\S]*?1-Digit Addition[\s\S]*?<\/h1>/);assert.match(html,/<link rel="canonical" href="https:\/\/mathpracticeonline\.com\/addition\/1-digit\/">/);assert.match(html,/<title>1-Digit Addition Practice[^<]*<\/title>/);assert.match(html,/<meta name="description" content="[^"]+">/);
const sitemapFiles=readdirSync('dist').filter(x=>/^sitemap.*\.xml$/.test(x));assert.ok(sitemapFiles.length);const sitemap=sitemapFiles.map(x=>readFileSync(`dist/${x}`,'utf8')).join('\n');for(const route of ['/addition/','/multiplication/times-tables/12/','/division/divide-by/12/','/progress/'])assert.ok(sitemap.includes(site+route),route);assert.ok(!sitemap.includes('?'));for(const legacy of ['/addition-practice/','/division-practice/','/multiplication-practice/'])assert.ok(!sitemap.includes(site+legacy),legacy);
const redirects=readFileSync('public/_redirects','utf8');for(const mapping of ['/addition-practice/ /addition/ 301','/speed-drill/ /arithmetic-speed-drill/ 301','/division-practice/facts/ /division/facts/ 301'])assert.ok(redirects.includes(mapping));
for(const file of expected){const body=readFileSync(`dist/${file}`,'utf8');assert.ok(!body.includes('?v=')&&!body.includes('?seed='),file)}
console.log(`Build contracts passed: ${expected.length} representative pages, 24 generated leaves, canonicals, sitemap, metadata, and redirects.`);
