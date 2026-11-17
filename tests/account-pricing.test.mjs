// Precio por cuenta y proyectos (skill 2.4.0, contrato «precio-por-cuenta-y-proyectos-2026-11-17», sección 6).
// Sin coste: la CLI real habla con un falso servidor AILAB en localhost. Comprueba que con factor 1,0 nada cambia
// para los miembros, que con factor 1,2 cada familia de precio usa ceil(round(base × factor, 6)) una sola vez,
// que el manifiesto congela el factor y que el proyecto viaja en su cabecera y nunca en los parámetros.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const execute = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills/ailab');
const CLI = path.join(SKILL, 'scripts/ailab.mjs');
const CATALOG_FILE = path.join(SKILL, 'catalog/catalog.json');
const CATALOG = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-account-pricing-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_BASE_URL = 'http://127.0.0.1:9/';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

const pricingModule = await import('../skills/ailab/scripts/lib/account-pricing.mjs');
const { priced, accountPricing, takeProject, validFactor } = pricingModule;
const { CLI_VERSION } = await import('../skills/ailab/scripts/lib/config.mjs');
const { estimateCredits, requiresServerQuote, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { pricingLines } = await import('../skills/ailab/scripts/lib/pricing.mjs');
const higgsfield = await import('../skills/ailab/scripts/adapters/higgsfield-v1.mjs');
const omni = await import('../skills/ailab/scripts/lib/omni12.mjs');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
const FUTURE = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const CLIENT = { label: 'cliente', factor: 1.2, rounding: 'ceil', require_project: false, min_client: '2.4.0' };
const MEMBER = { label: 'miembro', factor: 1, rounding: 'ceil', require_project: false, min_client: '2.4.0' };

// ---------------------------------------------------------------------------------------------------------------
// Unidades

test('priced: con factor 1,0 devuelve la base intacta; con otro factor, ceil(round(base × factor, 6))', () => {
  for (const base of [0, 1, 7, 13, 41, 100, 352, 4.08, 22.44, 1000]) assert.equal(priced(base, 1), base);
  assert.equal(priced(100, 1.2), 120);
  assert.equal(priced(5, 1.2), 6, '5 × 1,2 = 6,000000000000001 en coma flotante: el redondeo a 6 decimales evita cobrar 7');
  assert.equal(priced(7, 1.2), 9);
  assert.equal(priced(15, 1.2), 18);
  assert.equal(priced(612, 1.2), 735);
  assert.equal(priced(2100, 1.2), 2520);
  assert.equal(priced(1, 1.05), 2);
  assert.equal(priced(null, 1.2), null);
  assert.throws(() => priced(10, 0.8));
  assert.equal(validFactor(0.99), null);
  assert.equal(validFactor(11), null);
  assert.equal(validFactor('1.2'), 1.2);
});

test('me.pricing: sin campo es miembro; un factor o un redondeo incoherente se rechaza sin gastar', () => {
  assert.deepEqual(accountPricing({ balance: 10 }).pricing, { label: 'miembro', factor: 1, rounding: 'ceil', require_project: false, min_client: null });
  assert.equal(accountPricing({ pricing: CLIENT }).pricing.factor, 1.2);
  assert.equal(accountPricing({ pricing: { ...CLIENT, require_project: true } }).pricing.require_project, true);
  assert.equal(accountPricing({ pricing: { factor: 0.5 } }).ok, false);
  assert.equal(accountPricing({ pricing: { factor: 'x' } }).ok, false);
  assert.equal(accountPricing({ pricing: { factor: 1.2, rounding: 'round' } }).ok, false);
  assert.equal(accountPricing({ pricing: [] }).ok, false);
});

test('--proyecto: formato del contrato, una sola vez, y nunca queda entre las opciones', () => {
  for (const ok of ['06', '06_super-cremita', 'A.b-C_9', 'x'.repeat(64)]) {
    const taken = takeProject({ proyecto: ok, prompt: 'p' });
    assert.equal(taken.ok, true, ok);
    assert.equal(taken.project, ok);
    assert.deepEqual(taken.rest, { prompt: 'p' });
  }
  for (const bad of ['', ' ', 'con espacio', 'año', 'x'.repeat(65), 'a/b', true, ['1', '2']]) assert.equal(takeProject({ proyecto: bad }).ok, false, String(bad));
  assert.deepEqual(takeProject({ prompt: 'p' }), { ok: true, project: null, rest: { prompt: 'p' } });
});

test('topes de Higgsfield: con factor 1,0 son los de siempre y con factor 1,2 el tope final es priced(tope)', () => {
  for (const [id, model] of Object.entries(CATALOG.models).filter(([, m]) => m.driver === 'higgsfield-v1')) {
    const full = { id, ...model };
    const cap = higgsfield.hardCreditCap(full);
    assert.equal(higgsfield.accountCreditCap(full, 1), cap, id);
    assert.equal(higgsfield.accountCreditCap(full, 1.2), Math.ceil(Math.round(cap * 1.2 * 1e6) / 1e6), id);
  }
  assert.equal(higgsfield.accountCreditCap({ id: 'genjutsu', ...CATALOG.models.genjutsu }, 1.2), 2520);
  assert.equal(higgsfield.accountCreditCap({ id: 'higgsfield-genjutsu-light', ...CATALOG.models['higgsfield-genjutsu-light'] }, 1.2), 735);
});

test('Extend de Omni 1.2: la cifra del servidor ya es de la cuenta; la local se compara con el mismo factor y no enseña la tarifa', () => {
  // `rate` es la tarifa de miembro que manda el listado: solo se enseña con factor 1,0.
  const video = { task_id: 'omni-1', resolution: '360p', output_seconds: 11, rate: omni.omni12Rate('360p'), credits_by_duration: { 10: 41 } };
  const member = omni.omni12ExtendQuote(video, 10, Date.parse('2026-11-17T10:00:00Z'));
  assert.equal(member.quote.estimated_credits, 41);
  assert.doesNotMatch(member.quote.note, /AVISO/);
  assert.match(member.quote.note, new RegExp(' a ' + String(omni.omni12Rate('360p')).replace('.', ',') + ' cr/s'));
  const client = omni.omni12ExtendQuote({ ...video, credits_by_duration: { 10: priced(41, 1.2) } }, 10, Date.parse('2026-11-17T10:00:00Z'), 1.2);
  assert.equal(client.quote.estimated_credits, 50, 'no se multiplica otra vez');
  assert.doesNotMatch(client.quote.note, /AVISO/);
  assert.doesNotMatch(client.quote.note, /cr\/s/);
});

test('info: con factor 1,0 el texto es idéntico al de la 2.3.19; sin sesión se rotula como precio de miembro; con 1,2 no hay tablas de miembro', () => {
  const now = Date.parse('2026-11-17T10:00:00Z');
  for (const [id, model] of Object.entries(CATALOG.models)) {
    const full = { id, ...model };
    const legacy = pricingLines(full, now);
    assert.deepEqual(pricingLines(full, now, MEMBER), legacy, id);
    assert.deepEqual(pricingLines(full, now, null), [...legacy, '  Estos importes son precio de miembro: el precio exacto de tu cuenta lo da `prepare`.'], id);
    const client = pricingLines(full, now, CLIENT).join('\n');
    if (!requiresServerQuote(full, {}) && model.estimate?.kind !== 'higgsfield_quote' && id !== 'higgsfield-genjutsu-light') {
      assert.doesNotMatch(client, /Regla de cálculo|cr\/s/, id);
      assert.match(client, /Precio de tu cuenta/, id);
    }
  }
  const flux = { id: 'flux-3', ...CATALOG.models['flux-3'] };
  const memberExample = pricingLines(flux, now).find((line) => /Estimado/.test(line));
  const clientExample = pricingLines(flux, now, CLIENT).find((line) => /Estimado/.test(line));
  const numbers = (line) => [...line.matchAll(/(\d+) cr/g)].map((m) => Number(m[1]));
  assert.deepEqual(numbers(clientExample), numbers(memberExample).map((n) => priced(n, 1.2)));
});

test('cabeceras con fetch simulado: toda llamada a AILAB lleva X-AILAB-Client, y X-AILAB-Proyecto solo mientras hay proyecto', async (t) => {
  fs.mkdirSync(process.env.AILAB_CREDENTIALS_DIR, { recursive: true });
  fs.writeFileSync(path.join(process.env.AILAB_CREDENTIALS_DIR, 'token'), 'ailp_' + 'F'.repeat(48), { mode: 0o600 });
  const http = await import('../skills/ailab/scripts/lib/http.mjs');
  const seen = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    if (init.body && typeof init.body.getReader === 'function') { for await (const _ of init.body) { /* consumir */ } }
    else if (init.body && typeof init.body[Symbol.asyncIterator] === 'function') { for await (const _ of init.body) { /* consumir */ } }
    seen.push({ url: String(url), headers: { ...(init.headers || {}) } });
    return new Response(JSON.stringify({ ok: true, url: 'https://x.test/a.png' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = original; http.setRequestProject(null); });
  const file = path.join(temporary, 'subida.png');
  fs.writeFileSync(file, PNG);
  const calls = async () => {
    await http.apiPost({ action: 'me' });
    await http.gatewayPost('/jobs/createTask', {});
    await http.gatewayGet('/jobs/recordInfo?taskId=1');
    await http.servicePost('api/skill/higgsfield.php?action=quote', {});
    await http.serviceGet('api/wallet/private-voices.php', { action: 'options' });
    await http.assistantPost({ action: 'capabilities' });
    await http.taskLookup('t-1');
    await http.flowsPost({ action: 'status' });
    await http.uploadFile(PNG, 'a.png', 'image/png');
    await http.uploadPath(file, 'a.png', 'image/png', crypto.createHash('sha256').update(PNG).digest('hex'));
  };
  await calls();
  assert.equal(seen.length, 10);
  for (const call of seen) {
    assert.equal(call.headers['X-AILAB-Client'], 'ailab-cli/' + CLI_VERSION, call.url);
    assert.equal(call.headers['X-AILAB-Proyecto'], undefined, call.url);
  }
  seen.length = 0;
  http.setRequestProject('06');
  await calls();
  for (const call of seen) assert.equal(call.headers['X-AILAB-Proyecto'], '06', call.url);
  assert.equal(http.CLIENT_HEADER, 'ailab-cli/' + CLI_VERSION);
});

// ---------------------------------------------------------------------------------------------------------------
// Falso servidor y CLI real

async function harness(t, initial = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-account-cli-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'P'.repeat(48), { mode: 0o600 });
  const state = { pricing: undefined, balance: 100000, createFailure: null, meSequence: null, ...initial };
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
      const entry = { method: req.method, pathname: url.pathname, search: url.search, body, headers: req.headers };
      requests.push(entry);
      if (url.pathname === '/assets/out.png') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end(PNG); }
      if (url.pathname === '/api/v1/skill/assistants.json') return json(res, ASSISTANTS);
      if (url.pathname === '/api/v1/skill/assistant.php') {
        if (body.action === 'capabilities') return json(res, { ok: true, limits: { max_attachments: 50, max_by_kind: { image: 50, audio: 2, video: 2 }, max_bytes: { image: 10485760, audio: 20971520, video: 33554432 }, max_total_bytes: 50331648, max_inline_bytes: 37748736 } });
        return json(res, { ok: true, message: { role: 'assistant', content: 'Prompt mejorado.' }, charged_credits: 13, balance: 999 });
      }
      if (url.pathname === '/api/wallet/api.php') {
        if (body.action === 'me' && state.flowsOnly) return json(res, { ok: false, error: 'Esta cuenta solo puede usar sus flujos.', msg: 'Esta cuenta solo puede usar sus flujos.' }, 403);
        if (body.action === 'me') {
          const pricing = state.meSequence && state.meSequence.length ? state.meSequence.shift() : state.pricing;
          return json(res, { ok: true, user: { email: 'cuenta@example.test', tier: 'hub' }, balance: state.balance, ...(pricing === undefined ? {} : { pricing }) });
        }
        if (body.action === 'task_costs') return json(res, { ok: true, costs: {} });
        // Forma real de app/api/wallet/projects.php (wallet_projects_list / wallet_project_detail).
        if (body.action === 'projects') return json(res, { ok: true, projects: [{ key: '06', project: '06_super-cremita', label: '06_super-cremita', status: 'abierto', generations: 3, credits: 360, first_at: '2026-11-17 10:00', last_at: '2026-11-17 12:00', final_seconds: null, note: null }, { key: 'sin_proyecto', project: null, label: 'Uso general', status: null, generations: 1, credits: 12, first_at: null, last_at: null, final_seconds: null, note: null }], total_credits: 372 });
        if (body.action === 'project') return json(res, { ok: true, project: { key: body.project, project: body.project, label: body.project, status: 'abierto', final_seconds: null, credits: 12, generations: 2 }, items: [{ task_id: 't-1', model: 'nano-banana-2', label: 'Nano Banana 2', created_at: '2026-11-17 10:00', state: 'success', params_summary: { resolution: '2K', aspect_ratio: '9:16' }, credits: 12 }, { task_id: 't-2', model: 'kling-4-0', label: 'Kling 4.0', created_at: '2026-11-17 11:00', state: 'failed', params_summary: { duration: 5 }, credits: 0 }] });
        if (body.action === 'project_close') return json(res, { ok: true, project: { key: body.project, project: body.project, label: body.project, status: 'cerrado', final_seconds: body.final_seconds ?? null }, items: [] });
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
        if (action === 'quote') return json(res, { ok: true, code: 200, msg: 'ok', data: { quote_id: crypto.randomBytes(16).toString('hex'), credits: state.higgsfieldCredits || 60, billable_seconds: 1, max_credits_authorized: body.max_credits_authorized, expires_at: FUTURE() } });
        if (action === 'create') return json(res, { ok: true, code: 200, msg: 'ok', data: { taskId: 'hf-1' } });
        if (action === 'status') return json(res, { ok: true, code: 200, msg: 'ok', data: { status: 'COMPLETED', urls: [base + 'assets/out.png'] } });
      }
      if (url.pathname === '/api/v1/flows/index.php' && body.action === 'status') return json(res, { ok: true, month: '2026-11', balance_cr: 5000, limit_cr: 0, spent_month_cr: 0, remaining_month_cr: 0, videos_month: 0, paused: false });
      if (url.pathname === '/api/wallet/private-voices.php') {
        const action = url.searchParams.get('action');
        if (action === 'options') return json(res, { ok: true, data: { can_create: true, design_enabled: true } });
        if (action === 'reserve') return json(res, { ok: true, data: { id: 'a'.repeat(32) } });
        if (action === 'resume') return json(res, { ok: true, data: { id: body.id, state: 'active' } });
        // renewal_credits: precio de reanudar ESA voz (factor congelado al crearla). Sin él, servidor anterior.
        if (action === 'status') return json(res, { ok: true, data: { id: url.searchParams.get('id'), state: 'paused', renewal_enabled: false, ...(state.renewalCredits === undefined ? {} : { renewal_credits: state.renewalCredits }) } });
      }
      json(res, { error: 'unexpected request ' + req.url }, 404);
    } catch (error) { json(res, { error: error.message }, 500); }
  });
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  const env = {
    ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_POLL_MS: '5', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
    AILAB_CATALOG_PATH: CATALOG_FILE, AILAB_OUTPUT_DIR: path.join(temp, 'out'), AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials,
    AILAB_ASSISTANTS_URL: base + 'api/v1/skill/assistants.json', AILAB_ASSISTANT_ENDPOINT: base + 'api/v1/skill/assistant.php',
  };
  const run = async (args, runtime = CLI) => {
    try { return { code: 0, ...(await execute(process.execPath, [runtime, ...args], { env, timeout: 60000 })) }; }
    catch (error) { return { code: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; }
  };
  const manifestOf = (stdout) => {
    const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
    assert.ok(id, 'sin manifiesto:\n' + stdout);
    return { id, ...JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8')) };
  };
  const writeManifest = (manifest) => fs.writeFileSync(path.join(config, 'manifests', manifest.id + '.json'), JSON.stringify(manifest));
  const creates = () => requests.filter((r) => r.pathname === '/api/wallet/gateway.php' && /createTask/.test(r.search));
  return { state, requests, run, manifestOf, writeManifest, creates, temp, config, credentials, base, env };
}

const ASSISTANTS = {
  schema_version: 2, catalog_version: '2.0.0', min_cli_version: '2.2.0',
  billing: { type: 'actual_usage', max_authorized_credits: 160 },
  default_model: 'gemini-3-5-flash-lite-priority',
  assistants: { 'image-prompter': { label: 'Image Prompter', description: 'Imagen.', prompt_version: 'test', prompt_sha256: 'a'.repeat(64), estimated_credits: 11, max_authorized_credits: 48 } },
  models: { 'gemini-3-5-flash-lite-priority': { label: 'Gemini 3.5 Flash Lite', vendor: 'OpenRouter', accepts_images: true, accepts_audio: true, accepts_video: true } },
};

const NB2 = ['prepare', 'nano-banana-2', '--prompt', 'Un frasco de crema sobre mármol', '--resolution', '2K'];
const nb2Base = () => estimateCredits(CATALOG.models['nano-banana-2'], { ...defaults('nano-banana-2'), resolution: '2K' }).credits;
function defaults(id) {
  const params = {};
  for (const [key, spec] of Object.entries(CATALOG.models[id].params || {})) if (spec.default !== undefined) params[key] = spec.default;
  return params;
}
const scrub = (text) => String(text)
  .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<id>')
  .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<fecha>')
  .replace(/ailab-cli\/[\d.]+/g, '<cliente>');

test('miembros: con factor 1,0 (o sin pricing en `me`) prepare y submit dan la misma salida, el mismo manifiesto y el mismo máximo', async (t) => {
  const outputs = [];
  for (const pricing of [undefined, MEMBER]) {
    const h = await harness(t, { pricing });
    const planned = await h.run(NB2);
    assert.equal(planned.code, 0, planned.stderr);
    const manifest = h.manifestOf(planned.stdout);
    assert.equal(manifest.estimated_credits, nb2Base());
    assert.equal(manifest.max_credits_authorized, nb2Base());
    assert.equal(manifest.base_credits, nb2Base());
    assert.equal(manifest.price_factor, 1);
    assert.equal(manifest.project, null);
    const done = await h.run(['submit', manifest.id, '--confirmed']);
    assert.equal(done.code, 0, done.stderr);
    assert.equal(h.creates().length, 1);
    assert.equal(h.creates()[0].body.max_credits_authorized, nb2Base());
    assert.equal(h.creates()[0].headers['x-ailab-proyecto'], undefined);
    outputs.push([scrub(planned.stdout), scrub(done.stdout).replace(/ailab-[^\s]+\.png/g, '<archivo>'), h.creates()[0].body]);
  }
  assert.equal(outputs[0][0], outputs[1][0]);
  assert.equal(outputs[0][1], outputs[1][1]);
  assert.deepEqual({ ...outputs[0][2], client_request_id: 0 }, { ...outputs[1][2], client_request_id: 0 });
});

test('miembros: la salida de prepare y el cuerpo enviado son los de la CLI 2.3.19 publicada', async (t) => {
  // La 2.3.19 se extrae de la historia del repositorio; en un checkout superficial no está y la prueba se omite.
  const old = path.join(temporary, 'cli-2.3.19');
  const archive = spawnSync('git', ['-C', ROOT, 'archive', '--format=tar', '5eb55a9', 'skills/ailab'], { maxBuffer: 64 * 1024 * 1024 });
  if (archive.status !== 0) return t.skip('La revisión 2.3.19 (5eb55a9) no está en este checkout.');
  fs.mkdirSync(old, { recursive: true });
  const unpacked = spawnSync('tar', ['-x', '-C', old], { input: archive.stdout });
  assert.equal(unpacked.status, 0);
  const runtimes = [path.join(old, 'skills/ailab/scripts/ailab.mjs'), CLI];
  const seen = [];
  for (const runtime of runtimes) {
    const h = await harness(t, { pricing: MEMBER });
    const planned = await h.run(NB2, runtime);
    assert.equal(planned.code, 0, planned.stderr);
    const manifest = h.manifestOf(planned.stdout);
    const done = await h.run(['submit', manifest.id, '--confirmed'], runtime);
    assert.equal(done.code, 0, done.stderr);
    const body = { ...h.creates()[0].body, client_request_id: 0 };
    seen.push({ prepare: scrub(planned.stdout).replace(/node \S+ailab\.mjs/g, 'node <cli>'), body, estimated: manifest.estimated_credits, max: manifest.max_credits_authorized });
  }
  assert.deepEqual(seen[1], seen[0]);
});

test('todas las familias con estimación local: factor 1,2 congela priced(base) y factor 1,0 la base', async (t) => {
  const h = await harness(t);
  const drivers = new Set();
  let compared = 0;
  for (const [id, model] of Object.entries(CATALOG.models)) {
    if (!modelUsable(model).ok || requiresServerQuote({ id, ...model }, {})) continue;
    const required = Object.entries(model.params || {}).filter(([, spec]) => spec.required);
    if (required.some(([, spec]) => spec.type !== 'string')) continue;
    const args = ['prepare', id, ...required.flatMap(([key]) => ['--' + key, key.startsWith('voice_id') ? 'voz-' + key : 'Un frasco de crema sobre mármol'])];
    h.state.pricing = MEMBER;
    const member = await h.run(args);
    if (member.code !== 0) continue;
    const baseManifest = h.manifestOf(member.stdout);
    if (!Number.isFinite(baseManifest.estimated_credits)) continue;
    h.state.pricing = CLIENT;
    const client = await h.run(args);
    assert.equal(client.code, 0, id + ': ' + client.stderr);
    const clientManifest = h.manifestOf(client.stdout);
    assert.equal(clientManifest.base_credits, baseManifest.estimated_credits, id);
    assert.equal(clientManifest.price_factor, 1.2, id);
    assert.equal(clientManifest.estimated_credits, priced(baseManifest.estimated_credits, 1.2), id);
    assert.equal(clientManifest.max_credits_authorized, clientManifest.estimated_credits, id);
    assert.match(client.stdout, new RegExp('~' + clientManifest.estimated_credits + ' cr'), id);
    drivers.add(model.driver);
    compared += 1;
  }
  assert.ok(compared >= 30, 'solo se compararon ' + compared + ' modelos');
  for (const driver of ['jobs-v1', 'labs-queue-v1', 'labs-queue-multi-v1', 'eleven-v1', 'suno-v1', 'veo-v1', 'hybrid-seedream-v1']) assert.ok(drivers.has(driver), 'falta la familia ' + driver);
});

test('cliente ×1,2: submit envía el máximo final, --max-credits y el saldo se comprueban con el precio final', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const base = nb2Base();
  const final = priced(base, 1.2);
  assert.ok(final > base);
  const between = await h.run([...NB2, '--max-credits', String(final - 1)]);
  assert.equal(between.code, 0, 'nano-banana-2 no comprueba --max-credits en prepare, como en la 2.3.19');
  const planned = await h.run(NB2);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.estimated_credits, final);
  assert.match(planned.stdout, new RegExp('Estimacion: ~' + final + ' cr \\(precio de tu cuenta\\)'));
  assert.doesNotMatch(planned.stdout, new RegExp('~' + base + ' cr'), 'un solo importe: no se enseña el precio de miembro');

  h.state.balance = final - 1;
  const poor = await h.run(['submit', manifest.id, '--confirmed']);
  assert.notEqual(poor.code, 0);
  assert.match(poor.stderr, new RegExp('Saldo insuficiente para la operacion \\(~' + final + ' cr'));
  assert.equal(h.creates().length, 0);

  h.state.balance = 100000;
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  assert.equal(h.creates().length, 1);
  assert.equal(h.creates()[0].body.max_credits_authorized, final);
});

