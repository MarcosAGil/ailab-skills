import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
import { handlePrice } from './helpers/price-server.mjs';

// Genjutsu Light (Higgsfield) y el arreglo de los estados finales de Higgsfield (nsfw y rejected), en la release 2.3.14.
// Contrato del servidor: api/skill/higgsfield.php (spec, input, quote, create, status) y wallet_genjutsu_light_* de
// api/wallet/lib.php. Con AILAB_CANONICAL_REPO las comparaciones usan el PHP real, con proveedores sin conexión: sin red
// ni gasto. El resto de pruebas usa un servidor simulado en localhost. Desde la 2.5.0 la CLI no tiene tarifa: el precio lo da
// price.php (simulado aquí) y la cifra que se aprueba es siempre la cotización del servidor.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = path.join(root, 'skills/ailab');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-light-skill-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(skillRoot, 'catalog/catalog.json');
const { validateCatalogShape, validateParams, modelUsable, resolveModel } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const higgsfield = await import('../skills/ailab/scripts/adapters/higgsfield-v1.mjs');
const light = await import('../skills/ailab/scripts/lib/genjutsu-light.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const ID = 'higgsfield-genjutsu-light';
const model = { id: ID, ...catalog.models[ID] };
const normal = { id: 'genjutsu', ...catalog.models.genjutsu };
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));
const strip = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

const RESOLUTIONS = ['480p', '720p', '1080p'];

function plan(given) {
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, v, payload: higgsfield.buildPayload(model, v.params, uploaded) };
}

test('el contrato publicado: modelo nuevo, activo desde la skill 2.3.14, con cotización del servidor y sin datos del proveedor', async () => {
  assert.equal(model.driver, 'higgsfield-v1');
  assert.equal(model.min_cli_version, '2.3.14');
  assert.equal(model.enabled, true, 'el interruptor lo decide el servidor: cerrado responde 403 sin cobrar');
  assert.equal(model.status, 'active');
  assert.equal(model.output, 'video');
  assert.deepEqual(model.modes, ['character_swap', 'object_swap']);
  assert.deepEqual(model.params.mode.values, ['character_swap', 'object_swap']);
  assert.equal(model.params.mode.default, 'character_swap');
  assert.deepEqual(model.params.resolution.values, ['480p', '720p', '1080p']);
  assert.equal(model.params.resolution.default, '720p');
  assert.equal(model.params.prompt.max_len, 5000);
  assert.equal(model.params.prompt.required, undefined, 'el prompt es opcional');
  assert.deepEqual([model.params.image_urls.min, model.params.image_urls.max], [1, 8]);
  assert.equal(model.params.video_url.type, 'file');
  assert.equal(model.params.video_url.required, true);
  assert.equal(Object.keys(model.params).sort().join(), 'image_urls,mode,prompt,resolution,video_url', 'sin parámetros que el servidor no admite');
  assert.equal(model.estimate, undefined, 'sin tarifa local: el precio y el techo los da AILAB');
  assert.equal(modelUsable(model).ok, true);
  assert.equal(modelUsable({ ...model, min_cli_version: '9.0.0' }).ok, false);
  assert.equal(resolveModel(catalog, 'genjutsu-light').id, ID);
  assert.equal(resolveModel(catalog, 'genjutsu light').id, ID);
  assert.equal(resolveModel(catalog, 'genjutsu').id, 'genjutsu', 'Genjutsu Normal sigue siendo `genjutsu`');
  assert.equal(resolveModel(catalog, 'motion transfer').id, 'genjutsu');
  const text = JSON.stringify(model);
  for (const forbidden of ['genjutsu-light/', 'motion-transfer/v1', 'object-swap/v1', 'open.higgsfield', 'higgsfield-ai/', 'provider_contract', 'HIGGSFIELD', 'api_key']) assert.equal(text.includes(forbidden), false, forbidden);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  assert.equal(higgsfield.serverModelId(model), ID);
  // Genjutsu Normal no cambia.
  assert.deepEqual(normal.params.resolution.values, ['480p', '720p']);
  assert.equal(normal.min_cli_version, '2.3.0');
  if (!CANONICAL) return;
  // Las CLI 2.3.7 a 2.3.13 aceptan el catálogo entero y listan Light como no disponible: piden la 2.3.14.
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12', '2.3.13']) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    // Las CLI anteriores a la 2.5.0 leen catalog-v2.json (con tarifas); el catálogo sin `estimate` es solo para la 2.5.0.
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(path.join(CANONICAL, 'app/api/v1/skill/catalog-v2.json'), 'utf8')));
    const usable = old.modelUsable(parsed.models[ID]);
    assert.equal(usable.ok, false, `la CLI ${version} no debe ofrecer Light`);
    assert.match(usable.reason, /necesita CLI 2\.3\.14/, `la CLI ${version} pide actualizar`);
    assert.equal(old.modelUsable(parsed.models.genjutsu).ok, true, `la CLI ${version} sigue ofreciendo Genjutsu Normal`);
  }
});

test('el vídeo se redondea al segundo superior como el servidor: fracciones, milésimas y bordes', () => {
  const credits = (seconds, resolution = '720p', brand = 'isom') => plan({ video_url: media.video(`lf${seconds}${brand}.mp4`, seconds, brand), image_urls: [media.image('li.png')], resolution });
  for (const [seconds, resolution, brand] of [[0.2], [8.2], [12.34, '1080p', 'qt'], [14.999], [15]]) {
    assert.equal(credits(seconds, resolution, brand).ok, true, `${seconds} s cabe en Light`);
  }
  for (const seconds of [15.001, 15.01, 16, 30, 60]) {
    const result = credits(seconds);
    assert.equal(result.ok, false, `${seconds} s se rechaza`);
    assert.deepEqual(result.errors, [light.LIGHT_TOO_LONG_MESSAGE]);
  }
  // round(duración, 6) y después ceil, como wallet_genjutsu_light_billable_seconds.
  assert.equal(light.lightVideoSeconds(1.0000004), 1);
  assert.equal(light.lightVideoSeconds(1.0000006), 2);
  assert.equal(light.lightVideoSeconds(15.0000004), 15);
  assert.equal(light.lightVideoSeconds(15.000001), 16);
  assert.equal(light.lightVideoSeconds(0), null);
  assert.equal(light.lightVideoSeconds(NaN), null);
  assert.equal(light.lightCredits, undefined, 'la CLI ya no calcula el precio de Light');
});

