import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { CANONICAL, canRunParity, php } from './helpers/php.mjs';

// Precios y límites de Seedance desde la release 2.3.15 (el modo draft de 2.3.16 tiene tests/seedance-draft.test.mjs). Contrato: docs/operations/seedance-25-draft-precios-2026-10-31.md
// en AILAB. Regla de oro: `estimate.credits` nunca es menor que la reserva del servidor. Con AILAB_CANONICAL_REPO las
// comparaciones usan el PHP real con metadatos simulados: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-seedance-precios-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));
const parity = { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' };

const NORMAL = 'seedance-2-5';
const LITE = 'seedance-2-5-lite';
const TWO = 'seedance-2';
const MINI = 'seedance-2-mini';
const IDS = [NORMAL, LITE, TWO, MINI];
const OLD_RUNTIMES = ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12', '2.3.13', '2.3.14'];
const NORMAL_RATES = { '480p': 28.56, '720p': 64.26, '1080p': 161.16 };
const NORMAL_VIDEO_RATES = { '480p': 17.34, '720p': 38.76, '1080p': 96.9 };
const LITE_RATES = { '480p': 20.9712, '720p': 47.1648, '1080p': 115.9944 };
const LITE_VIDEO_RATES = { '480p': 12.546, '720p': 28.2132, '1080p': 69.4008 };
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const clips = new Map();
const clip = (seconds) => {
  if (!clips.has(seconds)) clips.set(seconds, media.video(`clip-${seconds}.mp4`, seconds));
  return clips.get(seconds);
};
const audioClips = new Map();
const audioClip = (seconds) => {
  if (!audioClips.has(seconds)) audioClips.set(seconds, media.wavAudio(`audio-${seconds}.wav`, seconds));
  return audioClips.get(seconds);
};

// Vídeos que facturan exactamente `seconds`. Por encima de 30 s hacen falta varios: cada uno sube al segundo superior.
function videosBilling(seconds) {
  if (seconds === 0) return [];
  if (seconds <= 30) return [clip(seconds)];
  const count = Math.min(10, seconds - 29);
  const base = Math.floor(seconds / count);
  return range(1, count).map((index) => clip(Number((base + (index <= seconds % count ? 1 : 0) - 1 + 0.01).toFixed(2))));
}

function plan(id, given) {
  const model = { id, ...catalog.models[id] };
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const estimate = estimateCredits(model, { ...v.params, ...v.fileParams });
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, id, estimate, payload: buildPayload(model, v.params, uploaded), files: Object.values(v.fileParams).flat() };
}

const metaFor = (cases) => {
  const meta = {};
  for (const c of cases) for (const file of c.files) meta[media.url(file)] = media.meta[file];
  return meta;
};