test('cliente ×1,2 en un modelo de tarifa exacta: --max-credits entre la base y el final se rechaza en prepare y en submit', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const args = ['prepare', 'kling-4-0', '--prompt', 'Un frasco de crema gira despacio'];
  h.state.pricing = MEMBER;
  const member = h.manifestOf((await h.run(args)).stdout);
  h.state.pricing = CLIENT;
  const base = member.estimated_credits;
  const final = priced(base, 1.2);
  const denied = await h.run([...args, '--max-credits', String(base)]);
  assert.notEqual(denied.code, 0);
  assert.match(denied.stderr, new RegExp('El coste \\(' + final + ' cr\\) supera el máximo que autorizaste'));
  const planned = h.manifestOf((await h.run(args)).stdout);
  const over = await h.run(['submit', planned.id, '--confirmed', '--max-credits', String(final - 1)]);
  assert.notEqual(over.code, 0);
  assert.match(over.stderr, new RegExp('El coste \\(' + final + ' cr\\) supera'));
  assert.equal(h.creates().length, 0);
});

test('manifiesto congelado: submit recalcula con el factor del manifiesto y no acepta un importe manipulado', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const manifest = h.manifestOf((await h.run(NB2)).stdout);
  h.writeManifest({ ...manifest, estimated_credits: nb2Base(), max_credits_authorized: nb2Base() });
  const tampered = await h.run(['submit', manifest.id, '--confirmed']);
  assert.notEqual(tampered.code, 0);
  assert.match(tampered.stderr, /no coincide con el plan confirmado/);
  h.writeManifest({ ...manifest, price_factor: 1 });
  const factorEdited = await h.run(['submit', manifest.id, '--confirmed']);
  assert.notEqual(factorEdited.code, 0);
  assert.equal(h.creates().length, 0);
});

