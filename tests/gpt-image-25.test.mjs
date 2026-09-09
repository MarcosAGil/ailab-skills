import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateParams, estimateCredits, resolveModel } from '../skills/ailab/scripts/lib/catalog.mjs';
import { buildPayload } from '../skills/ailab/scripts/adapters/jobs-v1.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../skills/ailab/catalog/catalog.json', import.meta.url)));
const model = catalog.models['gpt-image-2-5'];

test('GPT Image 2.5: both versions and modalities use one public jobs contract', () => {
  assert.equal(resolveModel(catalog, 'gpt image 2.5').id, model.id);
  for (const version of ['flare', 'sunburst']) for (const mode of ['t2i', 'i2i']) for (const [resolution, price] of [['1K', 7], ['2K', 11], ['4K', 17]]) {
    const input = { prompt: 'Preserve identity and composition', version, mode, resolution, aspect_ratio: '1:1', ...(mode === 'i2i' ? { image_urls: ['reference.png'] } : {}) };
    const validated = validateParams(model, input);
    assert.equal(validated.ok, true, JSON.stringify(validated.errors));
    assert.equal(estimateCredits(model, validated.params).credits, price);
    const body = buildPayload(model, validated.params, mode === 'i2i' ? { image_urls: ['https://media.example/ref.png'] } : {});
    assert.equal(body.model, model.id);
    assert.equal(body.input.version, version);
    assert.equal(body.input.mode, mode);
    assert.equal(body.input.input_urls, undefined);
  }
  assert.equal(model.params.prompt.max_len, 20000);
  assert.equal(model.params.image_urls.max, 16);
  assert.equal(validateParams(model, { prompt: 'Test', mode: 'i2i' }).ok, false);
  assert.equal(validateParams(model, { prompt: 'Test', version: 'fast' }).ok, false);
});
