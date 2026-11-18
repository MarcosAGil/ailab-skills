import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const catalogURL = new URL('../skills/ailab/scripts/lib/catalog.mjs', import.meta.url).href;
const bundledPath = new URL('../skills/ailab/catalog/catalog.json', import.meta.url);
const current = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
const legacy = structuredClone(current);
legacy.catalog_version = '1.18.0';
legacy.min_cli_version = '2.1.0';
delete legacy.models['flux-3'];
delete legacy.models['ideogram-v45'];

// Desde la 2.5.0 la caché propia es `catalog-v3.json` (sin precios). `catalog.json` y `catalog-meta.json` son de los
// runtimes anteriores (catálogo v2 con tarifas): el runtime nuevo ni los lee ni los toca.
function cachedCatalog(t, catalog, fetchedAt = '2000-01-01T00:00:00Z', { file = 'catalog-v3.json', meta = 'catalog-v3-meta.json' } = {}) {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-catalog-refresh-'));
  t.after(() => fs.rmSync(config, { recursive: true, force: true }));
  fs.writeFileSync(path.join(config, file), JSON.stringify(catalog));
  fs.writeFileSync(path.join(config, meta), JSON.stringify({
    etag: '"catalog-' + catalog.catalog_version + '"',
    fetched_at: fetchedAt,
    catalog_version: catalog.catalog_version,
  }));
  return config;
}

function runCatalog(config, script, overrides = {}) {
  const input = `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import path from 'node:path';
    import { loadCatalog, refreshCatalog, catalogCompatible } from ${JSON.stringify(catalogURL)};
    const current = JSON.parse(fs.readFileSync(new URL(${JSON.stringify(bundledPath.href)}), 'utf8'));
    const config = process.env.AILAB_CONFIG_DIR;
    const v3URL = 'https://catalog.invalid/ailab/api/v1/skill/catalog-v3.json';
    ${script}
  `;
  assert.ok(Buffer.byteLength(input, 'utf8') < 64 * 1024, 'El script debe leer los catálogos desde archivos, no incluir su JSON');
  // stdin evita MAX_ARG_STRLEN de Linux en Node 18, 20 y 24.
  const result = spawnSync(process.execPath, ['--input-type=module'], {
    input,
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      AILAB_BASE_URL: 'https://catalog.invalid/ailab/',
      AILAB_CONFIG_DIR: config,
      AILAB_CREDENTIALS_DIR: path.join(config, 'credentials'),
      AILAB_ALLOW_COOKIE_AUTH: '0',
      ...overrides,
    },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
}

test('una release nueva no queda oculta por un catálogo cacheado anterior', (t) => {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-catalog-cache-'));
  t.after(() => fs.rmSync(config, { recursive: true, force: true }));
  const current = JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8'));
  const stale = structuredClone(current);
  stale.catalog_version = '1.14.0';
  for (const id of ['topaz-bloom-2', 'topaz-wonder-3-5', 'topaz-astra-precise-2-6', 'topaz-astra-creative-2', 'lipsync-veed-v2']) {
    delete stale.models[id];
  }
  fs.writeFileSync(path.join(config, 'catalog-v3.json'), JSON.stringify(stale));
  const script = `import('./skills/ailab/scripts/lib/catalog.mjs').then(({loadCatalog}) => {
    const catalog = loadCatalog();
    process.stdout.write(catalog.catalog_version + ':' + Object.keys(catalog.models).length);
  })`;
  const loaded = spawnSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, AILAB_CONFIG_DIR: config },
  });
  assert.ifError(loaded.error);
  assert.equal(loaded.status, 0, loaded.stderr);
  assert.equal(loaded.stdout, '1.33.0:78');
});

