import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('una release nueva no queda oculta por un catálogo cacheado anterior', (t) => {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-catalog-cache-'));
  t.after(() => fs.rmSync(config, { recursive: true, force: true }));
  const current = JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8'));
  const stale = structuredClone(current);
  stale.catalog_version = '1.14.0';
  for (const id of ['topaz-bloom-2', 'topaz-wonder-3-5', 'topaz-astra-precise-2-6', 'topaz-astra-creative-2', 'lipsync-veed-v2']) {
    delete stale.models[id];
  }
  fs.writeFileSync(path.join(config, 'catalog.json'), JSON.stringify(stale));
  const script = `import('./skills/ailab/scripts/lib/catalog.mjs').then(({loadCatalog}) => {
    const catalog = loadCatalog();
    process.stdout.write(catalog.catalog_version + ':' + Object.keys(catalog.models).length);
  })`;
  const loaded = spawnSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, AILAB_CONFIG_DIR: config },
  });
  assert.equal(loaded.status, 0, loaded.stderr);
  assert.equal(loaded.stdout, '1.17.0:61');
});