test('límites de la CLI: más de 15 s con el texto exacto, prompt en bytes, resoluciones, materiales y vídeos que la CLI no mide', () => {
  const img = (name) => media.image(name, 800, 600);
  const video = (seconds = 5) => media.video(`ll${seconds}.mp4`, seconds);
  assert.equal(light.LIGHT_TOO_LONG_MESSAGE, 'Genjutsu Light usa hasta 15 segundos de vídeo. Recórtalo a 15 s o usa la versión Normal.');
  const cases = [
    ['16 s', { video_url: video(16), image_urls: [img('a.png')] }, /usa hasta 15 segundos de vídeo\. Recórtalo a 15 s o usa la versión Normal\./],
    ['sin vídeo', { image_urls: [img('b.png')] }, /video_url/],
    ['sin imágenes', { video_url: video() }, /image_urls/],
    ['9 imágenes', { video_url: video(), image_urls: Array.from({ length: 9 }, (_, i) => img(`c${i}.png`)) }, /como mucho 8/],
    ['1440p', { video_url: video(), image_urls: [img('d.png')], resolution: '1440p' }, /debe ser uno de: 480p, 720p, 1080p/],
    ['4k', { video_url: video(), image_urls: [img('d.png')], resolution: '4k' }, /debe ser uno de/],
    ['modo de otro modelo', { video_url: video(), image_urls: [img('e.png')], mode: 't2v' }, /debe ser uno de: character_swap, object_swap/],
    ['parámetro de Normal que no existe aquí', { video_url: video(), image_urls: [img('f.png')], duration: '5' }, /Parametro desconocido: --duration/],
    ['prompt de 5.001 caracteres', { video_url: video(), image_urls: [img('g.png')], prompt: 'a'.repeat(5001) }, /supera 5000 caracteres/],
    ['prompt de 5.000 bytes superados con tildes', { video_url: video(), image_urls: [img('g.png')], prompt: 'é'.repeat(2501) }, /supera 5000 bytes/],
    ['archivo que no es vídeo', { video_url: img('h.png'), image_urls: [img('i.png')] }, /debe ser un vídeo válido/],
  ];
  for (const [name, given, message] of cases) {
    const result = plan(given);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), message, name);
  }
  assert.equal(plan({ video_url: video(), image_urls: [img('j.png')], prompt: 'a'.repeat(5000) }).ok, true, '5.000 caracteres ASCII caben');
  assert.equal(plan({ video_url: video(), image_urls: [img('j.png')], prompt: 'é'.repeat(2500) }).ok, true, '5.000 bytes exactos caben');
  assert.equal(plan({ video_url: video(), image_urls: Array.from({ length: 8 }, (_, i) => img(`k${i}.png`)) }).ok, true, 'ocho imágenes caben');
  // Un WebM lo mide el servidor: la CLI no lo rechaza.
  const webm = media.put('light.webm', Buffer.concat([Buffer.from('1a45dfa3', 'hex'), Buffer.alloc(64)]), { mime: 'video/webm', duration: 5 });
  const unmeasured = plan({ video_url: webm, image_urls: [img('l.png')], resolution: '1080p' });
  assert.equal(unmeasured.ok, true, unmeasured.errors?.join('\n'));
  // Genjutsu Normal no cambia: admite hasta 30 s, no se mide en local y no admite 1080p.
  assert.equal(validateParams(normal, { video_url: 'cualquiera.mp4', image_urls: ['a.png'] }).ok, true);
  assert.equal(validateParams(normal, { video_url: 'cualquiera.mp4', image_urls: ['a.png'], resolution: '1080p' }).ok, false);
});

test('el payload lleva el id del servidor, el modo fuera del input y solo los campos que admite el servidor', () => {
  const clip = media.video('lp.mp4', 10);
  const a = media.image('lpa.png');
  const b = media.image('lpb.png');
  const result = plan({ mode: 'object_swap', video_url: clip, image_urls: [a, b], resolution: '1080p', prompt: '  cambia la taza  ' });
  assert.equal(result.ok, true, result.errors?.join('\n'));
  assert.deepEqual(result.payload, {
    model: ID, mode: 'object_swap',
    input: { prompt: '  cambia la taza  ', video_url: media.url(clip), image_urls: [media.url(a), media.url(b)], resolution: '1080p' },
  });
  const plain = plan({ video_url: clip, image_urls: [a] });
  assert.deepEqual(plain.payload, { model: ID, mode: 'character_swap', input: { video_url: media.url(clip), image_urls: [media.url(a)], resolution: '720p' } });
  assert.equal('mode' in plain.payload.input, false);
  assert.equal(higgsfield.buildPayload(normal, { video_url: 'v', image_urls: ['i'] }, {}).model, 'higgsfield-genjutsu-motion-transfer', 'Normal conserva su id');
});

