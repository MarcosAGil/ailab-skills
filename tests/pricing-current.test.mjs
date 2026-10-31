import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Precio vigente en todo lo que ve el agente: `info`, `models` y `guide` nunca presentan una promoción caducada como
// tarifa en vigor. La fecha está fijada en cada comprobación: el resultado no depende del día en que se ejecute.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills/ailab');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-pricing-current-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const { currentEstimate, pricingLines } = await import('../skills/ailab/scripts/lib/pricing.mjs');
const { estimateCredits, validateCatalogShape } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(path.join(SKILL, 'catalog/catalog.json'), 'utf8')));

const TODAY = Date.parse('2026-10-27T12:00:00Z');
const DURING = Date.parse('2026-09-01T12:00:00Z');

// Las cinco promociones que el catálogo publicó con la estructura antigua (tabla promocional + `previous_*`).
const LEGACY = {
  'seedance-2-5': {
    id: 'seedance-2-5', label: 'Seedance 2.5', kind: 'per_second_table', by_param: 'resolution', seconds_param: 'duration', video_param: 'reference_video_urls',
    credits_per_second: { '480p': 28.56, '720p': 64.26, '1080p': 116.28 }, credits_with_video: { '480p': 17.34, '720p': 38.76, '1080p': 69.87 },
    approximate: true, note: '1080p promocional hasta el 17 de septiembre de 2026.',
    promo: { label: '1080p con 28% de descuento hasta el 17 sep 2026', until: '2026-09-17T06:00:00Z', previous_credits_per_second: { '1080p': 161.5 }, previous_credits_with_video: { '1080p': 97.04 } },
  },
  'seedance-2-mini': {
    id: 'seedance-2-mini', label: 'Seedance 2.0 Mini', kind: 'per_second_table', by_param: 'resolution', seconds_param: 'duration', video_param: 'reference_video_urls',
    credits_per_second: { '480p': 3.88, '720p': 8.36 }, credits_with_video: { '480p': 2.45, '720p': 5.1 }, approximate: true,
    promo: { label: 'Rebajado', until: '2026-09-07T06:00:00Z', previous_credits_per_second: { '480p': 9.69, '720p': 20.91 }, previous_credits_with_video: { '480p': 9.69, '720p': 20.91 } },
  },
};
const params = {
  'seedance-2-5': { resolution: { type: 'enum', values: ['480p', '720p', '1080p'], default: '720p' }, duration: { type: 'int', min: 4, max: 30, default: 5 }, reference_video_urls: { type: 'file[]', accept: 'video' } },
  'seedance-2-mini': { resolution: { type: 'enum', values: ['480p', '720p'], default: '480p' }, duration: { type: 'int', min: 4, max: 15, default: 5 }, reference_video_urls: { type: 'file[]', accept: 'video' } },
};
const legacyModel = (id) => {
  const { kind, promo, approximate, note, by_param, seconds_param, video_param, credits_per_second, credits_with_video } = LEGACY[id];
  return { id, label: LEGACY[id].label, estimate: { kind, by_param, seconds_param, video_param, credits_per_second, credits_with_video, approximate, ...(note ? { note } : {}), promo }, params: params[id] };
};

test('una promoción caducada se resuelve a la tarifa ordinaria y desaparece del texto de `info`', () => {
  const model = legacyModel('seedance-2-5');
  const text = pricingLines(model, TODAY).join('\n');
  assert.match(text, /1080p 161,5 cr\/s/);
  assert.match(text, /vídeo de entrada: .*1080p 97,04 cr\/s/);
  assert.match(text, /tarifa ordinaria/);
  assert.doesNotMatch(text, /116[.,]28|69[.,]87|previous_|promo|17 de septiembre/i, 'ni la tabla promocional caducada ni su nota se muestran');
  // La estimación que enseña `info` es la misma que calcula `prepare`: 10 s a 1080p son 1.615 cr.
  assert.equal(estimateCredits(model, { resolution: '1080p', duration: 10 }, TODAY).credits, 1615);
  assert.match(text, /1080p 808 cr/);
  const resolved = currentEstimate(model.estimate, TODAY);
  assert.equal(resolved.promo, null);
  assert.equal(resolved.estimate.promo, undefined);
  assert.equal(resolved.estimate.credits_per_second['1080p'], 161.5);
  assert.equal(resolved.estimate.credits_per_second['480p'], 28.56, 'el resto de filas no cambia');
});

