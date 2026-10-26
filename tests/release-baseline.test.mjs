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

test('la release conserva los contratos anteriores excepto las ampliaciones versionadas de Eleven, Wan 3.0 y Seed Audio', () => {
  assert.equal(Object.keys(baseline.model_sha256).length, 61);
  for (const [id, expected] of Object.entries(baseline.model_sha256)) {
    assert.ok(catalog.models[id], 'No puede desaparecer ' + id);
    if (['eleven-tts','eleven-voice-changer'].includes(id)) {
      assert.equal(catalog.models[id].min_cli_version,'2.3.8');
      assert.ok(catalog.models[id].params.private_voice_id);
      continue;
    }
    if (id === 'wan-3-video') {
      // Cambio versionado: Kie factura también los segundos de los vídeos de entrada. Las CLI anteriores
      // dejan de ofrecer el modelo (min_cli_version 2.3.12) en lugar de presupuestar por debajo del servidor.
      assert.equal(catalog.models[id].min_cli_version, '2.3.12');
      assert.deepEqual(catalog.models[id].params.version.values, ['normal', 'prime']);
      assert.equal(catalog.models[id].estimate.kind, 'per_second_matrix');
      continue;
    }
    if (id === 'seed-audio') {
      // Cambio versionado en 2.3.13: el servidor reserva siempre el tope de 100 cr y cobra la duración real.
      // Solo cambia `estimate`; con el estimate original el contrato es idéntico al de la línea base.
      assert.deepEqual(catalog.models[id].estimate, { kind: 'flat_credits', credits: 100, approximate: true, note: catalog.models[id].estimate.note });
      assert.match(catalog.models[id].estimate.note, /^reserva maxima: la duracion la decide el modelo y no se puede fijar\. Se cobra la duracion real a 0,625 cr\/s \(10 s = 7 cr, 1 min = 38 cr\) y nunca mas de 100 cr\./);
      assert.ok(catalog.models[id].params.estimated_duration_seconds, 'el parámetro orientativo se conserva');
      assert.equal(catalog.models[id].min_cli_version, '1.0.0', 'las CLI anteriores siguen pudiendo usar el modelo con el catálogo nuevo');
      const original = { approximate: true, credits_per_unit: 0.625, kind: 'unit_credits', minimum_credits: 1, note: 'la duracion real la decide el modelo', units_param: 'estimated_duration_seconds' };
      const restored = crypto.createHash('sha256').update(stableStringify({ ...catalog.models[id], estimate: original })).digest('hex');
      assert.equal(restored, expected, 'Seed Audio solo puede cambiar su estimate');
      continue;
    }
    const actual = crypto.createHash('sha256').update(stableStringify(catalog.models[id])).digest('hex');
    assert.equal(actual, expected, 'El contrato publicado de ' + id + ' no debe cambiar');
  }
  assert.deepEqual(Object.keys(catalog.models).filter(id => !baseline.model_sha256[id]).sort(), ['flux-3', 'ideogram-v45', 'krea-3', 'nano-banana-2-1']);
  assert.equal(catalog.catalog_version, '1.25.0');
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

test('una instalación 2.3.13 no retrocede al runtime estable anterior', async () => {
  assert.equal(BUNDLED_RUNTIME_VERSION, '2.3.13');
  let installations = 0;
  const checked = await checkAndMaybeUpdate({
    force: true,
    manifestFetcher: async () => ({ signed: { version: '2.3.5', minimum_supported_runtime: '2.1.0' } }),
    releaseInstaller: async () => { installations++; throw new Error('No debe instalar una versión anterior'); },
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.current, '2.3.13');
  assert.equal(checked.update, null);
  assert.equal(installations, 0);
});
