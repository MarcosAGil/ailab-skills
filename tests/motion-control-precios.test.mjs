import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { canRunParity, php } from './helpers/php.mjs';

// Motion Control y Kling O3 Transformar: la salida dura lo que el vídeo de entrada y el servidor lo mide, así que la duración
// declarada no fija el precio. Desde la 2.5.0 el precio lo da price.php con la duración que mide la CLI; aquí queda el contrato,
// la medida que viaja a price.php y el cuerpo. Con AILAB_CANONICAL_REPO las comparaciones usan el PHP real: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-motion-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { priceParams } = await import('../skills/ailab/scripts/lib/price.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const media = new Media(path.join(temporary, 'files'));
const parity = { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' };

const IDS = ['kling-2-6-motion-control', 'kling-3-0-motion-control'];
const O3 = 'kling-o3';

const image = media.image('personaje.png');
const clip = (seconds) => media.video(`clip-${seconds}.mp4`, seconds);
// WebM real por sus primeros bytes: la CLI no sabe medirlo y el servidor, aquí, tampoco.
const webm = media.put('sin-medir.webm', Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]), { mime: 'video/webm', valid: false });

function plan(id, given) {
  const model = { id, ...catalog.models[id] };
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, id, v, payload: buildPayload(model, v.params, uploaded), files: Object.values(v.fileParams).flat() };
}
const motion = (id, video, mode, extra = {}) => plan(id, { prompt: 'x', input_urls: [image], video_urls: [video], mode, ...extra });
const transform = (video, resolution) => plan(O3, { prompt: 'x', mode: 'transform', video_urls: [video], resolution, aspect_ratio: 'auto' });

// Camino del gateway: contrato, traducción al modelo real y medición en el servidor.
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
    $out[] = ['ok' => true, 'slug' => $slug, 'billing' => $billing];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;
const askServer = (cases) => {
  const meta = {};
  for (const c of cases) for (const file of c.files || []) meta[media.url(file)] = media.meta[file];
  return php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ model: c.id, input: c.payload.input }))), JSON.stringify(meta)]);
};

test('Motion Control exige 2.3.15 y el catálogo no lleva tarifas; Kling O3 no cambia de versión mínima', () => {
  for (const id of IDS) {
    assert.equal(catalog.models[id].min_cli_version, '2.3.15', id);
    assert.equal(modelUsable(catalog.models[id]).ok, true, id);
    assert.equal(catalog.models[id].estimate, undefined, id);
    assert.match(catalog.models[id].params.duration.help, /Ya no cambia el coste/);
  }
  assert.equal(catalog.models[O3].min_cli_version, '2.1.0');
  assert.equal(catalog.models[O3].estimate, undefined);
});

test('Motion Control y Transformar: a price.php viaja la duración medida del vídeo, nunca la ruta', () => {
  for (const id of IDS) {
    const result = motion(id, clip(8.4), '1080p', { duration: '3' });
    assert.equal(result.ok, true, JSON.stringify(result.errors));
    const sent = priceParams(result.v.params, result.v.fileParams);
    assert.equal(Math.round(sent.video_urls[0].duration * 10) / 10, 8.4, id);
    assert.equal(sent.video_urls[0].class, 'video');
    assert.equal(sent.input_urls[0].class, 'image');
    assert.equal(JSON.stringify(sent).includes(temporary), false);
    // Un vídeo que la CLI no sabe medir viaja sin duración: el servidor aplica su peor caso.
    const unmeasured = motion(id, webm, '720p');
    if (unmeasured.ok) assert.equal(priceParams(unmeasured.v.params, unmeasured.v.fileParams).video_urls[0].duration, undefined);
  }
  const o3 = transform(clip(5), '1080p');
  assert.equal(o3.ok, true, JSON.stringify(o3.errors));
  assert.equal(Math.round(priceParams(o3.v.params, o3.v.fileParams).video_urls[0].duration), 5);
});

test('Motion Control: el cuerpo no lleva ni duración ni billing_duration', () => {
  for (const id of IDS) {
    const { payload } = motion(id, clip(8.4), '1080p', { duration: '3' });
    assert.equal('billing_duration' in payload, false);
    assert.equal('duration' in payload.input, false);
    assert.deepEqual(payload.input.video_urls, [media.url(clip(8.4))]);
  }
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