test('`info` y `validate` sin sesión no inventan precio: lo da AILAB en `prepare`', async () => {
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_CATALOG_PATH: catalogPath, AILAB_CONFIG_DIR: path.join(temporary, 'cli-config'),
    AILAB_CREDENTIALS_DIR: path.join(temporary, 'cli-credentials'), AILAB_BASE_URL: 'http://127.0.0.1:9/' };
  const exec = (...args) => execute(process.execPath, [process.env.AILAB_TEST_RUNTIME || path.join(skillRoot, 'scripts/ailab.mjs'), ...args], { env, timeout: 30000 });
  const models = await exec('models');
  assert.match(models.stdout, /^ {2}higgsfield-genjutsu-light · Higgsfield Genjutsu Light \[video\] · CARO$/m);
  assert.doesNotMatch(models.stdout, /higgsfield-genjutsu-light .*NO DISPONIBLE/);
  const clip = media.video('lv-cli.mp4', 10);
  const validated = await exec('validate', 'genjutsu-light', '--video_url', clip, '--image_urls', media.image('lvi.png'), '--resolution', '1080p');
  assert.match(validated.stdout, /parametros validos · el precio lo da `prepare` · sin gasto/);
  await assert.rejects(exec('validate', 'genjutsu-light', '--video_url', media.video('lv-long.mp4', 20), '--image_urls', media.image('lvi.png')),
    (error) => /Genjutsu Light usa hasta 15 segundos de vídeo\. Recórtalo a 15 s o usa la versión Normal\./.test(error.stderr));
  const info = await exec('info', 'higgsfield-genjutsu-light');
  assert.match(info.stdout, /Higgsfield Genjutsu Light \(higgsfield-genjutsu-light\)/);
  assert.match(info.stdout, /--resolution \(enum, 480p\|720p\|1080p, def 720p\)/);
  assert.match(info.stdout, /Precio: lo da AILAB con tu sesión/);
  assert.doesNotMatch(info.stdout, /\d+(,\d+)? cr\b/, 'ninguna cifra de créditos en local');
});

// Estados que el servidor trata como finales sin resultado, tal como los publica wallet_higgsfield_failure_meta.
const STATUSES = ['completed', 'failed', 'fail', 'error', 'cancelled', 'canceled', 'nsfw', 'rejected', 'expired', 'queued', 'in_progress', 'timeout'];

test('los estados finales de Higgsfield terminan la tarea con su motivo: nsfw y rejected ya no se consultan sin fin', async () => {
  const originalFetch = globalThis.fetch;
  let reply = null;
  globalThis.fetch = async () => Response.json({ ok: true, code: 200, data: reply });
  try {
    const check = async (data) => { reply = data; return higgsfield.check(model, { providerRequestId: 'tarea-1' }); };
    for (const status of ['nsfw', 'rejected', 'failed', 'error', 'canceled', 'cancelled', 'NSFW', 'Rejected']) {
      const result = await check({ status });
      assert.equal(result.status, 'fail', status);
      assert.equal(result.free, true, status + ' se liquida sin cargo');
      assert.match(result.error, /No se ha cobrado nada\.$/, status);
    }
    // Textos de reserva por estado cuando el servidor no manda el suyo.
    assert.equal((await check({ status: 'nsfw' })).error, 'Higgsfield ha bloqueado la generación por su filtro de contenido. Revisa el vídeo, las imágenes de referencia y el prompt. No se ha cobrado nada.');
    assert.equal((await check({ status: 'rejected' })).error, 'Higgsfield ha rechazado la generación. Revisa el vídeo, las imágenes de referencia y el prompt. No se ha cobrado nada.');
    assert.match((await check({ status: 'failed' })).error, /^Higgsfield no ha podido completar la generación\./);
    assert.match((await check({ status: 'canceled' })).error, /^La generación se ha cancelado en Higgsfield\./);
    // El motivo del servidor (`ailab_error`) manda; si no aclara el cobro, se añade.
    const server = await check({ status: 'nsfw', ailab_error: 'Higgsfield ha bloqueado la generación por su filtro de contenido. Revisa el vídeo, las imágenes de referencia y el prompt.', ailab_error_code: 'higgsfield_nsfw' });
    assert.equal(server.error, 'Higgsfield ha bloqueado la generación por su filtro de contenido. Revisa el vídeo, las imágenes de referencia y el prompt. No se ha cobrado nada.');
    assert.equal((await check({ status: 'rejected', ailab_error: 'Motivo propio. Sin cargo.' })).error, 'Motivo propio. Sin cargo.');
    assert.equal((await check({ status: 'failed', ailab_error: 'Sin punto final' })).error, 'Sin punto final. No se ha cobrado nada.');
    assert.equal((await check({ status: 'nsfw', ailab_error: '\u0007\u001b[31mroto\u001b[0m' })).error.includes('\u001b'), false, 'sin caracteres de control');
    assert.ok((await check({ status: 'nsfw', ailab_error: 'x'.repeat(5000) })).error.length < 460, 'el motivo se acota');
    // El resto de estados no cambia: fail y expired siguen siendo fallo sin afirmar nada del cobro; el resto sigue en cola.
    for (const status of ['expired', 'fail']) assert.deepEqual(await check({ status }), { status: 'fail', error: 'El procesamiento no pudo completarse.' }, status);
    for (const status of ['queued', 'in_progress', 'timeout', '']) assert.deepEqual(await check({ status }), { status: 'pending' }, status || '(vacío)');
    assert.deepEqual(await check({ status: 'completed' }), { status: 'pending', recoveryRequired: true });
    assert.deepEqual(await check({ status: 'completed', video: { url: 'https://r.test/v.mp4' } }), { status: 'success', urls: ['https://r.test/v.mp4'] });
  } finally { globalThis.fetch = originalFetch; }
});

