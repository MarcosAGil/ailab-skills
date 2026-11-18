// Precio opaco por cuenta e historial (skill 2.5.0, contrato «precio-opaco-historial-2026-11-18», secciones 3, 4, 6,
// 8 y 9). Sin coste: la CLI real habla con un falso servidor AILAB en localhost. Comprueba que la CLI no calcula
// ningún precio (todo importe sale de price.php), que no guarda nada de precio, que el 402 `price_changed` se muestra
// tal cual, que el proyecto viaja en su cabecera y que `proyectos` y `proyecto <id>` muestran el historial.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { handlePrice, estimates, priceResponse } from './helpers/price-server.mjs';

const execute = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills/ailab');
const CLI = path.join(SKILL, 'scripts/ailab.mjs');
const CATALOG_FILE = path.join(SKILL, 'catalog/catalog.json');
const CATALOG = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-account-price-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_BASE_URL = 'http://127.0.0.1:9/';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

const account = await import('../skills/ailab/scripts/lib/account.mjs');
const price = await import('../skills/ailab/scripts/lib/price.mjs');
const { CLI_VERSION, PRICE_ENDPOINT } = await import('../skills/ailab/scripts/lib/config.mjs');
const { modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
const FUTURE = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const CLIENT = { label: 'cliente', require_project: false, min_client: '2.5.0' };
const MEMBER = { label: 'miembro', require_project: false, min_client: '2.5.0' };
const UNAVAILABLE = 'No se ha podido obtener el precio de AILAB. No se ha enviado nada.';
const PRICE_CHANGED = 'El precio de tu cuenta ha cambiado desde la cotización. Prepara de nuevo. No se ha cobrado nada.';

// ---------------------------------------------------------------------------------------------------------------
// Unidades

test('me.pricing: etiqueta y require_project; sin campo es miembro; cualquier factor que mande un servidor se ignora', () => {
  assert.deepEqual(account.accountInfo({}).account, { label: 'miembro', require_project: false, min_client: null });
  assert.deepEqual(account.accountInfo({ pricing: CLIENT }).account, CLIENT);
  const legacy = account.accountInfo({ pricing: { label: 'cliente', factor: 1.2, rounding: 'ceil', require_project: true } });
  assert.deepEqual(legacy.account, { label: 'cliente', require_project: true, min_client: null });
  assert.equal(JSON.stringify(legacy).includes('factor'), false);
  assert.equal(account.accountInfo({ pricing: 'x' }).ok, false);
  assert.equal(account.accountInfo({ pricing: [] }).ok, false);
});

test('--proyecto: formato del contrato, una sola vez, nunca entre las opciones; flow open no admite el uso general', () => {
  assert.deepEqual(account.takeProject({ proyecto: '06_super-cremita', prompt: 'x' }), { ok: true, project: '06_super-cremita', rest: { prompt: 'x' } });
  assert.equal(account.takeProject({}).project, null);
  for (const bad of ['super cremita', 'a'.repeat(65), 'ñu', true, ['06', '07']]) assert.equal(account.takeProject({ proyecto: bad }).ok, false, String(bad));
  assert.equal(account.checkProject('sin_proyecto').ok, true);
  assert.equal(account.checkProject('sin_proyecto', { general: false }).ok, false);
  assert.equal(account.projectProblem({ require_project: true }, null), account.PROJECT_REQUIRED_TEXT);
  assert.equal(account.projectProblem({ require_project: true }, '06'), null);
  assert.equal(account.projectProblem({ require_project: false }, null), null);
});

test('la caché de precio de la 2.4.0 se borra en silencio y no se vuelve a crear', () => {
  const dir = process.env.AILAB_CONFIG_DIR;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'account-pricing.json');
  fs.writeFileSync(file, JSON.stringify({ factor: 1.2 }));
  account.removeLegacyAccountCache();
  assert.equal(fs.existsSync(file), false);
  account.removeLegacyAccountCache();
});