test('el factor de la cuenta cambia entre prepare y submit: aviso en local o tras el 402, sin cobrar', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const manifest = h.manifestOf((await h.run(NB2)).stdout);
  h.state.pricing = { ...CLIENT, factor: 1.3 };
  const changed = await h.run(['submit', manifest.id, '--confirmed']);
  assert.notEqual(changed.code, 0);
  assert.match(changed.stderr, /El precio de tu cuenta cambió; vuelve a preparar/);
  assert.equal(h.creates().length, 0);

  // El servidor cambia el factor justo después de la comprobación local y rechaza con 402.
  h.state.pricing = CLIENT;
  const again = h.manifestOf((await h.run(NB2)).stdout);
  h.state.meSequence = [CLIENT, { ...CLIENT, factor: 1.3 }];
  h.state.createFailure = { status: 402, body: { code: 402, msg: 'El importe supera el máximo autorizado.' } };
  const rejected = await h.run(['submit', again.id, '--confirmed']);
  assert.notEqual(rejected.code, 0);
  assert.match(rejected.stderr, /El precio de tu cuenta cambió; vuelve a preparar/);

  // Un 402 por saldo, con el mismo factor, conserva el mensaje de siempre.
  const third = h.manifestOf((await h.run(NB2)).stdout);
  h.state.meSequence = null;
  h.state.createFailure = { status: 402, body: { code: 402, msg: 'Saldo insuficiente.' } };
  const poor = await h.run(['submit', third.id, '--confirmed']);
  assert.match(poor.stderr, /Saldo insuficiente\. Recarga en/);

  // Con el código `price_changed` del servidor el aviso es directo: sin releer `me` y sin «Recarga en».
  const fourth = h.manifestOf((await h.run(NB2)).stdout);
  h.state.createFailure = { status: 402, body: { code: 402, error_code: 'price_changed', msg: 'El precio de tu cuenta cambió. Vuelve a preparar; no se ha cobrado nada.' } };
  const meBefore = h.requests.filter((r) => r.body.action === 'me').length;
  const coded = await h.run(['submit', fourth.id, '--confirmed']);
  assert.notEqual(coded.code, 0);
  assert.match(coded.stderr, /El precio de tu cuenta cambió; vuelve a preparar\. No se ha cobrado nada\./);
  assert.doesNotMatch(coded.stderr, /Recarga en/);
  assert.equal(h.requests.filter((r) => r.body.action === 'me').length - meBefore, 1, 'solo el `me` de la sesión');
  h.state.createFailure = null;
});