test('paridad con el PHP real: la CLI trata como finales los mismos estados que liquida el servidor y con el mismo motivo', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, async () => {
  const server = php(`
    $out = [];
    foreach (json_decode($argv[1], true) as $status) { $meta = wallet_higgsfield_failure_meta(['status' => $status]); $out[] = [$status, $meta ? $meta['error'] : null, $meta ? $meta['error_code'] : null]; }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);`, [JSON.stringify(STATUSES)], { skillHiggsfield: true });
  const originalFetch = globalThis.fetch;
  let reply = null;
  globalThis.fetch = async () => Response.json({ ok: true, code: 200, data: reply });
  try {
    for (const [status, error, code] of server) {
      reply = { status };
      const bare = await higgsfield.check(model, { providerRequestId: 'tarea-1' });
      if (error === null) {
        assert.notEqual(bare.free, true, status + ': el servidor no lo liquida como fallo sin cargo');
        continue;
      }
      assert.equal(bare.status, 'fail', `${status}: el servidor lo da por terminado`);
      assert.equal(bare.free, true, status);
      assert.ok(bare.error.startsWith(error), `${status}: el texto de reserva de la CLI parte del mismo motivo que el servidor`);
      reply = { status, ailab_error: error, ailab_error_code: code };
      const withReason = await higgsfield.check(model, { providerRequestId: 'tarea-1' });
      assert.equal(withReason.status, 'fail');
      assert.ok(withReason.error.startsWith(error), `${status}: manda el motivo del servidor`);
    }
  } finally { globalThis.fetch = originalFetch; }
  const finals = server.filter(([, error]) => error !== null).map(([status]) => status).sort();
  assert.deepEqual(finals, ['canceled', 'cancelled', 'error', 'failed', 'nsfw', 'rejected'], 'si el servidor añade un estado final, la CLI debe conocerlo');
  // Y el endpoint de estado publica ese motivo en `ailab_error`.
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/skill/higgsfield.php'), 'utf8');
  assert.match(source.slice(source.indexOf('function ailab_skill_higgsfield_status')), /\$data\['ailab_error'\] = \$failure\['error'\];/);
});

test('paridad con el PHP real: segundos facturables de Light, de 1 a 15 s y en los bordes', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const durations = [0.2, 0.5, 1, 1.0000004, 1.0000006, 2.5, 5, 8.2, 9.999, 10, 14.99, 14.999, 15, 15.0000004, 15.000001, 15.001, 15.01, 16, 20, 30, 0, -1];
  const cases = RESOLUTIONS.flatMap((resolution) => durations.map((duration) => ({ resolution, duration })));
  const results = php(`
    $cfg = wallet_config(); $spec = ailab_skill_higgsfield_spec('higgsfield-genjutsu-light'); $out = [];
    foreach (json_decode($argv[1], true) as $case) {
      $billable = ailab_skill_higgsfield_genjutsu_billable($spec, $case['duration']);
      $out[] = ['billable' => $billable, 'credits' => $billable === null ? null : ailab_skill_higgsfield_genjutsu_credits($cfg, $billable, $case['resolution'], true)];
    }
    echo json_encode($out);`, [JSON.stringify(cases)], { skillHiggsfield: true });
  let accepted = 0;
  cases.forEach((c, index) => {
    const seconds = light.lightVideoSeconds(c.duration);
    const server = results[index];
    const tooLong = seconds === null || seconds > light.LIGHT_MAX_VIDEO_SECONDS;
    if (tooLong) {
      assert.equal(server.credits, null, `${c.duration} s a ${c.resolution}: el servidor lo rechaza`);
      return;
    }
    accepted += 1;
    assert.equal(server.billable, 2 * seconds, `${c.duration} s`);
    assert.ok(Number.isSafeInteger(server.credits) && server.credits > 0, `${c.duration} s a ${c.resolution}: el servidor da un precio`);
  });
  assert.ok(accepted >= 40 && accepted < cases.length);
  // Resoluciones y duración máxima del servidor: las mismas que valida la CLI.
  const table = php("echo json_encode([wallet_genjutsu_light_resolutions(), wallet_genjutsu_light_max_video_seconds()]);", [], { skillHiggsfield: true });
  assert.deepEqual(table[0], model.params.resolution.values);
  assert.equal(table[1], light.LIGHT_MAX_VIDEO_SECONDS);
});

test('paridad con el PHP real: el endpoint de la skill acepta el cuerpo de la CLI y rechaza lo mismo (15 s, 1080p en Normal, campos ajenos)', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const validate = (modelId, input) => php(`$spec = ailab_skill_higgsfield_spec($argv[1]); echo json_encode(['input' => ailab_skill_higgsfield_input(['input' => json_decode($argv[2], true)], $spec)], JSON_UNESCAPED_UNICODE);`,
    [modelId, JSON.stringify(input)], { skillHiggsfield: true });
  const clip = media.video('lq.mp4', 6);
  const images = Array.from({ length: 8 }, (_, i) => media.image(`lq${i}.png`));
  const accepted = [
    { video_url: clip, image_urls: [images[0]] },
    { mode: 'object_swap', video_url: clip, image_urls: images, resolution: '1080p', prompt: 'cambia la taza' },
    { video_url: clip, image_urls: [images[0]], resolution: '480p', prompt: 'é'.repeat(2500) },
  ];
  for (const given of accepted) {
    const result = plan(given);
    assert.equal(result.ok, true, result.errors?.join('\n'));
    const input = result.payload.input;
    const sent = { ...input, video_url: 'https://uploads.example.test/v.mp4', image_urls: input.image_urls.map((_, i) => `https://uploads.example.test/i${i}.png`) };
    const server = validate(ID, sent);
    assert.ok(server.input, `el servidor debía aceptar ${JSON.stringify(sent)} y respondió ${JSON.stringify(server)}`);
    assert.equal(server.input.resolution, input.resolution);
    assert.equal(server.input.video_url, sent.video_url);
    assert.deepEqual(server.input.image_urls, sent.image_urls);
    assert.equal(server.input.prompt, (input.prompt || '').trim());
    assert.deepEqual(Object.keys(server.input).sort(), ['image_urls', 'prompt', 'resolution', 'video_url']);
  }
  const url = 'https://uploads.example.test/v.mp4';
  const img = ['https://uploads.example.test/i.png'];
  const rejected = [
    [ID, { video_url: url, image_urls: img, resolution: '1440p' }, /480p, 720p o 1080p/],
    [ID, { video_url: url, image_urls: img, resolution: '4k' }, /480p, 720p o 1080p/],
    [ID, { video_url: url, image_urls: [] }, /entre una y ocho imagenes/],
    [ID, { video_url: url, image_urls: Array.from({ length: 9 }, () => img[0]) }, /entre una y ocho imagenes/],
    [ID, { video_url: url, image_urls: img, duration: 5 }, /duration no esta permitido/],
    [ID, { video_url: url, image_urls: img, mode: 'object_swap' }, /mode no esta permitido/],
    [ID, { image_urls: img }, /video_url/],
    [ID, { video_url: url, image_urls: img, prompt: 'a'.repeat(5001) }, /prompt no es valido/],
    ['higgsfield-genjutsu-motion-transfer', { video_url: url, image_urls: img, resolution: '1080p' }, /solo admite resolucion 480p o 720p/],
  ];
  for (const [id, input, message] of rejected) {
    const server = validate(id, input);
    assert.ok(server.msg && !server.input, `${id}: el servidor debía rechazar ${JSON.stringify(input)}`);
    assert.match(server.msg, message, id);
  }
  // La CLI rechaza en local lo mismo: 1080p en Normal, 1440p/4k, 0 y 9 imágenes, campos ajenos.
  assert.equal(validateParams(normal, { video_url: 'v.mp4', image_urls: ['i.png'], resolution: '1080p' }).ok, false);
  assert.equal(plan({ video_url: clip, image_urls: [images[0]], resolution: '1440p' }).ok, false);
  assert.equal(plan({ video_url: clip, image_urls: [images[0]], duration: '5' }).ok, false);
});