test('price.php: los archivos viajan como medidas, sin ruta ni hash; un fallo sin respuesta útil es siempre el mismo texto', async (t) => {
  const image = path.join(temporary, 'referencia.png');
  const bytes = Buffer.from(PNG); bytes.writeUInt32BE(1920, 16); bytes.writeUInt32BE(1080, 20);
  fs.writeFileSync(image, bytes);
  const params = price.priceParams({ prompt: 'x', image_urls: [image] }, { image_urls: [image] });
  assert.equal(params.prompt, 'x');
  assert.equal(params.image_urls.length, 1);
  assert.equal(params.image_urls[0].ok, true);
  assert.equal(params.image_urls[0].width, 1920);
  assert.equal(params.image_urls[0].height, 1080);
  assert.equal(JSON.stringify(params).includes(temporary), false);
  assert.equal(JSON.stringify(params).includes('referencia'), false);
  assert.deepEqual(price.measureFile(path.join(temporary, 'no-existe.png')), { ok: false });

  assert.equal(price.priceFailure({ kind: 'network' }), UNAVAILABLE);
  assert.equal(price.priceFailure({ kind: 'server_error', message: 'boom' }), UNAVAILABLE);
  assert.equal(price.priceFailure({ kind: 'bad_request', message: 'Resolución no válida. No se ha cobrado nada.' }), 'Resolución no válida. No se ha cobrado nada.');
  assert.equal(price.priceFailure({ kind: 'bad_request', message: 'Resolución no válida.' }), 'Resolución no válida. No se ha enviado nada.');

  assert.equal(PRICE_ENDPOINT, 'http://127.0.0.1:9/api/v1/skill/price.php');
  const state = { prices: { 'nano-banana-2': 14, 'krea-3': { credits: null, server_quote: true, note: 'Cotiza el servidor.' } } };
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => priceResponse(state, url, init) || new Response('{}', { status: 404 });
  t.after(() => { globalThis.fetch = original; });
  const nb2 = await price.priceEstimate('nano-banana-2', { prompt: 'x' });
  assert.deepEqual(nb2, { ok: true, price: { credits: 14, approximate: false, note: '', expensive: false, server_quote: false, max_credits: null } });
  const krea = await price.priceEstimate('krea-3', { prompt: 'x' });
  assert.equal(krea.price.server_quote, true);
  assert.equal(krea.price.credits, null);
  state.prices['nano-banana-2'] = { credits: 1.5 };
  assert.deepEqual(await price.priceEstimate('nano-banana-2', {}), { ok: false, error: UNAVAILABLE, response: (await price.priceEstimate('nano-banana-2', {})).response });
  state.priceInfo = { 'nano-banana-2': ['Precio de tu cuenta: 14 cr por imagen.'] };
  assert.deepEqual(await price.priceInfo('nano-banana-2'), { ok: true, lines: ['Precio de tu cuenta: 14 cr por imagen.'] });
  state.priceInfo = { 'nano-banana-2': 'no es una lista' };
  assert.equal((await price.priceInfo('nano-banana-2')).ok, false);
  state.assistantPrices = { assistants: { a: { estimated_credits: 20, max_authorized_credits: 10 } }, billing: { max_authorized_credits: 160 } };
  assert.equal((await price.priceAssistants()).ok, false, 'un máximo menor que la estimación no es válido');
  state.priceDown = true;
  assert.equal((await price.priceAssistants()).error, UNAVAILABLE);
  assert.deepEqual(state.priceRequests[0], { action: 'estimate', model: 'nano-banana-2', params: { prompt: 'x' } });
});