test('refreshCatalog usa v3 y reemplaza una caché anterior con su ETag', t => {
  const config = cachedCatalog(t, legacy);
  runCatalog(config, `
    let requests = 0;
    globalThis.fetch = async (url, options) => {
      requests++;
      assert.equal(url, v3URL);
      assert.equal(options.headers['If-None-Match'], '"catalog-1.18.0"');
      assert.equal(options.cache, 'no-store');
      return Response.json(current, { headers: { etag: '"catalog-1.33.0"' } });
    };
    const refreshed = await refreshCatalog({ maxAgeMs: 600000, requireNetwork: true });
    assert.equal(requests, 1);
    assert.equal(refreshed.catalog_version, '1.33.0');
    assert.equal(Object.keys(refreshed.models).length, 78);
    assert.deepEqual(catalogCompatible(refreshed), { ok: true });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(config, 'catalog-v3.json'), 'utf8')), current);
    assert.equal(JSON.parse(fs.readFileSync(path.join(config, 'catalog-v3-meta.json'), 'utf8')).etag, '"catalog-1.33.0"');
  `);
});

test('una caché legacy reciente no oculta el catálogo 1.33.0 incluido en 2.3.7', t => {
  const config = cachedCatalog(t, legacy, new Date().toISOString());
  runCatalog(config, `
    globalThis.fetch = async () => { throw new Error('Una caché reciente no necesita red'); };
    const refreshed = await refreshCatalog({ maxAgeMs: 3600000, requireNetwork: true });
    assert.equal(refreshed.catalog_version, '1.33.0');
    assert.equal(Object.keys(refreshed.models).length, 78);
    assert.deepEqual(catalogCompatible(refreshed), { ok: true });
  `);
});

test('un 304 de v3 mantiene el catálogo validado y actualiza la fecha de caché', t => {
  const config = cachedCatalog(t, current);
  runCatalog(config, `
    globalThis.fetch = async (url, options) => {
      assert.equal(url, v3URL);
      assert.equal(options.headers['If-None-Match'], '"catalog-1.33.0"');
      return new Response(null, { status: 304 });
    };
    assert.deepEqual(await refreshCatalog({ maxAgeMs: 0, requireNetwork: true }), current);
    const meta = JSON.parse(fs.readFileSync(path.join(config, 'catalog-v3-meta.json'), 'utf8'));
    assert.equal(meta.etag, '"catalog-1.33.0"');
    assert.ok(Date.parse(meta.fetched_at) > Date.parse('2000-01-01T00:00:00Z'));
  `);
});

test('un fallo de v3 no consulta v2 ni destruye la caché válida', t => {
  const config = cachedCatalog(t, current);
  runCatalog(config, `
    const previousCache = fs.readFileSync(path.join(config, 'catalog-v3.json'), 'utf8');
    let requests = 0;
    globalThis.fetch = async url => {
      requests++;
      assert.equal(url, v3URL);
      return new Response(null, { status: 404 });
    };
    await assert.rejects(refreshCatalog({ maxAgeMs: 0, requireNetwork: true }), /HTTP 404/);
    assert.equal(requests, 1);
    assert.equal(fs.readFileSync(path.join(config, 'catalog-v3.json'), 'utf8'), previousCache);
    assert.deepEqual(loadCatalog(), current);
  `);
});

test('la caché v2 de un runtime anterior (con tarifas) no se lee, no aporta su ETag y queda intacta', t => {
  const priced = structuredClone(current);
  priced.catalog_version = '9.0.0';
  for (const model of Object.values(priced.models)) model.estimate = { kind: 'fixed', credits: 7 };
  const config = cachedCatalog(t, priced, new Date().toISOString(), { file: 'catalog.json', meta: 'catalog-meta.json' });
  runCatalog(config, `
    const before = fs.readFileSync(path.join(config, 'catalog.json'), 'utf8');
    assert.equal(loadCatalog().catalog_version, '1.33.0');
    let requests = 0;
    globalThis.fetch = async (url, options) => {
      requests++;
      assert.equal(url, v3URL);
      assert.equal(options.headers['If-None-Match'], undefined);
      return Response.json(current, { headers: { etag: '"catalog-1.33.0"' } });
    };
    assert.deepEqual(await refreshCatalog({ maxAgeMs: 3600000, requireNetwork: true }), current);
    assert.equal(requests, 1);
    assert.equal(fs.readFileSync(path.join(config, 'catalog.json'), 'utf8'), before);
  `);
});