test('paridad con el PHP real: interruptor de Light (true, admin, false o ausente) y mensajes que la skill anticipa', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const flag = (value) => ({ 'higgsfield-genjutsu-light': value });
  const cases = [flag(true), flag('admin'), flag(false), {}, flag('true'), flag(1), flag(null), 'no es un array', []];
  const result = php(`
    $out = [];
    foreach (json_decode($argv[1], true) as $flags) {
      $cfg = ['HIGGSFIELD_FEATURE_FLAGS' => $flags]; $m = 'higgsfield-genjutsu-light';
      $out[] = [wallet_higgsfield_flag_state($cfg, $m), ailab_skill_higgsfield_feature_enabled($cfg, $m),
        wallet_genjutsu_light_access($cfg, ['role' => 'administrator'], 'cookie'), wallet_genjutsu_light_access($cfg, ['role' => 'administrator'], 'token'),
        wallet_genjutsu_light_access($cfg, ['role' => 'user'], 'cookie'), wallet_genjutsu_light_access($cfg, ['role' => 'user'], 'token')];
    }
    echo json_encode($out);`, [JSON.stringify(cases)], { skillHiggsfield: true });
  // [estado, ¿lo abre la ruta de token?, admin+cookie, admin+token, miembro+cookie, miembro+token]
  assert.deepEqual(result, [
    ['open', true, true, true, true, true],
    ['admin', false, true, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
    ['closed', false, false, false, false, false],
  ]);
  // El interruptor se comprueba antes de validar, estimar, guardar o reservar nada, y la ruta pide el scope `generate`.
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/skill/higgsfield.php'), 'utf8');
  const quote = source.slice(source.indexOf('function ailab_skill_higgsfield_quote'), source.indexOf('function ailab_skill_higgsfield_create'));
  assert.match(quote, /feature_enabled\(\$cfg, \$model\)[\s\S]*pendiente de activacion[\s\S]*ailab_skill_higgsfield_input/);
  const create = source.slice(source.indexOf('function ailab_skill_higgsfield_create'), source.indexOf('function ailab_skill_higgsfield_status'));
  assert.match(create, /feature_enabled\(\$cfg, \$model\)[\s\S]*pendiente de activacion[\s\S]*wallet_intent_reserve/);
  assert.match(source, /wallet_require_scope\('generate'\)/);
  // El texto que la skill anticipa para los 15 s coincide con el del servidor (el servidor lo manda sin tildes).
  assert.ok(strip(source).includes(strip(light.LIGHT_TOO_LONG_MESSAGE).replace(/\.$/, '').replace('15 segundos de video', "' . wallet_genjutsu_light_max_video_seconds() . ' segundos de video").replace('a 15 s', "a ' . wallet_genjutsu_light_max_video_seconds() . ' s")),
    'el mensaje de más de 15 s del servidor es el de la skill');
  // Sin clave en el array manda GENJUTSU_LIGHT_ENABLED: abierto a todos en el repositorio (28/10/2026).
  const fallback = php("echo json_encode([wallet_higgsfield_flag_state(['HIGGSFIELD_FEATURE_FLAGS' => [], 'GENJUTSU_LIGHT_ENABLED' => true], 'higgsfield-genjutsu-light'), wallet_higgsfield_flag_state(['HIGGSFIELD_FEATURE_FLAGS' => ['higgsfield-genjutsu-light' => false], 'GENJUTSU_LIGHT_ENABLED' => true], 'higgsfield-genjutsu-light')]);");
  assert.deepEqual(fallback, ['open', 'closed'], 'la clave del array, si existe, manda sobre GENJUTSU_LIGHT_ENABLED');
  const config = php("echo json_encode(wallet_higgsfield_flag_state(wallet_config(), 'higgsfield-genjutsu-light'));");
  assert.equal(config, 'open', 'Genjutsu Light está abierto a todos en el repositorio');
});

// ---------------------------------------------------------------------------
// CLI real contra un servidor simulado en localhost: prepare, submit y status con cada estado final y con 429 y 500.
// ---------------------------------------------------------------------------
const CLI = process.env.AILAB_TEST_RUNTIME || path.join(skillRoot, 'scripts/ailab.mjs');
const TASK = 'hf-light-task-1';
const QUOTE_ID = crypto.randomBytes(16).toString('hex');
const FUTURE = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const json = (res, body, status = 200, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };

// `statuses`: respuestas sucesivas de action=status (la última se repite). Cada una: { status, headers, body } o { data }.
async function harness(t, { statuses = [], quoteCredits = 204, quoteFailure = null, balance = 5000, poll = '20', price = { credits: 204, server_quote: true, max_credits: 612 } } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-light-flow-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'L'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  let statusCalls = 0;
  // price.php simulado: precio de la cuenta para Light (lo cotiza el servidor) y techo de la cuenta en `max_credits`.
  const priceState = { prices: { [ID]: price } };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks);
      const isJson = /json/.test(req.headers['content-type'] || '');
      let body = {};
      if (isJson) { try { body = raw.length ? JSON.parse(raw.toString('utf8')) : {}; } catch { body = { unreadable: true }; } }
      requests.push({ method: req.method, pathname: url.pathname, query: url.search, body });
      if (handlePrice(priceState, url.pathname, body, res)) return;
      if (url.pathname === '/result.mp4') {
        res.writeHead(200, { 'Content-Type': 'video/mp4' });
        return res.end(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)]));
      }
      if (url.pathname === '/api/wallet/api.php') {
        if (body.action === 'task_costs') return json(res, { ok: true, costs: { ['higgsfield:' + TASK]: quoteCredits } });
        return json(res, { ok: true, user: { email: 'light@example.test', tier: 'hub' }, balance });
      }
      if (url.pathname === '/api/skill/upload.php') {
        const name = base + 'uploads/' + requests.length + '.bin';
        return json(res, { ok: true, code: 200, url: name, data: { url: name }, expires_at: '2099-01-01 00:00:00' });
      }
      if (url.pathname === '/api/v1/skill/task.php') {
        return json(res, { ok: true, task: { task_id: 'higgsfield:' + TASK, model_id: ID, state: 'pending', charged_credits: null, result_urls: [] } });
      }
      if (url.pathname === '/api/skill/higgsfield.php') {
        const action = url.searchParams.get('action');
        if (action === 'quote') {
          if (quoteFailure) return json(res, { ok: false, code: quoteFailure.status, msg: quoteFailure.msg }, quoteFailure.status);
          return json(res, { ok: true, code: 200, msg: 'Presupuesto calculado.', data: { quote_id: QUOTE_ID, credits: quoteCredits, max_credits_authorized: body.max_credits_authorized, billable_seconds: 20, expires_at: FUTURE() } });
        }
        if (action === 'create') return json(res, { ok: true, code: 200, msg: 'Generacion enviada.', data: { taskId: TASK, request_id: TASK, status: 'queued', credits_authorized: quoteCredits } });
        if (action === 'status') {
          const next = statuses[Math.min(statusCalls, statuses.length - 1)] || { data: { status: 'in_progress' } };
          statusCalls += 1;
          if (next.http) return json(res, next.body || { ok: false, code: next.http, msg: 'Fallo simulado' }, next.http, next.headers || {});
          return json(res, { ok: true, code: 200, data: JSON.parse(JSON.stringify(next.data).replaceAll('__BASE__', base)) });
        }
      }
      json(res, { error: 'unexpected request ' + req.url }, 404);
    } catch (error) { json(res, { error: error.message }, 500); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_POLL_MS: poll, AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
    AILAB_CATALOG_PATH: catalogPath, AILAB_OUTPUT_DIR: path.join(temp, 'out'), AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials };
  const run = (...args) => execute(process.execPath, [CLI, ...args], { env, timeout: 60000 });
  // Éxito o fallo, devuelve siempre { code, stdout, stderr }.
  const tryRun = async (...args) => { try { return { code: 0, ...(await run(...args)) }; } catch (error) { return { code: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; } };
  const of = (action) => requests.filter((r) => r.pathname === '/api/skill/higgsfield.php' && r.query.includes('action=' + action));
  const manifestOf = (stdout) => {
    const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
    assert.ok(id, 'La CLI no publicó el manifiesto:\n' + stdout);
    return { id, file: path.join(config, 'manifests', id + '.json') };
  };
  return { base, requests, run, tryRun, of, manifestOf, temp, output: path.join(temp, 'out'), priceState };
}

const lightArgs = (h, { seconds = 10, resolution = '720p', mode = 'character_swap' } = {}) => [ID, '--mode', mode, '--video_url', media.video(`flow${seconds}.mp4`, seconds), '--image_urls', media.image('flow.png', 640, 480), '--resolution', resolution];