test('cabeceras con fetch simulado: toda llamada a AILAB, price.php incluido, lleva X-AILAB-Client; X-AILAB-Proyecto solo con proyecto', async (t) => {
  fs.mkdirSync(process.env.AILAB_CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(path.join(process.env.AILAB_CREDENTIALS_DIR, 'token'), 'ailp_' + 'F'.repeat(48), { mode: 0o600 });
  const httpLib = await import('../skills/ailab/scripts/lib/http.mjs');
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (init.body && typeof init.body[Symbol.asyncIterator] === 'function') { for await (const _ of init.body) { /* consumir */ } }
    seen.push({ url: String(url), headers: { ...(init.headers || {}) } });
    return new Response(JSON.stringify({ ok: true, url: 'https://x.test/a.png' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = original; httpLib.setRequestProject(null); });
  const calls = async () => {
    await httpLib.apiPost({ action: 'me' });
    await httpLib.pricePost({ action: 'info', model: 'nano-banana-2' });
    await httpLib.gatewayPost('/jobs/createTask', {});
    await httpLib.servicePost('api/skill/higgsfield.php?action=quote', {});
    await httpLib.assistantPost({ action: 'capabilities' });
    await httpLib.flowsPost({ action: 'status' });
    await httpLib.uploadFile(PNG, 'a.png', 'image/png');
  };
  await calls();
  assert.equal(seen.length, 7);
  assert.ok(seen.some((call) => call.url === PRICE_ENDPOINT));
  for (const call of seen) {
    assert.equal(call.headers['X-AILAB-Client'], 'ailab-cli/' + CLI_VERSION, call.url);
    assert.equal(call.headers['X-AILAB-Proyecto'], undefined, call.url);
    assert.ok(call.headers.Authorization || call.headers['X-Ailendra-Token'], 'price.php va autenticado: ' + call.url);
  }
  seen.length = 0;
  httpLib.setRequestProject('06');
  await calls();
  for (const call of seen) assert.equal(call.headers['X-AILAB-Proyecto'], '06', call.url);
});

test('el 402 price_changed se reconoce por error_code (gateways) o code (api.php) y se muestra con el texto del servidor', () => {
  return import('../skills/ailab/scripts/lib/http.mjs').then(({ explain, errorCode }) => {
    const gateway = { ok: false, kind: 'price_changed', httpStatus: 402, message: 'Payment Required', raw: { code: 402, msg: 'Payment Required', error_code: 'price_changed', message: PRICE_CHANGED, credits: 17 } };
    assert.equal(errorCode(gateway), 'price_changed');
    assert.equal(explain(gateway), PRICE_CHANGED);
    const custom = { ...gateway, raw: { ...gateway.raw, message: 'Otro texto del servidor. No se ha cobrado nada.' } };
    assert.equal(explain(custom), 'Otro texto del servidor. No se ha cobrado nada.');
    const apiStyle = { ok: false, kind: 'price_changed', httpStatus: 402, message: PRICE_CHANGED, raw: { ok: false, code: 'price_changed', error: PRICE_CHANGED } };
    assert.equal(explain(apiStyle), PRICE_CHANGED);
    assert.equal(explain({ ok: false, kind: 'price_changed', httpStatus: 402, message: '', raw: { code: 402, error_code: 'price_changed' } }), PRICE_CHANGED);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Falso servidor y CLI real

const ASSISTANTS = {
  schema_version: 3, catalog_version: '3.0.0', min_cli_version: '2.5.0',
  billing: { type: 'actual_usage' },
  default_model: 'gemini-3-5-flash-lite-priority',
  assistants: { 'image-prompter': { label: 'Image Prompter', description: 'Imagen.', prompt_version: 'test', prompt_sha256: 'a'.repeat(64) } },
  models: { 'gemini-3-5-flash-lite-priority': { label: 'Gemini 3.5 Flash Lite', vendor: 'OpenRouter', accepts_images: true, accepts_audio: true, accepts_video: true } },
};

// Formas finales del servidor (sección 8 y notas de la sección 12 del contrato).
const PROJECTS = {
  ok: true,
  projects: [
    { key: '06_super-cremita', label: '06_super-cremita', number: 6, origin: ['plugin', 'kit'], status: 'abierto', first_at: '2026-11-17 10:00', last_at: '2026-11-18 12:00', closed_at: null, final_seconds: null, generations: 4, credits: 372, note: null },
    { key: '03_luismi', label: '03_luismi', number: 3, origin: ['registro'], status: 'cerrado', first_at: '2026-10-01 09:00', last_at: '2026-10-03 18:00', closed_at: '2026-10-03 18:00', final_seconds: 41.5, generations: 9, credits: 980, note: null },
    { key: 'sin_proyecto', label: 'Uso general', number: null, origin: [], status: null, first_at: '2026-11-01 08:00', last_at: '2026-11-18 09:00', closed_at: null, final_seconds: null, generations: 1, credits: 12, note: null },
  ],
  total_credits: 1364, balance: 4321, pricing: CLIENT,
};
const PROJECT = {
  ok: true,
  project: PROJECTS.projects[0],
  items: [
    { id: 't-1', task_id: 't-1', kind: 'generacion', model: 'nano-banana-2', label: 'Nano Banana 2', duration_s: null, credits: 12, created_at: '2026-11-17 10:00', state: 'success', params_summary: { resolution: '2K', prompt: 'PROMPT-SECRETO' } },
    { id: 'a'.repeat(32), kind: 'toma', model: 'toma', label: 'Toma', duration_s: 8, credits: 240, created_at: '2026-11-18 11:00', state: 'completado', code: 'NOV26-07', take: 2, version: 1, file_ids: ['b'.repeat(32), 'no-es-un-id'] },
    { id: 'registro-4', kind: 'registro', model: null, label: null, duration_s: 30, credits: 120, created_at: '2026-11-18 12:00', state: 'registrado' },
  ],
  videos: [{ code: 'NOV26-07', case: 'servicio-empresas', title: 'Super cremita', status: 'abierto', opened_at: '2026-11-18 10:30', closed_at: null, references: 3 }],
  closes: [{ code: 'NOV26-07', revision: 1, final_seconds: 32.5, used_takes: [{ take: 1, version: 2 }, { take: 2, version: 1 }], closed_at: '2026-11-18 12:30' }],
};

async function harness(t, initial = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-account-cli-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'P'.repeat(48), { mode: 0o600 });
  const state = { pricing: undefined, balance: 100000, createFailure: null, prices: { 'nano-banana-2': 14 }, ...initial };
  const requests = [];
  let base;
  const json = (res, body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks);
      let body = {};
      try { body = raw.length ? JSON.parse(raw.toString('utf8')) : {}; } catch { body = { multipart: true }; }
      requests.push({ method: req.method, pathname: url.pathname, search: url.search, body, headers: req.headers });
      if (handlePrice(state, url.pathname, body, res)) return;
      if (url.pathname === '/assets/out.png') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(PNG); }
      if (url.pathname === '/api/v1/skill/assistants-v3.json') return json(res, ASSISTANTS);
      if (url.pathname === '/api/v1/skill/assistant.php') {
        if (body.action === 'capabilities') return json(res, { ok: true, limits: { max_attachments: 50, max_by_kind: { image: 50, audio: 2, video: 2 }, max_bytes: { image: 10485760, audio: 20971520, video: 33554432 }, max_total_bytes: 50331648, max_inline_bytes: 37748736 } });
        if (state.assistantFailure) return json(res, state.assistantFailure.body, state.assistantFailure.status);
        return json(res, { ok: true, message: { role: 'assistant', content: 'Prompt mejorado.' }, charged_credits: 13, balance: 999 });
      }
      if (url.pathname === '/api/wallet/api.php') {
        if (body.action === 'me' && state.flowsOnly) return json(res, { ok: false, error: 'Esta cuenta solo puede usar sus flujos.' }, 403);
        if (body.action === 'me') return json(res, { ok: true, user: { email: 'cuenta@example.test', tier: 'hub' }, balance: state.balance, ...(state.pricing === undefined ? {} : { pricing: state.pricing }) });
        if (body.action === 'task_costs') return json(res, { ok: true, costs: {} });
        if (body.action === 'projects') return json(res, PROJECTS);
        if (body.action === 'project') {
          if (body.project !== '06_super-cremita') return json(res, { ok: false, code: 'project_not_found', error: 'Ese proyecto no existe en tu cuenta.' }, 404);
          return json(res, PROJECT);
        }
        if (body.action === 'project_close') return json(res, { ok: true, project: { ...PROJECTS.projects[0], status: 'cerrado', final_seconds: body.final_seconds ?? null }, items: [] });
        return json(res, { ok: false, error: 'acción desconocida' }, 400);
      }
      if (url.pathname === '/api/wallet/gateway.php') {
        const route = url.searchParams.get('path') || '';
        if (route.startsWith('/jobs/createTask')) {
          if (state.createFailure) return json(res, state.createFailure.body, state.createFailure.status);
          return json(res, { code: 200, msg: 'ok', data: { taskId: 'task-' + requests.length } });
        }
        if (route.startsWith('/jobs/recordInfo')) return json(res, { code: 200, msg: 'ok', data: { state: 'success', resultJson: JSON.stringify({ resultUrls: [base + 'assets/out.png'] }) } });
      }
      if (url.pathname === '/api/skill/higgsfield.php') {
        const action = url.searchParams.get('action');
        if (action === 'quote') return json(res, { ok: true, code: 200, msg: 'ok', data: { quote_id: crypto.randomBytes(16).toString('hex'), credits: state.higgsfieldCredits || 60, billable_seconds: 1, max_credits_authorized: body.max_credits_authorized, hard_cap_credits: 1200, expires_at: FUTURE() } });
        if (action === 'create') return json(res, { ok: true, code: 200, msg: 'ok', data: { taskId: 'hf-1' } });
        if (action === 'status') return json(res, { ok: true, code: 200, msg: 'ok', data: { status: 'COMPLETED', urls: [base + 'assets/out.png'] } });
      }
      if (url.pathname === '/api/v1/flows/index.php' && body.action === 'status') return json(res, { ok: true, month: '2026-11', balance_cr: 5000, limit_cr: 0, spent_month_cr: 0, remaining_month_cr: 0, videos_month: 0, paused: false });
      json(res, { error: 'unexpected request ' + req.url }, 404);
    } catch (error) { json(res, { error: error.message }, 500); }
  });
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  const env = {
    ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_POLL_MS: '5', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
    AILAB_CATALOG_PATH: CATALOG_FILE, AILAB_OUTPUT_DIR: path.join(temp, 'out'), AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials,
  };
  delete env.AILAB_ASSISTANTS_URL; delete env.AILAB_ASSISTANT_ENDPOINT; delete env.AILAB_PRICE_ENDPOINT;
  const run = async (args, extraEnv = {}) => {
    try { return { code: 0, ...(await execute(process.execPath, [CLI, ...args], { env: { ...env, ...extraEnv }, timeout: 60000 })) }; }
    catch (error) { return { code: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; }
  };
  const manifestOf = (stdout) => {
    const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
    assert.ok(id, 'sin manifiesto:\n' + stdout);
    return { id, ...JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8')) };
  };
  const writeManifest = (manifest) => fs.writeFileSync(path.join(config, 'manifests', manifest.id + '.json'), JSON.stringify(manifest));
  const creates = () => requests.filter((r) => r.pathname === '/api/wallet/gateway.php' && /createTask/.test(r.search));
  const uploads = () => requests.filter((r) => /upload/.test(r.pathname + r.search));
  return { state, requests, run, manifestOf, writeManifest, creates, uploads, temp, config, credentials, base, env };
}

const NB2 = ['prepare', 'nano-banana-2', '--prompt', 'Un frasco de crema sobre mármol', '--resolution', '2K'];
const priceFiles = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => /pricing|price/.test(name)) : [];

test('prepare pide el precio a price.php, el manifiesto lo congela sin factor y submit envía ese importe sin volver a pedirlo', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  fs.mkdirSync(h.config, { recursive: true });
  fs.writeFileSync(path.join(h.config, 'account-pricing.json'), JSON.stringify({ factor: 1.2, label: 'cliente' }));
  const planned = await h.run(NB2);
  assert.equal(planned.code, 0, planned.stderr);
  assert.equal(fs.existsSync(path.join(h.config, 'account-pricing.json')), false, 'la caché de la 2.4.0 se borra al arrancar');
  assert.match(planned.stdout, /Estimacion: ~14 cr/);
  const asked = estimates(h.state);
  assert.equal(asked.length, 1);
  assert.equal(asked[0].model, 'nano-banana-2');
  assert.equal(asked[0].params.prompt, 'Un frasco de crema sobre mármol');
  assert.equal(asked[0].params.resolution, '2K');
  const priceCall = h.requests.find((r) => r.pathname === '/api/v1/skill/price.php');
  assert.equal(priceCall.method, 'POST');
  assert.equal(priceCall.headers['x-ailab-client'], 'ailab-cli/' + CLI_VERSION);
  assert.match(priceCall.headers.authorization || '', /^Bearer ailp_/);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.estimated_credits, 14);
  assert.equal(manifest.max_credits_authorized, 14);
  assert.equal(manifest.server_quote, false);
  for (const key of ['price_factor', 'base_credits', 'factor']) assert.equal(manifest[key], undefined, key);
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  assert.equal(h.creates().length, 1);
  assert.equal(h.creates()[0].body.max_credits_authorized, 14);
  assert.equal(estimates(h.state).length, 1, 'submit nunca vuelve a pedir el precio');
  assert.deepEqual(priceFiles(h.config), [], 'la CLI no guarda ningún precio');
});