test('Seedance 2.0 Mini caducada: 720p cuesta 20,91 cr/s y 5 s son 105 cr', () => {
  const model = legacyModel('seedance-2-mini');
  const text = pricingLines(model, TODAY).join('\n');
  assert.match(text, /720p 20,91 cr\/s/);
  assert.doesNotMatch(text, /8,36|5,1 cr|\b42 cr\b/);
  assert.equal(estimateCredits(model, { resolution: '720p', duration: 5 }, TODAY).credits, 105);
  assert.match(text, /480p 49 cr · 720p 105 cr/);
});

test('mientras la promoción esté activa, `info` la indica con su fecha de fin y la tarifa promocional', () => {
  const model = legacyModel('seedance-2-5');
  const text = pricingLines(model, DURING).join('\n');
  assert.match(text, /PROMOCIÓN ACTIVA hasta 2026-09-17T06:00:00Z/);
  assert.match(text, /1080p 116,28 cr\/s/);
  assert.match(text, /después rige la tarifa ordinaria/);
  assert.equal(currentEstimate(model.estimate, DURING).promo.until, '2026-09-17T06:00:00Z');
  // En el instante exacto de fin ya no rige.
  assert.equal(currentEstimate(model.estimate, Date.parse('2026-09-17T06:00:00Z')).promo, null);
  assert.equal(currentEstimate(model.estimate, Date.parse('2026-09-17T05:59:59Z')).promo.until, '2026-09-17T06:00:00Z');
});

test('las promociones de tabla por valor (Flux 3) y por caracteres (Eleven) también se resuelven por fecha', () => {
  const flux = { id: 'flux-3', estimate: { kind: 'param_table', by_param: 'resolution', credits_by_value: { '1k': 10, '4k': 157 },
    promo: { label: 'Promoción', until: '2026-10-08T00:00:00Z', credits_by_value: { '1k': 5, '4k': 79 } } }, params: { resolution: { type: 'enum', values: ['1k', '4k'], default: '1k' } } };
  assert.match(pricingLines(flux, TODAY).join('\n'), /1k 10 cr · 4k 157 cr/);
  assert.doesNotMatch(pricingLines(flux, TODAY).join('\n'), /79|4k 5 /);
  assert.match(pricingLines(flux, Date.parse('2026-10-01T00:00:00Z')).join('\n'), /1k 5 cr · 4k 79 cr/);
  const eleven = { id: 'eleven-tts', estimate: { kind: 'per_1000_chars', characters_param: 'text', rate_param: 'version', credits_per_1000: 10.2,
    credits_per_1000_by_value: { flash: 10.2, v4: 16.32 }, promo: { label: 'Cierre', until: '2026-10-11T00:00:00Z', credits_per_1000_by_value: { v4: 4.488 } } }, params: {} };
  assert.match(pricingLines(eleven, TODAY).join('\n'), /v4 16,32 cr/);
  assert.doesNotMatch(pricingLines(eleven, TODAY).join('\n'), /4,488/);
  assert.match(pricingLines(eleven, Date.parse('2026-10-05T00:00:00Z')).join('\n'), /v4 4,488 cr/);
});

