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

// Seedance 2.5 Lite (ByteDance vía Sume). Contrato del servidor: sume_lite_contract, sume_route_lite,
// gateway_seedance_25_lite_video_seconds y gateway_estimate_credits. Con AILAB_CANONICAL_REPO las
// comparaciones usan el PHP real con metadatos simulados: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-lite-skill-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const model = { id: 'seedance-2-5-lite', ...catalog.models['seedance-2-5-lite'] };
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));
const RATES = { '480p': 20.9712, '720p': 47.1648, '1080p': 115.9944 };

function plan(given) {
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const estimate = estimateCredits(model, { ...v.params, ...v.fileParams });
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  const payload = buildPayload(model, v.params, uploaded);
  const meta = {};
  for (const files of Object.values(v.fileParams)) for (const file of files) meta[media.url(file)] = media.meta[file];
  return { ok: true, v, estimate, payload, meta };
}

test('el contrato publicado exige la skill 2.3.13, es Lite sin edición y las CLI anteriores lo ignoran', async () => {
  assert.equal(model.min_cli_version, '2.3.13');
  assert.equal(model.enabled, true);
  assert.deepEqual(model.modes, ['t2v', 'i2v', 'ref'], 'Lite no edita vídeo');
  assert.deepEqual(model.params.mode.values, ['t2v', 'i2v', 'ref']);
  assert.match(model.description, /No edita vídeo/);
  assert.equal(model.params.prompt.max_len, 15000);
  assert.deepEqual([model.params.duration.min, model.params.duration.max, model.params.duration.default], [4, 30, 5]);
  assert.deepEqual(model.params.resolution.values, ['480p', '720p', '1080p']);
  assert.equal(model.params.reference_image_urls.max, 30);
  assert.equal(model.params.reference_video_urls.max, 1);
  assert.equal(model.params.reference_audio_urls.max, 1);
  assert.equal(model.estimate.kind, 'per_second_table');
  assert.deepEqual(model.estimate.credits_per_second, RATES);
  const text = JSON.stringify(model);
  for (const forbidden of ['bytedance/seedance', 'provider_contract', 'callBackUrl', 'SUME_API_KEY']) assert.equal(text.includes(forbidden), false, forbidden);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  assert.equal(modelUsable(model).ok, true);
  if (!CANONICAL) return;
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12']) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    assert.equal(old.modelUsable(parsed.models['seedance-2-5-lite']).ok, false, 'la CLI ' + version + ' no debe ofrecer Lite');
  }
});

test('sin vídeo, 3 resoluciones y 27 duraciones dan la tarifa por segundo; con vídeo se reserva salida más entrada', () => {
  let checked = 0;
  for (const resolution of ['480p', '720p', '1080p']) for (let duration = 4; duration <= 30; duration += 1) {
    const result = plan({ prompt: 'Una escena', resolution, duration });
    assert.equal(result.ok, true, result.errors?.join('\n'));
    assert.equal(result.estimate.credits, Math.ceil(Number((RATES[resolution] * duration).toFixed(6))), `${resolution} ${duration}`);
    assert.equal(result.estimate.approximate, false);
    checked += 1;
  }
  assert.equal(checked, 81);
  assert.equal(plan({ prompt: 'x' }).estimate.credits, 236, '5 s a 720p');
  // Un vídeo de 8,2 s se redondea a 9 s: 10 s de salida + 9 s = 19 s a 720p.
  const withVideo = plan({ mode: 'ref', prompt: 'Mira @Video1', duration: 10, reference_video_urls: [media.video('lv82.mp4', 8.2)] });
  assert.equal(withVideo.ok, true, withVideo.errors?.join('\n'));
  assert.equal(withVideo.estimate.credits, Math.ceil(Number((RATES['720p'] * 19).toFixed(6))));
  assert.equal(withVideo.estimate.credits, 897);
  assert.equal(withVideo.estimate.approximate, true);
  assert.match(withVideo.estimate.note, /10 s de salida \+ 9 s de vídeo de referencia = 19 s/);
  // Imágenes y audio no suman segundos.
  const images = plan({ mode: 'ref', prompt: 'x', reference_image_urls: [media.image('li1.png')], reference_audio_urls: [media.wavAudio('la1.wav', 5)] });
  assert.equal(images.estimate.credits, 236);
  assert.equal(images.estimate.approximate, false);
});

