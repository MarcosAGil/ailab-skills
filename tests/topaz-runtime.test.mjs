import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { estimateCredits, validateCatalogShape, validateParams } from '../skills/ailab/scripts/lib/catalog.mjs';

const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
const ids = ['topaz-bloom-2', 'topaz-wonder-3-5', 'topaz-astra-precise-2-6', 'topaz-astra-creative-2'];

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

test('el precio local replica los tramos y la conversión del gateway', () => {
  assert.equal(estimateCredits(catalog.models['topaz-bloom-2'], { output_megapixels: 4 }).credits, 29);
  assert.equal(estimateCredits(catalog.models['topaz-wonder-3-5'], { output_megapixels: 4 }).credits, 15);
  assert.equal(estimateCredits(catalog.models['topaz-astra-precise-2-6'], { frame_count: 27, output_resolution: '1080p' }).credits, 29);
  assert.equal(estimateCredits(catalog.models['topaz-astra-creative-2'], { frame_count: 10, output_resolution: '4K' }).credits, 29);
  assert.equal(estimateCredits(catalog.models['topaz-bloom-2'], { output_megapixels: 100.01 }).credits, null);
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
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-topaz-test-'));
  const credentials = path.join(temp, 'credentials');
  fs.mkdirSync(credentials, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'x'.repeat(40), { mode: 0o600 });
  process.env.AILAB_CREDENTIALS_DIR = credentials;
  process.env.AILAB_BASE_URL = 'https://ailendra.com/ailab/';
  const adapter = await import('../skills/ailab/scripts/adapters/topaz-v1.mjs');
  const model = catalog.models['topaz-astra-creative-2'];
  const payload = adapter.buildPayload(model, { frame_count: 25, output_resolution: '1080p', prompt: 'detalle' }, { video_url: ['https://media.invalid/input.mp4'] });
  assert.deepEqual(payload, { model: model.id, input: { output_resolution: '1080p', prompt: 'detalle', video_url: 'https://media.invalid/input.mp4' } });
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
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
    assert.ok(calls.every((call) => call.url.startsWith('https://ailendra.com/ailab/')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
