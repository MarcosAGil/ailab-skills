import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-flux-adapter-'));
process.env.AILAB_CONFIG_DIR = path.join(isolated, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(isolated, 'credentials');
process.env.AILAB_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_GENERATION_BASE_URL = process.env.AILAB_BASE_URL;
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
const { estimateCredits, validateCatalogShape, validateParams } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload, check } = await import('../skills/ailab/scripts/adapters/labs-queue-v1.mjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const model = catalog.models['flux-3'];
const verifiedCredits = {
  '768sq': { promotional: 5, ordinary: 10 },
  '1k': { promotional: 5, ordinary: 10 },
  '2k': { promotional: 20, ordinary: 40 },
  '4k': { promotional: 79, ordinary: 157 },
};
const documentedResolutions = ['512sq', '768sq', '1k', '2k', '4k'];
const verifiedResolutions = Object.keys(verifiedCredits);
const unavailableResolutions = documentedResolutions.filter(resolution => !verifiedCredits[resolution]);
const execute = promisify(execFile);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

function reference(t, width, height) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-flux-image-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  // Solo fixture del lector de metadatos PNG, no una imagen para el proveedor.
  const bytes = Buffer.from(png);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  const file = path.join(dir, 'reference.png');
  fs.writeFileSync(file, bytes);
  return file;
}

test('Flux 3 expone solo su contrato AILAB y una única salida', () => {
  assert.ok(model);
  assert.equal(model.driver, 'labs-queue-v1');
  assert.equal(model.min_cli_version, '2.3.7');
  assert.equal(model.output, 'image');
  assert.deepEqual(Object.keys(model.params).sort(), ['aspect_ratio', 'image_urls', 'mode', 'prompt', 'resolution']);
  assert.deepEqual(model.params.resolution.values, verifiedResolutions);
  assert.equal(model.params.resolution.default, '1k');
  assert.equal(model.params.aspect_ratio.default, '1:1');
  assert.equal(model.params.prompt.max_len, 20000);
  assert.match(model.params.prompt.help, /AILAB/);
  assert.equal(model.params.image_urls.max, 10);
});

test('los ejemplos de edición conservan dos referencias con el parser real de la CLI', () => {
  const runtime = fs.readFileSync(path.join(root, 'skills/ailab/scripts/pg.mjs'), 'utf8');
  const parser = runtime.match(/function parseArgs\(argv\) \{[^]*?\n\}/)[0];
  const sandbox = {};
  vm.runInNewContext(parser, sandbox);
  for (const filename of ['flux-3.md', 'ideogram-v45.md']) {
    const doc = fs.readFileSync(path.join(root, 'skills/ailab/references', filename), 'utf8');
    const example = doc.split('\n').find(line => line.includes('--mode edit') && line.startsWith('node '));
    const flags = Array.from(example.matchAll(/--image_urls ([^ ]+)/g), match => match[1]);
    assert.equal(flags.length, 2);
    const args = ['prepare', filename === 'flux-3.md' ? 'flux-3' : 'ideogram-v45', ...flags.flatMap(file => ['--image_urls', file])];
    const parsed = sandbox.parseArgs(args);
    assert.deepEqual(Array.from(parsed.opts.image_urls), flags);
    assert.equal(parsed.pos.length, 2, 'ninguna referencia debe quedar como argumento suelto');
  }
});