test('un catálogo servido sin ningún dato de precio se acepta, y un bloque estimate heredado se descarta en silencio', t => {
  const config = cachedCatalog(t, legacy);
  runCatalog(config, `
    const served = structuredClone(current);
    served.models['nano-banana-2'].estimate = { kind: 'by_param', param: 'resolution', credits_by_value: { '1K': 5 } };
    globalThis.fetch = async () => Response.json(served, { headers: { etag: '"catalog-1.33.0"' } });
    const refreshed = await refreshCatalog({ maxAgeMs: 0, requireNetwork: true });
    for (const model of Object.values(refreshed.models)) assert.equal('estimate' in model, false);
    const cached = JSON.parse(fs.readFileSync(path.join(config, 'catalog-v3.json'), 'utf8'));
    assert.deepEqual(cached, current);
    assert.equal(fs.readFileSync(path.join(config, 'catalog-v3.json'), 'utf8').includes('credits_by_value'), false);
  `);
});

test('AILAB_CATALOG_PATH conserva la lectura explícita sin refresco remoto', t => {
  const config = cachedCatalog(t, legacy);
  runCatalog(config, `
    globalThis.fetch = async () => { throw new Error('No debe consultar ninguna URL'); };
    assert.deepEqual(await refreshCatalog({ maxAgeMs: 0, requireNetwork: true }), current);
  `, { AILAB_CATALOG_PATH: fileURLToPath(bundledPath) });
});

test('el runtime publicado 2.3.5 y el nuevo conviven: cada uno con su caché', t => {
  const canonicalRoot = process.env.AILAB_CANONICAL_REPO;
  if (!canonicalRoot) return t.skip('Define AILAB_CANONICAL_REPO para comprobar el runtime publicado.');
  const publishedRoot = path.join(canonicalRoot, 'app/api/v1/skill/releases/2.3.5');
  const publishedURL = pathToFileURL(path.join(publishedRoot, 'scripts/lib/catalog.mjs')).href;
  const publishedCatalog = JSON.parse(fs.readFileSync(path.join(publishedRoot, 'catalog/catalog.json'), 'utf8'));
  assert.equal(publishedCatalog.catalog_version, '1.18.0');
  assert.equal(Object.keys(publishedCatalog.models).length, 61);
  const config = cachedCatalog(t, current, new Date().toISOString(), { file: 'catalog.json', meta: 'catalog-meta.json' });
  runCatalog(config, `
    const oldRuntime = await import(${JSON.stringify(publishedURL)});
    const published = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(publishedRoot, 'catalog/catalog.json'))}, 'utf8'));
    let requests = 0;
    globalThis.fetch = async url => {
      requests++;
      if (url === 'https://catalog.invalid/ailab/api/v1/skill/catalog-v3.json') return Response.json(current, { headers: { etag: '"catalog-1.33.0"' } });
      assert.equal(url, 'https://catalog.invalid/ailab/api/v1/skill/catalog.json');
      return Response.json(published, { headers: { etag: '"catalog-1.18.0"' } });
    };
    const oldFresh = await oldRuntime.refreshCatalog({ maxAgeMs: 3600000, requireNetwork: true });
    assert.deepEqual(oldFresh, published);
    assert.deepEqual(oldRuntime.catalogCompatible(oldFresh), { ok: true });
    assert.equal(requests, 0, 'El parser antiguo descarta v2 y usa su catálogo incluido');
    fs.writeFileSync(path.join(config, 'catalog-meta.json'), JSON.stringify({ fetched_at: '2000-01-01T00:00:00Z' }));
    assert.deepEqual(await oldRuntime.refreshCatalog({ maxAgeMs: 0, requireNetwork: true }), published);
    assert.equal(requests, 1);
    const newFresh = await refreshCatalog({ maxAgeMs: 3600000, requireNetwork: true });
    assert.deepEqual(newFresh, current);
    assert.deepEqual(catalogCompatible(newFresh), { ok: true });
    assert.equal(requests, 2, 'El runtime nuevo no lee la caché v2 del antiguo: descarga la v3');
  `);
});
