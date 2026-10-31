import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { CANONICAL, canRunParity, php } from './helpers/php.mjs';

// Motion Control y Kling O3 Transformar en la release 2.3.15: la salida dura lo que el vídeo de entrada y el servidor lo mide,
// así que la duración declarada no fija el precio. Regla de oro: `estimate.credits` nunca es menor que la reserva del servidor.
// Con AILAB_CANONICAL_REPO las comparaciones usan el PHP real con metadatos simulados: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-motion-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const media = new Media(path.join(temporary, 'files'));
const parity = { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' };

const MOTION = { 'kling-2-6-motion-control': { '720p': 12, '1080p': 19 }, 'kling-3-0-motion-control': { '720p': 21, '1080p': 29 } };
const IDS = Object.keys(MOTION);
const O3 = 'kling-o3';
const O3_RATES = { '720p': 20.4, '1080p': 27.54, '4k': 68.34 };
const OLD_RUNTIMES = ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12', '2.3.13', '2.3.14'];
// Segundos del vídeo y los que factura: al segundo superior, entre 3 y 30 s.
const CLIPS = [[1, 3], [2.9, 3], [3, 3], [3.2, 4], [5, 5], [8.4, 9], [29.6, 30], [30, 30], [31, 30], [60, 30]];

const image = media.image('personaje.png');
const clip = (seconds) => media.video(`clip-${seconds}.mp4`, seconds);
// WebM real por sus primeros bytes: la CLI no sabe medirlo y el servidor, aquí, tampoco.
const webm = media.put('sin-medir.webm', Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]), { mime: 'video/webm', valid: false });

function plan(id, given) {
  const model = { id, ...catalog.models[id] };
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const estimate = estimateCredits(model, { ...v.params, ...v.fileParams });
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, id, estimate, payload: buildPayload(model, v.params, uploaded), files: Object.values(v.fileParams).flat() };
}
const motion = (id, video, mode, extra = {}) => plan(id, { prompt: 'x', input_urls: [image], video_urls: [video], mode, ...extra });
const transform = (video, resolution) => plan(O3, { prompt: 'x', mode: 'transform', video_urls: [video], resolution, aspect_ratio: 'auto' });