test('Flux 3: default de skill, catálogo canónico y adaptador web coinciden', t => {
  const canonicalRoot = process.env.AILAB_CANONICAL_REPO;
  if (!canonicalRoot) return t.skip('Define AILAB_CANONICAL_REPO para la comprobación cruzada de release.');
  const canonical = JSON.parse(fs.readFileSync(path.join(canonicalRoot, 'config/ailab-model-additions.json'), 'utf8')).models.find(candidate => candidate.id === 'flux-3');
  const adapter = createRequire(import.meta.url)(path.join(canonicalRoot, 'app/ailab-image-models-live.js')).get('flux-3');
  const validated = validateParams(model, { prompt: 'Default contract audit' });
  assert.equal(validated.ok, true, validated.errors.join('\n'));
  assert.equal(canonical.params.aspect_ratio.default, '1:1');
  assert.equal(validated.params.aspect_ratio, canonical.params.aspect_ratio.default);
  assert.equal(adapter.normalizeOptions({ mode: 't2i' }).aspectRatio, canonical.params.aspect_ratio.default);
  assert.equal(adapter.normalizeOptions({ mode: 'edit' }).aspectRatio, 'auto');
  const boundary = Date.parse(model.estimate.promo.until);
  assert.deepEqual(model.params.resolution.values, canonical.params.resolution.values);
  assert.equal(model.params.resolution.help, canonical.params.resolution.help);
  assert.equal(model.estimate.note, canonical.estimate.note);
  for (const resolution of verifiedResolutions) for (const mode of ['t2i', 'edit']) for (const now of [boundary - 1, boundary, boundary + 1]) {
    assert.equal(estimateCredits(model, { mode, resolution }, now).credits, adapter.estimateCredits({ mode, resolution }, mode === 'edit' ? 2 : 0, now), mode + ':' + resolution + ':' + now);
  }
});

test('Flux 3 cotiza cada resolución verificada antes y después del corte promocional', () => {
  const before = Date.parse('2026-10-07T23:59:59.999Z');
  const boundary = Date.parse('2026-10-08T00:00:00Z');
  for (const [resolution, prices] of Object.entries(verifiedCredits)) for (const mode of ['t2i', 'edit']) {
    assert.equal(estimateCredits(model, { mode, resolution }, before).credits, prices.promotional);
    assert.equal(estimateCredits(model, { mode, resolution }, boundary).credits, prices.ordinary);
    assert.equal(estimateCredits(model, { mode, resolution }, boundary + 1).credits, prices.ordinary);
  }
  assert.deepEqual(Object.keys(model.estimate.credits_by_value).sort(), verifiedResolutions.slice().sort());
  assert.deepEqual(Object.keys(model.estimate.promo.credits_by_value).sort(), verifiedResolutions.slice().sort());
  for (const resolution of [...unavailableResolutions, 'unknown']) assert.equal(estimateCredits(model, { resolution }, before).credits, null);
  assert.equal(model.estimate.approximate, false);
});

test('Flux 3 valida modalidades, prompt y límites de referencias antes de subir', t => {
  const base = reference(t, 256, 256);
  const max = reference(t, 2000, 2000);
  for (const image of [base, max]) {
    const valid = validateParams(model, { mode: 'edit', prompt: 'Edit', image_urls: [image] });
    assert.equal(valid.ok, true, valid.errors.join('\n'));
    assert.deepEqual(valid.fileParams.image_urls, [image]);
  }
  const many = Array(10).fill(base);
  assert.equal(validateParams(model, { mode: 'edit', prompt: 'Edit', image_urls: many }).ok, true);
  for (const given of [
    { prompt: ' ' }, { prompt: 'x'.repeat(20001) }, { seed: 1 }, { batch_size: 2 },
    { safety_tolerance: 4 }, { enable_prompt_expansion: true }, { output_format: 'png' },
    { sync_mode: true }, { version: 'latest' }, { image_urls: [base] },
    ...unavailableResolutions.map(resolution => ({ resolution })),
    { mode: 'edit' }, { mode: 'edit', image_urls: [] }, { mode: 'edit', image_urls: [...many, base] },
    { mode: 'edit', image_urls: [reference(t, 255, 1024)] },
    { mode: 'edit', image_urls: [reference(t, 1024, 255)] },
    { mode: 'edit', image_urls: [reference(t, 2001, 2000)] },
  ]) assert.equal(validateParams(model, { prompt: 'Generate', ...given }).ok, false, JSON.stringify(given));
  for (const resolution of model.params.resolution.values) assert.equal(validateParams(model, { prompt: 'Generate', resolution }).ok, true);
  for (const aspect_ratio of model.params.aspect_ratio.values) assert.equal(validateParams(model, { prompt: 'Generate', aspect_ratio }).ok, true);
});

