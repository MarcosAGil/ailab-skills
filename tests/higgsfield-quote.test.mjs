import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateCatalogShape, validateParams, estimateCredits, requiresServerQuote, resolveModel } from '../skills/ailab/scripts/lib/catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'ailab', 'catalog', 'catalog.json'), 'utf8')));
const adapter = await import('../skills/ailab/scripts/adapters/higgsfield-v1.mjs');

test('SOUL 2 y Genjutsu están en el catálogo con el driver de Higgsfield', () => {
  const soul = catalog.models['soul-2'];
  assert.equal(soul.driver, 'higgsfield-v1');
  assert.equal(soul.output, 'image');
  assert.equal(soul.params.prompt.required, true);
  for (const param of ['aspect_ratio', 'resolution', 'batch_size', 'seed', 'style_id']) assert.ok(soul.params[param], param);
  assert.deepEqual(soul.params.resolution.values, ['720p', '1080p']);
  assert.equal(soul.params.resolution.default, '720p');
  assert.deepEqual(soul.params.batch_size.values, ['1', '4']);
  assert.equal(soul.params.batch_size.default, '1');
  assert.deepEqual(soul.params.aspect_ratio.values, ['9:16', '16:9', '4:3', '3:4', '1:1', '2:3', '3:2']);
  assert.equal(soul.params.style_id.type, 'string');
  assert.equal(soul.estimate.kind, 'higgsfield_quote');
  assert.equal(requiresServerQuote(soul), true);

  const genjutsu = catalog.models['genjutsu'];
  assert.equal(genjutsu.driver, 'higgsfield-v1');
  assert.equal(genjutsu.output, 'video');
  assert.deepEqual(genjutsu.params.mode.values, ['character_swap', 'object_swap']);
  assert.equal(genjutsu.params.mode.default, 'character_swap');
  assert.match(genjutsu.params.mode.help, /Motion Transfer/);
  assert.match(genjutsu.params.mode.help, /Cambio de objeto/);
  assert.equal(genjutsu.params.prompt.required, undefined);
  assert.equal(genjutsu.params.video_url.type, 'file');
  assert.equal(genjutsu.params.video_url.required, true);
  assert.equal(genjutsu.params.image_urls.type, 'file[]');
  assert.equal(genjutsu.params.image_urls.required, true);
  assert.equal(genjutsu.params.image_urls.min, 1);
  assert.equal(genjutsu.params.image_urls.max, 8);
  assert.deepEqual(genjutsu.params.resolution.values, ['480p', '720p']);
  assert.deepEqual(resolveModel(catalog, 'motion transfer').id, 'genjutsu');
});

test('higgsfield_quote no inventa un precio local: exige cotización del servidor', () => {
  for (const id of ['soul-2', 'genjutsu']) {
    const est = estimateCredits(catalog.models[id], { prompt: 'x' });
    assert.equal(est.credits, null);
    assert.equal(est.server_quote, true);
  }
  assert.equal(estimateCredits(catalog.models['flux-2-pro'], { prompt: 'x', resolution: '1K' }).server_quote, undefined);
});