test('el catálogo publicado no conserva promociones ni textos con fechas de promoción caducadas', () => {
  for (const [id, model] of Object.entries(catalog.models)) {
    assert.equal(model.estimate.promo, undefined, id + ' conserva un bloque promo');
    const text = [model.description, model.estimate.note, ...Object.values(model.params).map((spec) => spec.help)].filter(Boolean).join(' ');
    assert.doesNotMatch(text, /promocional hasta|rebajad[oa] hasta|hasta el \d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|promoción termina/i, id);
  }
  // Tarifas que el servidor cobra hoy y que mostraba la promoción caducada.
  assert.equal(catalog.models['seedance-2-5'].estimate.credits_per_second['1080p'], 161.16);
  assert.equal(catalog.models['seedance-2-5'].estimate.credits_with_video['1080p'], 96.9);
  assert.deepEqual(catalog.models['seedance-2-mini'].estimate.credits_per_second, { '480p': 9.69, '720p': 20.91 });
  assert.equal(estimateCredits(catalog.models['seedance-2-5'], { resolution: '1080p', duration: 10 }, TODAY).credits, 1612);
  assert.equal(estimateCredits(catalog.models['seedance-2-mini'], { resolution: '720p', duration: 5 }, TODAY).credits, 105);
});

test('`info` de los 70 modelos no falla, no enseña tablas caducadas y repite la regla de precio', () => {
  const ids = Object.keys(catalog.models);
  assert.equal(ids.length, 70);
  for (const id of ids) {
    const model = { id, ...catalog.models[id] };
    const text = pricingLines(model, TODAY).join('\n');
    assert.ok(text.length > 20, id);
    assert.doesNotMatch(text, /previous_|promo/i, id);
    assert.match(text, /Precio vigente a 2026-10-27|lo cotiza el servidor/, id);
  }
});

function run(args, extraEnv = {}) {
  const dir = fs.mkdtempSync(path.join(temporary, 'run-'));
  return execFileSync(process.execPath, [path.join(SKILL, 'scripts/pg.mjs'), ...args], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: dir, AILAB_CONFIG_DIR: path.join(dir, 'config'), AILAB_CREDENTIALS_DIR: path.join(dir, 'credentials'), AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_BASE_URL: 'http://127.0.0.1:1/', ...extraEnv },
  });
}

test('la CLI real: `info` de un catálogo con la estructura antigua muestra 161,5 cr/s y `models` remite a `prepare`', () => {
  const dir = fs.mkdtempSync(path.join(temporary, 'legacy-'));
  const legacy = structuredClone(catalog);
  legacy.models['seedance-2-5'].estimate = { ...legacy.models['seedance-2-5'].estimate, ...LEGACY['seedance-2-5'], id: undefined, label: undefined };
  delete legacy.models['seedance-2-5'].estimate.id;
  delete legacy.models['seedance-2-5'].estimate.label;
  const file = path.join(dir, 'catalog.json');
  fs.writeFileSync(file, JSON.stringify(legacy));
  const info = run(['info', 'seedance-2-5'], { AILAB_CATALOG_PATH: file });
  assert.match(info, /1080p 161,5 cr\/s/);
  assert.doesNotMatch(info, /116[.,]28/);
  assert.match(info, /Precio vigente a \d{4}-\d{2}-\d{2} \(UTC\)/);
  assert.match(info, /usa el presupuesto de la CLI/);
  const models = run(['models'], { AILAB_CATALOG_PATH: path.join(SKILL, 'catalog/catalog.json') });
  assert.equal(models.split('\n').filter((line) => /^ {2}[a-z0-9-]+ · /.test(line)).length, 70);
  assert.doesNotMatch(models, /NO DISPONIBLE/, 'ningún modelo está desactivado en el catálogo de la skill');
  assert.match(models, /Precios: `info <modelo>`.*presupuesto de `prepare`/);
});

test('`guide` y SKILL.md llevan la regla: para dar un precio, el presupuesto de la CLI y nunca tablas a mano', () => {
  const guide = run(['guide'], { AILAB_CATALOG_PATH: path.join(SKILL, 'catalog/catalog.json') });
  assert.match(guide, /Precios\. Para dar un precio al usuario usa el presupuesto de la CLI \(`prepare`/);
  assert.match(guide, /Nunca leas, sumes ni cites tablas de tarifas a mano/);
  const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
  assert.match(skill, /Para dar un precio al usuario usa el presupuesto de la CLI/);
  assert.match(skill, /Nunca leas ni cites tablas de\s+tarifas a mano/);
  for (const text of [guide, skill]) assert.equal(text.includes(String.fromCharCode(0x2014)), false);
});
