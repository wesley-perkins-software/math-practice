import { assert, test } from './harness';
import { readFileSync } from 'node:fs';
const source=(p:string)=>readFileSync(p,'utf8');
export const tests=[
 test('shared footer implementations link to /create/',()=>{for(const p of ['src/layouts/PracticeLayout.astro','src/layouts/HubLayout.astro','src/pages/index.astro']){const s=source(p);assert.ok(s.includes('href="/create/"'),p);assert.ok(s.includes('Create Practice'),p)}}),
 test('/for-teachers/ has a dedicated Create Practice CTA and no-login mention',()=>{const s=source('src/pages/for-teachers.astro');assert.ok(s.includes('href="/create/"'));assert.ok(s.includes('Create Custom Practice'));assert.ok(s.includes('Custom practice links work the same way'))}),
 test('homepage links to /create/ from the teacher/parent guide section',()=>{const s=source('src/pages/index.astro');assert.ok(s.includes('href="/create/"'));assert.ok(s.includes('Create Custom Practice'))}),
 test('multiplication and division facts pages link to /create/ from Related Practice',()=>{const mult=source('src/pages/multiplication/facts.astro'),div=source('src/pages/division/facts.astro');assert.ok(mult.includes("href: '/create/'"));assert.ok(mult.includes('Create Custom Practice'));assert.ok(div.includes("href: '/create/'"));assert.ok(div.includes('Create Custom Practice'))}),
 test('operation category hubs remain unchanged by discoverability work',()=>{for(const p of ['src/pages/addition/index.astro','src/pages/subtraction/index.astro','src/pages/multiplication/index.astro','src/pages/division/index.astro'])assert.equal(source(p).includes('/create'),false,p)})
];