test('cabeceras: X-AILAB-Client en todas las peticiones y X-AILAB-Proyecto en las del comando con --proyecto, nunca en el cuerpo', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const planned = await h.run([...NB2, '--proyecto', '06_super-cremita']);
  assert.equal(planned.code, 0, planned.stderr);
  assert.match(planned.stdout, /proyecto: 06_super-cremita/);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.project, '06_super-cremita');
  assert.equal(manifest.params.proyecto, undefined);
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  for (const request of h.requests.filter((r) => r.pathname.startsWith('/api/'))) {
    assert.equal(request.headers['x-ailab-client'], 'ailab-cli/' + CLI_VERSION, request.pathname + request.search);
  }
  const create = h.creates()[0];
  assert.equal(create.headers['x-ailab-proyecto'], '06_super-cremita');
  assert.equal(JSON.stringify(create.body).includes('proyecto'), false);
  assert.equal(create.body.max_credits_authorized, priced(nb2Base(), 1.2));
  const otherProject = await h.run(['submit', manifest.id, '--confirmed', '--proyecto', '07']);
  assert.notEqual(otherProject.code, 0);

  const plain = await h.run(['proyectos']);
  assert.equal(h.requests.at(-1).headers['x-ailab-proyecto'], undefined, 'sin --proyecto no hay cabecera');
  assert.equal(plain.code, 0);
});