test('límites de la CLI: modalidades excluyentes, materiales y vídeo medido', () => {
  const img = (name) => media.image(name, 800, 600);
  const cases = [
    ['prompt vacío', { prompt: '  ' }, /requiere un prompt/],
    ['prompt de 15.001 caracteres', { prompt: 'a'.repeat(15001) }, /supera 15000|supera los 15\.000/],
    ['duración 3', { prompt: 'x', duration: 3 }, /minimo 4/],
    ['duración 31', { prompt: 'x', duration: 31 }, /maximo 30/],
    ['duración automática', { prompt: 'x', duration: '-1' }, /minimo 4/],
    ['proporción inválida', { prompt: 'x', aspect_ratio: '2:1' }, /debe ser uno de/],
    ['texto con imágenes', { prompt: 'x', mode: 't2v', reference_image_urls: [img('a.png')] }, /no admite imágenes ni referencias/],
    ['i2v sin primer fotograma', { prompt: 'x', mode: 'i2v' }, /first_frame_url/],
    ['último sin primero', { prompt: 'x', mode: 'ref', last_frame_url: img('b.png'), reference_image_urls: [img('c.png')] }, /exige un primer fotograma/],
    ['i2v con referencias', { prompt: 'x', mode: 'i2v', first_frame_url: img('d.png'), reference_image_urls: [img('e.png')] }, /no admite referencias/],
    ['ref sin referencias', { prompt: 'x', mode: 'ref' }, /al menos una imagen/],
    ['ref con fotogramas', { prompt: 'x', mode: 'ref', first_frame_url: img('f.png'), reference_image_urls: [img('g.png')] }, /no combina fotogramas con referencias/],
    ['31 imágenes', { prompt: 'x', mode: 'ref', reference_image_urls: Array.from({ length: 31 }, (_, i) => img(`h${i}.png`)) }, /como mucho 30/],
    ['dos vídeos', { prompt: 'x', mode: 'ref', reference_video_urls: [media.video('v1.mp4', 4), media.video('v2.mp4', 4)] }, /como mucho 1/],
    ['dos audios', { prompt: 'x', mode: 'ref', reference_audio_urls: [media.wavAudio('a1.wav', 2), media.wavAudio('a2.wav', 2)] }, /como mucho 1/],
    ['vídeo de 31 s', { prompt: 'x', mode: 'ref', reference_video_urls: [media.video('v31.mp4', 31)] }, /no pueden sumar más de 30 segundos/],
    ['WebM', { prompt: 'x', mode: 'ref', reference_video_urls: [media.put('lite.webm', Buffer.concat([Buffer.from('1a45dfa3', 'hex'), Buffer.alloc(64)]), { mime: 'video/webm', duration: 5 })] }, /MP4 o MOV medible/],
    ['edición', { prompt: 'x', mode: 'edit' }, /debe ser uno de/],
  ];
  for (const [name, given, message] of cases) {
    const result = plan(given);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), message, name);
  }
  assert.equal(plan({ prompt: 'x', mode: 'ref', reference_video_urls: [media.video('v30.mp4', 30.2)] }).ok, true, 'el tope del servidor es 30,2 s');
  assert.equal(plan({ prompt: '😀'.repeat(15000) }).ok, true, 'los caracteres se cuentan como puntos de código');
});