test('un servidor que aún manda factor en `me` no cambia nada: el importe es siempre el de price.php', async (t) => {
  const h = await harness(t, { pricing: { label: 'cliente', factor: 1.2, rounding: 'ceil', require_project: false }, prices: { 'nano-banana-2': 17 } });
  const planned = await h.run(NB2);
  assert.equal(planned.code, 0, planned.stderr);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.estimated_credits, 17);
  assert.doesNotMatch(planned.stdout, /factor|miembro|1,2|1\.2/);
});

test('todas las familias: prepare congela el importe que da price.php para cada modelo, sin listas de modelos en la CLI', async (t) => {
  const h = await harness(t, { prices: {}, defaultCredits: 37 });
  const drivers = new Set();
  let compared = 0;
  for (const [id, model] of Object.entries(CATALOG.models)) {
    if (!modelUsable(model).ok) continue;
    const required = Object.entries(model.params || {}).filter(([, spec]) => spec.required);
    if (required.some(([, spec]) => spec.type !== 'string')) continue;
    const args = ['prepare', id, ...required.flatMap(([key]) => ['--' + key, key.startsWith('voice_id') ? 'voz-' + key : 'Un frasco de crema sobre mármol'])];
    const before = estimates(h.state).length;
    const planned = await h.run(args);
    if (planned.code !== 0) continue;
    const asked = estimates(h.state).slice(before);
    assert.equal(asked.length, 1, id);
    assert.equal(asked[0].model, id);
    const manifest = h.manifestOf(planned.stdout);
    assert.equal(manifest.estimated_credits, 37, id);
    assert.equal(manifest.max_credits_authorized, 37, id);
    drivers.add(model.driver);
    compared += 1;
  }
  assert.ok(compared >= 30, 'solo se compararon ' + compared + ' modelos');
  for (const driver of ['jobs-v1', 'labs-queue-v1', 'labs-queue-multi-v1', 'eleven-v1', 'suno-v1', 'veo-v1', 'hybrid-seedream-v1']) assert.ok(drivers.has(driver), 'falta la familia ' + driver);
});

