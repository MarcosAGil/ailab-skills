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

// Kling Image 4.0 vía Kie (contrato leído el 18/11/2026). La CLI traduce parámetros planos (ranuras de
// personajes) a la entrada exacta que valida el servidor y presupuesta lo mismo que reserva. Con
// AILAB_CANONICAL_REPO las comparaciones se hacen contra el PHP real (gateway_kling_image4_input,
// gateway_estimate_credits) con metadatos simulados: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-kling-image4-skill-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { klingImage4Credits } = await import('../skills/ailab/scripts/lib/kling-image4.mjs');
const { kling4MentionError } = await import('../skills/ailab/scripts/lib/kling4.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const model = { id: 'kling-image-4-0', ...catalog.models['kling-image-4-0'] };
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));

// Pasos de la CLI: validar, presupuestar y construir el cuerpo con las URLs de subida simuladas.
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

// Referencia independiente: décimas de crédito Kie por imagen y 0,5 por referencia o vista en cada imagen; ceil(x 1,02).
const TENTHS = { '2K': 113, '4K': 170, '8K': 283 };
const reference = (resolution, count, materials) => Math.ceil(Number(((count * TENTHS[resolution] + 5 * count * materials) * 1.02 / 10).toFixed(6)));

// Valida en el PHP real y devuelve la entrada normalizada y la reserva del servidor.
const PHP_BACKEND = `
  $cases = json_decode($argv[1], true); $out = [];
  foreach ($cases as $case) {
    $meta = $case['meta'] ?? [];
    $inspect = static fn($url, $kind) => $meta[$url] ?? null;
    try {
      $input = gateway_kling_image4_input($case['input'], 1, $inspect);
      $out[] = ['ok' => true, 'input' => $input, 'credits' => gateway_estimate_credits('kling-image-4-0', $input)];
    } catch (Throwable $e) { $out[] = ['ok' => false, 'error' => $e->getMessage()]; }
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;

test('el contrato publicado exige la skill 2.4.1, no expone proveedor y las CLI anteriores lo ignoran', async () => {
  assert.equal(model.min_cli_version, '2.4.1');
  assert.equal(catalog.min_cli_version, '2.3.7');
  assert.equal(catalog.catalog_version, '1.33.0');
  assert.equal(model.driver, 'jobs-v1');
  assert.equal(model.enabled, true);
  assert.deepEqual(model.modes, ['t2i', 'i2i']);
  assert.equal(model.params.prompt.max_len, 20000);
  assert.deepEqual(model.params.output_mode.values, ['default', 'series']);
  assert.deepEqual([model.params.count.min, model.params.count.max, model.params.count.default], [1, 10, undefined]);
  assert.deepEqual(model.params.resolution.values, ['2K', '4K', '8K']);
  assert.match(model.params.resolution.help, /8K sale en JPG/);
  assert.deepEqual(model.params.aspect_ratio.values, ['auto', '9:16', '2:3', '3:4', '1:1', '4:3', '3:2', '16:9', '21:9']);
  assert.equal(model.params.image_urls.max, 10);
  for (let n = 1; n <= 10; n += 1) {
    assert.deepEqual([model.params[`subject_${n}_images`].min, model.params[`subject_${n}_images`].max], [2, 4]);
    assert.equal(model.params[`subject_${n}_name`].max_len, 20);
    assert.equal(model.params[`subject_${n}_description`].max_len, 100);
  }
  assert.equal(model.params.subject_11_name, undefined);
  assert.equal(model.estimate.kind, 'param_table', 'la forma del estimate la conocen todas las CLI 2.3.x');
  assert.deepEqual(model.estimate.credits_by_value, { '2K': 12, '4K': 18, '8K': 29 });
  const text = JSON.stringify(model);
  for (const forbidden of ['kling-4-0/', 'provider_contract', 'callBackUrl', 'KIE', 'api.kie']) assert.equal(text.includes(forbidden), false, forbidden);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  assert.equal(modelUsable(model).ok, true);
  assert.equal(modelUsable({ ...model, min_cli_version: '2.4.2' }).ok, false);
  if (!CANONICAL) return;
  for (const version of ['2.3.7', '2.3.13', '2.3.19', '2.4.0']) {
    const file = path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs');
    if (!fs.existsSync(file)) continue;
    const old = await import(pathToFileURL(file).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    assert.equal(old.modelUsable(parsed.models['kling-image-4-0']).ok, false, 'la CLI ' + version + ' no debe ofrecer un modelo que no sabe ejecutar');
  }
});

test('el presupuesto multiplica por imagen y suma 0,5 cr Kie por referencia o vista, con un solo redondeo', () => {
  for (const resolution of ['2K', '4K', '8K']) for (const count of [1, 2, 5, 9, 10]) for (const materials of [0, 1, 3, 10, 40]) {
    assert.equal(klingImage4Credits(resolution, count, materials), reference(resolution, count, materials), `${resolution} ${count} ${materials}`);
  }
  assert.deepEqual(['2K', '4K', '8K'].map((resolution) => plan({ prompt: 'x', resolution }).estimate.credits), [12, 18, 29]);
  assert.equal(plan({ prompt: 'x', output_mode: 'series' }).estimate.credits, reference('2K', 2, 0), 'sin --count, una serie pide 2');
  assert.equal(plan({ prompt: 'x', output_mode: 'series', count: '10', resolution: '8K' }).estimate.credits, reference('8K', 10, 0));
  assert.equal(plan({ prompt: 'x', mode: 'i2i', image_urls: [media.image('p1.png')] }).estimate.credits, 13);
  const two = [media.image('p2.png'), media.image('p3.png')];
  const series = plan({ prompt: '@ana y @image_1', mode: 'i2i', output_mode: 'series', count: '3', image_urls: [media.image('p4.png')], subject_1_name: 'ana', subject_1_images: two });
  assert.equal(series.estimate.credits, 40);
  assert.equal(series.estimate.approximate, true);
  assert.match(series.estimate.note, /máximo reservado/);
  assert.match(plan({ prompt: 'x', resolution: '8K' }).estimate.note, /8K sale en JPG/);
  assert.equal(klingImage4Credits('16K', 1, 0), null);
  assert.equal(klingImage4Credits('2K', 11, 0), null);
});

test('límites de la CLI: modalidades, salida, materiales, personajes y menciones', () => {
  const two = [media.image('s1.png'), media.image('s2.png', 600, 800)];
  const webp = media.put('ref.webp', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(32)]), { mime: 'image/webp', width: 10, height: 10 });
  const cases = [
    ['prompt vacío', { prompt: '   ' }, /prompt no puede estar vacío/],
    ['prompt de 20.001 caracteres', { prompt: 'a'.repeat(20001) }, /20\.000/],
    ['10 sueltas', { prompt: 'x', count: '10' }, /de 1 a 9 imágenes sueltas/],
    ['serie de 1', { prompt: 'x', output_mode: 'series', count: '1' }, /de 2 a 10/],
    ['serie de 11', { prompt: 'x', output_mode: 'series', count: '11' }, /maximo 10/],
    ['resolución 1K', { prompt: 'x', resolution: '1K' }, /debe ser uno de/],
    ['proporción 5:4', { prompt: 'x', aspect_ratio: '5:4' }, /debe ser uno de/],
    ['referencias en t2i', { prompt: 'x', image_urls: [media.image('t1.png')] }, /Texto a imagen no admite referencias/],
    ['i2i sin materiales', { prompt: 'x', mode: 'i2i' }, /al menos una referencia/],
    ['WebP', { prompt: '@image_1', mode: 'i2i', image_urls: [webp] }, /JPG o PNG válida/],
    ['más de 10 imágenes', { prompt: 'x', mode: 'i2i', image_urls: Array.from({ length: 11 }, (_, i) => media.image(`m${i}.png`)) }, /como mucho 10/],
    ['10 referencias y un personaje', { prompt: 'x', mode: 'i2i', image_urls: Array.from({ length: 10 }, (_, i) => media.image(`n${i}.png`)), subject_1_name: 'ana', subject_1_images: two }, /hasta 10 materiales/],
    ['mención huérfana', { prompt: 'Mira @image_2', mode: 'i2i', image_urls: [media.image('o1.png')] }, /menciona @image_2/],
    ['mención en texto a imagen', { prompt: 'Mira @image_1' }, /menciona @image_1/],
    ['personaje sin imágenes', { prompt: 'x', mode: 'i2i', subject_1_name: 'ana' }, /Falta --subject_1_images/],
    ['personaje sin nombre', { prompt: 'x', mode: 'i2i', subject_1_images: two }, /Falta --subject_1_name/],
    ['personaje con una imagen', { prompt: '@ana', mode: 'i2i', subject_1_name: 'ana', subject_1_images: [two[0]] }, /al menos 2|entre 2 y 4/],
    ['personaje con 5 imágenes', { prompt: '@ana', mode: 'i2i', subject_1_name: 'ana', subject_1_images: Array.from({ length: 5 }, (_, i) => media.image(`q${i}.png`)) }, /como mucho 4/],
    ['nombre con tilde', { prompt: 'x', mode: 'i2i', subject_1_name: 'María', subject_1_images: two }, /sin tildes/],
    ['nombre reservado object_2', { prompt: 'x', mode: 'i2i', subject_1_name: 'object_2', subject_1_images: two }, /nombre reservado/],
    ['nombre duplicado', { prompt: '@ana', mode: 'i2i', subject_1_name: 'ana', subject_1_images: two, subject_2_name: 'ANA', subject_2_images: two }, /Ya hay un personaje llamado @ANA/],
    ['descripción de 101', { prompt: '@ana', mode: 'i2i', subject_1_name: 'ana', subject_1_images: two, subject_1_description: 'd'.repeat(101) }, /supera 100|hasta 100 caracteres/],
    ['categoría inválida', { prompt: '@ana', mode: 'i2i', subject_1_name: 'ana', subject_1_images: two, subject_1_tag: 'persona' }, /debe ser uno de/],
    ['parámetro de otro modelo', { prompt: 'x', negative_prompt: 'feo' }, /negative_prompt/],
  ];
  for (const [name, given, message] of cases) {
    const result = plan(given);
    assert.equal(result.ok, false, name + ' debía rechazarse');
    assert.match(result.errors.join(' '), message, name + ': ' + result.errors.join(' '));
    assert.equal(result.errors.join(' ').includes(String.fromCharCode(0x2014)), false, name);
  }
});

function validCases() {
  const two = [media.image('v1.png', 800, 800), media.image('v2.png', 800, 1000)];
  const refs = (n, prefix) => Array.from({ length: n }, (_, i) => media.image(`${prefix}${i}.png`));
  return [
    ['texto 2K', { prompt: 'Un faro' }],
    ['texto 4K 16:9', { prompt: 'Un faro', resolution: '4K', aspect_ratio: '16:9' }],
    ['texto 8K', { prompt: 'Un faro', resolution: '8K' }],
    ['nueve sueltas', { prompt: 'Un faro', count: '9' }],
    ['serie por defecto', { prompt: 'Un faro', output_mode: 'series' }],
    ['serie de 10 a 8K', { prompt: 'Un faro', output_mode: 'series', count: '10', resolution: '8K', aspect_ratio: '21:9' }],
    ['una referencia', { prompt: 'Cambia el fondo de @image_1', mode: 'i2i', image_urls: refs(1, 'a') }],
    ['diez referencias', { prompt: '@image_10 arriba', mode: 'i2i', count: '2', image_urls: refs(10, 'b'), resolution: '4K' }],
    ['personaje solo', { prompt: '@ana en la playa', mode: 'i2i', subject_1_name: 'ana', subject_1_images: two }],
    ['personaje completo y referencia', { prompt: '@ana delante de @image_1', mode: 'i2i', output_mode: 'series', count: '3', image_urls: refs(1, 'c'),
      subject_1_name: 'ana', subject_1_images: two, subject_1_tag: 'character', subject_1_description: 'Protagonista con abrigo rojo' }],
    ['tres personajes', { prompt: '@ana, @luis y @gato', mode: 'i2i', subject_1_name: 'ana', subject_1_images: two, subject_2_name: 'luis', subject_2_images: refs(4, 'd'),
      subject_3_name: 'gato', subject_3_images: refs(3, 'e'), subject_3_tag: 'animal' }],
  ];
}

test('el payload es exactamente la entrada que valida el servidor', () => {
  const t2i = plan({ prompt: '  Un faro  ', resolution: '8K' });
  assert.deepEqual(t2i.payload, { model: 'kling-image-4-0', input: { mode: 't2i', prompt: 'Un faro', output_mode: 'default', count: 1, resolution: '8K', aspect_ratio: 'auto' } });
  const [, given] = validCases()[9];
  const full = plan(given);
  assert.deepEqual(Object.keys(full.payload.input), ['mode', 'prompt', 'output_mode', 'count', 'resolution', 'aspect_ratio', 'image_urls', 'elements']);
  assert.deepEqual(full.payload.input.elements, [{ name: 'ana', image_urls: given.subject_1_images.map((file) => media.url(file)), tag: 'character', description: 'Protagonista con abrigo rojo' }]);
  for (const [name, c] of validCases()) assert.equal(plan(c).ok, true, name);
});

test('paridad con el PHP real: el servidor acepta lo que envía la CLI, lo devuelve igual y reserva lo mismo', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const cases = validCases().map(([name, given]) => ({ name, ...plan(given) }));
  for (const c of cases) assert.equal(c.ok, true, `${c.name}: ${c.errors?.join(' ')}`);
  const results = php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ input: c.payload.input, meta: c.meta })))]);
  cases.forEach((c, index) => {
    const server = results[index];
    assert.equal(server.ok, true, `${c.name}: ${server.error}`);
    // El servidor solo cambia la resolución a minúsculas, que es la forma de Kie.
    assert.deepEqual(server.input, { ...c.payload.input, resolution: c.payload.input.resolution.toLowerCase() }, c.name);
    assert.equal(c.estimate.credits, server.credits, `${c.name}: la CLI autoriza ${c.estimate.credits} y el servidor reserva ${server.credits}`);
  });
});

test('paridad con el PHP real: lo que la CLI rechaza en local el servidor también lo rechaza, con el mismo texto en las menciones', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const url = (file) => media.url(file);
  const two = [media.image('r1.png'), media.image('r2.png')];
  const meta = (files) => Object.fromEntries(files.map((file) => [url(file), media.meta[file]]));
  const raw = (input, files = []) => ({ input: { mode: 'i2i', prompt: 'x', output_mode: 'default', count: 1, resolution: '2K', aspect_ratio: 'auto', ...input }, meta: meta(files) });
  const webp = media.put('r3.webp', Buffer.alloc(40), { mime: 'image/webp', width: 10, height: 10 });
  const heavy = media.put('r4.png', Buffer.alloc(40), { mime: 'image/png', width: 10, height: 10, bytes: 20 * 1024 * 1024 + 1 });
  const rejected = [
    ['10 sueltas', raw({ mode: 't2i', count: 10 })],
    ['serie de 1', raw({ mode: 't2i', output_mode: 'series', count: 1 })],
    ['referencias en t2i', raw({ mode: 't2i', image_urls: [url(two[0])] }, two)],
    ['i2i vacío', raw({})],
    ['WebP', raw({ image_urls: [url(webp)] }, [webp])],
    ['más de 20 MB', raw({ image_urls: [url(heavy)] }, [heavy])],
    ['personaje con una imagen', raw({ prompt: '@ana', elements: [{ name: 'ana', image_urls: [url(two[0])] }] }, two)],
    ['nombre reservado', raw({ elements: [{ name: 'image_3', image_urls: two.map(url) }] }, two)],
    ['nombre duplicado', raw({ elements: [{ name: 'ana', image_urls: two.map(url) }, { name: 'ANA', image_urls: two.map(url) }] }, two)],
    ['11 materiales', raw({ image_urls: Array(10).fill(url(two[0])), elements: [{ name: 'ana', image_urls: two.map(url) }] }, two)],
    ['campo extra', raw({ negative_prompt: 'feo', image_urls: [url(two[0])] }, two)],
    ['mención en texto a imagen', raw({ mode: 't2i', prompt: 'Mira @image_1' })],
  ];
  const results = php(PHP_BACKEND, [JSON.stringify(rejected.map(([, c]) => c))]);
  rejected.forEach(([name], index) => assert.equal(results[index].ok, false, `${name}: el servidor debía rechazarlo`));
  const prompts = ['Mira @image_9', '@image_10', '@anaX', '@', 'Hola @nadie y @image_1', '@image_1x', '@image_1, @ANA'];
  const names = ['image_1', 'ana'];
  const mentionResults = php(PHP_BACKEND, [JSON.stringify(prompts.map((prompt) => raw({ prompt, image_urls: [url(two[0])], elements: [{ name: 'ana', image_urls: two.map(url) }] }, two)))]);
  prompts.forEach((prompt, index) => {
    const local = kling4MentionError(prompt, names);
    if (local === null) assert.equal(mentionResults[index].ok, true, prompt);
    else assert.equal(mentionResults[index].error, local, prompt);
  });
});

test('paridad con el PHP real: ruta del servidor y acceso por token', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const route = php("$c = wallet_config(); echo json_encode($c['SKILL_MODEL_ROUTES']['kling-image-4-0']);");
  assert.deepEqual(route, { driver: 'jobs-v1', gateway_model: 'kling-4-0/image', strip_input: ['mode'], rename_input: { output_mode: 'mode' } });
  // El valor por defecto del repositorio abre el modelo a todos; config.local.php puede cerrarlo (rollback).
  assert.equal(php("$c = wallet_config(); echo json_encode($c['KLING_IMAGE_4_0_ENABLED']);"), true);
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/wallet/gateway.php'), 'utf8');
  assert.match(source, /wallet_require_scope\('generate'\)/);
  assert.match(source, /'kling-image-4-0' && empty\(\$cfg\['KLING_IMAGE_4_0_ENABLED'\]\)/);
});

test('CLI real: prepare valida, sube y autoriza el máximo; submit envía el cuerpo exacto y descarga el lote', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-kling-image4-cli-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'K'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  const pngBytes = fs.readFileSync(media.image('cli-out.png', 64, 64));
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const url = new URL(req.url, base);
    const body = /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw.toString() || '{}') : {};
    requests.push({ path: url.pathname, query: url.searchParams.get('path'), body });
    if (/^\/result-\d\.png$/.test(url.pathname)) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(pngBytes); }
    let response = { ok: true, user: { email: 'test@example.invalid', tier: 'hub' }, balance: 5000 };
    if (body.action === 'task_costs') response = { ok: true, costs: { 'kling-image-job': 39 } };
    if (url.pathname.endsWith('/upload.php')) {
      const name = base + 'uploads/' + requests.length + '.png';
      response = { ok: true, code: 200, url: name, data: { url: name }, expires_at: '2099-01-01 00:00:00' };
    }
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = { code: 200, data: { taskId: 'kling-image-job' } };
      else response = { code: 200, data: { taskId: 'kling-image-job', state: 'success', resultJson: JSON.stringify({ resultUrls: [1, 2, 3].map((n) => base + `result-${n}.png`) }) } };
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const out = path.join(temp, 'out');
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath,
    AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: out };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  const hero = [media.image('cli-h1.png', 800, 800), media.image('cli-h2.png', 800, 1000)];
  const street = media.image('cli-calle.png', 1200, 800);
  // Una combinación inválida se rechaza en local, sin tocar la red.
  await assert.rejects(exec('prepare', 'kling-image-4-0', '--prompt', 'Mira @image_1'), /menciona @image_1/);
  assert.equal(requests.length, 0);
  const args = ['kling-image-4-0', '--mode', 'i2i', '--output_mode', 'series', '--count', '3', '--prompt', '@ana pasea por @image_1',
    '--image_urls', street, '--subject_1_name', 'ana', '--subject_1_images', hero[0], '--subject_1_images', hero[1], '--subject_1_tag', 'character'];
  const expected = reference('2K', 3, 3);
  assert.equal(expected, 40);
  const { stdout } = await exec('prepare', ...args, '--max-credits', String(expected));
  assert.match(stdout, new RegExp(`Estimacion: ~${expected} cr`));
  assert.match(stdout, /3 imágenes en serie · 3 referencias y vistas/);
  const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
  assert.ok(id, stdout);
  assert.equal(JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8')).max_credits_authorized, expected);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 0, 'prepare no envía nada');
  await assert.rejects(exec('prepare', ...args, '--max-credits', String(expected - 1)), /supera el m[aá]ximo/i);
  const done = await exec('submit', id, '--confirmed');
  assert.match(done.stdout, /Coste real: 39 cr/);
  const sends = requests.filter((request) => request.query === '/jobs/createTask');
  assert.equal(sends.length, 1);
  const sent = sends[0].body;
  assert.equal(sent.model, 'kling-image-4-0');
  assert.equal(sent.max_credits_authorized, expected);
  assert.deepEqual(Object.keys(sent.input), ['mode', 'prompt', 'output_mode', 'count', 'resolution', 'aspect_ratio', 'image_urls', 'elements']);
  assert.deepEqual([sent.input.mode, sent.input.output_mode, sent.input.count, sent.input.resolution], ['i2i', 'series', 3, '2K']);
  assert.equal(sent.input.image_urls.length, 1);
  assert.deepEqual([sent.input.elements[0].name, sent.input.elements[0].image_urls.length, sent.input.elements[0].tag], ['ana', 2, 'character']);
  const files = fs.readdirSync(out, { recursive: true }).filter((name) => /\.png$/.test(name));
  assert.equal(files.length, 3, 'descarga las tres imágenes del lote: ' + files.join(', '));
  await assert.rejects(exec('submit', id, '--confirmed'), /ya se ejecutó/);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 1, 'no duplica un envío confirmado');
});