test('el payload lleva siempre aspect_ratio y generate_audio, fuerza adaptive con primer fotograma y no manda campos ajenos', () => {
  const text = plan({ prompt: '  Un zorro  ', resolution: '1080p', duration: 8, aspect_ratio: '9:16', generate_audio: 'false' });
  assert.deepEqual(text.payload, { model: 'seedance-2-5-lite', input: { mode: 't2v', prompt: 'Un zorro', resolution: '1080p', duration: 8, aspect_ratio: '9:16', generate_audio: false } });
  const first = media.image('pf1.png');
  const last = media.image('pf2.png');
  const frames = plan({ mode: 'i2v', prompt: 'x', aspect_ratio: '16:9', first_frame_url: first, last_frame_url: last });
  assert.deepEqual(frames.payload.input, { mode: 'i2v', prompt: 'x', resolution: '720p', duration: 5, aspect_ratio: 'adaptive', generate_audio: true,
    first_frame_url: media.url(first), last_frame_url: media.url(last) });
  const refs = plan({ mode: 'ref', prompt: '@Image1 y @Video1 con @Audio1', reference_image_urls: [first, last], reference_video_urls: [media.video('pv.mp4', 3)], reference_audio_urls: [media.wavAudio('pa.wav', 3)] });
  assert.deepEqual(Object.keys(refs.payload.input).sort(), ['aspect_ratio', 'duration', 'generate_audio', 'mode', 'prompt', 'reference_audio_urls', 'reference_image_urls', 'reference_video_urls', 'resolution']);
  for (const key of ['web_search', 'callBackUrl', 'first_frame_url', '_billing_input_seconds', 'workflow_mode']) assert.equal(key in refs.payload.input, false, key);
});

function validCases() {
  const img = (name) => media.image(name, 1024, 768);
  return [
    ['texto 5 s', { prompt: 'Un zorro cruza el bosque' }],
    ['texto 4 s a 480p', { prompt: 'Corto', duration: 4, resolution: '480p' }],
    ['texto 30 s a 1080p sin audio', { prompt: 'Largo', duration: 30, resolution: '1080p', generate_audio: 'false' }],
    ['texto vertical', { prompt: 'Vertical', aspect_ratio: '9:16', duration: 12 }],
    ['i2v solo primer fotograma', { mode: 'i2v', prompt: 'Mueve la cámara', first_frame_url: img('lc1.png') }],
    ['i2v con último fotograma', { mode: 'i2v', prompt: 'Del primero al último', first_frame_url: img('lc2.png'), last_frame_url: img('lc3.png'), duration: 9 }],
    ['ref con una imagen', { mode: 'ref', prompt: '@Image1 camina', reference_image_urls: [img('lc4.png')] }],
    ['ref con treinta imágenes', { mode: 'ref', prompt: '@Image30', reference_image_urls: Array.from({ length: 30 }, (_, i) => img(`lci${i}.png`)) }],
    ['ref con un vídeo de 8,2 s', { mode: 'ref', prompt: '@Video1', duration: 10, reference_video_urls: [media.video('lcv1.mp4', 8.2)] }],
    ['ref con un vídeo mov de 12,34 s', { mode: 'ref', prompt: '@Video1', duration: 6, resolution: '1080p', reference_video_urls: [media.video('lcv2.mov', 12.34, 'qt')] }],
    ['ref con un vídeo de 30,2 s', { mode: 'ref', prompt: '@Video1', duration: 4, reference_video_urls: [media.video('lcv3.mp4', 30.2)] }],
    ['ref con un vídeo de 5,0004 s (5,000 en milésimas)', { mode: 'ref', prompt: '@Video1', reference_video_urls: [media.video('lcv4.mp4', 5.0004)] }],
    ['ref con un audio', { mode: 'ref', prompt: '@Audio1', reference_audio_urls: [media.wavAudio('lca.wav', 6)] }],
    ['ref con imagen, vídeo y audio', { mode: 'ref', prompt: '@Image1 @Video1 @Audio1', duration: 15, reference_image_urls: [img('lcm.png')], reference_video_urls: [media.video('lcv5.mp4', 3)], reference_audio_urls: [media.mp3Audio('lca2.mp3', 3)] }],
  ];
}