test('Flux 3 elimina opciones privadas y metadatos del payload de cola', () => {
  const images = Array.from({ length: 10 }, (_, i) => `https://uploads.example/image-${i + 1}.png`);
  const params = { mode: 'edit', prompt: 'Edit image 1 using image 2', resolution: '1k', aspect_ratio: 'auto', seed: 123, num_images: 8, image_urls: ['local.png'], safety_tolerance: 4, output_format: 'png', sync_mode: true, version: 'latest', enable_prompt_expansion: true, estimated_credits: 0, width: 256, height: 256, duration_seconds: 3, provider_contract: {} };
  assert.deepEqual(buildPayload(model, params, { image_urls: images }), {
    model: 'flux-3', input: { mode: 'edit', prompt: params.prompt, resolution: '1k', aspect_ratio: 'auto', image_urls: images },
  });
  assert.deepEqual(buildPayload(model, { ...params, mode: 't2i' }, { image_urls: images }).input, { mode: 't2i', prompt: params.prompt, resolution: '1k', aspect_ratio: 'auto' });
  assert.throws(() => buildPayload(model, params, { image_urls: [...images, 'https://uploads.example/extra.png'] }), /imágenes subidas/);
  assert.throws(() => buildPayload(model, params, {}), /imágenes subidas/);
});

