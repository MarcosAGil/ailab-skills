// Prueba de integracion SIN COSTE del flujo Higgsfield (SOUL 2) contra un falso
// servidor AILAB en localhost. Arranca la CLI real (prepare -> submit) con
// AILAB_CONFIG_DIR y AILAB_CREDENTIALS_DIR temporales y comprueba el contrato de
// dos fases: el quote se pide con el tope de seguridad (1000) y el create viaja
// con el importe APROBADO en el manifiesto (50), la misma cotizacion verificada y
// el mismo client_request_id. Nunca se llama al proveedor real.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const execute = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = process.env.AILAB_TEST_RUNTIME || path.join(ROOT, 'skills/ailab/scripts/ailab.mjs');
const CATALOG = path.join(ROOT, 'skills/ailab/catalog/catalog.json');

// PNG minimo valido (1x1) para que la descarga del resultado sniffee image/png.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
const FUTURE = () => new Date(Date.now() + 10 * 60 * 1000).toISOString();
const QUOTE_ID = crypto.randomBytes(16).toString('hex');
const TASK_ID = 'hf-soul2-task-1';

const json = (res, body, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};
// Higgsfield devuelve el sobre doble del endpoint real: {ok, code, msg, data}.
const gateway = (res, data, msg = 'Presupuesto calculado.') => json(res, { ok: true, code: 200, msg, data });

async function harness(t, { balance = 1000 } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-higgsfield-flow-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'H'.repeat(48), { mode: 0o600 });

  const requests = [];
  let base;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks);
      let body = {};
      try { body = raw.length ? JSON.parse(raw.toString('utf8')) : {}; } catch { body = { unreadable: true }; }
      requests.push({ method: req.method, pathname: url.pathname, query: url.search, body, host: url.hostname });

      if (url.pathname === '/assets/soul-2.png') {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        return res.end(PNG);
      }
      // Wallet compartida: sesion y saldo.
      if (url.pathname === '/api/wallet/api.php') {
        if (body.action === 'task_costs') return json(res, { ok: true, costs: { ['higgsfield:' + TASK_ID]: 47 } });
        return json(res, { ok: true, user: { email: 'higgsfield@example.test', tier: 'hub' }, balance });
      }
      if (url.pathname === '/api/skill/higgsfield.php') {
        const action = new URL(req.url, base).searchParams.get('action');
        if (action === 'quote') {
          return gateway(res, {
            quote_id: QUOTE_ID,
            credits: 50,
            billable_seconds: 2,
            max_credits_authorized: 1000,
            expires_at: FUTURE(),
          });
        }
        if (action === 'create') return gateway(res, { taskId: TASK_ID, request_id: TASK_ID }, 'Tarea creada.');
        if (action === 'status') return gateway(res, { status: 'COMPLETED', urls: [base + 'assets/soul-2.png'] }, 'Estado consultado.');
        return json(res, { code: 400, msg: 'unknown action' }, 400);
      }
      json(res, { error: 'unexpected request ' + req.url }, 404);
    } catch (error) { json(res, { error: error.message }, 500); }
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  const output = path.join(temp, 'out');
  const env = {
    ...process.env,
    AILAB_SKIP_UPDATE: '1',
    AILAB_BASE_URL: base,
    AILAB_GENERATION_BASE_URL: base,
    AILAB_CATALOG_PATH: CATALOG,
    AILAB_OUTPUT_DIR: output,
    AILAB_CONFIG_DIR: config,
    AILAB_CREDENTIALS_DIR: credentials,
  };
  const run = (...args) => execute(process.execPath, [CLI, ...args], { env, timeout: 60000 });
  const manifestOf = (stdout) => {
    const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
    assert.ok(id, 'La CLI no publico el manifiesto:\n' + stdout);
    return { id, file: path.join(config, 'manifests', id + '.json') };
  };
  const readManifest = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  const writeManifest = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
  const of = (action) => requests.filter((r) => r.pathname === '/api/skill/higgsfield.php' && r.body.action === action);
  return { base, requests, run, manifestOf, readManifest, writeManifest, of, output };
}