test('Genjutsu valida el mínimo y el máximo de referencias', () => {
  const model = catalog.models['genjutsu'];
  const base = { mode: 'character_swap', video_url: 'motion.mp4' };
  assert.equal(validateParams(model, { ...base, image_urls: ['a.png'] }).ok, true);
  const none = validateParams(model, base);
  assert.equal(none.ok, false);
  assert.ok(none.errors.some((e) => /image_urls/.test(e)), none.errors.join(' | '));
  const empty = validateParams(model, { ...base, image_urls: [] });
  assert.equal(empty.ok, false);
  assert.ok(empty.errors.some((e) => /al menos 1 archivo/.test(e)), empty.errors.join(' | '));
  const many = validateParams(model, { ...base, image_urls: Array.from({ length: 9 }, (_, i) => i + '.png') });
  assert.equal(many.ok, false);
  assert.ok(many.errors.some((e) => /como mucho 8 archivo/.test(e)), many.errors.join(' | '));
  assert.equal(validateParams(model, { mode: 'object_swap', video_url: 'motion.mp4', image_urls: ['a.png', 'b.png'] }).ok, true);
  assert.equal(validateParams(model, { mode: 'swap', video_url: 'motion.mp4', image_urls: ['a.png'] }).ok, false);
  assert.equal(validateParams(model, { video_url: 'motion.mp4', image_urls: ['a.png'] }).ok, true);
  assert.equal(validateParams(catalog.models['soul-2'], { prompt: '' }).ok, false);
  assert.equal(validateParams(catalog.models['soul-2'], { prompt: 'retrato', batch_size: '4', seed: 7 }).ok, true);
  assert.equal(validateParams(catalog.models['soul-2'], { prompt: 'retrato', batch_size: '5' }).ok, false);
});

test('los modelos sin mínimo declarado no cambian de comportamiento', () => {
  const flex = catalog.models['flux-2-flex'];
  assert.equal(validateParams(flex, { prompt: 'x', image_urls: [] }).ok, true);
  const gpt = catalog.models['gpt-image-2'];
  assert.equal(validateParams(gpt, { prompt: 'x', mode: 'i2i', image_urls: ['a.png'] }).ok, true);
  const i2i = validateParams(gpt, { prompt: 'x', mode: 'i2i', image_urls: [] });
  assert.equal(i2i.ok, false);
  const heygen = catalog.models['avatar-photo-video'];
  assert.equal(validateParams(heygen, { image_url: ['a.png'], script: 'hola', voice_id: 'v', estimated_duration_seconds: 5 }).ok, true);
});

test('el adapter rechaza el envío sin cotización aprobada y no llama al proveedor', async () => {
  const model = { ...catalog.models['genjutsu'], id: 'genjutsu' };
  const payload = adapter.buildPayload(model, { mode: 'character_swap', video_url: 'https://media.invalid/motion.mp4', image_urls: ['https://media.invalid/a.png'] }, {});
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return Response.json({ code: 200, data: {} }); };
  try {
    for (const intent of [
      { client_request_id: 'r1', max_credits_authorized: 100 },
      { client_request_id: 'r1', max_credits_authorized: 100, quote_id: 'q1', quote_max_credits: 90, quote_expires_at: new Date(Date.now() + 60000).toISOString() },
      { client_request_id: 'r1', max_credits_authorized: 100, quote_id: 'q1', quote_max_credits: 100, quote_expires_at: new Date(Date.now() - 1000).toISOString() },
    ]) {
      const result = await adapter.submit(model, payload, intent);
      assert.equal(result.ok, false);
      assert.equal(result.normalized.kind, 'local_quote');
    }
    assert.equal(calls, 0);

    globalThis.fetch = async () => Response.json({ code: 200, data: { request_id: 'job-1' } });
    const accepted = await adapter.submit(model, payload, {
      client_request_id: 'r1',
      max_credits_authorized: 100,
      quote_id: 'q1',
      quote_max_credits: 100,
      quote_expires_at: new Date(Date.now() + 60000).toISOString(),
    });
    assert.equal(accepted.ok, true);
    assert.equal(accepted.taskRef.providerRequestId, 'job-1');

    globalThis.fetch = async () => Response.json({ code: 200, data: { quote_id: 'q2', estimated_credits: 12, max_credits_authorized: 14, expires_at: new Date(Date.now() + 60000).toISOString(), verified_duration_seconds: 4 } });
    const quoted = await adapter.quote(model, payload, { client_request_id: 'r1', max_credits_authorized: 100 });
    assert.equal(quoted.ok, true);
    assert.equal(quoted.quote.quote_id, 'q2');
    assert.equal(quoted.quote.max_credits_authorized, 14);
    assert.equal(quoted.quote.verified_duration_seconds, 4);
  } finally { globalThis.fetch = originalFetch; }
});