test('--proyecto en Higgsfield: la cotización y el envío llevan la cabecera; el servidor da el precio final y no se multiplica', async (t) => {
  const h = await harness(t, { pricing: CLIENT, higgsfieldCredits: 72 });
  const planned = await h.run(['prepare', 'soul-2', '--prompt', 'retrato', '--proyecto', '06']);
  assert.equal(planned.code, 0, planned.stderr);
  const quote = h.requests.find((r) => r.pathname === '/api/skill/higgsfield.php' && r.body.action === 'quote');
  assert.equal(quote.headers['x-ailab-proyecto'], '06');
  assert.equal(quote.body.max_credits_authorized, 1200, 'el tope de 1000 cr de miembro es 1200 cr para la cuenta');
  assert.equal(quote.body.input.proyecto, undefined);
  const manifest = h.manifestOf(planned.stdout);
  assert.equal(manifest.estimated_credits, 72);
  assert.equal(manifest.price_factor, 1.2);
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  const create = h.requests.find((r) => r.pathname === '/api/skill/higgsfield.php' && r.body.action === 'create');
  assert.equal(create.body.max_credits_authorized, 72);
  assert.equal(create.headers['x-ailab-proyecto'], '06');

  // --max-credits se compara con la cotización final.
  const ceiling = await h.run(['prepare', 'soul-2', '--prompt', 'retrato', '--max-credits', '71']);
  assert.notEqual(ceiling.code, 0);
  assert.match(ceiling.stderr, /\(72 cr\) supera .*\(71 cr\)\. No se ha enviado nada/);
});

