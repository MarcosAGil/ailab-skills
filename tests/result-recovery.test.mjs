import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = promisify(execFile);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

async function fixture(t, { model = 'genjutsu', stored = 'pending', receipt = true, payload, gatewayError = false, partial = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-recovery-'));
  const config = path.join(dir, 'config');
  const credentials = path.join(dir, 'credentials');
  const prefix = model === 'midjourney' ? 'apimart' : 'higgsfield';
  const id = prefix + ':existing-task';
  const receiptPath = path.join(config, 'tasks', crypto.createHash('sha256').update(id).digest('hex') + '.json');
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'T'.repeat(48));
  if (receipt) fs.writeFileSync(receiptPath, JSON.stringify({ task_id: id, model_id: model, completed_at: null, task_ref: { serverTaskId: id, costTaskId: id, providerRequestId: 'existing-task' } }));
  const calls = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    const url = new URL(req.url, base);
    calls.push({ pathname: url.pathname, query: url.search, body });
    const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    if (url.pathname === '/result.png') { res.setHeader('Content-Type', 'image/png'); return res.end(png); }
    if (url.pathname === '/missing.png') { res.writeHead(404); return res.end('missing'); }
    if (url.pathname === '/api/wallet/api.php') return json(body.action === 'task_costs' ? { ok: true, costs: { [id]: 556 } } : { ok: true, balance: 1000, user: { tier: 'hub' } });
    if (url.pathname === '/api/v1/skill/task.php') return json({ ok: true, task: {
      task_id: id, model_id: model === 'genjutsu' ? 'higgsfield-genjutsu-motion-transfer' : model,
      state: stored, charged_credits: stored === 'success' ? 556 : null,
      result_urls: stored === 'success' ? [base + 'result.png'] : [],
    } });
    if (url.pathname.endsWith('higgsfield.php') || url.pathname.endsWith('apimart-gateway.php')) {
      assert.equal(url.searchParams.get('action'), 'status', 'La recuperacion nunca crea generaciones');
      if (prefix === 'higgsfield') assert.equal(url.searchParams.get('taskId'), 'existing-task');
      if (gatewayError) return json({ code: 502, msg: 'No se pudo consultar el estado' });
      const data = payload ? payload(base) : { status: 'COMPLETED', images: [base + 'result.png', ...(partial ? [base + 'missing.png'] : [])] };
      return json({ code: 200, data });
    }
    res.writeHead(404); res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); });
  let result;
  try {
    result = await execute(process.execPath, [process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs'), 'status', id], { timeout: 20000, env: {
      ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
      AILAB_CATALOG_PATH: path.join(root, 'skills/ailab/catalog/catalog.json'), AILAB_CONFIG_DIR: config,
      AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(dir, 'out'),
    } });
    result.code = 0;
  } catch (error) { result = error; }
  return { result, calls, receiptPath };
}

for (const [name, payload] of [
  ['video.url', base => ({ status: 'completed', video: { url: base + 'result.png' } })],
  ['images', base => ({ status: 'completed', images: [{ url: base + 'result.png' }] })],
  ['output.video', base => ({ status: 'complete', output: { video: { url: base + 'result.png' } } })],
]) test('Higgsfield recupera el formato real ' + name, async t => {
  const h = await fixture(t, { payload });
  assert.equal(h.result.code, 0, h.result.stdout + h.result.stderr);
  assert.match(h.result.stdout, /Guardado:/);
  assert.doesNotMatch(h.result.stdout, /sin cargo/);
});

for (const model of ['genjutsu', 'midjourney']) test(model + ': con recibo local prioriza el resultado persistido', async t => {
  const h = await fixture(t, { model, stored: 'success', gatewayError: true });
  assert.equal(h.result.code, 0, h.result.stdout);
  assert.match(h.result.stdout, /Guardado:/);
  assert.equal(h.calls.filter(c => c.pathname.endsWith('gateway.php') || c.pathname.endsWith('higgsfield.php')).length, 0);
});

test('Higgsfield recupera desde otro equipo con el modelo interno y elimina el prefijo', async t => {
  const h = await fixture(t, { receipt: false });
  assert.equal(h.result.code, 0, h.result.stdout + h.result.stderr);
  assert.match(h.result.stdout, /Tarea recuperada/);
});

test('completado sin URL sigue recuperable y no afirma fallo o gratuidad', async t => {
  const h = await fixture(t, { payload: () => ({ status: 'COMPLETED' }) });
  assert.notEqual(h.result.code, 0);
  assert.match(h.result.stdout, /no vuelvas a generar/);
  assert.doesNotMatch(h.result.stdout, /La generacion fallo|sin cargo/);
  assert.equal(JSON.parse(fs.readFileSync(h.receiptPath)).completed_at, null);
});

test('Midjourney: un error de consulta conserva ID y recibo', async t => {
  const h = await fixture(t, { model: 'midjourney', gatewayError: true });
  assert.match(h.result.stdout, /No se pudo confirmar el estado/);
  assert.match(h.result.stdout, /status apimart:existing-task/);
  assert.doesNotMatch(h.result.stdout, /sin cargo/);
});

test('Midjourney: descarga parcial no marca completa la entrega', async t => {
  const h = await fixture(t, { model: 'midjourney', partial: true });
  assert.notEqual(h.result.code, 0);
  assert.match(h.result.stdout, /faltan archivos por descargar/);
  assert.equal(JSON.parse(fs.readFileSync(h.receiptPath)).completed_at, null);
});
