import { createServer } from 'vite';
import { readdir } from 'node:fs/promises';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let passed = 0, failed = 0;
try {
  const files = (await readdir('tests')).filter(f => f.endsWith('.test.ts')).sort();
  for (const file of files) {
    const mod = await server.ssrLoadModule(`/tests/${file}`);
    for (const item of mod.tests) {
      try { await item.run(); console.log(`✓ ${file} — ${item.name}`); passed++; }
      catch (error) { console.error(`✗ ${file} — ${item.name}`); console.error(error); failed++; }
    }
  }
  console.log(`\n${passed} passed, ${failed} failed (${files.length} files)`);
  if (failed) process.exitCode = 1;
} finally { await server.close(); }