const PHP_BACKEND = `
  $cfg = wallet_config(); $cases = json_decode($argv[1], true); $out = [];
  foreach ($cases as $case) {
    $meta = $case['meta'] ?? []; $input = $case['input'];
    $inspect = static fn($url, $kind) => $meta[$url] ?? null;
    $error = sume_lite_contract($input, $cfg); $seconds = 0;
    if ($error === null) {
      try { $seconds = gateway_seedance_25_lite_video_seconds($input, 1, $inspect); }
      catch (InvalidArgumentException $e) { $error = $e->getMessage(); }
    }
    if ($error !== null) { $out[] = ['ok' => false, 'error' => $error]; continue; }
    $est = $input; $est['_billing_input_seconds'] = $seconds;
    $routed = $input; unset($routed['mode']);
    $out[] = ['ok' => true, 'seconds' => $seconds, 'credits' => gateway_estimate_credits('bytedance/seedance-2-5-lite', $est),
      'sume' => sume_route_lite($routed)];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;

test('paridad con el PHP real: el servidor acepta lo que envía la CLI, reserva lo mismo y enruta al modo correcto', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const cases = validCases().map(([name, given]) => ({ name, ...plan(given) }));
  for (const c of cases) assert.equal(c.ok, true, `${c.name}: ${c.errors?.join(' ')}`);
  const results = php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ input: c.payload.input, meta: c.meta })))], { sume: true });
  cases.forEach((c, index) => {
    const server = results[index];
    assert.equal(server.ok, true, `${c.name}: ${server.error}`);
    assert.ok(c.estimate.credits >= server.credits, `${c.name}: la CLI autoriza ${c.estimate.credits} y el servidor reserva ${server.credits}`);
    assert.equal(c.estimate.credits, server.credits, c.name);
    const sume = server.sume;
    const input = c.payload.input;
    assert.equal(sume.provider, 'sume');
    assert.equal(sume.payload.prompt, input.prompt);
    assert.equal(sume.payload.duration, input.duration);
    assert.equal(sume.payload.resolution, input.resolution);
    assert.equal(sume.payload.generate_audio, input.generate_audio);
    assert.equal(sume.route, { t2v: 'lite-t2v', i2v: 'lite-i2v', ref: 'lite-ref' }[input.mode], c.name);
    if (input.mode === 'i2v') assert.equal(sume.payload.aspect_ratio, 'adaptive');
    if (input.mode === 'ref') assert.deepEqual(sume.payload.reference_video_urls, input.reference_video_urls);
  });
  assert.equal(cases.length, 14);
  // Las cifras con vídeo incluyen sus segundos medidos por el servidor.
  assert.equal(results[8].seconds, 9);
  assert.equal(results[11].seconds, 5, '5,0004 s se redondea a milésimas (5,000) y no sube al segundo superior');
});

test('paridad con el PHP real: lo que la CLI rechaza en local el servidor también lo rechaza', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const img = (name) => media.image(name, 800, 600);
  const url = (file) => media.url(file);
  const raw = (input, files = []) => ({
    input: { mode: 't2v', prompt: 'x', resolution: '720p', duration: 5, aspect_ratio: 'adaptive', generate_audio: true, ...input },
    meta: Object.fromEntries(files.map((file) => [url(file), media.meta[file]])),
  });
  const v31 = media.video('rj31.mp4', 31);
  const two = [media.video('rj1.mp4', 4), media.video('rj2.mp4', 4)];
  const a = [media.wavAudio('rja1.wav', 2), media.wavAudio('rja2.wav', 2)];
  const first = img('rjf.png');
  const imgs = Array.from({ length: 31 }, (_, i) => img(`rji${i}.png`));
  const rejected = [
    ['prompt vacío', raw({ prompt: ' ' })],
    ['prompt largo', raw({ prompt: 'a'.repeat(15001) })],
    ['duración 3', raw({ duration: 3 })],
    ['duración 31', raw({ duration: 31 })],
    ['resolución 4k', raw({ resolution: '4k' })],
    ['texto con imágenes', raw({ reference_image_urls: [url(first)] }, [first])],
    ['i2v sin primer fotograma', raw({ mode: 'i2v' })],
    ['último sin primero', raw({ mode: 'ref', last_frame_url: url(first), reference_image_urls: [url(first)] }, [first])],
    ['fotogramas con referencias', raw({ mode: 'ref', first_frame_url: url(first), reference_image_urls: [url(first)] }, [first])],
    ['ref sin referencias', raw({ mode: 'ref' })],
    ['31 imágenes', raw({ mode: 'ref', reference_image_urls: imgs.map(url) }, imgs)],
    ['dos vídeos', raw({ mode: 'ref', reference_video_urls: two.map(url) }, two)],
    ['dos audios', raw({ mode: 'ref', reference_audio_urls: a.map(url) }, a)],
    ['vídeo de 31 s', raw({ mode: 'ref', reference_video_urls: [url(v31)] }, [v31])],
    ['edición', raw({ mode: 'edit' })],
    ['búsqueda web', raw({ web_search: true })],
    ['parámetro ajeno', raw({ callBackUrl: 'https://evil.example' })],
  ];
  const results = php(PHP_BACKEND, [JSON.stringify(rejected.map(([, c]) => c))], { sume: true });
  rejected.forEach(([name], index) => assert.equal(results[index].ok, false, `${name}: el servidor debía rechazarlo`));
});

test('paridad con el PHP real: ruta del servidor y puerta de acceso de Lite (piloto, token y cookie)', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const route = php("$c = wallet_config(); echo json_encode($c['SKILL_MODEL_ROUTES']['seedance-2-5-lite']);");
  assert.equal(route.driver, 'jobs-v1');
  assert.equal(route.gateway_model, 'bytedance/seedance-2-5-lite');
  assert.ok(route.strip_input.includes('mode'), 'mode es de AILAB y no se reenvía');
  // Puerta de sume_lite_gate: ninguna cuenta puede usar Lite sin clave de Sume ni con el interruptor en `kie`;
  // `sume` abre a todos, también a tokens de dispositivo; `sume_admin` exige un administrador con sesión web.
  const matrix = php(`
    $out = [];
    foreach (['kie', 'sume_admin', 'sume', 'otro'] as $provider) foreach ([true, false] as $hasKey) foreach (['administrator', 'user'] as $role) foreach (['cookie', 'token'] as $auth) {
      $cfg = ['SEEDANCE_25_PROVIDER' => $provider, 'SUME_API_KEY' => $hasKey ? 'clave-de-prueba' : ''];
      $out[] = ['provider' => $provider, 'key' => $hasKey, 'role' => $role, 'auth' => $auth, 'open' => sume_lite_gate(['role' => $role], $auth, $cfg) === null];
    }
    echo json_encode($out);`, [], { sume: true });
  const open = matrix.filter((row) => row.open).map((row) => `${row.provider}:${row.role}:${row.auth}`).sort();
  assert.deepEqual(open, [
    'sume:administrator:cookie', 'sume:administrator:token', 'sume:user:cookie', 'sume:user:token', 'sume_admin:administrator:cookie',
  ].sort(), 'con la clave puesta: `sume` abre a todos (token incluido) y `sume_admin` solo al administrador con cookie; sin clave o con `kie` no abre nadie');
  assert.equal(matrix.length, 32);
  // El valor por defecto del repositorio deja Lite cerrado: la apertura vive en config.local.php del servidor.
  const defaults = php("$c = wallet_config(); echo json_encode([$c['SEEDANCE_25_PROVIDER'], $c['SUME_LITE_MAX_REFERENCE_VIDEOS'], $c['SUME_LITE_MAX_REFERENCE_AUDIOS'], $c['SUME_MAX_REFERENCE_IMAGES'], $c['SUME_MAX_PROMPT_CHARS']]);");
  assert.deepEqual(defaults, ['kie', 1, 1, 30, 15000]);
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/wallet/gateway.php'), 'utf8');
  assert.match(source, /wallet_require_scope\('generate'\)/);
  assert.match(source, /sume_lite_gate\(\$user, \(string\)\(\$auth\['auth_type'\] \?\? ''\), \$cfg\)/);
});

test('CLI real: prepare mide el vídeo y autoriza salida más entrada; submit envía el cuerpo exacto y no repite', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-lite-cli-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'L'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const url = new URL(req.url, base);
    const isJson = /json/.test(req.headers['content-type'] || '');
    const body = isJson ? JSON.parse(raw.toString() || '{}') : {};
    requests.push({ path: url.pathname, query: url.searchParams.get('path'), body });
    if (url.pathname === '/result.mp4') { res.writeHead(200, { 'content-type': 'video/mp4' }); return res.end(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)])); }
    let response = { ok: true, user: { email: 'test@example.invalid', tier: 'hub' }, balance: 5000 };
    if (body.action === 'task_costs') response = { ok: true, costs: { 'sume_lite_job': 600 } };
    if (url.pathname.endsWith('/upload.php')) {
      const name = base + 'uploads/' + requests.length + '.bin';
      response = { ok: true, code: 200, url: name, data: { url: name }, expires_at: '2099-01-01 00:00:00' };
    }
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = { code: 200, data: { taskId: 'sume_lite_job' } };
      else response = { code: 200, data: { taskId: 'sume_lite_job', state: 'success', resultJson: JSON.stringify({ resultUrls: [base + 'result.mp4'] }) } };
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath,
    AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out') };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  const clip = media.video('lite-cli.mp4', 8.2);
  await assert.rejects(exec('prepare', 'seedance-2-5-lite', '--prompt', 'x', '--mode', 'edit'), /debe ser uno de/);
  await assert.rejects(exec('prepare', 'seedance-lite', '--prompt', 'x'), /Modelo no encontrado/);
  assert.equal(requests.length, 0);
  const expected = Math.ceil(Number((RATES['720p'] * 19).toFixed(6)));
  const args = ['seedance-2-5-lite', '--mode', 'ref', '--prompt', 'Mira @Video1', '--duration', '10', '--reference_video_urls', clip];
  const { stdout } = await exec('prepare', ...args, '--max-credits', String(expected));
  assert.match(stdout, new RegExp(`Estimacion: ~${expected} cr`));
  assert.match(stdout, /10 s de salida \+ 9 s de vídeo de referencia = 19 s/);
  const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
  assert.ok(id, stdout);
  assert.equal(JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8')).max_credits_authorized, expected);
  await assert.rejects(exec('prepare', ...args, '--max-credits', String(expected - 1)), /supera el m[aá]ximo/i);
  const done = await exec('submit', id, '--confirmed');
  assert.match(done.stdout, /Coste real: 600 cr/);
  const sends = requests.filter((request) => request.query === '/jobs/createTask');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].body.model, 'seedance-2-5-lite');
  assert.equal(sends[0].body.max_credits_authorized, expected);
  assert.deepEqual(Object.keys(sends[0].body.input).sort(), ['aspect_ratio', 'duration', 'generate_audio', 'mode', 'prompt', 'reference_video_urls', 'resolution']);
  assert.equal(sends[0].body.input.mode, 'ref');
  await assert.rejects(exec('submit', id, '--confirmed'), /ya se ejecutó/);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 1);
});
