import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {execFile, spawnSync} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath, pathToFileURL} from 'node:url';
import test from 'node:test';

// Wan 3.0 Video y Prime (Kie, contrato leído el 23/10/2026): Kie factura (segundos de vídeos de
// entrada + segundos de salida) x tarifa. La CLI mide los vídeos locales; el servidor es la autoridad.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-wan3-skill-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const {validateCatalogShape, validateParams, estimateCredits, modelContractHash, modelUsable} = await import('../skills/ailab/scripts/lib/catalog.mjs');
const {buildPayload, check} = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const model = {id: 'wan-3-video', ...catalog.models['wan-3-video']};
const execute = promisify(execFile);

// Archivos sintéticos reales: la CLI los detecta por contenido y mide su duración sin ffprobe.
const box = (type, payload) => { const header = Buffer.alloc(8); header.writeUInt32BE(8 + payload.length, 0); header.write(type, 4, 'ascii'); return Buffer.concat([header, payload]); };
function mp4(seconds, brand = 'isom') {
  const ftyp = box('ftyp', Buffer.concat([Buffer.from(brand.padEnd(4, ' ')), Buffer.alloc(4), Buffer.from(brand.padEnd(4, ' '))]));
  const mvhd = Buffer.alloc(100); mvhd.writeUInt32BE(1000, 12); mvhd.writeUInt32BE(Math.round(seconds * 1000), 16);
  return Buffer.concat([ftyp, box('moov', box('mvhd', mvhd)), box('mdat', Buffer.alloc(64))]);
}
function wav(seconds) {
  const rate = 8000; const data = Buffer.alloc(Math.round(seconds * rate * 2)); const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
// MPEG-1 Layer III a 128 kbps (16.000 bytes por segundo), tramas sin audio real pero con cabecera válida.
function mp3(seconds) { const frame = Buffer.from([0xff, 0xfb, 0x90, 0x00]); return Buffer.concat([frame, Buffer.alloc(Math.round(seconds * 16000) - 4)]); }
function png(width, height) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const chunk = Buffer.alloc(12 + 13); chunk.writeUInt32BE(13, 0); chunk.write('IHDR', 4, 'ascii'); ihdr.copy(chunk, 8);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk, Buffer.alloc(32)]);
}
const files = path.join(temporary, 'files');
fs.mkdirSync(files);
const put = (name, bytes) => { const file = path.join(files, name); fs.writeFileSync(file, bytes); return file; };
const video = (name, seconds, brand) => put(name, mp4(seconds, brand));
const audio = (name, seconds) => put(name, wav(seconds));
const image = (name, width = 1024, height = 768) => put(name, png(width, height));

const REF = {mode: 'ref', prompt: 'Combina @Image1 y @Video1', duration: 10, version: 'prime', resolution: '1080P'};
const run = (given) => { const v = validateParams(model, given); return {...v, estimate: v.ok ? estimateCredits(model, {...v.params, ...v.fileParams}) : null}; };

test('el contrato publicado exige la skill 2.3.12, no añade campos privados y arranca sin semilla', () => {
  assert.equal(model.min_cli_version, '2.3.12');
  assert.equal(catalog.min_cli_version, '2.3.7', 'el resto del catálogo sigue disponible para las CLI 2.3.7 a 2.3.11');
  assert.equal(catalog.catalog_version, '1.25.0');
  assert.equal(model.params.seed.default, undefined);
  assert.equal(model.params.nsfw_checker, undefined);
  assert.deepEqual(model.params.duration, {type: 'int', min: 2, max: 30, default: 5, help: model.params.duration.help});
  assert.match(model.params.duration.help, /30 s en total/);
  assert.match(model.params.reference_video_urls.help, /duración se suma/);
  assert.equal(model.estimate.kind, 'per_second_matrix', 'la forma del estimate la conocen todas las CLI 2.3.x');
  assert.deepEqual(model.estimate.credits_matrix, {normal: {'480P': 8.16, '720P': 16.32, '1080P': 32.64}, prime: {'480P': 12.444, '720P': 25.704, '1080P': 51.408}});
  const text = JSON.stringify(model);
  for (const key of ['provider_contract', 'provider_usd', 'margin_multiplier', 'credit_usd', 'wan/3-0-video', 'nsfw']) assert.equal(text.includes(key), false, key);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  assert.equal(modelUsable(model).ok, true);
});