test('Flux 3 recupera images[].url y un completado vacío sigue recuperable', async () => {
  const previousFetch = globalThis.fetch;
  const replies = [{ status: 'COMPLETED', images: [{ url: 'https://results.example/flux.png' }] }, { status: 'COMPLETED', images: [] }];
  globalThis.fetch = async () => new Response(JSON.stringify({ code: 200, data: replies.shift() }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    assert.deepEqual(await check(model, { providerRequestId: 'existing' }), { status: 'success', urls: ['https://results.example/flux.png'] });
    assert.deepEqual(await check(model, { providerRequestId: 'existing' }), { status: 'pending', recoveryRequired: true });
  } finally { globalThis.fetch = previousFetch; }
});

async function statusFixture(t, { modelId = 'flux-3', historyModelId = modelId, receipt = false, stored = false, empty = false, partial = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-image-queue-'));
  const config = path.join(dir, 'config');
  const credentials = path.join(dir, 'credentials');
  const taskId = 'fal:existing';
  const receiptPath = path.join(config, 'tasks', crypto.createHash('sha256').update(taskId).digest('hex') + '.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'T'.repeat(48));
  if (receipt) fs.writeFileSync(receiptPath, JSON.stringify({ task_id: taskId, model_id: modelId, completed_at: null, task_ref: { serverTaskId: taskId, costTaskId: taskId, providerRequestId: 'existing' } }));
  const calls = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    const url = new URL(req.url, base);
    calls.push({ path: url.pathname, action: body.action });
    const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    if (url.pathname.startsWith('/result-')) { res.setHeader('Content-Type', 'image/png'); return res.end(png); }
    if (url.pathname === '/missing.png') { res.writeHead(404); return res.end(); }
    if (url.pathname === '/api/wallet/api.php') return json(body.action === 'task_costs' ? { ok: true, costs: { [taskId]: 13 } } : { ok: true, balance: 1000, user: { tier: 'hub' } });
    const count = modelId === 'ideogram-v45' ? 8 : 1;
    const urls = empty ? [] : Array.from({ length: count }, (_, i) => base + `result-${i}.png`);
    if (partial && urls.length) urls[urls.length - 1] = base + 'missing.png';
    if (url.pathname === '/api/v1/skill/task.php') return json({ ok: true, task: { task_id: taskId, model_id: historyModelId, state: stored ? 'success' : 'pending', charged_credits: stored ? 13 : null, result_urls: stored ? urls : [] } });
    if (url.pathname === '/api/wallet/fal-gateway.php') {
      assert.equal(body.action, 'status', 'Recuperar nunca crea una generación');
      assert.equal(body.request_id, 'existing');
      return json({ code: 200, data: { status: 'COMPLETED', images: urls.map(url => ({ url })) } });
    }
    res.writeHead(404); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
  let result;
  try {
    result = await execute(process.execPath, [path.join(root, 'skills/ailab/scripts/ailab.mjs'), 'status', taskId], { timeout: 10000, env: { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: catalogPath, AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_OUTPUT_DIR: path.join(dir, 'out') } });
    result.code = 0;
  } catch (error) { result = error; }
  return { result, calls, receiptPath };
}

for (const modelId of ['flux-3', 'ideogram-v45']) {
  test(modelId + ': status sin recibo local recupera todas las imágenes sin regenerar', async t => {
    const h = await statusFixture(t, { modelId });
    assert.equal(h.result.code, 0, h.result.stdout + h.result.stderr);
    assert.equal((h.result.stdout.match(/Guardado:/g) || []).length, modelId === 'flux-3' ? 1 : 8);
    assert.equal(h.calls.filter(call => call.action === 'submit').length, 0);
  });
  test(modelId + ': historial terminado evita otra consulta al proveedor', async t => {
    const h = await statusFixture(t, { modelId, receipt: true, stored: true });
    assert.equal(h.result.code, 0, h.result.stdout + h.result.stderr);
    assert.equal(h.calls.filter(call => call.path.endsWith('fal-gateway.php')).length, 0);
  });
}

for (const historyModelId of ['flux-3-t2i', 'flux-3-edit', 'ideogram-v45-t2i', 'ideogram-v45-edit']) {
  test(historyModelId + ': recupera la ruta interna mediante un alias exacto', async t => {
    const modelId = historyModelId.startsWith('flux-3-') ? 'flux-3' : 'ideogram-v45';
    const h = await statusFixture(t, { modelId, historyModelId });
    assert.equal(h.result.code, 0, h.result.stdout + h.result.stderr);
    assert.match(h.result.stdout, /Tarea recuperada/);
    assert.equal(h.calls.filter(call => call.action === 'submit').length, 0);
  });
}

test('una ruta de historial desconocida no se convierte por coincidencia de prefijo', async t => {
  const h = await statusFixture(t, { historyModelId: 'flux-3-untrusted' });
  assert.notEqual(h.result.code, 0);
  assert.match(h.result.stderr, /no tiene un contrato publico recuperable/);
  assert.equal(h.calls.filter(call => call.path.endsWith('fal-gateway.php')).length, 0);
});

test('la cola completada sin URL conserva el ID y no afirma fallo ni gratuidad', async t => {
  const h = await statusFixture(t, { receipt: true, empty: true });
  assert.notEqual(h.result.code, 0);
  assert.match(h.result.stdout, /no vuelvas a generar/);
  assert.doesNotMatch(h.result.stdout, /La generacion fallo|sin cargo/);
  assert.equal(JSON.parse(fs.readFileSync(h.receiptPath)).completed_at, null);
});

test('Ideogram conserva el recibo cuando falta una descarga del lote', async t => {
  const h = await statusFixture(t, { modelId: 'ideogram-v45', receipt: true, partial: true });
  assert.notEqual(h.result.code, 0);
  assert.match(h.result.stdout, /faltan archivos por descargar/);
  assert.equal(JSON.parse(fs.readFileSync(h.receiptPath)).completed_at, null);
});

async function prepareFixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-image-plan-'));
  const config = path.join(dir, 'config');
  const credentials = path.join(dir, 'credentials');
  const localCatalog = path.join(dir, 'catalog.json');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'T'.repeat(48));
  fs.writeFileSync(localCatalog, JSON.stringify(catalog));
  const calls = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    calls.push({ path: req.url, action: body.action });
    if (req.url === '/api/wallet/api.php' && body.action === 'me') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, balance: 10000, user: { tier: 'hub' } }));
    }
    res.writeHead(500); res.end('Unexpected request in no-spend test');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
  const run = async args => {
    try {
      const result = await execute(process.execPath, [path.join(root, 'skills/ailab/scripts/ailab.mjs'), ...args], { timeout: 10000, env: { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: localCatalog, AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base } });
      return { ...result, code: 0 };
    } catch (error) { return error; }
  };
  return { config, localCatalog, calls, run };
}