test('CLI real: prepare mide el vídeo, pide el precio a AILAB, cotiza con el techo de la cuenta y submit envía el importe aprobado', async (t) => {
  const h = await harness(t, { statuses: [{ data: { status: 'in_progress' } }, { data: { status: 'completed', video: { url: '__BASE__result.mp4' } } }] });
  h.requests.length = 0;
  const prepared = (await h.run('prepare', ...lightArgs(h, { seconds: 10, resolution: '720p', mode: 'object_swap' }), '--prompt', 'cambia la taza')).stdout;
  assert.match(prepared, /coste cotizado 204 cr \(importe que se aprueba\) · techo de seguridad del servidor 612 cr/);
  assert.doesNotMatch(prepared, /Estimacion local|AVISO: la estimacion local/);
  // price.php recibe los parámetros y la medida del vídeo (nunca la ruta local).
  const [asked] = h.priceState.priceRequests;
  assert.equal(h.priceState.priceRequests.length, 1);
  assert.deepEqual([asked.action, asked.model, asked.params.mode, asked.params.resolution], ['estimate', ID, 'object_swap', '720p']);
  assert.equal(asked.params.video_url.length, 1);
  assert.equal(asked.params.video_url[0].class, 'video');
  assert.equal(asked.params.video_url[0].duration, 10);
  assert.equal(JSON.stringify(asked).includes(h.temp), false, 'sin rutas locales');
  assert.equal(JSON.stringify(asked).includes('flow10.mp4'), false, 'sin nombres de archivo');
  const manifest = h.manifestOf(prepared);
  const [quote] = h.of('quote');
  assert.equal(h.of('quote').length, 1);
  assert.equal(quote.body.model, ID);
  assert.equal(quote.body.mode, 'object_swap');
  assert.equal(quote.body.max_credits_authorized, 612, 'el techo de la cotización es el que da AILAB para la cuenta');
  assert.deepEqual(Object.keys(quote.body.input).sort(), ['image_urls', 'prompt', 'resolution', 'video_url']);
  assert.equal(quote.body.input.resolution, '720p');
  assert.equal(quote.body.input.prompt, 'cambia la taza');
  assert.equal('mode' in quote.body.input, false);
  assert.equal(h.of('create').length, 0, 'prepare no envía nada');
  const frozen = JSON.parse(fs.readFileSync(manifest.file, 'utf8'));
  assert.equal(frozen.max_credits_authorized, 204);
  assert.equal(frozen.quote_ceiling_credits, 612);

  const done = await h.run('submit', manifest.id, '--confirmed', '--output', h.output);
  const [create] = h.of('create');
  assert.equal(h.of('create').length, 1);
  assert.equal(create.body.model, ID);
  assert.equal(create.body.mode, 'object_swap');
  assert.equal(create.body.max_credits_authorized, 204);
  assert.equal(create.body.quote_id, QUOTE_ID);
  assert.equal(create.body.client_request_id, frozen.client_request_id);
  assert.match(done.stdout, new RegExp('Tarea encolada: higgsfield:' + TASK));
  assert.match(done.stdout, /Guardado: .*\.mp4/);
  assert.match(done.stdout, /Coste real: 204 cr/);
  assert.equal(h.of('status').length, 2, 'in_progress y después completed');
  assert.equal(h.of('quote').length, 1, 'submit no vuelve a cotizar');
  await assert.rejects(h.run('submit', manifest.id, '--confirmed'), /ya se ejecut/);
  assert.equal(h.of('create').length, 1);
});

test('CLI real: más de 15 s se rechaza en local antes de subir nada; --max-credits por debajo del coste también', async (t) => {
  const h = await harness(t);
  const long = await h.tryRun('prepare', ...lightArgs(h, { seconds: 16 }));
  assert.notEqual(long.code, 0);
  assert.match(long.stderr, /Genjutsu Light usa hasta 15 segundos de vídeo\. Recórtalo a 15 s o usa la versión Normal\./);
  assert.equal(h.requests.length, 0, 'sin subida, ni cotización, ni consulta de saldo');
  const capped = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }), '--max-credits', '203');
  assert.notEqual(capped.code, 0);
  assert.match(capped.stderr, /El coste \(204 cr\) supera el máximo que autorizaste \(--max-credits 203\)\. No se ha enviado nada\./);
  assert.deepEqual(h.requests.map((r) => r.pathname), ['/api/wallet/api.php', '/api/v1/skill/price.php'], 'solo sesión y precio: se avisa antes de subir nada');
  const exact = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }), '--max-credits', '204');
  assert.equal(exact.code, 0, exact.stderr);
});

test('CLI real: el precio de la cuenta lo da AILAB: --max-credits por debajo se rechaza tras pedirlo y antes de subir nada', async (t) => {
  const h = await harness(t, { price: { credits: 245, server_quote: true, max_credits: 735 } });
  const capped = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }), '--max-credits', '240');
  assert.notEqual(capped.code, 0);
  assert.match(capped.stderr, /El coste \(245 cr\) supera el máximo que autorizaste \(--max-credits 240\)\. No se ha enviado nada\./);
  assert.deepEqual(h.requests.map((r) => r.pathname), ['/api/wallet/api.php', '/api/v1/skill/price.php'], 'solo sesión y precio: ni subida ni cotización');
});

test('CLI real: si la cotización da otra cifra que price.php, se aprueba la del servidor sin avisos locales', async (t) => {
  const h = await harness(t, { quoteCredits: 230 });
  const prepared = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }));
  assert.equal(prepared.code, 0, prepared.stderr);
  assert.match(prepared.stdout, /coste cotizado 230 cr/);
  assert.doesNotMatch(prepared.stdout, /AVISO: la estimacion local/);
  const frozen = JSON.parse(fs.readFileSync(h.manifestOf(prepared.stdout).file, 'utf8'));
  assert.equal(frozen.max_credits_authorized, 230, 'se aprueba lo que cotiza el servidor');
});

test('CLI real: sin precio de AILAB no se sube ni se cotiza nada', async (t) => {
  const h = await harness(t);
  h.priceState.priceDown = true;
  const prepared = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }));
  assert.notEqual(prepared.code, 0);
  assert.match(prepared.stderr, /No se ha podido obtener el precio de AILAB\. No se ha enviado nada\./);
  assert.equal(h.requests.some((r) => r.pathname === '/api/skill/upload.php'), false);
  assert.equal(h.of('quote').length, 0);
});

test('CLI real: el interruptor cerrado (403 pendiente de activación) se explica, no cobra y no se reintenta', async (t) => {
  const h = await harness(t, { quoteFailure: { status: 403, msg: 'Este modelo Higgsfield esta pendiente de activacion.' } });
  const prepared = await h.tryRun('prepare', ...lightArgs(h, { seconds: 10 }));
  assert.notEqual(prepared.code, 0);
  assert.match(prepared.stderr, /pendiente de activacion/);
  assert.match(prepared.stderr, /no se ha gastado nada/);
  assert.equal(h.of('quote').length, 1, 'un único intento, sin reintentos');
  assert.equal(h.of('create').length, 0);
  assert.equal(h.of('status').length, 0);
  const manifests = path.join(h.temp, 'config', 'manifests');
  assert.equal(fs.existsSync(manifests) ? fs.readdirSync(manifests).length : 0, 0, 'sin manifiesto que enviar');
});