test('Higgsfield: un manifiesto de cliente por encima del tope de miembro pero dentro de priced(tope) se envía', async (t) => {
  const h = await harness(t, { pricing: CLIENT, higgsfieldCredits: 1100 });
  const manifest = h.manifestOf((await h.run(['prepare', 'soul-2', '--prompt', 'retrato'])).stdout);
  assert.equal(manifest.estimated_credits, 1100);
  const done = await h.run(['submit', manifest.id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);

  const member = await harness(t, { pricing: MEMBER, higgsfieldCredits: 1100 });
  const planned = await member.run(['prepare', 'soul-2', '--prompt', 'retrato']);
  assert.notEqual(planned.code, 0, 'con factor 1,0 el tope sigue siendo 1000 cr');
});

test('cuenta que exige proyecto: falla en local antes de subir o cotizar; un proyecto no válido tampoco sale', async (t) => {
  const h = await harness(t, { pricing: { ...CLIENT, require_project: true } });
  const missing = await h.run(NB2);
  assert.notEqual(missing.code, 0);
  assert.match(missing.stderr, /Esta cuenta exige --proyecto en cada generación\. No se ha cobrado nada\./);
  const hf = await h.run(['prepare', 'soul-2', '--prompt', 'retrato']);
  assert.notEqual(hf.code, 0);
  assert.equal(h.requests.filter((r) => r.pathname === '/api/skill/higgsfield.php').length, 0);
  const invalid = await h.run([...NB2, '--proyecto', 'super cremita']);
  assert.notEqual(invalid.code, 0);
  assert.match(invalid.stderr, /--proyecto admite de 1 a 64 caracteres/);
  const ok = await h.run([...NB2, '--proyecto', '06']);
  assert.equal(ok.code, 0, ok.stderr);
  const validated = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--proyecto', '06']);
  assert.equal(validated.code, 0, validated.stderr);
  const badValidate = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--proyecto', 'a b']);
  assert.notEqual(badValidate.code, 0);
});

test('rechazos del servidor: 426, 409 project_required y 400 invalid_project se explican sin hablar de envío ambiguo', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const cases = [
    [426, { ok: false, code: 'client_update_required', error: 'Esta cuenta necesita AILAB 2.4.0 o posterior. Ejecuta `update --confirmed`. No se ha cobrado nada.' }, /necesita AILAB 2\.4\.0 o posterior/],
    [426, { code: 426, msg: '' }, /necesita AILAB 2\.4\.0 o posterior\. Ejecuta .*update --confirmed.*No se ha cobrado nada/],
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

test('comandos de proyectos: lista, detalle y cierre con duración final', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const list = await h.run(['proyectos']);
  assert.equal(list.code, 0, list.stderr);
  assert.match(list.stdout, /06_super-cremita \(06\) · abierto · 3 generaciones · 360 cr cobrados/);
  assert.match(list.stdout, /Uso general · 1 generaciones · 12 cr cobrados/);
  const detail = await h.run(['proyecto', '06']);
  assert.equal(detail.code, 0, detail.stderr);
  assert.match(detail.stdout, /Generaciones \(2\) · 12 cr cobrados/);
  assert.match(detail.stdout, /t-1 · Nano Banana 2 · 2026-11-17 10:00 · success · resolution=2K, aspect_ratio=9:16 · 12 cr/);
  assert.match(detail.stdout, /t-2 · Kling 4\.0 .* failed · duration=5 · 0 cr/);
  const json = await h.run(['proyecto', '06', '--json']);
  assert.equal(JSON.parse(json.stdout).items.length, 2);
  const closed = await h.run(['cerrar-proyecto', '06', '--duracion-final', '32,5', '--nota', 'Entregado']);
  assert.equal(closed.code, 0, closed.stderr);
  assert.match(closed.stdout, /Proyecto 06 cerrado · duración final 32,5 s/);
  const close = h.requests.filter((r) => r.body.action === 'project_close').at(-1);
  assert.deepEqual(close.body, { action: 'project_close', project: '06', final_seconds: 32.5, note: 'Entregado' });
  for (const bad of [['proyecto', 'a b'], ['cerrar-proyecto', '06', '--duracion-final', 'diez'], ['cerrar-proyecto', 'sin_proyecto'], ['proyectos', '--foo']]) {
    const failed = await h.run(bad);
    assert.notEqual(failed.code, 0, bad.join(' '));
  }
});

test('info, models y validate: precio de la cuenta con sesión (sin red) y precio de miembro rotulado sin ella', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const anonymous = { ...h.env, AILAB_CREDENTIALS_DIR: path.join(h.temp, 'sin-sesion') };
  const runAs = async (env, args) => execute(process.execPath, [CLI, ...args], { env, timeout: 60000 });
  const noSession = await runAs(anonymous, ['validate', 'nano-banana-2', '--prompt', 'x', '--resolution', '2K']);
  assert.match(noSession.stdout, new RegExp('estimacion ~' + nb2Base() + ' cr · precio de miembro'));
  assert.match((await runAs(anonymous, ['info', 'nano-banana-2'])).stdout, /precio de miembro/);
  assert.match((await runAs(anonymous, ['models'])).stdout, /Son precios de miembro/);

  await h.run(['balance']);
  const before = h.requests.length;
  const validated = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--resolution', '2K']);
  assert.match(validated.stdout, new RegExp('estimacion ~' + priced(nb2Base(), 1.2) + ' cr · sin gasto'));
  const info = await h.run(['info', 'nano-banana-2']);
  assert.match(info.stdout, /Precio de tu cuenta/);
  assert.doesNotMatch(info.stdout, /Regla de cálculo|precio de miembro/);
  const models = await h.run(['models']);
  assert.match(models.stdout, /muestra el precio de tu cuenta/);
  assert.equal(h.requests.length, before, 'info, models y validate no consultan la cuenta');

  // Miembro con sesión: el texto de siempre, sin rótulo.
  h.state.pricing = MEMBER;
  await h.run(['balance']);
  const member = await h.run(['validate', 'nano-banana-2', '--prompt', 'x', '--resolution', '2K']);
  assert.match(member.stdout, new RegExp('estimacion ~' + nb2Base() + ' cr · sin gasto\\.'));
  assert.doesNotMatch((await h.run(['models'])).stdout, /precios de miembro|precio de tu cuenta/);
  await h.run(['logout']);
  assert.equal(fs.existsSync(path.join(h.config, 'account-pricing.json')), false, 'logout borra el precio guardado');
});

test('balance consulta `me` una sola vez; los logins de cliente y por cookie borran el precio guardado', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const meCalls = () => h.requests.filter((r) => r.body.action === 'me').length;
  const before = meCalls();
  const balance = await h.run(['balance']);
  assert.equal(balance.code, 0, balance.stderr);
  assert.match(balance.stdout, /saldo 100000 cr/);
  assert.equal(meCalls() - before, 1, 'una sola consulta de `me`, como en la 2.3.19');
  const cache = path.join(h.config, 'account-pricing.json');
  assert.equal(fs.existsSync(cache), true);

  const withInput = (env, args, input) => new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], { env, timeout: 60000 });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(input);
  });
  h.state.flowsOnly = true;
  const client = await withInput(h.env, ['login'], 'ailp_' + 'C'.repeat(48) + '\n');
  assert.equal(client.code, 0, client.stderr + client.stdout);
  assert.match(client.stdout, /cuenta de cliente · saldo 5000 cr/);
  assert.equal(fs.existsSync(cache), false, 'la cuenta de cliente solo de flujos no conserva el precio de otra sesión');

  h.state.flowsOnly = false;
  await h.run(['balance']);
  assert.equal(fs.existsSync(cache), true);
  await withInput({ ...h.env, AILAB_ALLOW_COOKIE_AUTH: '1' }, ['login-cookie'], 'cuenta@example.test\n');
  assert.equal(fs.existsSync(cache), false, 'login por cookie borra el precio guardado');
});