// Cada caso recorre el camino del gateway: normalización, contrato, medición en el servidor y estimación con los datos
// de cobro que fija el servidor. Es el código real; solo se simula la consulta de metadatos de la subida.
const PHP_BACKEND = `
  $cfg = wallet_config(); $cases = json_decode($argv[1], true); $meta = json_decode($argv[2], true); $out = [];
  $inspect = static function ($url, $kind) use ($meta) { return $meta[$url] ?? null; };
  // La puerta del draft, con el interruptor abierto.
  $draft = static fn(array $body) => gateway_seedance_25_draft_error($body, true, '/jobs/createTask')['msg'] ?? null;
  foreach ($cases as $case) {
    $model = $case['model']; $error = null; $seconds = 0;
    try {
      $error = $draft(['model' => $model, 'input' => $case['input']]);
      $input = gateway_normalize_video_input($model, $case['input']);
      if ($error === null) { $error = gateway_validate_video_contract($model, $input, 0); }
      if ($error === null && $model === 'seedance-2-5-lite') { $error = sume_lite_contract($input, $cfg); }
      if ($error === null && (string)($input['workflow_mode'] ?? '') === 'edit') {
        $clip = $meta[$input['reference_video_urls'][0]] ?? [];
        $error = gateway_validate_seedance_25_edit_metadata(['mime' => $clip['mime'] ?? '', 'verified' => !empty($clip['valid']), 'duration' => $clip['duration'] ?? null,
          'width' => $clip['width'] ?? null, 'height' => $clip['height'] ?? null, 'pixels' => ($clip['width'] ?? 0) * ($clip['height'] ?? 0), 'size_bytes' => $clip['bytes'] ?? 0]);
      }
      if ($error === null) {
        if ($model === 'seedance-2-5') { $seconds = gateway_seedance_25_media_seconds($input, 1, GATEWAY_SEEDANCE_25_REFERENCE_SECONDS, 'Seedance 2.5', $inspect); }
        elseif ($model === 'seedance-2-5-lite') { $seconds = gateway_seedance_25_media_seconds($input, 1, GATEWAY_SEEDANCE_25_LITE_REFERENCE_SECONDS, 'Seedance 2.5 Lite', $inspect); }
        else { $seconds = gateway_seedance_video_seconds(array_merge(gateway_seedance_reference_list($input, 'reference_video_urls'), gateway_seedance_reference_list($input, 'video_urls')), 1, null, 'Seedance', $inspect); }
      }
    } catch (InvalidArgumentException $e) { $error = $e->getMessage(); }
    if ($error !== null) { $out[] = ['ok' => false, 'error' => $error]; continue; }
    $route = $cfg['SKILL_MODEL_ROUTES'][$model];
    $forward = array_merge($input, $route['fixed_input'] ?? []);
    foreach ($route['strip_input'] ?? [] as $key) { unset($forward[$key]); }
    $billing = ['_billing_input_seconds' => $seconds];
    if ($model === 'seedance-2-5') { $billing['_billing_edit'] = (string)($input['workflow_mode'] ?? '') === 'edit'; }
    $out[] = ['ok' => true, 'seconds' => $seconds, 'credits' => gateway_estimate_credits($route['gateway_model'], array_merge($forward, $billing)), 'forward' => $forward];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;

const askServer = (cases) => php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ model: c.id, input: c.payload.input }))), JSON.stringify(metaFor(cases))], { sume: true });

test('el catálogo publica las tarifas y los límites del contrato, sin promoción', () => {
  const normal = catalog.models[NORMAL];
  assert.deepEqual(normal.estimate.credits_per_second, NORMAL_RATES);
  assert.deepEqual(normal.estimate.credits_with_video, NORMAL_VIDEO_RATES);
  assert.equal(normal.estimate.auto_duration_seconds, 30);
  assert.equal(normal.estimate.duration_by_mode, undefined);
  assert.equal(normal.estimate.promo, undefined);
  assert.equal(normal.params.reference_video_urls.max, 10);
  assert.equal(normal.params.reference_audio_urls.max, 10);
  const lite = catalog.models[LITE];
  assert.deepEqual(lite.estimate.credits_per_second, LITE_RATES);
  assert.deepEqual(lite.estimate.credits_with_video, LITE_VIDEO_RATES);
  assert.equal(lite.params.reference_video_urls.max, 10);
  assert.equal(lite.params.reference_audio_urls.max, 10);
  assert.deepEqual(catalog.models[TWO].estimate.credits_with_video_matrix.normal, { '480p': 11.73, '720p': 25.5, '1080p': 63.24, '4k': 212.16 });
  assert.deepEqual(catalog.models[MINI].estimate.credits_with_video, { '480p': 9.69, '720p': 20.91 });
  for (const id of [TWO, MINI]) {
    assert.equal(catalog.models[id].params.reference_video_urls.max, 1);
    assert.equal(catalog.models[id].params.reference_audio_urls.max, 1);
  }
  for (const id of IDS) {
    const model = catalog.models[id];
    assert.equal(model.min_cli_version, id === LITE ? '2.3.16' : '2.3.15', id);
    assert.equal(modelUsable(model).ok, true, id);
    assert.equal(model.params.draft_task_id, undefined, id);
    assert.deepEqual(model.params.resolution.values.filter((value) => /draft/i.test(value)), [], id);
    assert.equal(JSON.stringify(model).includes(String.fromCharCode(0x2014)), false, id);
  }
  for (const id of [TWO, MINI]) assert.equal(/draft/i.test(JSON.stringify(catalog.models[id])), false, id);
  assert.match(plan(TWO, { prompt: 'x', draft: 'true' }).errors.join('\n'), /Parametro desconocido: --draft/);
  assert.match(plan(LITE, { prompt: 'x', draft_task_id: 'abc' }).errors.join('\n'), /Parametro desconocido: --draft_task_id/);
});

test('las cifras medidas del contrato salen exactas', () => {
  // Sin vídeo: 10 s a 1080p. Automática: 30 s. Editar: clip de 5 s a 480p son 10 s a 17,34 cr/s (170 cr de Kie x 1,02).
  assert.equal(plan(NORMAL, { prompt: 'x', resolution: '1080p', duration: 10 }).estimate.credits, 1612);
  assert.equal(plan(NORMAL, { prompt: 'x', resolution: '720p', auto_duration: 'true' }).estimate.credits, 1928);
  const edit = plan(NORMAL, { prompt: 'x', mode: 'edit', resolution: '480p', reference_video_urls: [clip(5)] });
  assert.equal(edit.estimate.credits, 174);
  assert.match(edit.estimate.note, /2 x 5 s del clip = 10 s/);
  // 6 s de salida con un vídeo de 3 s: 9 s a la tarifa con vídeo.
  const reference = plan(NORMAL, { prompt: 'x', mode: 'ref', resolution: '480p', duration: 6, reference_video_urls: [clip(3)] });
  assert.equal(reference.estimate.credits, 157);
  assert.match(reference.estimate.note, /6 s de salida \+ 3 s de vídeo de referencia = 9 s/);
  // Automática con vídeo: 30 s de salida + 3 s.
  assert.equal(plan(NORMAL, { prompt: 'x', mode: 'ref', resolution: '480p', auto_duration: 'true', reference_video_urls: [clip(3)] }).estimate.credits, 573);
  // Cada vídeo sube al segundo superior: 3,2 s + 4,1 s son 9 s, no 8.
  const two = plan(NORMAL, { prompt: 'x', mode: 'ref', resolution: '720p', duration: 4, reference_video_urls: [clip(3.2), clip(4.1)] });
  assert.equal(two.estimate.credits, Math.ceil(38.76 * 13));
  // Imágenes y audio no suman segundos.
  const others = plan(NORMAL, { prompt: 'x', mode: 'ref', reference_image_urls: [media.image('imagen.png')], reference_audio_urls: [audioClip(10)] });
  assert.equal(others.estimate.credits, 322);
  // Seedance 2.0 y Mini: la tarifa con vídeo sobre salida + entrada.
  assert.equal(plan(TWO, { prompt: 'x', mode: 'ref', resolution: '720p', duration: 5, reference_video_urls: [clip(8.2)] }).estimate.credits, Math.ceil(25.5 * 14));
  assert.equal(plan(MINI, { prompt: 'x', mode: 'ref', resolution: '720p', duration: 5, reference_video_urls: [clip(8.2)] }).estimate.credits, Math.ceil(20.91 * 14));
  assert.equal(plan(TWO, { prompt: 'x', speed: 'fast', resolution: '720p', duration: 5 }).estimate.credits, Math.ceil(41.82 * 5), 'Fast se reserva como Normal');
});

test('límites locales: suma exacta, un solo vídeo en 2.0 y Mini, y vídeos medibles', () => {
  const webm = media.put('referencia.webm', Buffer.concat([Buffer.from('1a45dfa3', 'hex'), Buffer.alloc(64)]), { mime: 'video/webm', duration: 5 });
  const cases = [
    ['once vídeos', NORMAL, { prompt: 'x', mode: 'ref', reference_video_urls: range(1, 11).map(() => clip(1)) }, /como mucho 10/],
    ['once audios', NORMAL, { prompt: 'x', mode: 'ref', reference_audio_urls: range(1, 11).map(() => audioClip(1)) }, /como mucho 10/],
    ['vídeos de más de 30 s', NORMAL, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(15.1), clip(15)] }, /Los vídeos de referencia de Seedance 2\.5 no pueden sumar más de 30 segundos\./],
    ['audios de más de 30 s', NORMAL, { prompt: 'x', mode: 'ref', reference_audio_urls: [audioClip(15.1), audioClip(15)] }, /Los audios de referencia de Seedance 2\.5 no pueden sumar más de 30 segundos\./],
    ['un vídeo como audio', NORMAL, { prompt: 'x', mode: 'ref', reference_audio_urls: [clip(3)] }, /Un audio de referencia no es un archivo de audio válido\./],
    ['dos vídeos en 2.0', TWO, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(4), clip(5)] }, /como mucho 1/],
    ['dos vídeos en Mini', MINI, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(4), clip(5)] }, /como mucho 1/],
    ['vídeo de más de 15 s en 2.0', TWO, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(15.1)] }, /Los vídeos de referencia de Seedance 2\.0 no pueden sumar más de 15 segundos\./],
    ['vídeo de más de 15 s en Mini', MINI, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(15.1)] }, /Los vídeos de referencia de Seedance 2\.0 Mini no pueden sumar más de 15 segundos\./],
    ['WebM en Normal', NORMAL, { prompt: 'x', mode: 'ref', reference_video_urls: [webm] }, /MP4 o MOV medible/],
    ['WebM en 2.0', TWO, { prompt: 'x', mode: 'ref', reference_video_urls: [webm] }, /MP4 o MOV medible/],
    ['WebM en Mini', MINI, { prompt: 'x', mode: 'ref', reference_video_urls: [webm] }, /MP4 o MOV medible/],
    ['editar sin clip', NORMAL, { prompt: 'x', mode: 'edit' }, /Editar vídeo requiere exactamente un vídeo original\./],
    ['editar dos clips', NORMAL, { prompt: 'x', mode: 'edit', reference_video_urls: [clip(5), clip(6)] }, /Editar vídeo requiere exactamente un vídeo original\./],
  ];
  for (const [name, id, given, message] of cases) {
    const result = plan(id, given);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), message, name);
  }
  assert.equal(plan(NORMAL, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(30)] }).ok, true, 'el tope es 30 s exactos');
  assert.equal(plan(TWO, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(15)] }).ok, true, 'el tope es 15 s exactos');
  assert.equal(plan(NORMAL, { prompt: 'x', mode: 'ref', reference_video_urls: range(1, 10).map(() => clip(3)), reference_audio_urls: range(1, 10).map(() => audioClip(3)) }).ok, true, '10 + 10 sumando 30 s');
  // El audio no cambia el precio: uno que no se puede medir no cuenta en la suma y decide el proveedor, como en el servidor.
  const unmeasured = plan(NORMAL, { prompt: 'x', mode: 'ref', reference_audio_urls: [media.put('sin-cabecera.mp3', Buffer.from('ID3'), { mime: 'audio/mpeg' })] });
  assert.equal(unmeasured.ok, true, unmeasured.errors?.join(' '));
  assert.equal(unmeasured.estimate.credits, 322);
  // Un estimador sin medición no devuelve cifra: nunca autoriza por debajo de la reserva.
  const model = { id: NORMAL, ...catalog.models[NORMAL] };
  assert.equal(estimateCredits(model, { resolution: '720p', duration: 5, reference_video_urls: [webm] }).credits, null);
  assert.equal(estimateCredits(model, { resolution: '720p', duration: 5, reference_video_urls: [path.join(temporary, 'no-existe.mp4')] }).credits, null);
});

test('regla de oro con el PHP real: la CLI reserva exactamente lo mismo en toda combinación facturable', parity, () => {
  const cases = [];
  const base = { prompt: 'Una escena' };
  const add = (id, given) => {
    const planned = plan(id, { ...base, ...given });
    assert.equal(planned.ok, true, id + ' ' + JSON.stringify(given) + ' ' + planned.errors?.join(' '));
    cases.push({ ...planned, label: id + ' ' + JSON.stringify({ ...given, prompt: undefined }) });
  };
  // Normal: cada resolución y duración con 0 a 39 s de entrada (el máximo de 10 vídeos que suman 30 s), automática y edición.
  for (const resolution of ['480p', '720p', '1080p']) {
    for (const input of range(0, 39)) {
      const reference_video_urls = videosBilling(input);
      const refs = input ? { mode: 'ref', reference_video_urls } : {};
      for (const duration of range(4, 30)) add(NORMAL, { resolution, duration, ...refs });
      add(NORMAL, { resolution, auto_duration: 'true', ...refs });
    }
    for (const seconds of range(4, 30)) add(NORMAL, { resolution, mode: 'edit', reference_video_urls: [clip(seconds)] });
    add(NORMAL, { resolution, mode: 'edit', reference_video_urls: [clip(8.2)] });
    // Lite: de 0 a 40 s de entrada (30,2 s exactos en 10 vídeos).
    for (const input of range(0, 40)) {
      const refs = input ? { mode: 'ref', reference_video_urls: videosBilling(input) } : {};
      for (const duration of range(4, 30)) add(LITE, { resolution, duration, ...refs });
    }
  }
  // 2.0, Fast y Mini: de 0 a 15 s de entrada en un solo vídeo.
  const pairs = [[TWO, 'normal', ['480p', '720p', '1080p', '4k']], [TWO, 'fast', ['480p', '720p']], [MINI, null, ['480p', '720p']]];
  for (const [id, speed, resolutions] of pairs) for (const resolution of resolutions) for (const input of range(0, 15)) for (const duration of range(4, 15)) {
    add(id, { resolution, duration, ...(speed ? { speed } : {}), ...(input ? { mode: 'ref', reference_video_urls: videosBilling(input) } : {}) });
  }
  const results = askServer(cases);
  assert.equal(results.length, cases.length);
  cases.forEach((c, index) => {
    const server = results[index];
    assert.equal(server.ok, true, `${c.label}: ${server.error}`);
    assert.ok(Number.isFinite(c.estimate.credits), c.label);
    assert.ok(c.estimate.credits >= server.credits, `${c.label}: la CLI autoriza ${c.estimate.credits} y el servidor reserva ${server.credits}`);
    assert.equal(c.estimate.credits, server.credits, c.label);
  });
  assert.equal(cases.length, 8301);
});

test('paridad con el PHP real: el servidor acepta el cuerpo que construye la CLI y lo devuelve igual', parity, () => {
  const image = media.image('paridad.png', 1024, 768);
  const first = media.image('primero.png', 1024, 768);
  const cases = [
    [NORMAL, { prompt: 'Texto', resolution: '1080p', duration: 12, aspect_ratio: '9:16' }],
    [NORMAL, { prompt: 'Automática', auto_duration: 'true' }],
    [NORMAL, { prompt: 'Fotogramas', mode: 'i2v', first_frame_url: first, last_frame_url: image }],
    [NORMAL, { prompt: 'Diez y diez', mode: 'ref', reference_image_urls: [image], reference_video_urls: range(1, 10).map(() => clip(3)), reference_audio_urls: range(1, 10).map(() => audioClip(3)) }],
    [NORMAL, { prompt: 'Edita', mode: 'edit', resolution: '720p', reference_video_urls: [clip(8.2)] }],
    [TWO, { prompt: 'Texto', resolution: '4k', duration: 15 }],
    [TWO, { prompt: 'Referencias', mode: 'ref', speed: 'fast', resolution: '720p', reference_image_urls: [image], reference_video_urls: [clip(15)], reference_audio_urls: [audioClip(5)] }],
    [MINI, { prompt: 'Texto' }],
    [MINI, { prompt: 'Referencias', mode: 'ref', resolution: '720p', reference_video_urls: [clip(12.34)], reference_audio_urls: [audioClip(5)] }],
    [LITE, { prompt: 'Diez y diez', mode: 'ref', reference_video_urls: range(1, 10).map(() => clip(3)), reference_audio_urls: range(1, 10).map(() => audioClip(3)) }],
  ].map(([id, given]) => plan(id, given));
  for (const c of cases) assert.equal(c.ok, true, c.errors?.join(' '));
  const results = askServer(cases);
  cases.forEach((c, index) => {
    const server = results[index];
    const name = c.id + ' ' + c.payload.input.prompt;
    assert.equal(server.ok, true, `${name}: ${server.error}`);
    assert.equal(c.estimate.credits, server.credits, name);
    for (const key of ['prompt', 'resolution', 'reference_image_urls', 'reference_video_urls', 'reference_audio_urls', 'first_frame_url', 'last_frame_url']) {
      assert.deepEqual(server.forward[key], c.payload.input[key], `${name}: ${key}`);
    }
    for (const key of ['_billing_input_seconds', '_billing_edit']) assert.equal(key in server.forward, false, `${name}: ${key} no viaja al proveedor`);
    for (const key of ['draft', 'draft_task_id']) assert.equal(key in c.payload.input, false, key);
  });
  assert.equal(results[4].forward.duration, -1, 'Editar vídeo va con duración automática');
  assert.equal(results[4].seconds, 9);
  assert.equal(results[3].seconds, 30);
});

test('paridad con el PHP real: lo que la CLI rechaza el servidor también lo rechaza, con el mismo texto', parity, () => {
  const image = media.image('rechazo.png', 1024, 768);
  const short = clip(3);
  const long = clip(31);
  const input = (extra) => ({ prompt: 'x', resolution: '720p', duration: 5, aspect_ratio: 'adaptive', generate_audio: true, ...extra });
  const url = (file) => media.url(file);
  const raw = (id, extra, files = []) => ({ id, payload: { input: input(extra) }, files });
  const server = [
    ['el Last Frame exige First Frame', NORMAL, { last_frame_url: image }, raw(NORMAL, { last_frame_url: url(image) }, [image])],
    ['frames con referencias', NORMAL, { mode: 'ref', first_frame_url: image, reference_image_urls: [image] }, raw(NORMAL, { first_frame_url: url(image), reference_image_urls: [url(image)] }, [image])],
    ['frames con vídeo en 2.0', TWO, { mode: 'ref', first_frame_url: image, reference_video_urls: [short] }, raw(TWO, { first_frame_url: url(image), reference_video_urls: [url(short)] }, [image, short])],
    ['editar con frames', NORMAL, { mode: 'edit', first_frame_url: image, reference_video_urls: [clip(5)] }, raw(NORMAL, { mode: 'edit', first_frame_url: url(image), reference_video_urls: [url(clip(5))] }, [image, clip(5)])],
    ['editar con imágenes', NORMAL, { mode: 'edit', reference_image_urls: [image], reference_video_urls: [clip(5)] }, raw(NORMAL, { mode: 'edit', reference_image_urls: [url(image)], reference_video_urls: [url(clip(5))] }, [image, clip(5)])],
    ['editar con audio', NORMAL, { mode: 'edit', reference_audio_urls: [audioClip(5)], reference_video_urls: [clip(5)] }, raw(NORMAL, { mode: 'edit', reference_audio_urls: [url(audioClip(5))], reference_video_urls: [url(clip(5))] }, [audioClip(5), clip(5)])],
    ['editar dos vídeos', NORMAL, { mode: 'edit', reference_video_urls: [clip(5), clip(6)] }, raw(NORMAL, { mode: 'edit', reference_video_urls: [url(clip(5)), url(clip(6))] }, [clip(5), clip(6)])],
    ['editar sin prompt', NORMAL, { mode: 'edit', prompt: '  ', reference_video_urls: [clip(5)] }, raw(NORMAL, { mode: 'edit', prompt: '  ', reference_video_urls: [url(clip(5))] }, [clip(5)])],
    ['editar un clip de 3 s', NORMAL, { mode: 'edit', reference_video_urls: [short] }, raw(NORMAL, { mode: 'edit', reference_video_urls: [url(short)] }, [short])],
    ['editar un clip de 31 s', NORMAL, { mode: 'edit', reference_video_urls: [long] }, raw(NORMAL, { mode: 'edit', reference_video_urls: [url(long)] }, [long])],
    ['vídeos de más de 30 s', NORMAL, { mode: 'ref', reference_video_urls: [clip(15.1), clip(15)] }, raw(NORMAL, { reference_video_urls: [url(clip(15.1)), url(clip(15))] }, [clip(15.1), clip(15)])],
    ['audios de más de 30 s', NORMAL, { mode: 'ref', reference_audio_urls: [audioClip(15.1), audioClip(15)] }, raw(NORMAL, { reference_audio_urls: [url(audioClip(15.1)), url(audioClip(15))] }, [audioClip(15.1), audioClip(15)])],
    ['un vídeo como audio', NORMAL, { mode: 'ref', reference_audio_urls: [clip(3)] }, raw(NORMAL, { reference_audio_urls: [url(clip(3))] }, [clip(3)])],
  ];
  const results = askServer(server.map(([, , , c]) => c));
  server.forEach(([name, id, given], index) => {
    assert.equal(results[index].ok, false, `${name}: el servidor debía rechazarlo`);
    const local = plan(id, { prompt: 'x', ...given });
    assert.equal(local.ok, false, `${name}: la CLI debía rechazarlo`);
    assert.ok(local.errors.includes(results[index].error), `${name}: CLI ${JSON.stringify(local.errors)} frente a servidor «${results[index].error}»`);
  });
  // Lo que solo el catálogo limita, sin el mismo texto: el conteo.
  const counts = [
    ['once vídeos', raw(NORMAL, { reference_video_urls: range(1, 11).map(() => url(clip(1))) }, [clip(1)])],
    ['once audios', raw(NORMAL, { reference_audio_urls: range(1, 11).map(() => url(audioClip(1))) }, [audioClip(1)])],
    ['dos vídeos en 2.0', raw(TWO, { reference_video_urls: [url(clip(4)), url(clip(5))] }, [clip(4), clip(5)])],
    ['dos vídeos en Mini', raw(MINI, { reference_video_urls: [url(clip(4)), url(clip(5))] }, [clip(4), clip(5)])],
    ['dos audios en 2.0', raw(TWO, { reference_audio_urls: [url(audioClip(4)), url(audioClip(5))] }, [audioClip(4), audioClip(5)])],
    ['vídeo que no es una subida propia', raw(NORMAL, { reference_video_urls: ['https://ajeno.example/video.mp4'] })],
    ['vídeo que no es una subida propia en Mini', raw(MINI, { reference_video_urls: ['https://ajeno.example/video.mp4'] })],
    ['vídeo sin medir', { id: TWO, payload: { input: input({ reference_video_urls: [url(media.put('sin-medir.mp4', Buffer.alloc(8), { mime: 'video/mp4', valid: false }))] }) }, files: [path.join(temporary, 'files', 'sin-medir.mp4')] }],
    ['draft', raw(NORMAL, { draft: true })],
    ['draft en Lite', raw(LITE, { mode: 't2v', draft: true })],
    ['draft_task_id', raw(NORMAL, { draft_task_id: 'tarea' })],
  ];
  const refused = askServer(counts.map(([, c]) => c));
  counts.forEach(([name], index) => assert.equal(refused[index].ok, false, `${name}: el servidor debía rechazarlo`));
  assert.match(refused[0].error, /Seedance 2\.5 admite como máximo 10 vídeos y 10 audios de referencia/);
  for (const index of [8, 9]) assert.match(refused[index].error, /modo draft de Seedance 2\.5/);
  // Los slugs privados tampoco pasan: la skill nunca los envía.
  const slugs = php(`$out = []; foreach (['bytedance/seedance-2-5', 'bytedance/seedance-2-5-draft', 'bytedance/seedance-2-5-lite', 'bytedance/seedance-2-5-lite-draft'] as $slug) { $out[] = gateway_seedance_25_private_slug_error($slug); } echo json_encode($out);`);
  for (const message of slugs) assert.match(message, /No se ha cobrado nada/);
});

test('el límite de 15 s de Seedance 2.0 y Mini es de la CLI: el servidor lo deja al proveedor', parity, () => {
  const c = { id: MINI, payload: { input: { prompt: 'x', resolution: '720p', duration: 5, reference_video_urls: [media.url(clip(16))] } }, files: [clip(16)] };
  const [server] = askServer([c]);
  // Si el servidor pasa a limitarlo, esto es lo que hay que revisar: la CLI ya lo rechaza.
  assert.equal(server.ok, true, 'hoy `gateway_seedance_video_seconds` recibe un máximo nulo para 2.0 y Mini');
  assert.equal(plan(MINI, { prompt: 'x', mode: 'ref', reference_video_urls: [clip(16)] }).ok, false);
});

test('compatibilidad: los parsers 2.3.7 a 2.3.14 aceptan el catálogo y no ofrecen los cuatro modelos', parity, async () => {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  for (const version of OLD_RUNTIMES) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(raw));
    assert.equal(Object.keys(parsed.models).length, Object.keys(catalog.models).length, version);
    for (const id of IDS) {
      const usable = old.modelUsable(parsed.models[id]);
      assert.equal(usable.ok, false, `la CLI ${version} no debe ofrecer ${id}`);
      assert.match(usable.reason, new RegExp('Actualiza la skill.*' + catalog.models[id].min_cli_version.replace(/\./g, '\\.')), `${version} ${id}`);
    }
    assert.equal(old.catalogCompatible(parsed).ok, true, version);
  }
});

test('por qué 2.3.15: un runtime 2.3.14 con estas tarifas autoriza menos que la reserva en los tres modelos de Kie', parity, async () => {
  const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases/2.3.14/scripts/lib/catalog.mjs')).href);
  const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
  for (const id of [NORMAL, TWO, MINI]) {
    const given = { prompt: 'x', mode: 'ref', resolution: '720p', duration: 5, reference_video_urls: [clip(8)] };
    const current = plan(id, given);
    const [server] = askServer([current]);
    const stale = old.estimateCredits({ id, ...parsed.models[id] }, { ...given });
    assert.ok(stale.credits < server.credits, `${id}: ${stale.credits} frente a ${server.credits}`);
    assert.equal(current.estimate.credits, server.credits, id);
  }
  // Editar: el runtime antiguo no puede reservar 2 x 16 s y autorizaría 5 s de salida.
  const edit = plan(NORMAL, { prompt: 'x', mode: 'edit', resolution: '720p', reference_video_urls: [clip(16)] });
  const stale = old.estimateCredits({ id: NORMAL, ...parsed.models[NORMAL] }, { mode: 'edit', resolution: '720p', duration: 5, reference_video_urls: [clip(16)] });
  assert.ok(stale.credits < edit.estimate.credits);
});

test('CLI real: prepare mide los vídeos, respeta --max-credits y submit envía el cuerpo exacto', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-seedance-cli-'));
  const credentials = path.join(temp, 'credentials');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'S'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = new URL(req.url, base);
    const body = /json/.test(req.headers['content-type'] || '') ? JSON.parse(Buffer.concat(chunks).toString() || '{}') : {};
    requests.push({ query: url.searchParams.get('path'), body });
    if (url.pathname === '/result.mp4') { res.writeHead(200, { 'content-type': 'video/mp4' }); return res.end(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)])); }
    let response = { ok: true, user: { email: 'test@example.invalid', tier: 'hub' }, balance: 500000 };
    if (body.action === 'task_costs') response = { ok: true, costs: { seedance_job: 100 } };
    if (url.pathname.endsWith('/upload.php')) {
      const name = base + 'uploads/' + requests.length + '.bin';
      response = { ok: true, code: 200, url: name, data: { url: name }, expires_at: '2099-01-01 00:00:00' };
    }
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = { code: 200, data: { taskId: 'seedance_job' } };
      else response = { code: 200, data: { taskId: 'seedance_job', state: 'success', resultJson: JSON.stringify({ resultUrls: [base + 'result.mp4'] }) } };
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath,
    AILAB_CONFIG_DIR: path.join(temp, 'config'), AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out') };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  const list = (name, files) => files.flatMap((file) => ['--' + name, file]);

  await assert.rejects(exec('prepare', TWO, '--prompt', 'x', '--draft', 'true'), /Parametro desconocido: --draft/);
  await assert.rejects(exec('prepare', NORMAL, '--prompt', 'x', '--mode', 'ref', ...list('reference_video_urls', [clip(16), clip(15)])), /no pueden sumar más de 30 segundos/);
  assert.equal(requests.length, 0, 'lo que se rechaza en local no llega al servidor');

  const scenarios = [
    { id: NORMAL, expected: Math.ceil(38.76 * 13), keys: ['aspect_ratio', 'auto_duration', 'duration', 'generate_audio', 'mode', 'prompt', 'reference_audio_urls', 'reference_video_urls', 'resolution'],
      args: ['--mode', 'ref', '--prompt', '@Video1 y @Video2', '--duration', '4', ...list('reference_video_urls', [clip(3.2), clip(4.1)]), ...list('reference_audio_urls', [audioClip(3), audioClip(4)])], note: /4 s de salida \+ 9 s de vídeo de referencia = 13 s/, videos: 2 },
    { id: NORMAL, expected: 1241, args: ['--mode', 'edit', '--prompt', 'Cambia el cielo', '--reference_video_urls', clip(16)], note: /2 x 16 s del clip = 32 s/, videos: 1 },
    { id: TWO, expected: Math.ceil(25.5 * 14), args: ['--mode', 'ref', '--prompt', '@Video1', '--resolution', '720p', '--duration', '5', '--reference_video_urls', clip(8.2)], note: /5 s de salida \+ 9 s de vídeo de referencia = 14 s/, videos: 1 },
    { id: MINI, expected: Math.ceil(20.91 * 14), args: ['--mode', 'ref', '--prompt', '@Video1', '--resolution', '720p', '--duration', '5', '--reference_video_urls', clip(8.2)], note: /= 14 s/, videos: 1 },
  ];
  for (const scenario of scenarios) {
    const { stdout } = await exec('prepare', scenario.id, ...scenario.args, '--max-credits', String(scenario.expected));
    assert.match(stdout, new RegExp(`Estimacion: ~${scenario.expected} cr`), scenario.id);
    assert.match(stdout, scenario.note, scenario.id);
    const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
    assert.ok(id, stdout);
    const before = requests.length;
    await assert.rejects(exec('prepare', scenario.id, ...scenario.args, '--max-credits', String(scenario.expected - 1)), /supera el m[aá]ximo/i);
    assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, requests.slice(0, before).filter((request) => request.query === '/jobs/createTask').length);
    await exec('submit', id, '--confirmed');
    const sends = requests.filter((request) => request.query === '/jobs/createTask');
    const sent = sends[sends.length - 1].body;
    assert.equal(sent.model, scenario.id);
    assert.equal(sent.max_credits_authorized, scenario.expected, scenario.id);
    assert.equal(sent.input.reference_video_urls.length, scenario.videos);
    if (scenario.keys) assert.deepEqual(Object.keys(sent.input).sort(), scenario.keys);
    for (const key of ['draft', 'draft_task_id', '_billing_input_seconds', '_billing_edit']) assert.equal(key in sent.input, false, key);
  }
});

test('acceso por token: los cuatro modelos tienen ruta y el servidor exige el permiso de generar', parity, () => {
  const routes = php(`$c = wallet_config(); echo json_encode(array_map(static fn($id) => $c['SKILL_MODEL_ROUTES'][$id]['gateway_model'] ?? null, ['seedance-2-5', 'seedance-2-5-lite', 'seedance-2', 'seedance-2-mini']));`);
  assert.deepEqual(routes, ['bytedance/seedance-2-5', 'bytedance/seedance-2-5-lite', 'bytedance/seedance-2', 'bytedance/seedance-2-mini']);
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/wallet/gateway.php'), 'utf8');
  assert.match(source, /wallet_require_scope\('generate'\)/);
});