// Camino del gateway: contrato, traducción al modelo real, medición en el servidor y estimación.
const PHP_BACKEND = `
  $cfg = wallet_config(); $cases = json_decode($argv[1], true); $meta = json_decode($argv[2], true); $out = [];
  $inspect = static function ($url, $kind) use ($meta) { return $meta[$url] ?? null; };
  foreach ($cases as $case) {
    $model = $case['model']; $input = $case['input'];
    $error = gateway_validate_video_contract($model, $input, 0);
    if ($error !== null) { $out[] = ['ok' => false, 'error' => $error]; continue; }
    $route = $cfg['SKILL_MODEL_ROUTES'][$model] ?? [];
    $slug = $route['gateway_model'] ?? ($route['variants'][$input['mode'] ?? ''] ?? $model);
    $forward = $input;
    foreach ($route['strip_input'] ?? [] as $key) { unset($forward[$key]); }
    $billing = gateway_source_video_billing($slug, $forward, 1, $inspect);
    $out[] = ['ok' => true, 'slug' => $slug, 'billing' => $billing, 'credits' => gateway_estimate_credits($slug, array_merge($forward, $billing))];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;
const askServer = (cases) => {
  const meta = {};
  for (const c of cases) for (const file of c.files || []) meta[media.url(file)] = media.meta[file];
  return php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ model: c.id, input: c.payload.input }))), JSON.stringify(meta)]);
};

test('Motion Control exige 2.3.15 y conserva sus tarifas; Kling O3 no cambia de versión mínima', () => {
  for (const [id, rates] of Object.entries(MOTION)) {
    assert.equal(catalog.models[id].min_cli_version, '2.3.15', id);
    assert.equal(modelUsable(catalog.models[id]).ok, true, id);
    assert.deepEqual(catalog.models[id].estimate.credits_per_second, rates);
    assert.match(catalog.models[id].params.duration.help, /Ya no cambia el coste/);
  }
  assert.equal(catalog.models[O3].min_cli_version, '2.1.0');
  assert.equal(catalog.models[O3].estimate.duration_by_mode.transform, 16);
});

test('Motion Control: la CLI cobra por el vídeo medido, no por --duration', () => {
  for (const [id, rates] of Object.entries(MOTION)) {
    for (const [mode, rate] of Object.entries(rates)) {
      for (const [seconds, billed] of CLIPS) {
        for (const duration of [undefined, '3', '30']) {
          const result = motion(id, clip(seconds), mode, duration ? { duration } : {});
          assert.equal(result.ok, true, JSON.stringify(result.errors));
          assert.equal(result.estimate.credits, rate * billed, `${id} ${mode} ${seconds} s con --duration ${duration}`);
          assert.match(result.estimate.note, new RegExp(`^${billed} s medidos`));
        }
      }
      const unmeasured = motion(id, webm, mode);
      assert.equal(unmeasured.estimate.credits, rate * 30, 'sin medir, el peor caso del servidor');
      assert.match(unmeasured.estimate.note, /sin medir/);
    }
  }
});

test('Motion Control: el cuerpo no lleva ni duración ni billing_duration', () => {
  for (const id of IDS) {
    const { payload } = motion(id, clip(8.4), '1080p', { duration: '3' });
    assert.equal('billing_duration' in payload, false);
    assert.equal('duration' in payload.input, false);
    assert.deepEqual(payload.input.video_urls, [media.url(clip(8.4))]);
  }
});

test('regla de oro con el PHP real: la CLI autoriza exactamente lo que reserva el servidor en Motion Control', parity, () => {
  const cases = [];
  for (const [id, rates] of Object.entries(MOTION)) {
    for (const mode of Object.keys(rates)) {
      for (const [seconds, billed] of CLIPS) cases.push({ ...motion(id, clip(seconds), mode, { duration: '3' }), billed });
      cases.push({ ...motion(id, webm, mode), billed: 30 });
    }
  }
  const server = askServer(cases);
  cases.forEach((c, index) => {
    assert.equal(server[index].ok, true, JSON.stringify(server[index]));
    assert.equal(server[index].billing._billing_duration, c.billed, c.id);
    assert.equal(c.estimate.credits, server[index].credits, `${c.id} ${c.billed} s`);
  });
  assert.ok(cases.length >= 40, String(cases.length));
});

test('regla de oro con el PHP real: en Transformar la CLI autoriza la cota de 16 s, que cubre cualquier reserva', parity, () => {
  const cases = [];
  for (const resolution of Object.keys(O3_RATES)) {
    for (const [seconds] of CLIPS) cases.push(transform(clip(seconds), resolution));
    cases.push(transform(webm, resolution));
  }
  const server = askServer(cases);
  cases.forEach((c, index) => {
    assert.equal(c.ok, true, JSON.stringify(c.errors));
    assert.equal('duration' in c.payload.input, false);
    assert.equal(server[index].ok, true, JSON.stringify(server[index]));
    assert.equal(server[index].slug, 'kling/v3-omni-transformation');
    assert.ok(c.estimate.credits >= server[index].credits, `${c.estimate.credits} frente a ${server[index].credits}`);
  });
  // Medido: 5 s al 1080p, no 16. Sin medir, el servidor llega a la misma cota que la CLI.
  const [measured, unmeasured] = askServer([transform(clip(5), '1080p'), transform(webm, '1080p')]);
  assert.equal(measured.credits, Math.ceil(27.54 * 5));
  assert.equal(unmeasured.credits, transform(webm, '1080p').estimate.credits);
});

test('paridad con el PHP real: la CLI nunca envía los datos de cobro que el servidor rechaza', parity, () => {
  const url = media.url(clip(8.4));
  const raw = (id, extra = {}) => ({ id, payload: { input: { prompt: 'x', input_urls: ['https://uploads.example.test/i.png'], video_urls: [url], mode: '720p', character_orientation: 'video', ...extra } } });
  const names = [...IDS, 'kling-2.6/motion-control', 'kling-3.0/motion-control'];
  const refused = askServer(names.map((id) => raw(id, { _billing_duration: 3 })));
  refused.forEach((answer, index) => {
    assert.equal(answer.ok, false, names[index]);
    assert.match(answer.error, /no admite _billing_duration/);
  });
  for (const id of IDS) assert.equal(JSON.stringify(motion(id, clip(8.4), '720p').payload).includes('_billing'), false);
});

test('compatibilidad: los parsers 2.3.7 a 2.3.14 aceptan el catálogo, no ofrecen Motion Control y siguen con Kling O3', parity, async () => {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  for (const version of OLD_RUNTIMES) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(raw));
    for (const id of IDS) {
      const usable = old.modelUsable(parsed.models[id]);
      assert.equal(usable.ok, false, `la CLI ${version} no debe ofrecer ${id}`);
      assert.match(usable.reason, /Actualiza la skill.*2\.3\.15/, `${version} ${id}`);
    }
    assert.equal(old.modelUsable(parsed.models[O3]).ok, true, version);
    assert.equal(old.catalogCompatible(parsed).ok, true, version);
  }
});

test('por qué 2.3.15: un runtime 2.3.14 autoriza por --duration y quedaría por debajo de la reserva medida', parity, async () => {
  const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases/2.3.14/scripts/lib/catalog.mjs')).href);
  const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
  for (const id of IDS) {
    const current = motion(id, clip(8.4), '720p');
    const [server] = askServer([current]);
    const stale = old.estimateCredits({ id, ...parsed.models[id] }, { mode: '720p', duration: 5, video_urls: [clip(8.4)] });
    assert.ok(stale.credits < server.credits, `${id}: ${stale.credits} frente a ${server.credits}`);
    assert.equal(current.estimate.credits, server.credits, id);
  }
  // Transformar no necesita subir la versión mínima: 2.3.14 ya autoriza los 16 s.
  const [o3] = askServer([transform(clip(15), '1080p')]);
  const stale = old.estimateCredits({ id: O3, ...parsed.models[O3] }, { mode: 'transform', resolution: '1080p', video_urls: [clip(15)] });
  assert.ok(stale.credits >= o3.credits, `${stale.credits} frente a ${o3.credits}`);
});
