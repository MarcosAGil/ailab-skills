import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

// Importar con credenciales vacías: ningún mock necesita el estado del usuario.
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-ideogram-adapter-'));
process.env.AILAB_CONFIG_DIR = path.join(isolated, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(isolated, 'credentials');
process.env.AILAB_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_GENERATION_BASE_URL = process.env.AILAB_BASE_URL;
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
const { estimateCredits, validateCatalogShape, validateParams } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/labs-queue-v1.mjs');

const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
const model = catalog.models['ideogram-v45'];

test('Ideogram 4.5 valida catálogo y tarifas exactas por modo/calidad/lote', () => {
  assert.ok(model);
  assert.equal(estimateCredits(model, { mode: 't2i', quality: 'low', num_images: 8 }).credits, 48);
  assert.equal(estimateCredits(model, { mode: 't2i', quality: 'high', num_images: 1 }).credits, 44);
  assert.equal(estimateCredits(model, { mode: 'edit', quality: 'very_low', num_images: 8 }).credits, 13);
  assert.equal(estimateCredits(model, { mode: 'edit', quality: 'very_low', num_images: 1 }).credits, 2);
  assert.equal(estimateCredits(model, { mode: 'edit', quality: 'unknown', num_images: 1 }).credits, null);
  assert.equal(estimateCredits(model, { mode: 't2i', quality: 'very_low', num_images: 1 }).credits, null);
  for (const num_images of [0, -1, 1.5, 9]) assert.equal(estimateCredits(model, { mode: 'edit', quality: 'low', num_images }).credits, null);
});

test('Ideogram: 88 combinaciones coinciden entre skill, catálogo canónico y web', t => {
  const canonicalRoot = process.env.AILAB_CANONICAL_REPO;
  if (!canonicalRoot) return t.skip('Define AILAB_CANONICAL_REPO para la comprobación cruzada de release.');
  const canonical = JSON.parse(fs.readFileSync(path.join(canonicalRoot, 'config/ailab-model-additions.json'), 'utf8')).models.find(candidate => candidate.id === 'ideogram-v45');
  assert.deepEqual(model.estimate.credits_per_unit_by_value, canonical.estimate.credits_per_unit_by_value);
  const adapter = createRequire(import.meta.url)(path.join(canonicalRoot, 'app/ailab-image-models-live.js')).get('ideogram-v45');
  let cases = 0;
  for (const mode of ['t2i', 'edit']) {
    const qualities = mode === 't2i' ? ['low', 'medium', 'high'] : ['very_low', 'low', 'medium', 'high'];
    const precisions = mode === 'edit' ? ['regular', 'high'] : [null];
    for (const quality of qualities) for (const precision of precisions) for (let num_images = 1; num_images <= 8; num_images++) {
      const params = { prompt: 'Pricing contract audit', mode, quality, num_images };
      if (mode === 'edit') Object.assign(params, { image_urls: ['base.png', 'reference.png'], image_size: 'auto', edit_precision: precision });
      const validated = validateParams(model, params);
      assert.equal(validated.ok, true, validated.errors.join('\n'));
      assert.equal(estimateCredits(model, validated.params).credits, adapter.estimateCredits(params), mode + ':' + quality + ':' + precision + ':' + num_images);
      cases++;
    }
  }
  assert.equal(cases, 88);
});

test('Ideogram distingue modalidades y conserva seed opcional en la CLI', () => {
  const t2i = validateParams(model, { prompt: 'Poster', seed: '2147483647' });
  assert.equal(t2i.ok, true, t2i.errors.join('\n'));
  assert.equal(t2i.params.seed, 2147483647);
  assert.equal(t2i.params.enable_prompt_expansion, true);
  assert.equal(t2i.params.edit_precision, undefined);
  for (const given of [
    { quality: 'very_low' }, { image_size: 'auto' }, { edit_precision: 'regular' },
    { image_urls: ['base.png'] }, { seed: '-1' }, { seed: '2147483648' },
    { num_images: '0' }, { num_images: '9' }, { prompt: '   ' },
  ]) assert.equal(validateParams(model, { prompt: 'Poster', ...given }).ok, false, JSON.stringify(given));
  const edit = validateParams(model, { mode: 'edit', prompt: 'Edit', image_urls: ['base.png'], quality: 'very_low', edit_precision: 'high', image_size: 'auto' });
  assert.equal(edit.ok, true, edit.errors.join('\n'));
  assert.equal(edit.params.enable_prompt_expansion, undefined);
  assert.deepEqual(edit.fileParams.image_urls, ['base.png']);
  for (const given of [
    { image_urls: [] }, { image_urls: Array(6).fill('ref.png') },
    { edit_precision: 'high', image_size: 'square_hd' }, { enable_prompt_expansion: 'true' },
  ]) assert.equal(validateParams(model, { mode: 'edit', prompt: 'Edit', image_urls: ['base.png'], ...given }).ok, false, JSON.stringify(given));
  assert.equal(validateParams(model, { mode: 'edit', prompt: 'Edit', image_urls: ['base.png'], enable_prompt_expansion: 'false' }).ok, true);
});

test('Ideogram solo transmite campos públicos del modo y referencias ordenadas', () => {
  const t2i = buildPayload(model, { mode: 't2i', prompt: 'Poster', quality: 'medium', image_size: 'square_hd', num_images: 2, seed: 42, enable_prompt_expansion: true, edit_precision: 'high', duration_seconds: 99, provider_contract: {}, sync_mode: true }, { image_urls: ['https://ignored.example/ref.png'] });
  assert.deepEqual(t2i, { model: 'ideogram-v45', input: { mode: 't2i', prompt: 'Poster', quality: 'medium', image_size: 'square_hd', num_images: 2, seed: 42, enable_prompt_expansion: true } });
  const images = ['https://uploads.example/base.png', 'https://uploads.example/style.png'];
  const edit = buildPayload(model, { mode: 'edit', prompt: 'Edit', quality: 'low', image_size: 'auto', num_images: 1, seed: 42, edit_precision: 'high', enable_prompt_expansion: true }, { image_urls: images });
  assert.deepEqual(edit.input, { mode: 'edit', prompt: 'Edit', quality: 'low', image_size: 'auto', num_images: 1, seed: 42, edit_precision: 'high', image_urls: images });
  assert.throws(() => buildPayload(model, { mode: 'edit', prompt: 'Edit' }, {}), /imágenes subidas/);
});

test('el adaptador de cola conserva las ocho salidas de Ideogram', async () => {
  const urls = Array.from({ length:8 }, (_, i) => `https://fal.example/${i}.png`);
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 200, msg: 'success', data: {
    status: 'COMPLETED', images: urls.map(url => ({ url })), credits: 96,
  } }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const { check } = await import('../skills/ailab/scripts/adapters/labs-queue-v1.mjs?ideogram-test');
    const result = await check(model, { providerRequestId: 'req-1' });
    assert.equal(result.status, 'success');
    assert.deepEqual(result.urls, urls);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('el adaptador no descarta salidas del lote aunque repitan la misma URL', async () => {
  const previousFetch = globalThis.fetch;
  const url = 'https://fal.example/shared.png';
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 200, data: {
    status: 'COMPLETED', images: [{ url }, { url }], image: 'https://legacy.example/unrelated.png',
  } }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const { check } = await import('../skills/ailab/scripts/adapters/labs-queue-v1.mjs');
    assert.deepEqual((await check(model, { providerRequestId: 'existing' })).urls, [url, url]);
  } finally { globalThis.fetch = previousFetch; }
});