test('price.php no responde: prepare falla con el texto del contrato sin subir ni enviar; info sale con 1; validate sigue validando', async (t) => {
  const h = await harness(t, { priceDown: true });
  const image = path.join(h.temp, 'ref.png');
  fs.writeFileSync(image, PNG);
  for (const args of [NB2, ['prepare', 'nano-banana-2', '--prompt', 'x', '--image_urls', image]]) {
    const failed = await h.run(args);
    assert.notEqual(failed.code, 0);
    assert.match(failed.stderr, new RegExp(UNAVAILABLE.replace(/\./g, '\\.')));
  }
  assert.equal(h.creates().length, 0);
  assert.equal(h.uploads().length, 0);
  assert.equal(fs.existsSync(path.join(h.config, 'manifests')) ? fs.readdirSync(path.join(h.config, 'manifests')).length : 0, 0);
  const info = await h.run(['info', 'nano-banana-2']);
  assert.equal(info.code, 1);
  assert.match(info.stdout, /Parametros:/);
  assert.match(info.stdout + info.stderr, /No se ha podido obtener el precio de AILAB/);
  const validated = await h.run(['validate', 'nano-banana-2', '--prompt', 'x']);
  assert.equal(validated.code, 0, validated.stderr);
  assert.match(validated.stdout, /parametros validos · precio no disponible ahora/);
  // El servidor se cae con un 500 sin JSON, o responde con datos que no son un precio: el mismo texto.
  h.state.priceDown = false;
  h.state.prices = { 'nano-banana-2': { credits: -3 } };
  const invalid = await h.run(NB2);
  assert.match(invalid.stderr, /No se ha podido obtener el precio de AILAB\. No se ha enviado nada\./);
});

test('price.php rechaza unos parámetros: se muestra su mensaje y no se envía nada', async (t) => {
  const h = await harness(t, { priceError: { status: 400, body: { ok: false, code: 'invalid_params', error: 'Esa resolución no tiene tarifa. No se ha cobrado nada.' } } });
  const failed = await h.run(NB2);
  assert.notEqual(failed.code, 0);
  assert.match(failed.stderr, /Esa resolución no tiene tarifa\. No se ha cobrado nada\./);
  assert.equal(h.creates().length, 0);
});

test('--max-credits y el manifiesto: el techo se compara con el importe del servidor y un manifiesto manipulado no se envía', async (t) => {
  const h = await harness(t, { prices: { 'nano-banana-2': 20 } });
  const below = await h.run([...NB2, '--max-credits', '19']);
  assert.notEqual(below.code, 0);
  assert.match(below.stderr, /El coste \(20 cr\) supera el máximo que autorizaste \(--max-credits 19\)\. No se ha enviado nada\./);
  const planned = await h.run([...NB2, '--max-credits', '20']);
  assert.equal(planned.code, 0, planned.stderr);
  const manifest = h.manifestOf(planned.stdout);
  const ceiling = await h.run(['submit', manifest.id, '--confirmed', '--max-credits', '19']);
  assert.notEqual(ceiling.code, 0);
  h.writeManifest({ ...manifest, estimated_credits: 5 });
  const tampered = await h.run(['submit', manifest.id, '--confirmed']);
  assert.notEqual(tampered.code, 0);
  assert.match(tampered.stderr, /no coincide con el plan confirmado/);
  h.writeManifest({ ...manifest, estimated_credits: 1.5, max_credits_authorized: 1.5 });
  assert.notEqual((await h.run(['submit', manifest.id, '--confirmed'])).code, 0);
  assert.equal(h.creates().length, 0);
});

test('el precio cambia entre prepare y submit: el 402 price_changed del servidor se muestra tal cual, sin hablar de saldo ni de envío ambiguo', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const cases = [
    [402, { code: 402, msg: 'Payment Required', error_code: 'price_changed', message: PRICE_CHANGED, credits: 17 }, PRICE_CHANGED],
    [402, { ok: false, code: 'price_changed', error: 'El precio de tu cuenta ha subido. Prepara de nuevo. No se ha cobrado nada.' }, 'El precio de tu cuenta ha subido. Prepara de nuevo. No se ha cobrado nada.'],
  ];
  for (const [status, body, expected] of cases) {
    const manifest = h.manifestOf((await h.run(NB2)).stdout);
    h.state.createFailure = { status, body };
    const rejected = await h.run(['submit', manifest.id, '--confirmed']);
    assert.notEqual(rejected.code, 0);
    assert.ok(rejected.stderr.includes(expected), rejected.stderr);
    assert.doesNotMatch(rejected.stderr, /Recarga en|ambiguo|Saldo insuficiente/);
    h.state.createFailure = null;
  }
});