async function submitted(t, options) {
  const h = await harness(t, options);
  const prepared = (await h.run('prepare', ...lightArgs(h, { seconds: 10 }))).stdout;
  const manifest = h.manifestOf(prepared);
  const result = await h.tryRun('submit', manifest.id, '--confirmed', '--output', h.output);
  return { h, manifest, result };
}

const MODERATION = 'Higgsfield ha bloqueado la generación por su filtro de contenido. Revisa el vídeo, las imágenes de referencia y el prompt.';
for (const [status, serverMessage, fallback] of [
  ['nsfw', MODERATION, /bloqueado la generación por su filtro de contenido\. Revisa el vídeo, las imágenes de referencia y el prompt\. No se ha cobrado nada\./],
  ['rejected', 'Higgsfield ha rechazado la generación. Revisa el vídeo, las imágenes de referencia y el prompt.', /Higgsfield ha rechazado la generación\. Revisa el vídeo.* No se ha cobrado nada\./],
  ['failed', 'Higgsfield no ha podido completar la generación. Inténtalo de nuevo más tarde.', /no ha podido completar la generación\..* No se ha cobrado nada\./],
  ['canceled', 'La generación se ha cancelado en Higgsfield.', /se ha cancelado en Higgsfield\. No se ha cobrado nada\./],
]) {
  test(`CLI real: ${status} termina la tarea a la primera consulta, muestra el motivo del servidor y no consulta sin fin`, async (t) => {
    const { h, result } = await submitted(t, { statuses: [{ data: { status, ailab_error: serverMessage, ailab_error_code: 'higgsfield_' + status } }] });
    assert.notEqual(result.code, 0);
    assert.ok(result.stdout.includes('La generacion fallo: ' + serverMessage + ' No se ha cobrado nada.'), result.stdout);
    assert.match(result.stdout, /No hay nada que recuperar/);
    assert.doesNotMatch(result.stdout, /Conserva esta tarea|no vuelvas a generar/);
    assert.equal(h.of('status').length, 1, 'una sola consulta: ya no hay bucle');
    assert.equal(h.of('create').length, 1, 'no se vuelve a enviar nada');
  });
  test(`CLI real: ${status} con un servidor que aún no manda ailab_error usa el texto propio del estado`, async (t) => {
    const { h, result } = await submitted(t, { statuses: [{ data: { status: status.toUpperCase() } }] });
    assert.notEqual(result.code, 0);
    assert.match(result.stdout, fallback);
    assert.equal(h.of('status').length, 1);
  });
}

test('CLI real: un 429 al consultar el estado espera lo que indica el servidor y la tarea sigue y se descarga', async (t) => {
  const { h, result } = await submitted(t, { statuses: [
    { http: 429, body: { ok: false, code: 429, msg: 'Demasiadas peticiones' }, headers: { 'Retry-After': '1' } },
    { data: { status: 'completed', video: { url: '__BASE__result.mp4' } } },
  ] });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /límite de peticiones\). La tarea sigue en marcha: vuelvo a consultar en 1 s\./);
  assert.match(result.stdout, /Guardado: /);
  assert.doesNotMatch(result.stdout, /No se pudo confirmar el estado/);
  assert.equal(h.of('status').length, 2);
  assert.equal(h.of('create').length, 1, 'un 429 nunca reenvía la generación');
});

test('CLI real: varios 500 seguidos esperan con retroceso creciente y la tarea acaba descargándose', async (t) => {
  const failure = { http: 500, body: { ok: false, code: 500, msg: 'Error interno del servidor wallet.' } };
  const started = Date.now();
  const { h, result } = await submitted(t, { poll: '50', statuses: [failure, failure, failure, { data: { status: 'completed', video: { url: '__BASE__result.mp4' } } }] });
  assert.equal(result.code, 0, result.stdout + result.stderr);
  const waits = [...result.stdout.matchAll(/HTTP 500\)\. La tarea sigue en marcha: vuelvo a consultar en (\d+) s/g)].map((m) => Number(m[1]));
  assert.equal(waits.length, 3, result.stdout);
  assert.deepEqual([...waits].sort((a, b) => a - b), waits, 'la espera no baja');
  assert.equal(h.of('status').length, 4);
  assert.equal(h.of('create').length, 1);
  assert.ok(Date.now() - started < 30000);
});

test('CLI real: si el servidor no se recupera, la tarea queda recuperable con un mensaje claro y sin reenviar', async (t) => {
  const { h, result } = await submitted(t, { poll: '5', statuses: [{ http: 503, body: { ok: false, code: 503, msg: 'No disponible' } }] });
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /No se pudo consultar el estado tras 8 intentos seguidos/);
  assert.match(result.stdout, /La tarea sigue en marcha y no se ha vuelto a enviar nada\./);
  assert.match(result.stdout, new RegExp('Conserva esta tarea; no vuelvas a generar\\. Recupera con: .*status higgsfield:' + TASK));
  assert.doesNotMatch(result.stdout, /La generacion fallo|sin cargo|No se ha cobrado/);
  assert.equal(h.of('status').length, 8, 'ocho consultas, con espera creciente entre ellas');
  assert.equal(h.of('create').length, 1);
  assert.equal(h.requests.filter((r) => r.pathname === '/api/v1/skill/task.php').length, 1, 'una última lectura del historial antes de rendirse');
});

test('CLI real: un 403 al consultar el estado no se reintenta: no es transitorio', async (t) => {
  const { h, result } = await submitted(t, { statuses: [{ http: 403, body: { ok: false, code: 403, msg: 'Esa tarea no es de tu cuenta.' } }] });
  assert.notEqual(result.code, 0);
  assert.match(result.stdout, /No se pudo confirmar el estado/);
  assert.equal(h.of('status').length, 1);
});