test('voces: alta con priced(100); la reanudación usa el precio de la voz y nunca llevan proyecto', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const slot = 'b'.repeat(32), sample = 'c'.repeat(32), voice = 'd'.repeat(32);
  const created = await h.run(['voice-prepare', 'create', '--name', 'Luismi', '--slot', slot, '--sample', sample]);
  assert.equal(created.code, 0, created.stderr);
  const plan = JSON.parse(created.stdout);
  assert.equal(plan.credits, 120);
  assert.equal(plan.params.max_credits_authorized, 120);

  // Voz creada con factor 1,0 en una cuenta que ahora está a 1,2: manda el precio de la voz (15).
  h.state.renewalCredits = 15;
  const resumed = await h.run(['voice-prepare', 'resume', '--id', voice]);
  assert.equal(resumed.code, 0, resumed.stderr);
  const resumePlan = JSON.parse(resumed.stdout);
  assert.equal(resumePlan.credits, 15);
  assert.equal(resumePlan.warning, undefined);
  h.state.pricing = { ...CLIENT, factor: 1.5 };
  const submitted = await h.run(['voice-submit', resumePlan.manifest_id, '--confirmed']);
  assert.equal(submitted.code, 0, 'el factor de la cuenta no cambia el precio de la voz: ' + submitted.stderr);
  const sent = h.requests.filter((r) => r.pathname === '/api/wallet/private-voices.php' && r.search.includes('action=resume')).at(-1);
  assert.equal(sent.body.max_credits_authorized, 15);
  assert.equal(sent.headers['x-ailab-proyecto'], undefined);
  h.state.pricing = CLIENT;
  h.state.renewalCredits = 18;
  assert.equal(JSON.parse((await h.run(['voice-prepare', 'resume', '--id', voice])).stdout).credits, 18, 'voz creada a 1,2');
  h.state.renewalCredits = 'quince';
  const invalid = await h.run(['voice-prepare', 'resume', '--id', voice]);
  assert.notEqual(invalid.code, 0);
  assert.match(invalid.stderr, /precio de reanudación no válido/);

  // Servidor anterior sin renewal_credits: 15 con factor 1,0; con 1,2, priced(15) y un aviso claro.
  h.state.renewalCredits = undefined;
  const fallback = JSON.parse((await h.run(['voice-prepare', 'resume', '--id', voice])).stdout);
  assert.equal(fallback.credits, 18);
  assert.match(fallback.warning, /AILAB no indica el precio de esta voz/);
  h.state.pricing = { ...CLIENT, factor: 1.5 };
  const priceChanged = await h.run(['voice-submit', fallback.manifest_id, '--confirmed']);
  assert.match(priceChanged.stderr, /El precio de tu cuenta cambió/);
  h.state.pricing = MEMBER;
  const member = JSON.parse((await h.run(['voice-prepare', 'resume', '--id', voice])).stdout);
  assert.equal(member.credits, 15, 'los miembros siguen con 15 cr');
  assert.equal(member.warning, undefined);
  const memberCreate = JSON.parse((await h.run(['voice-prepare', 'create', '--name', 'Luismi', '--slot', slot, '--sample', sample])).stdout);
  assert.equal(memberCreate.credits, 100);

  // Las voces van a Uso general: --proyecto se rechaza sin red, y una cuenta que exige proyecto no lo pide aquí.
  const before = h.requests.length;
  for (const args of [['voice-prepare', 'resume', '--id', voice, '--proyecto', '06'], ['voice-submit', fallback.manifest_id, '--confirmed', '--proyecto', '06'], ['voice-status', voice, '--proyecto', '06']]) {
    const rejected = await h.run(args);
    assert.notEqual(rejected.code, 0, args.join(' '));
    assert.match(rejected.stderr, /Las voces no llevan proyecto: sus cargos van a Uso general/);
  }
  assert.equal(h.requests.length, before, 'el rechazo es local');
  h.state.pricing = { ...CLIENT, require_project: true };
  h.state.renewalCredits = 18;
  const required = await h.run(['voice-prepare', 'resume', '--id', voice]);
  assert.equal(required.code, 0, required.stderr);
});