test('SOUL 2: prepare cotiza con el tope y submit envia solo el importe aprobado', async (t) => {
  const h = await harness(t);
  const prepared = (await h.run('prepare', 'soul-2', '--prompt', 'portrait')).stdout;
  const manifest = h.manifestOf(prepared);
  assert.match(prepared, /Cotizacion del servidor/);
  assert.match(prepared, /coste cotizado 50 cr \(importe que se aprueba\) · techo de seguridad del servidor 1000 cr/);

  // prepare: un unico quote, con el tope de seguridad (1000), nunca con el coste.
  const quotes = h.of('quote');
  assert.equal(quotes.length, 1);
  assert.equal(quotes[0].body.max_credits_authorized, 1000);
  assert.equal(quotes[0].body.model, 'higgsfield-soul-2');
  assert.equal(quotes[0].body.input.prompt, 'portrait');
  assert.match(quotes[0].body.client_request_id, /^[0-9a-f-]{36}$/);

  const frozen = h.readManifest(manifest.file);
  assert.equal(frozen.quote_id, QUOTE_ID);
  assert.equal(frozen.quote_estimated_credits, 50);
  assert.equal(frozen.quote_max_credits, 50);
  assert.equal(frozen.quote_ceiling_credits, 1000);
  assert.equal(frozen.estimated_credits, 50);
  assert.equal(frozen.max_credits_authorized, 50, 'El manifiesto aprueba el coste cotizado, no el techo de seguridad.');
  assert.equal(frozen.client_request_id, quotes[0].body.client_request_id, 'El quote y el manifiesto comparten client_request_id.');
  assert.equal(frozen.submitted_task, undefined, 'prepare no debe enviar nada.');
  assert.equal(h.of('create').length, 0, 'prepare no debe llamar a create.');

  const submitted = (await h.run('submit', manifest.id, '--confirmed', '--output', h.output)).stdout;
  const creates = h.of('create');
  assert.equal(creates.length, 1, 'submit debe llamar a create exactamente una vez.');
  assert.equal(creates[0].body.action, 'create');
  assert.equal(creates[0].body.max_credits_authorized, 50, 'create envia el importe APROBADO, no el techo de 1000.');
  assert.equal(creates[0].body.quote_id, QUOTE_ID);
  assert.equal(creates[0].body.client_request_id, frozen.client_request_id, 'create reutiliza el client_request_id del manifiesto.');
  assert.equal(h.of('quote').length, 1, 'submit no debe recotizar.');

  assert.ok(submitted.includes('Tarea encolada: higgsfield:' + TASK_ID), submitted);
  const statuses = h.requests.filter((r) => r.pathname === '/api/skill/higgsfield.php' && r.query.includes('action=status'));
  assert.ok(statuses.length >= 1);
  assert.ok(statuses[0].query.includes('taskId=' + TASK_ID));
  assert.match(submitted, /Guardado: .*soul-2.*\.png/);
  assert.match(submitted, /Coste real: 47 cr/);
  assert.equal(new Set(h.requests.map((r) => r.host)).size, 1);
  assert.equal(h.requests[0].host, '127.0.0.1', 'Toda la prueba debe vivir en localhost.');
});

test('SOUL 2: submit exige --confirmed y no envia nada', async (t) => {
  const h = await harness(t);
  const prepared = (await h.run('prepare', 'soul-2', '--prompt', 'portrait')).stdout;
  const manifest = h.manifestOf(prepared);
  await assert.rejects(h.run('submit', manifest.id), /Falta la confirmacion/);
  assert.equal(h.of('create').length, 0);
});

test('SOUL 2: una cotizacion caducada no llega al proveedor', async (t) => {
  const h = await harness(t);
  const prepared = (await h.run('prepare', 'soul-2', '--prompt', 'portrait')).stdout;
  const manifest = h.manifestOf(prepared);
  const frozen = h.readManifest(manifest.file);
  h.writeManifest(manifest.file, { ...frozen, quote_expires_at: new Date(Date.now() - 60000).toISOString() });
  await assert.rejects(h.run('submit', manifest.id, '--confirmed'), /caducado/);
  assert.equal(h.of('create').length, 0);
});

test('SOUL 2: un maximo aprobado distinto del cotizado no llega al proveedor', async (t) => {
  const h = await harness(t);
  const prepared = (await h.run('prepare', 'soul-2', '--prompt', 'portrait')).stdout;
  const manifest = h.manifestOf(prepared);
  const frozen = h.readManifest(manifest.file);
  h.writeManifest(manifest.file, { ...frozen, quote_max_credits: 80 });
  await assert.rejects(h.run('submit', manifest.id, '--confirmed'), /no coincide con la cotizacion aprobada/);
  assert.equal(h.of('create').length, 0);
});

test('SOUL 2: una aprobacion por encima del tope del contrato no llega al proveedor', async (t) => {
  const h = await harness(t, { balance: 10000 });
  const prepared = (await h.run('prepare', 'soul-2', '--prompt', 'portrait')).stdout;
  const manifest = h.manifestOf(prepared);
  const frozen = h.readManifest(manifest.file);
  h.writeManifest(manifest.file, { ...frozen, max_credits_authorized: 5000, quote_max_credits: 5000 });
  await assert.rejects(h.run('submit', manifest.id, '--confirmed'), /supera el tope del contrato/);
  assert.equal(h.of('create').length, 0);
});
