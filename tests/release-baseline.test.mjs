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
const { estimateCredits, stableStringify, validateParams } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { BUNDLED_RUNTIME_VERSION, checkAndMaybeUpdate } = await import('../skills/ailab/scripts/lib/updater.mjs');
const catalog = JSON.parse(fs.readFileSync(new URL('../skills/ailab/catalog/catalog.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/catalog-1.18.0-2.3.5.model-hashes.json', import.meta.url), 'utf8'));

test('la release conserva los contratos anteriores excepto la ampliación Eleven versionada', () => {
  assert.equal(Object.keys(baseline.model_sha256).length, 61);
  for (const [id, expected] of Object.entries(baseline.model_sha256)) {
    assert.ok(catalog.models[id], 'No puede desaparecer ' + id);
    if (['eleven-tts','eleven-voice-changer'].includes(id)) {
      assert.equal(catalog.models[id].min_cli_version,'2.3.8');
      assert.ok(catalog.models[id].params.private_voice_id);
      continue;
    }
    const actual = crypto.createHash('sha256').update(stableStringify(catalog.models[id])).digest('hex');
    assert.equal(actual, expected, 'El contrato publicado de ' + id + ' no debe cambiar');
  }
  assert.deepEqual(Object.keys(catalog.models).filter(id => !baseline.model_sha256[id]).sort(), ['flux-3', 'ideogram-v45', 'nano-banana-2-1']);
  assert.equal(catalog.catalog_version, '1.22.0');
  assert.equal(catalog.min_cli_version, '2.3.7');
});

test('Eleven mantiene su promoción publicada y Nano su contrato vigente', () => {
  const eleven = catalog.models['eleven-tts'];
  const params = { version: 'v4', text: 'x'.repeat(1000) };
  const boundary = Date.parse('2026-10-11T00:00:00Z');
  assert.equal(estimateCredits(eleven, params, boundary - 1).credits, 5);
  assert.equal(estimateCredits(eleven, params, boundary).credits, 17);
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

test('una instalación 2.3.9 no retrocede al runtime estable anterior', async () => {
  assert.equal(BUNDLED_RUNTIME_VERSION, '2.3.9');
  let installations = 0;
  const checked = await checkAndMaybeUpdate({
    force: true,
    manifestFetcher: async () => ({ signed: { version: '2.3.5', minimum_supported_runtime: '2.1.0' } }),
    releaseInstaller: async () => { installations++; throw new Error('No debe instalar una versión anterior'); },
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.current, '2.3.9');
  assert.equal(checked.update, null);
  assert.equal(installations, 0);
});