test('una CLI anterior a 2.3.12 no ofrece Wan 3.0 en vez de autorizar un precio por debajo del servidor', async () => {
  assert.equal(modelUsable({...model, min_cli_version: '2.3.14'}).ok, false);
  const config = await import('../skills/ailab/scripts/lib/config.mjs');
  assert.equal(config.CLI_VERSION, '2.3.13');
  const updater = await import('../skills/ailab/scripts/lib/updater.mjs');
  assert.equal(updater.BUNDLED_RUNTIME_VERSION, '2.3.13');
  // Las CLI 2.3.7 a 2.3.12 siguen validando el catálogo v2 completo (sin claves ni tipos nuevos).
  const canonical = process.env.AILAB_CANONICAL_REPO;
  if (!canonical) return;
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12']) {
    const old = await import(pathToFileURL(path.join(canonical, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    assert.equal(parsed.models['wan-3-video'].min_cli_version, '2.3.12');
  }
});

test('sin vídeos de entrada, las 6 combinaciones y 29 duraciones dan el precio por segundo exacto', () => {
  const table = {normal: {'480P': 8.16, '720P': 16.32, '1080P': 32.64}, prime: {'480P': 12.444, '720P': 25.704, '1080P': 51.408}};
  let checked = 0;
  for (const version of ['normal', 'prime']) for (const resolution of ['480P', '720P', '1080P']) for (let duration = 2; duration <= 30; duration += 1) {
    const result = run({prompt: 'Plano cenital', version, resolution, duration});
    assert.equal(result.ok, true, result.errors?.join('\n'));
    assert.equal(result.estimate.credits, Math.ceil(Number((table[version][resolution] * duration).toFixed(6))), `${version} ${resolution} ${duration}`);
    assert.equal(result.estimate.approximate, false);
    checked += 1;
  }
  assert.equal(checked, 174);
});

test('con vídeos de entrada se factura salida más entrada, cada vídeo al segundo superior, y solo los vídeos suman', () => {
  const clip75 = video('v75.mp4', 7.5);
  const clip42 = video('v42.mov', 4.2, 'qt');
  const image1 = image('i1.png');
  const audio1 = audio('a1.wav', 9);
  // Ejemplo de Kie: 5 s de vídeo + 10 s de salida en Prime 1080P = 15 s x 50,4 = 756 cr Kie.
  const five = run({...REF, reference_video_urls: [video('v5.mp4', 5)]});
  assert.equal(five.estimate.credits, Math.ceil(756 * 1.02));
  assert.equal(five.estimate.credits, 772);
  assert.equal(five.estimate.approximate, true);
  assert.match(five.estimate.note, /10 s de salida \+ 5 s de vídeo de entrada = 15 s/);
  // 7,5 s -> 8 s y 4,2 s -> 5 s: 10 + 13 = 23 s; imágenes y audio no cuentan.
  const all = run({...REF, reference_image_urls: [image1], reference_video_urls: [clip75, clip42], reference_audio_urls: [audio1], reference_link_urls: ['https://example.com/guion']});
  assert.equal(all.ok, true, all.errors?.join('\n'));
  assert.equal(all.estimate.credits, Math.ceil(Number((51.408 * 23).toFixed(6))));
  assert.equal(all.estimate.credits, 1183);
  // Solo imágenes y audio: sin vídeo de entrada el precio es el de la salida y es exacto.
  const noVideo = run({...REF, reference_image_urls: [image1], reference_audio_urls: [audio1]});
  assert.equal(noVideo.estimate.credits, 515);
  assert.equal(noVideo.estimate.approximate, false);
  // Texto e imagen a vídeo nunca facturan vídeo: ni se admite adjuntarlo.
  assert.equal(run({prompt: 'x', mode: 'i2v', first_frame_url: [image1], version: 'normal', resolution: '720P', duration: 6}).estimate.credits, 98);
});

test('paridad: la CLI, la referencia independiente y, con AILAB_CANONICAL_REPO, el gateway PHP dan la misma cifra', () => {
  const kie = {normal: {'480P': 8, '720P': 16, '1080P': 32}, prime: {'480P': 12.2, '720P': 25.2, '1080P': 50.4}};
  const clips = {};
  const get = (seconds) => clips[seconds] ||= video(`p${String(seconds).replace('.', '_')}.mp4`, seconds);
  const rows = [];
  for (const version of ['normal', 'prime']) for (const resolution of ['480P', '720P', '1080P']) {
    for (const output of [2, 5, 10, 14, 15, 22, 25, 30]) for (const durations of [[], [1], [2.4], [7.5], [15], [5, 5, 5], [3.2, 4.5, 5.5]]) {
      const exact = durations.reduce((total, value) => total + value, 0);
      if (exact + output > 30 + 1e-9) continue;
      const input = durations.reduce((total, value) => total + Math.ceil(value), 0);
      const expected = Math.ceil(Number((kie[version][resolution] * (output + input) * 1.02).toFixed(6)));
      const result = run({...REF, version, resolution, duration: output, ...(durations.length ? {reference_video_urls: durations.map(get)} : {reference_image_urls: [image('base.png')]})});
      assert.equal(result.ok, true, `${version} ${resolution} ${output} ${durations}: ${result.errors?.join(' ')}`);
      assert.equal(result.estimate.credits, expected, `${version} ${resolution} ${output} ${JSON.stringify(durations)}`);
      rows.push({version, resolution, output, input, expected});
    }
  }
  assert.ok(rows.length > 200, String(rows.length));
  const canonical = process.env.AILAB_CANONICAL_REPO;
  if (!canonical) return;
  const gateway = path.join(canonical, 'app/api/wallet/gateway.php');
  const php = spawnSync('php', ['-r', `define('AILAB_GATEWAY_FUNCTIONS_ONLY', true); require ${JSON.stringify(gateway)};
    $out = []; foreach (json_decode(stream_get_contents(STDIN), true) as $row) {
      $input = ['resolution' => $row['resolution'], 'duration' => $row['output'], '_billing_input_seconds' => $row['input']];
      if ($row['input'] > 0) { $input['reference_video_urls'] = ['https://u.test/a.mp4']; }
      $out[] = gateway_estimate_credits($row['version'] === 'prime' ? 'wan/3-0-video-prime' : 'wan/3-0-video', $input);
    } echo json_encode($out);`], {input: JSON.stringify(rows), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  assert.equal(php.status, 0, php.stderr);
  assert.deepEqual(JSON.parse(php.stdout), rows.map((row) => row.expected), 'la CLI y el gateway deben autorizar y reservar lo mismo');
});

test('límites de la CLI: modalidades, materiales y duración medida', () => {
  const ok = {...REF, reference_image_urls: [image('ok.png')]};
  assert.equal(run(ok).ok, true);
  const cases = [
    ['texto con archivos', {mode: 't2v', reference_image_urls: [image('x1.png')]}, /no admite archivos/],
    ['imagen a vídeo sin primer fotograma', {mode: 'i2v'}, /necesita --first_frame_url/],
    ['último sin primero', {mode: 'i2v', last_frame_url: [image('x2.png')]}, /--first_frame_url|exige un primer fotograma/],
    ['referencias vacías', {mode: 'ref'}, /al menos una imagen/],
    ['fotogramas con referencias', {...ok, first_frame_url: [image('x3.png')]}, /mezclar fotogramas/],
    ['enlace y documento', {...REF, reference_link_urls: ['https://example.com/a'], reference_file_urls: ['https://example.com/a.pdf']}, /enlace y un documento/],
    ['documento HTML', {...REF, reference_file_urls: ['https://example.com/a.html']}, /PDF, Word/],
    ['enlace inválido', {...REF, reference_link_urls: ['ftp://example.com/a']}, /dirección web válida/],
    ['duración inteligente', {...ok, duration: -1}, /duración inteligente \(-1\)/],
    ['duración 31', {...ok, duration: 31}, /maximo 30/],
    ['imagen pequeña', {...REF, reference_image_urls: [image('chica.png', 200, 300)]}, /entre 240 y 8\.000/],
    ['imagen muy apaisada', {...REF, reference_image_urls: [image('ancha.png', 2500, 300)]}, /8:1/],
    ['vídeo de 16 s', {...REF, reference_video_urls: [video('v16.mp4', 16)]}, /entre 1 y 15 segundos/],
    ['vídeo de 0,5 s', {...REF, reference_video_urls: [video('v05.mp4', 0.5)]}, /entre 1 y 15 segundos/],
    ['vídeos que suman 16 s', {...REF, reference_video_urls: [video('a8.mp4', 8), video('b8.mp4', 8)]}, /sumar más de 15 segundos/],
    ['entrada + salida de 33 s', {...REF, duration: 25, reference_video_urls: [video('v8.mp4', 8)]}, /no pueden superar 30 segundos\. Reduce la duración a 22 s/],
    ['vídeo que no es MP4 ni MOV', {...REF, reference_video_urls: [put('clip.webm', Buffer.from('1a45dfa3', 'hex'))]}, /MP4 o MOV|Se esperaba/],
    ['audio de 16 s', {...REF, reference_audio_urls: [audio('a16.wav', 16)]}, /entre 1 y 15 segundos/],
    ['audios que suman 18 s', {...REF, reference_audio_urls: [audio('a9.wav', 9), audio('a9b.wav', 9)]}, /sumar más de 15 segundos/],
    ['prompt vacío', {...ok, prompt: '   '}, /prompt no puede estar vacío/]
  ];
  for (const [name, given, message] of cases) {
    const result = run({prompt: 'x', ...given});
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), message, name);
  }
  // Tolerancia de 0,05 s en 15 s, igual que la web y el servidor; el audio MP3 también se mide.
  const edge = run({...REF, duration: 14, reference_video_urls: [video('v1504.mp4', 15.04)]});
  assert.equal(edge.ok, true, edge.errors?.join('\n'));
  assert.equal(edge.estimate.credits, Math.ceil(Number((51.408 * (14 + 16)).toFixed(6))));
  assert.equal(run({...ok, reference_audio_urls: [put('voz.mp3', mp3(5))]}).ok, true);
  assert.equal(run({...ok, reference_audio_urls: [put('larga.mp3', mp3(16))]}).ok, false);
});

test('el payload no reenvía campos de AILAB, el cobro ni el filtro; sin semilla no hay semilla', () => {
  const given = {...REF, reference_image_urls: [image('p.png')], reference_video_urls: [video('p.mp4', 6)]};
  const valid = validateParams(model, given);
  assert.equal(valid.ok, true, valid.errors?.join('\n'));
  assert.equal('seed' in valid.params, false);
  const payload = buildPayload(model, valid.params, {reference_image_urls: ['https://uploads.test/a.png'], reference_video_urls: ['https://uploads.test/v.mp4']});
  assert.equal(payload.model, 'wan-3-video');
  assert.deepEqual(payload.input.reference_video_urls, ['https://uploads.test/v.mp4']);
  for (const key of ['seed', 'nsfw_checker', 'callBackUrl', '_billing_input_seconds', 'billing_duration']) assert.equal(payload.input[key], undefined, key);
  assert.equal(validateParams(model, {...given, seed: '0'}).params.seed, 0);
  assert.equal(validateParams(model, {...given, nsfw_checker: 'false'}).ok, false, 'el filtro no es un parámetro de la skill');
  assert.equal(validateParams(model, {...given, callBackUrl: 'https://evil.example'}).ok, false);
});

test('recuperación: el vídeo de salida es la URL, nunca una entrada; sin archivo no se da por buena', async () => {
  const previous = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const data = {state: 'success', param: JSON.stringify({input: {reference_video_urls: ['https://uploads.test/entrada.mp4']}}),
      ...(calls > 1 ? {resultJson: JSON.stringify({resultUrls: ['https://result.example/wan.mp4']})} : {resultJson: '{}'})};
    return new Response(JSON.stringify({code: 200, data}), {headers: {'content-type': 'application/json'}});
  };
  try {
    const first = await check(model, {providerRequestId: 'wan-task'});
    assert.notEqual(first.status, 'success');
    const second = await check(model, {providerRequestId: 'wan-task'});
    assert.equal(second.status, 'success');
    assert.deepEqual(second.urls, ['https://result.example/wan.mp4']);
  } finally { globalThis.fetch = previous; }
});

test('CLI real: prepare mide el vídeo y autoriza entrada más salida; submit envía el máximo y no repite', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-wan3-cli-'));
  const credentials = path.join(temp, 'credentials'); const config = path.join(temp, 'config');
  fs.mkdirSync(credentials); fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'W'.repeat(48), {mode: 0o600});
  const requests = []; let base;
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const url = new URL(req.url, base);
    const isJson = /json/.test(req.headers['content-type'] || '');
    const body = isJson ? JSON.parse(raw.toString() || '{}') : {};
    requests.push({path: url.pathname, query: url.searchParams.get('path'), body});
    if (url.pathname === '/result.mp4') { res.writeHead(200, {'content-type': 'video/mp4'}); return res.end(mp4(2)); }
    let response = {ok: true, user: {email: 'test@example.invalid', tier: 'hub'}, balance: 5000};
    if (body.action === 'task_costs') response = {ok: true, costs: {'wan-cli-job': 772}};
    if (url.pathname.endsWith('/upload.php')) response = {ok: true, code: 200, url: base + 'uploads/' + requests.length + '.bin', data: {url: base + 'uploads/' + requests.length + '.bin'}, expires_at: '2099-01-01 00:00:00'};
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = {code: 200, data: {taskId: 'wan-cli-job'}};
      else response = {code: 200, data: {taskId: 'wan-cli-job', state: 'success', resultJson: JSON.stringify({resultUrls: [base + 'result.mp4']})}};
    }
    res.writeHead(200, {'content-type': 'application/json'}); res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, {recursive: true, force: true}); });
  const env = {...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath,
    AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out')};
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], {env, timeout: 30000});
  const clip = video('cli5.mp4', 5);
  // Duración inteligente: rechazada en local, sin tocar la red.
  await assert.rejects(exec('prepare', 'wan-3-video', '--prompt', 'Escena', '--duration', '-1'), /duración inteligente/);
  assert.equal(requests.length, 0);
  const {stdout} = await exec('prepare', 'wan-3-video', '--mode', 'ref', '--version', 'prime', '--resolution', '1080P', '--duration', '10',
    '--prompt', 'Mueve @Video1', '--reference_video_urls', clip, '--max-credits', '772');
  assert.match(stdout, /Estimacion: ~772 cr/);
  assert.match(stdout, /10 s de salida \+ 5 s de vídeo de entrada = 15 s/);
  const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1]; assert.ok(id, stdout);
  const manifest = JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8'));
  assert.equal(manifest.max_credits_authorized, 772);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 0, 'prepare no envía nada');
  const done = await exec('submit', id, '--confirmed');
  assert.match(done.stdout, /Coste real: 772 cr/);
  const sends = requests.filter((request) => request.query === '/jobs/createTask');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].body.model, 'wan-3-video');
  assert.equal(sends[0].body.max_credits_authorized, 772);
  assert.equal(sends[0].body.input.duration, 10);
  assert.equal(sends[0].body.input.version, 'prime');
  assert.equal(sends[0].body.input.reference_video_urls.length, 1);
  assert.equal('seed' in sends[0].body.input, false);
  await assert.rejects(exec('submit', id, '--confirmed'), /ya se ejecutó/);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 1, 'no duplica un envío confirmado');
  // Un tope del usuario por debajo del máximo con vídeo se respeta aunque el precio sin vídeo cupiese.
  await assert.rejects(exec('prepare', 'wan-3-video', '--mode', 'ref', '--version', 'prime', '--resolution', '1080P', '--duration', '10', '--prompt', 'x', '--reference_video_urls', clip, '--max-credits', '600'), /supera el m[aá]ximo/i);
});