test('cabeceras: X-AILAB-Proyecto en price.php, la cotización y el envío con --proyecto; nunca en el cuerpo ni en los params', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const planned = await h.run([...NB2, '--proyecto', '06_super-cremita']);
  assert.equal(planned.code, 0, planned.stderr);
  assert.match(planned.stdout, /proyecto: 06_super-cremita/);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.project, '06_super-cremita');
  assert.equal(manifest.params.proyecto, undefined);
  assert.equal(estimates(h.state)[0].params.proyecto, undefined);
  assert.equal(h.requests.find((r) => r.pathname === '/api/v1/skill/price.php').headers['x-ailab-proyecto'], '06_super-cremita');
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  for (const request of h.requests.filter((r) => r.pathname.startsWith('/api/'))) {
    assert.equal(request.headers['x-ailab-client'], 'ailab-cli/' + CLI_VERSION, request.pathname + request.search);
  }
  const create = h.creates()[0];
  assert.equal(create.headers['x-ailab-proyecto'], '06_super-cremita');
  assert.equal(JSON.stringify(create.body).includes('proyecto'), false);
  assert.notEqual((await h.run(['submit', manifest.id, '--confirmed', '--proyecto', '07'])).code, 0);
  await h.run(['proyectos']);
  assert.equal(h.requests.at(-1).headers['x-ailab-proyecto'], undefined, 'sin --proyecto no hay cabecera');
});

test('Higgsfield: price.php marca la cotización del servidor y da el techo de la cuenta; la cotización lleva ese techo y el proyecto', async (t) => {
  const h = await harness(t, { pricing: CLIENT, higgsfieldCredits: 72, prices: { 'soul-2': { credits: null, server_quote: true, max_credits: 1200 } } });
  const planned = await h.run(['prepare', 'soul-2', '--prompt', 'retrato', '--proyecto', '06']);
  assert.equal(planned.code, 0, planned.stderr);
  const quote = h.requests.find((r) => r.pathname === '/api/skill/higgsfield.php' && /action=quote/.test(r.search));
  assert.equal(quote.headers['x-ailab-proyecto'], '06');
  assert.equal(quote.body.max_credits_authorized, 1200);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.estimated_credits, 72);
  assert.equal(manifest.server_quote, true);
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  const create = h.requests.find((r) => r.pathname === '/api/skill/higgsfield.php' && /action=create/.test(r.search));
  assert.equal(create.body.max_credits_authorized, 72);
  assert.equal(create.headers['x-ailab-proyecto'], '06');
  const ceiling = await h.run(['prepare', 'soul-2', '--prompt', 'retrato', '--max-credits', '71']);
  assert.notEqual(ceiling.code, 0);
  assert.match(ceiling.stderr, /\(72 cr\) supera .*71.*No se ha enviado nada/);
  assert.equal(h.requests.filter((r) => /action=quote/.test(r.search)).at(-1).body.max_credits_authorized, 71, 'el techo de la cotización es el menor');
});

test('cuenta que exige proyecto: falla en local antes de pedir precio, subir o cotizar; un proyecto no válido tampoco sale', async (t) => {
  const h = await harness(t, { pricing: { ...CLIENT, require_project: true } });
  const missing = await h.run(NB2);
  assert.notEqual(missing.code, 0);
  assert.match(missing.stderr, /Esta cuenta exige --proyecto en cada generación\. No se ha cobrado nada\./);
  assert.notEqual((await h.run(['prepare', 'soul-2', '--prompt', 'retrato'])).code, 0);
  assert.equal(estimates(h.state).length, 0);
  assert.equal(h.requests.filter((r) => r.pathname === '/api/skill/higgsfield.php').length, 0);
  const invalid = await h.run([...NB2, '--proyecto', 'super cremita']);
  assert.match(invalid.stderr, /--proyecto admite de 1 a 64 caracteres/);
  assert.equal((await h.run([...NB2, '--proyecto', '06'])).code, 0);
  assert.notEqual((await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--proyecto', 'a b'])).code, 0);
});

test('rechazos de cuenta del servidor: 426, 409 project_required y 400 invalid_project se explican sin hablar de envío ambiguo', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const cases = [
    [426, { ok: false, code: 'client_update_required', error: 'Esta cuenta necesita AILAB 2.5.0 o posterior. Ejecuta `update --confirmed`. No se ha cobrado nada.' }, /necesita AILAB 2\.5\.0 o posterior/],
    [426, { code: 426, msg: '' }, /necesita una versión más reciente de AILAB\. Ejecuta .*update --confirmed.*No se ha cobrado nada/],
    [409, { ok: false, code: 'project_required', error: 'Esta cuenta exige --proyecto en cada generación. No se ha cobrado nada.' }, /exige --proyecto/],
    [409, { code: 409, msg: '', data: { code: 'project_required' } }, /exige --proyecto en cada generación/],
    [400, { ok: false, code: 'invalid_project', error: '' }, /--proyecto no es válido/],
  ];
  for (const [status, body, expected] of cases) {
    const manifest = h.manifestOf((await h.run(NB2)).stdout);
    h.state.createFailure = { status, body };
    const rejected = await h.run(['submit', manifest.id, '--confirmed']);
    assert.notEqual(rejected.code, 0);
    assert.match(rejected.stderr, expected);
    assert.doesNotMatch(rejected.stderr, /ambiguo/);
    h.state.createFailure = null;
  }
});

test('proyectos: una fila por proyecto con número, origen, fechas, segundos finales, generaciones y créditos; Uso general al final', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const list = await h.run(['proyectos']);
  assert.equal(list.code, 0, list.stderr);
  const lines = list.stdout.split('\n');
  assert.ok(lines.includes('Proyectos de tu cuenta (2):'), list.stdout);
  assert.ok(lines.includes('  06 · 06_super-cremita · plugin + kit · abierto · 2026-11-17 10:00 a 2026-11-18 12:00 · 4 generaciones · 372 cr'), list.stdout);
  assert.ok(lines.includes('  03 · 03_luismi · registro · cerrado · 2026-10-01 09:00 a 2026-10-03 18:00 · cerrado 2026-10-03 18:00 · 41,5 s finales · 9 generaciones · 980 cr'), list.stdout);
  assert.ok(lines.includes('  Uso general · 2026-11-01 08:00 a 2026-11-18 09:00 · 1 generaciones · 12 cr'), list.stdout);
  assert.ok(lines.indexOf('  Uso general · 2026-11-01 08:00 a 2026-11-18 09:00 · 1 generaciones · 12 cr') > lines.findIndex((line) => line.startsWith('  03 ·')));
  assert.ok(lines.includes('Total: 1364 cr · Saldo: 4321 cr.'), list.stdout);
  const json = await h.run(['proyectos', '--json']);
  assert.deepEqual(JSON.parse(json.stdout), PROJECTS, '--json es la respuesta del servidor tal cual');
});