for (const modelId of ['flux-3', 'ideogram-v45']) {
  test(modelId + ': prepare congela el coste y submit exige autorización sin tocar el proveedor', async t => {
    const h = await prepareFixture(t);
    const args = ['prepare', modelId, '--prompt', 'One image'];
    if (modelId === 'ideogram-v45') args.push('--quality', 'high', '--num_images', '8');
    const planned = await h.run(args);
    assert.equal(planned.code, 0, planned.stdout + planned.stderr);
    const manifestId = planned.stdout.match(/Manifiesto: ([a-f0-9-]+)/)?.[1];
    assert.ok(manifestId);
    const manifest = JSON.parse(fs.readFileSync(path.join(h.config, 'manifests', manifestId + '.json')));
    const expected = modelId === 'ideogram-v45' ? 352 : estimateCredits(model, { resolution: '1k' }).credits;
    assert.equal(manifest.estimated_credits, expected);
    assert.equal(manifest.max_credits_authorized, expected);
    const denied = await h.run(['submit', manifestId]);
    assert.notEqual(denied.code, 0);
    assert.match(denied.stderr, /Falta la confirmacion/);
    const overCeiling = await h.run(['submit', manifestId, '--confirmed', '--max-credits', String(expected - 1)]);
    assert.notEqual(overCeiling.code, 0);
    assert.match(overCeiling.stderr, /supera el máximo/);
    const changed = JSON.parse(fs.readFileSync(h.localCatalog));
    changed.models[modelId].estimate.note += ' New contract';
    fs.writeFileSync(h.localCatalog, JSON.stringify(changed));
    const stale = await h.run(['submit', manifestId, '--confirmed']);
    assert.notEqual(stale.code, 0);
    assert.match(stale.stderr, /contrato o el precio/);
    assert.equal(h.calls.filter(call => call.action !== 'me').length, 0);
  });
}

for (const modelId of ['flux-3', 'ideogram-v45']) {
  test(modelId + ': prepare y validate de edición conservan referencias ordenadas sin subirlas', async t => {
    const h = await prepareFixture(t);
    const images = [reference(t, 256, 256), reference(t, 512, 256)];
    const options = ['--mode', 'edit', '--prompt', 'Edit image 1 using image 2', ...images.flatMap(file => ['--image_urls', file])];
    if (modelId === 'flux-3') options.push('--aspect_ratio', 'auto');
    else options.push('--image_size', 'auto', '--edit_precision', 'high', '--quality', 'very_low', '--num_images', '8');
    const validated = await h.run(['validate', modelId, ...options]);
    assert.equal(validated.code, 0, validated.stdout + validated.stderr);
    assert.equal(h.calls.length, 0, 'validate no consulta cuenta ni proveedor');
    const planned = await h.run(['prepare', modelId, ...options]);
    assert.equal(planned.code, 0, planned.stdout + planned.stderr);
    const manifestId = planned.stdout.match(/Manifiesto: ([a-f0-9-]+)/)?.[1];
    const manifest = JSON.parse(fs.readFileSync(path.join(h.config, 'manifests', manifestId + '.json')));
    assert.equal(manifest.params.mode, 'edit');
    assert.deepEqual(manifest.files.map(file => file.path), images.map(file => fs.realpathSync(file)));
    assert.deepEqual(manifest.files.map(file => file.param), ['image_urls', 'image_urls']);
    assert.equal(manifest.estimated_credits, modelId === 'ideogram-v45' ? 13 : estimateCredits(model, { resolution: '1k' }).credits);
    assert.equal(h.calls.filter(call => call.action !== 'me').length, 0, 'prepare no sube ni genera');
  });
}

test('Ideogram aplica el techo explícito al coste agregado de prepare', async t => {
  const h = await prepareFixture(t);
  const denied = await h.run(['prepare', 'ideogram-v45', '--prompt', 'Eight edits', '--quality', 'high', '--num_images', '8', '--max-credits', '351']);
  assert.notEqual(denied.code, 0);
  assert.match(denied.stderr, /352 cr.*351/);
  assert.equal(h.calls.length, 0, 'Rechaza antes de consultar cuenta o proveedor');
});