test('asistentes: estimación y máximo con priced(), proyecto en la cabecera y aviso si el factor cambia', async (t) => {
  const h = await harness(t, { pricing: CLIENT });
  const listed = await h.run(['assistants']);
  assert.match(listed.stdout, /precio de miembro/, 'sin dato de la cuenta todavía: precio de miembro rotulado');
  const prepared = await h.run(['assistant-prepare', 'image-prompter', '--message', 'Mejora este prompt.', '--proyecto', '06']);
  assert.equal(prepared.code, 0, prepared.stderr);
  assert.match(prepared.stdout, /Estimacion: ~14 cr/);
  assert.match(prepared.stdout, /Maximo autorizado temporalmente: 58 cr/);
  assert.match(prepared.stdout, /Proyecto: 06/);
  const id = /Peticion: ([0-9a-f-]{36})/.exec(prepared.stdout)[1];
  const done = await h.run(['assistant-submit', id, '--confirmed']);
  assert.equal(done.code, 0, done.stderr);
  const sent = h.requests.filter((r) => r.pathname === '/api/v1/skill/assistant.php' && !r.body.action).at(-1);
  assert.equal(sent.headers['x-ailab-proyecto'], '06');
  assert.equal(JSON.stringify(sent.body).includes('proyecto'), false);
  assert.match((await h.run(['assistants'])).stdout, /image-prompter · Image Prompter · ~14 cr orientativos/);

  const other = await h.run(['assistant-prepare', 'image-prompter', '--message', 'Otro.']);
  const otherId = /Peticion: ([0-9a-f-]{36})/.exec(other.stdout)[1];
  h.state.pricing = MEMBER;
  const changed = await h.run(['assistant-submit', otherId, '--confirmed']);
  assert.notEqual(changed.code, 0);
  assert.match(changed.stderr, /El precio de tu cuenta cambió/);

  const member = await h.run(['assistant-prepare', 'image-prompter', '--message', 'Mejora este prompt.']);
  assert.match(member.stdout, /Estimacion: ~11 cr/);
  assert.match(member.stdout, /Maximo autorizado temporalmente: 48 cr/);
  const memberRequest = JSON.parse(fs.readFileSync(path.join(h.config, 'assistant-requests', /Peticion: ([0-9a-f-]{36})/.exec(member.stdout)[1] + '.json'), 'utf8'));
  assert.equal(memberRequest.price_factor, undefined, 'la petición de un miembro sin proyecto es la de la 2.3.19');
  assert.equal(memberRequest.project, undefined);
});