test('proyecto <id>: vídeos del kit, generaciones y cierres sin prompts; --json pasa la respuesta; 404 con su mensaje', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const detail = await h.run(['proyecto', '06_super-cremita']);
  assert.equal(detail.code, 0, detail.stderr);
  const out = detail.stdout;
  assert.match(out, /^Proyecto 06 · 06_super-cremita · plugin \+ kit · abierto/m);
  assert.match(out, /^Vídeos del kit \(1\):\n  NOV26-07 · «Super cremita» · caso servicio-empresas · abierto · abierto 2026-11-18 10:30$/m);
  assert.match(out, /^Generaciones \(3\):$/m);
  assert.match(out, /^  t-1 · generación · Nano Banana 2 · 12 cr · 2026-11-17 10:00 · success$/m);
  assert.match(out, new RegExp('^  ' + 'a'.repeat(32) + ' · toma · Toma · vídeo NOV26-07 · toma 2 v1 · 8 s · 240 cr · 2026-11-18 11:00 · completado · archivos: ' + 'b'.repeat(32) + '$', 'm'));
  assert.match(out, /^  registro-4 · registro · 30 s · 120 cr · 2026-11-18 12:00 · registrado$/m);
  assert.match(out, /^Cierres \(1\):\n  NOV26-07 · revisión 1 · 32,5 s finales · tomas usadas 1:2, 2:1 · 2026-11-18 12:30$/m);
  assert.doesNotMatch(out, /PROMPT-SECRETO|params_summary|resolution|no-es-un-id/);

  const json = await h.run(['proyecto', '06_super-cremita', '--json']);
  assert.equal(json.code, 0);
  const parsed = JSON.parse(json.stdout);
  assert.deepEqual(parsed, PROJECT);
  assert.deepEqual(parsed.videos[0], { code: 'NOV26-07', case: 'servicio-empresas', title: 'Super cremita', status: 'abierto', opened_at: '2026-11-18 10:30', closed_at: null, references: 3 });

  const missing = await h.run(['proyecto', '99_otro']);
  assert.notEqual(missing.code, 0);
  assert.match(missing.stderr, /Ese proyecto no existe en tu cuenta\./);
  const missingJson = await h.run(['proyecto', '99_otro', '--json']);
  assert.equal(missingJson.code, 1);
  assert.deepEqual(JSON.parse(missingJson.stdout), { ok: false, code: 'project_not_found', error: 'Ese proyecto no existe en tu cuenta.' });

  const closed = await h.run(['cerrar-proyecto', '06_super-cremita', '--duracion-final', '32,5', '--nota', 'Entregado']);
  assert.equal(closed.code, 0, closed.stderr);
  assert.match(closed.stdout, /Proyecto 06_super-cremita cerrado · duración final 32,5 s/);
  const close = h.requests.filter((r) => r.body.action === 'project_close').at(-1);
  assert.deepEqual(close.body, { action: 'project_close', project: '06_super-cremita', final_seconds: 32.5, note: 'Entregado' });
  for (const bad of [['proyecto', 'a b'], ['cerrar-proyecto', '06', '--duracion-final', 'diez'], ['cerrar-proyecto', 'sin_proyecto'], ['proyectos', '--foo']]) {
    assert.notEqual((await h.run(bad)).code, 0, bad.join(' '));
  }
});

