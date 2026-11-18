import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-release-baseline-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const { stableStringify, validateParams, validateCatalogShape } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { BUNDLED_RUNTIME_VERSION, checkAndMaybeUpdate } = await import('../skills/ailab/scripts/lib/updater.mjs');
const { CLI_VERSION } = await import('../skills/ailab/scripts/lib/config.mjs');
const catalog = JSON.parse(fs.readFileSync(new URL('../skills/ailab/catalog/catalog.json', import.meta.url), 'utf8'));
// Línea base: el catálogo de la release 2.4.0 (4e6f7bc) sin sus bloques `estimate`. La 2.5.0 quita las tarifas y nada
// más: cada contrato debe dar el mismo hash que su versión 2.4.0 sin precio.
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/catalog-1.32.0-2.4.0.model-hashes.json', import.meta.url), 'utf8'));
const sha = (value) => crypto.createHash('sha256').update(stableStringify(value)).digest('hex');

// Textos que en la 2.4.0 llevaban una cifra de créditos o el nombre de una plataforma intermedia (fal, Kie,
// VideoRouter) y en la 2.5.0 se publican sin ellos. Cada entrada es { path, before, after } dentro de `models`.
const PUBLIC_TEXT_EDITS = JSON.parse(fs.readFileSync(new URL('./fixtures/catalog-2.5.0-public-text-edits.json', import.meta.url), 'utf8')).edits;
const INTERMEDIARY = /\b(?:fal(?:\.ai)?|kie(?:\.ai)?|videorouter|openrouter)\b/i;

test('la 2.5.0 conserva cada contrato de la 2.4.0: solo desaparecen `estimate`, las cifras y las plataformas intermedias', () => {
  assert.equal(Object.keys(baseline.model_sha256).length, 77);
  assert.equal(baseline.catalog_version, '1.32.0');
  for (const [id, expected] of Object.entries(baseline.model_sha256)) {
    const model = catalog.models[id];
    assert.ok(model, 'No puede desaparecer ' + id);
    assert.equal(model.estimate, undefined, id);
    const restored = structuredClone(model);
    for (const edit of PUBLIC_TEXT_EDITS.filter((item) => item.path[0] === id)) {
      const keys = edit.path.slice(1);
      const parent = keys.slice(0, -1).reduce((node, key) => node[key], restored);
      const last = keys[keys.length - 1];
      assert.equal(parent[last], edit.after, edit.path.join('.'));
      assert.equal(INTERMEDIARY.test(edit.after), false, edit.path.join('.'));
      parent[last] = edit.before;
    }
    assert.equal(sha(restored), expected, 'El contrato de ' + id + ' solo puede perder su precio');
  }
  // Los modelos nuevos de esta misma release (Kling Image 4.0) se añaden aquí al entrar.
  assert.deepEqual(Object.keys(catalog.models).filter((id) => !baseline.model_sha256[id]).sort(), []);
  assert.equal(catalog.catalog_version, '1.32.0');
  // Igual que catalog-v3.json del servidor: solo la 2.5.0 lee un catálogo sin `estimate`.
  assert.equal(catalog.min_cli_version, '2.5.0');
  assert.equal(INTERMEDIARY.test(JSON.stringify(catalog)), false, 'el catálogo no nombra plataformas intermedias');
  assert.deepEqual(validateCatalogShape(structuredClone(catalog)).models, catalog.models, 'el catálogo sin precio supera la validación local');
});

test('Nano mantiene su contrato vigente y la validación local sigue funcionando sin tarifas', () => {
  const nano = catalog.models['nano-banana-pro'];
  assert.equal(nano.params.prompt.max_len, 20000);
  assert.equal(nano.params.image_urls.max, 8);
  assert.deepEqual(nano.params.output_format.values, ['png', 'jpg']);
  assert.ok(nano.params.aspect_ratio.values.includes('auto'));
  assert.ok(nano.params.aspect_ratio.values.includes('21:9'));
  assert.equal(validateParams(nano, { prompt: 'x'.repeat(20000), aspect_ratio: '21:9', output_format: 'jpg' }).ok, true);
  assert.equal(validateParams(nano, { prompt: 'x'.repeat(20001) }).ok, false);
});

test('los nuevos contratos públicos no contienen costes o endpoints privados', () => {
  const privateKeys = new Set(['provider_contract', 'provider_usd_ordinary', 'provider_usd_promotional', 'margin_multiplier', 'credit_usd', 'endpoints', 'verification', 'verification_targets']);
  const inspect = (value, location) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      assert.equal(privateKeys.has(key), false, location + '.' + key);
      inspect(item, location + '.' + key);
    }
  };
  for (const id of ['flux-3', 'ideogram-v45']) {
    assert.equal(catalog.models[id].min_cli_version, '2.3.7');
    inspect(catalog.models[id], id);
  }
});

test('una instalación 2.5.0 no retrocede al runtime estable anterior', async () => {
  assert.equal(BUNDLED_RUNTIME_VERSION, '2.5.0');
  assert.equal(CLI_VERSION, '2.5.0');
  let installations = 0;
  const checked = await checkAndMaybeUpdate({
    force: true,
    manifestFetcher: async () => ({ signed: { version: '2.3.5', minimum_supported_runtime: '2.1.0' } }),
    releaseInstaller: async () => { installations++; throw new Error('No debe instalar una versión anterior'); },
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.current, '2.5.0');
  assert.equal(checked.update, null);
  assert.equal(installations, 0);
});
