import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const ids = ['topaz-bloom-2', 'topaz-wonder-3-5', 'topaz-astra-precise-2-6', 'topaz-astra-creative-2'];
const testEnv = {
  AILAB_BASE_URL: process.env.AILAB_BASE_URL,
  AILAB_GENERATION_BASE_URL: process.env.AILAB_GENERATION_BASE_URL,
  AILAB_CONFIG_DIR: process.env.AILAB_CONFIG_DIR,
  AILAB_CREDENTIALS_DIR: process.env.AILAB_CREDENTIALS_DIR,
  AILAB_ALLOW_COOKIE_AUTH: process.env.AILAB_ALLOW_COOKIE_AUTH,
};
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-topaz-isolation-'));
const testConfig = path.join(testRoot, 'config');
const testCredentials = path.join(testRoot, 'credentials');
fs.mkdirSync(testConfig, { recursive: true, mode: 0o700 });
fs.mkdirSync(testCredentials, { recursive: true, mode: 0o700 });
process.env.AILAB_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_GENERATION_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_CONFIG_DIR = testConfig;
process.env.AILAB_CREDENTIALS_DIR = testCredentials;
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
const config = await import('../skills/ailab/scripts/lib/config.mjs');
assert.equal(config.CONFIG_DIR, testConfig);
assert.equal(config.CREDENTIALS_DIR, testCredentials);
const { validateCatalogShape, validateParams } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { priceEstimate } = await import('../skills/ailab/scripts/lib/price.mjs');
const { priceResponse, estimates } = await import('./helpers/price-server.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
const adapter = await import('../skills/ailab/scripts/adapters/topaz-v1.mjs');
test.after(() => {
  for (const [key, value] of Object.entries(testEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(testRoot, { recursive: true, force: true });
});

test('los cuatro contratos Topaz usan el driver y las mediciones internas correctas', () => {
  for (const id of ids) {
    const model = catalog.models[id];
    assert.equal(model.driver, 'topaz-v1');
    assert.equal(model.expensive, true);
    const media = model.output === 'image' ? 'image_url' : 'video_url';
    assert.equal(model.params[media].required, true);
    assert.equal(model.params[model.output === 'image' ? 'output_megapixels' : 'frame_count'].internal, true);
  }
});

// Los tramos de Topaz los aplica AILAB: la CLI le manda las mediciones internas (megapíxeles o fotogramas).
test('price.php recibe las mediciones internas de Topaz y devuelve el importe de la cuenta', async () => {
  const state = { prices: { 'topaz-bloom-2': 29, 'topaz-astra-precise-2-6': null } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => priceResponse(state, url, init) || Response.json({ ok: false }, { status: 404 });
  try {
    const bloom = await priceEstimate('topaz-bloom-2', { output_megapixels: 4, upscale_factor: 2 }, {});
    assert.equal(bloom.ok, true);
    assert.equal(bloom.price.credits, 29);
    const astra = await priceEstimate('topaz-astra-precise-2-6', { frame_count: 27, output_resolution: '1080p' }, {});
    assert.equal(astra.ok, true);
    assert.equal(astra.price.credits, null);
    assert.deepEqual(estimates(state).map((r) => [r.model, r.params]), [
      ['topaz-bloom-2', { output_megapixels: 4, upscale_factor: 2 }],
      ['topaz-astra-precise-2-6', { frame_count: 27, output_resolution: '1080p' }],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
  for (const id of ids) assert.equal(catalog.models[id].estimate, undefined, id);
});

test('la validación rechaza límites de imagen y Astra Creative sin subir nada', () => {
  const bloom = catalog.models['topaz-bloom-2'];
  assert.equal(validateParams(bloom, { image_url: 'input.png', output_megapixels: 100.01 }).ok, false);
  const creative = catalog.models['topaz-astra-creative-2'];
  const invalid = validateParams(creative, { video_url: 'input.mp4', frame_count: 451, prompt: 'textura' });
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(' '), /450/);
  const valid = validateParams(creative, { video_url: 'input.mp4', frame_count: 451 });
  assert.equal(valid.ok, true);
});

test('el adaptador solo llama al gateway AILAB, mapea archivos y conserva idempotencia', async () => {
  const model = catalog.models['topaz-astra-creative-2'];
  const payload = adapter.buildPayload(model, { frame_count: 25, output_resolution: '1080p', prompt: 'detalle' }, { video_url: ['https://media.invalid/input.mp4'] });
  assert.deepEqual(payload, { model: model.id, input: { output_resolution: '1080p', prompt: 'detalle', video_url: 'https://media.invalid/input.mp4' } });
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(new URL(url).host, 'ailendra.invalid');
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    const status = new URL(url).searchParams.get('action');
    if (status === 'status') return Response.json({ code: 200, data: { status: 'COMPLETED', result_url: 'https://media.invalid/out.mp4' } });
    if (status === 'submit') return Response.json({ code: 200, data: { request_id: 'topaz-test-1' } });
    return Response.json({ ok: true, costs: { 'topaz:topaz-test-1': 15 } });
  };
  try {
    const submitted = await adapter.submit(model, payload, { client_request_id: 'same-operation', max_credits_authorized: 15 });
    assert.equal(submitted.taskRef.serverTaskId, 'topaz:topaz-test-1');
    assert.equal(calls[0].body.client_request_id, 'same-operation');
    assert.equal((await adapter.check(model, submitted.taskRef)).urls[0], 'https://media.invalid/out.mp4');
    assert.equal(await adapter.realCost(submitted.taskRef), 15);
    assert.ok(calls.every((call) => call.url.startsWith('https://ailendra.invalid/ailab/')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