test('info, models y validate: el precio sale de price.php con sesión; sin sesión no hay cifras ni «precio de miembro»', async (t) => {
  const h = await harness(t, { pricing: CLIENT, priceInfo: { 'nano-banana-2': ['Precio de tu cuenta: 14 cr (2K).', 'El importe exacto lo da prepare.'] } });
  const anonymous = { AILAB_CREDENTIALS_DIR: path.join(h.temp, 'sin-sesion') };
  const noSession = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--resolution', '2K'], anonymous);
  assert.equal(noSession.code, 0, noSession.stderr);
  assert.match(noSession.stdout, /parametros validos · el precio lo da `prepare` · sin gasto/);
  const anonymousInfo = await h.run(['info', 'nano-banana-2'], anonymous);
  assert.match(anonymousInfo.stdout, /Precio: lo da AILAB con tu sesión/);
  const models = await h.run(['models'], anonymous);
  for (const text of [noSession.stdout, anonymousInfo.stdout, models.stdout]) {
    assert.doesNotMatch(text, /precio de miembro|precios de miembro/i);
    assert.doesNotMatch(text, /\d+(?:[.,]\d+)? ?cr\b/, 'sin sesión no se muestra ninguna cifra');
  }
  assert.equal(estimates(h.state).length, 0);

  const validated = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--resolution', '2K']);
  assert.match(validated.stdout, /estimacion ~14 cr · sin gasto/);
  const info = await h.run(['info', 'nano-banana-2']);
  assert.equal(info.code, 0, info.stderr);
  assert.match(info.stdout, /Precio de tu cuenta: 14 cr \(2K\)\.\nEl importe exacto lo da prepare\./);
  assert.deepEqual(h.state.priceRequests.filter((r) => r.action === 'info'), [{ action: 'info', model: 'nano-banana-2' }]);
  assert.match((await h.run(['models'])).stdout, /Precios: los da siempre AILAB/);
});

test('balance y logins no guardan precio; el login de una cuenta solo de flujos tampoco', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const meCalls = () => h.requests.filter((r) => r.body.action === 'me').length;
  const before = meCalls();
  const balance = await h.run(['balance']);
  assert.equal(balance.code, 0, balance.stderr);
  assert.match(balance.stdout, /saldo 100000 cr/);
  assert.equal(meCalls() - before, 1);
  assert.deepEqual(priceFiles(h.config), []);
  const withInput = (args, input) => new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], { env: h.env, timeout: 60000 });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
  h.state.flowsOnly = true;
  const client = await withInput(['login'], 'ailp_' + 'C'.repeat(48) + '\n');
  assert.equal(client.code, 0, client.stderr + client.stdout);
  assert.match(client.stdout, /cuenta de cliente · saldo 5000 cr/);
  assert.deepEqual(priceFiles(h.config), []);
});

test('asistentes: lista y preparación con los importes de price.php, proyecto en la cabecera; el 402 price_changed se muestra tal cual', async (t) => {
  const h = await harness(t, { pricing: CLIENT, assistantPrices: { assistants: { 'image-prompter': { estimated_credits: 14, max_authorized_credits: 58 } }, billing: { max_authorized_credits: 192 } } });
  const listed = await h.run(['assistants']);
  assert.equal(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /image-prompter · Image Prompter · ~14 cr orientativos/);
  assert.doesNotMatch(listed.stdout, /miembro/);
  const prepared = await h.run(['assistant-prepare', 'image-prompter', '--message', 'Mejora este prompt.', '--proyecto', '06']);
  assert.equal(prepared.code, 0, prepared.stderr);
  assert.match(prepared.stdout, /Estimacion: ~14 cr/);
  assert.match(prepared.stdout, /Maximo autorizado temporalmente: 58 cr/);
  assert.match(prepared.stdout, /Proyecto: 06/);
  const id = /Peticion: ([0-9a-f-]{36})/.exec(prepared.stdout)[1];
  const saved = JSON.parse(fs.readFileSync(path.join(h.config, 'assistant-requests', id + '.json'), 'utf8'));
  assert.equal(saved.estimated_credits, 14);
  assert.equal(saved.max_credits_authorized, 58);
  assert.equal(saved.price_factor, undefined);
  assert.equal(saved.project, '06');
  const done = await h.run(['assistant-submit', id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  const sent = h.requests.filter((r) => r.pathname === '/api/v1/skill/assistant.php' && !r.body.action).at(-1);
  assert.equal(sent.headers['x-ailab-proyecto'], '06');
  assert.equal(JSON.stringify(sent.body).includes('proyecto'), false);
  assert.ok(h.state.priceRequests.every((r) => r.action === 'assistants'));

  const other = await h.run(['assistant-prepare', 'image-prompter', '--message', 'Otro.']);
  const otherId = /Peticion: ([0-9a-f-]{36})/.exec(other.stdout)[1];
  h.state.assistantFailure = { status: 402, body: { ok: false, code: 'price_changed', error: PRICE_CHANGED } };
  const changed = await h.run(['assistant-submit', otherId, '--confirmed']);
  assert.notEqual(changed.code, 0);
  assert.ok(changed.stderr.includes(PRICE_CHANGED), changed.stderr);
});

test('voces: --proyecto se rechaza en local con su texto, sin traza ni red', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const voice = 'd'.repeat(32);
  const before = h.requests.length;
  for (const args of [['voice-prepare', 'resume', '--id', voice, '--proyecto', '06'], ['voice-status', voice, '--proyecto', '06']]) {
    const rejected = await h.run(args);
    assert.notEqual(rejected.code, 0, args.join(' '));
    assert.match(rejected.stderr, /Las voces no llevan proyecto: sus cargos van a Uso general/);
    assert.doesNotMatch(rejected.stderr, /\n\s+at /);
  }
  assert.equal(h.requests.length, before, 'el rechazo es local');
  const unknown = await h.run(['voice-prepare', 'nada']);
  assert.notEqual(unknown.code, 0);
  assert.doesNotMatch(unknown.stderr, /\n\s+at /, 'un rechazo de voces no imprime la traza');
});
