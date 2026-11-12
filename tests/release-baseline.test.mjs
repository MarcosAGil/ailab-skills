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
// Auditoría de precios (27/10/2026): contratos que cambian a propósito solo en `estimate` (y, en H3, el máximo de dos parámetros
// de referencia). El fixture guarda lo que valían antes; restaurarlo reproduce el hash de la línea base.
const beforePriceAudit = JSON.parse(fs.readFileSync(new URL('./fixtures/estimates-before-price-audit.json', import.meta.url), 'utf8')).models;

// Tarifas de Kling antes de 2.3.17 (Kie las subió el 4 de noviembre de 2026; ver tests/motion-control-precios.test.mjs).
const KLING_BEFORE_KIE_2026_11 = {
  'kling-3-0': { credits_per_second: { '4K': 69, pro: 29, std: 21 } },
  'kling-o3': {
    credits_per_second: { '1080p': 18.36, '4k': 68.34, '720p': 14.28 },
    credits_with_audio: { '1080p': 23.46, '4k': 68.34, '720p': 18.36 },
    credits_with_video: { '1080p': 27.54, '4k': 68.34, '720p': 20.4 },
    note: 'Tarifa base sin audio. Con audio nativo: 18,36 (720p) / 23,46 (1080p) cr/s. Con video de entrada (transform siempre; ref con video): 20,4 / 27,54 cr/s. En 4K la tarifa es unica (68,34 cr/s). Coste real al terminar',
  },
};

test('la release conserva los contratos anteriores excepto las ampliaciones versionadas de Eleven, Wan 3.0, Seed Audio y Seedance y la auditoría de precios', () => {
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
    if (['seedance-2', 'seedance-2-5', 'seedance-2-mini'].includes(id)) {
      // Cambio versionado en 2.3.15: el servidor factura los segundos de los vídeos de referencia y los mide. Las CLI
      // anteriores dejan de ofrecerlos en lugar de autorizar por debajo de la reserva (ver tests/seedance-precios.test.mjs).
      assert.equal(catalog.models[id].min_cli_version, '2.3.15');
      assert.equal(catalog.models[id].estimate.video_param, 'reference_video_urls');
      continue;
    }
    if (['kling-2-6-motion-control', 'kling-3-0-motion-control'].includes(id)) {
      // Cambio versionado en 2.3.15: el servidor mide el vídeo y deja de atender a --duration. Las CLI anteriores dejan de
      // ofrecerlos en lugar de autorizar por debajo de la reserva (ver tests/motion-control-precios.test.mjs).
      assert.equal(catalog.models[id].min_cli_version, '2.3.15');
      assert.equal(catalog.models[id].estimate.kind, 'per_second_table');
      continue;
    }
    if (id === 'eleven-voice-changer') {
      // Cambio de 2.3.18: solo se añade la ayuda de --voice_id (la web permite copiar el ID de una voz de ElevenLabs).
      const restored = structuredClone(catalog.models[id]);
      assert.match(restored.params.voice_id.help, /Copiar ID/);
      delete restored.params.voice_id.help;
      assert.equal(crypto.createHash('sha256').update(stableStringify(restored)).digest('hex'), expected, id + ' solo puede cambiar la ayuda de voice_id');
      continue;
    }
    if (KLING_BEFORE_KIE_2026_11[id]) {
      // Cambio de 2.3.17: solo cambian las tarifas del estimate (y la nota de O3) a la tarifa de Kie x 1,02.
      const restored = structuredClone(catalog.models[id]);
      Object.assign(restored.estimate, KLING_BEFORE_KIE_2026_11[id]);
      assert.equal(crypto.createHash('sha256').update(stableStringify(restored)).digest('hex'), expected, id + ' solo puede cambiar sus tarifas');
      continue;
    }
    if (beforePriceAudit[id]) {
      // Por qué cambia cada uno (todos contra el servidor real, ver tests/pricing-audit.test.mjs):
      //  - kling-v3: tarifa por audio y margen decimal; lipsync-heygen-*: margen decimal; avatar-photo-video: tarifa por resolución.
      //  - crystal-upscaler y seedvr2-image-upscaler: reserva mínima del servidor; eleven-sound-fx: 25 cr, no 26.
      //  - minimax-h3: el servidor admite un solo vídeo y un solo audio de referencia.
      const restored = structuredClone(catalog.models[id]);
      restored.estimate = beforePriceAudit[id].estimate;
      if (beforePriceAudit[id].params) Object.assign(restored.params, beforePriceAudit[id].params);
      assert.equal(crypto.createHash('sha256').update(stableStringify(restored)).digest('hex'), expected, id + ' solo puede cambiar lo que documenta la auditoría de precios');
      assert.notDeepEqual(catalog.models[id], restored, id + ' sí cambia respecto a la línea base');
      continue;
    }
    const actual = crypto.createHash('sha256').update(stableStringify(catalog.models[id])).digest('hex');
    assert.equal(actual, expected, 'El contrato publicado de ' + id + ' no debe cambiar');
  }
  assert.deepEqual(Object.keys(catalog.models).filter(id => !baseline.model_sha256[id]).sort(), ['flux-3', 'gemini-omni-flash-1-2', 'gpt-image-2-6', 'higgsfield-genjutsu-light', 'higgsfield-marketing-studio-image', 'higgsfield-soul-cinema', 'ideogram-v45', 'kling-4-0', 'krea-3', 'nano-banana-2-1', 'seedance-2-5-draft-1080p', 'seedance-2-5-lite', 'seedream-5-5']);
  assert.equal(catalog.catalog_version, '1.31.0');
  assert.equal(catalog.min_cli_version, '2.3.7');
});

test('Eleven ya no lleva promoción (terminó el 11/10/2026) y Nano mantiene su contrato vigente', () => {
  const eleven = catalog.models['eleven-tts'];
  const params = { version: 'v4', text: 'x'.repeat(1000) };
  const boundary = Date.parse('2026-10-11T00:00:00Z');
  assert.equal(eleven.estimate.promo, undefined);
  assert.equal(estimateCredits(eleven, params, boundary - 1).credits, 17, 'la tarifa ordinaria rige a cualquier fecha');
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

test('una instalación 2.3.18 no retrocede al runtime estable anterior', async () => {
  assert.equal(BUNDLED_RUNTIME_VERSION, '2.3.18');
  let installations = 0;
  const checked = await checkAndMaybeUpdate({
    force: true,
    manifestFetcher: async () => ({ signed: { version: '2.3.5', minimum_supported_runtime: '2.1.0' } }),
    releaseInstaller: async () => { installations++; throw new Error('No debe instalar una versión anterior'); },
  });
  assert.equal(checked.ok, true);
  assert.equal(checked.current, '2.3.18');
  assert.equal(checked.update, null);
  assert.equal(installations, 0);
});
