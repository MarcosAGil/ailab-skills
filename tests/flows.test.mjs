import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CANONICAL, canRunParity } from './helpers/php.mjs';
import { neutral, FLOWS } from '../skills/ailab/scripts/lib/flows.mjs';
import { guideText } from '../skills/ailab/scripts/lib/guide.mjs';

// Comando `flow` de la skill 2.3.17 contra el PHP REAL de AILAB (contrato de AILAB
// docs/operations/clientes-flujos-2026-11-03.md). El banco es el de AILAB (`tests/helpers/flows-bank.cjs`): copia
// temporal de app/api, SQLite aislada y proveedores simulados en local. Sin red, sin claves y sin gasto.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'skills/ailab/scripts/ailab.mjs');
const BANK = CANONICAL ? path.join(CANONICAL, 'tests/helpers/flows-bank.cjs') : '';
const parity = { skip: !(canRunParity() && BANK && fs.existsSync(BANK)) && 'Necesita AILAB_CANONICAL_REPO con el módulo Clientes y PHP' };
const TEXT = 'Hola, soy Luismi y hoy os traigo la cafetera de la oficina.';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cliEnv(temp, base) {
  return {
    ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', PG_NO_OPEN: '1', AILAB_POLL_MS: '300',
    AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
    AILAB_CATALOG_PATH: path.join(ROOT, 'skills/ailab/catalog/catalog.json'),
    AILAB_CONFIG_DIR: path.join(temp, 'config'), AILAB_CREDENTIALS_DIR: path.join(temp, 'credentials'),
    AILAB_OUTPUT_DIR: path.join(temp, 'salida'),
  };
}

// La CLI se ejecuta en segundo plano: los proveedores simulados viven en este mismo proceso.
function cli(env, args, { input } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    // Una espera colgada no debe dejar el banco abierto: se corta y la prueba falla por el estado.
    const timer = setTimeout(() => child.kill(), 90000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

const lastJson = (text) => JSON.parse(text.trim().split('\n').filter((line) => line.startsWith('{')).pop());

async function loadBank() {
  return createRequire(import.meta.url)(BANK);
}

// Marca como terminada en el proveedor simulado la tarea del último paso enviado de ese flujo.
async function finishProvider(b, flow, { fail = false } = {}) {
  for (let i = 0; i < 200; i++) {
    const row = b.q("SELECT task_id FROM ailab_flow_steps WHERE flow = ? AND state = 'en_curso' AND task_id IS NOT NULL AND task_id != '' ORDER BY id DESC LIMIT 1", [flow])[0];
    if (row) {
      if (flow === 'toma') b.kieDone(row.task_id);
      if (flow === 'separar') b.falDone(row.task_id.slice(4), fail);
      b.unthrottle();
      return row.task_id;
    }
    await sleep(50);
  }
  throw new Error('El paso ' + flow + ' no llegó al proveedor simulado.');
}

function setup(t, b, client) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-flujos-cli-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  fs.mkdirSync(path.join(temp, 'credentials'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'credentials', 'token'), client.token + '\n', { mode: 0o600 });
  return { temp, env: cliEnv(temp, b.origin + '/app/') };
}

// Nada interno en la salida: ni prompts, ni banco, ni voz, ni modelos, ni proveedores, ni direcciones.
function assertQuiet(b, assertNeutral, temp, ...results) {
  for (const r of results) {
    // La única dirección que imprime la CLI es la página de tokens de la cuenta (login), que es de AILAB.
    const text = (r.stdout + '\n' + r.stderr).split(temp).join('<tmp>').split(ROOT).join('<skill>')
      .split('\n').filter((line) => !line.startsWith('1. Crea un token en: ')).join('\n');
    assertNeutral(text, b);
    assert.doesNotMatch(text, /seedance|nano-banana|modelo:|provider/i);
  }
}

test('las utilidades del flujo son neutras y la guía documenta el comando', () => {
  assert.deepEqual(FLOWS, ['guion', 'toma', 'separar', 'aislar', 'voz']);
  assert.equal(neutral('Falló https://proveedor.example/x?y=1 al bajar'), 'Falló [enlace omitido] al bajar');
  const guide = guideText({ version: '2.3.17', run: (sub) => sub });
  assert.match(guide, /flow prepare/);
  assert.match(guide, /flow close/);
});

test('flow valida en local sin red ni gasto', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-flujos-local-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const env = cliEnv(temp, 'http://127.0.0.1:9/');
  const noCode = await cli(env, ['flow', 'prepare', 'toma', '--take', '1', '--text', TEXT]);
  assert.notEqual(noCode.status, 0);
  assert.match(noCode.stderr, /Falta --code/);
  const badFlow = await cli(env, ['flow', 'prepare', 'video', '--code', 'NOV26-01']);
  assert.match(badFlow.stderr, /Flujo no válido/);
  const noTake = await cli(env, ['flow', 'prepare', 'toma', '--code', 'NOV26-01', '--text', TEXT, '--json']);
  assert.equal(lastJson(noTake.stdout).ok, false);
  assert.match(lastJson(noTake.stdout).error, /Falta --take/);
  const noRequest = await cli(env, ['flow', 'submit', 'a'.repeat(32), '--confirmed']);
  assert.match(noRequest.stderr, /no encontrada/);
  const badUsed = await cli(env, ['flow', 'close', '--code', 'NOV26-01', '--final-seconds', '20', '--used', 'uno']);
  assert.match(badUsed.stderr, /toma:versión/);
});

test('recorrido completo de una cuenta de cliente: login, doctor, abrir, guion, toma, separar, aislar, voz y cerrar', parity, async (t) => {
  const { flowsBank, assertNeutral, wav, PROMPT_MARK } = await loadBank();
  const b = await flowsBank(t);
  const c = await b.createClient();
  const { temp, env } = setup(t, b, c);
  fs.rmSync(path.join(temp, 'credentials', 'token'));

  // login: `me` responde 403 a la cuenta de cliente; se valida con el estado de sus flujos y el token se guarda.
  const login = await cli(env, ['login'], { input: c.token + '\n' });
  assert.equal(login.status, 0, login.stderr + login.stdout);
  assert.match(login.stdout, /cuenta de cliente · saldo 10000 cr/);
  assert.equal(fs.readFileSync(path.join(temp, 'credentials', 'token'), 'utf8').trim(), c.token);
  const doctor = await cli(env, ['doctor']);
  assert.equal(doctor.status, 0, doctor.stdout + doctor.stderr);
  assert.match(doctor.stdout, /^OK · Autenticacion: cuenta de cliente · saldo 10000 cr$/m);
  assert.match(doctor.stdout, /^OK · Mes: \d{4}-\d{2} · gastado 0 cr · sin límite mensual · 0 vídeos$/m);
  assert.match(doctor.stdout, /^OK · Cuenta: activa$/m);
  const balance = await cli(env, ['balance']);
  assert.match(balance.stdout, /Cuenta de cliente · saldo 10000 cr/);
  const models = await cli(env, ['prepare', 'nano-banana-2-lite', '--prompt', 'x']);
  assert.notEqual(models.status, 0);
  assert.match(models.stderr, /cuenta de cliente/);

  const status = await cli(env, ['flow', 'status', '--json']);
  assert.deepEqual({ ...lastJson(status.stdout), month: undefined }, { ok: true, month: undefined, balance_cr: 10000, limit_cr: 0, spent_month_cr: 0, videos_month: 0, paused: false });

  const opened = await cli(env, ['flow', 'open', '--case', 'servicio-empresas', '--json']);
  assert.equal(opened.status, 0, opened.stderr);
  const code = lastJson(opened.stdout).code;
  assert.match(code, /^[A-Z]{3}\d{2}-01$/);
  const again = await cli(env, ['flow', 'open', '--case', 'servicio-empresas', '--request-id', lastJson(opened.stdout).request_id]);
  assert.match(again.stdout, new RegExp('Código: ' + code));

  const out = path.join(temp, 'salida', code);
  const results = [login, doctor, balance, status, opened, again];
  const run = async (args, flow) => {
    const pending = cli(env, args);
    if (flow) await finishProvider(b, flow);
    const r = await pending;
    results.push(r);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r;
  };

  const guion = await run(['flow', 'prepare', 'guion', '--code', code, '--idea', 'Café para oficinas'], null);
  assert.match(guion.stdout, /Coste máximo: \d+ cr \(se cobra el consumo real\)/);
  const guionQuote = /Cotización: ([a-f0-9]{32})/.exec(guion.stdout)[1];
  const guionDone = await run(['flow', 'submit', guionQuote, '--confirmed', '--output', out, '--json'], null);
  const guionJob = lastJson(guionDone.stdout);
  assert.equal(guionJob.markdown, '## Toma 1\nHola, soy Luismi.\n> broll: cafetera');
  assert.equal(guionJob.files[0].name, code + '_guion.md');
  assert.equal(fs.readFileSync(guionJob.files[0].path, 'utf8'), guionJob.markdown);

  const take = await run(['flow', 'prepare', 'toma', '--code', code, '--take', '1', '--text', TEXT], null);
  assert.match(take.stdout, /^Flujo: toma · vídeo [A-Z0-9-]+ · toma 1$/m);
  assert.match(take.stdout, /^Coste: 129 cr · sin gasto todavía\.$/m);
  assert.equal(b.seen.kie.length, 0, 'prepare no llama al proveedor');
  const takeQuote = /Cotización: ([a-f0-9]{32})/.exec(take.stdout)[1];
  const takeDone = await run(['flow', 'submit', takeQuote, '--confirmed', '--output', out], 'toma');
  assert.match(takeDone.stdout, new RegExp('^Guardado: .*' + code + '_toma-1_v1\\.mp4 \\(video/mp4, \\d+KB\\)$', 'm'));
  assert.match(takeDone.stdout, /^Duración: 10\.04 s$/m);
  assert.match(takeDone.stdout, /^Coste real: 129 cr · saldo \d+ cr$/m);
  assert.equal(b.seen.kie.length, 1);
  assert.equal(b.seen.kie[0].input.prompt, PROMPT_MARK + ' Luismi dice a cámara: ' + TEXT);

  // El audio local sube por api/skill/upload.php con el token de cliente y el flujo lo usa por su dirección.
  const audio = path.join(temp, 'toma-1.wav');
  fs.writeFileSync(audio, wav(10));
  const sep = await run(['flow', 'prepare', 'separar', '--code', code, '--take', '1', '--version', '1', '--audio', audio, '--attempt', '1', '--json'], null);
  assert.equal(lastJson(sep.stdout).credits, 11);
  assert.equal(lastJson(sep.stdout).attempt, 1);
  const sepDone = await run(['flow', 'submit', lastJson(sep.stdout).quote_id, '--confirmed', '--output', out, '--json'], 'separar');
  const separated = lastJson(sepDone.stdout);
  assert.deepEqual(separated.files.map((f) => [f.kind, f.name]), [['voice', code + '_toma-1_v1_voz_intento-1.wav'], ['ambient', code + '_toma-1_v1_ambiente_intento-1.wav']]);
  assert.equal(separated.has_more, true);
  assert.deepEqual(separated.qc, { toleranciaDuracionS: 0.15, minCorrelacion: 0.7 });
  assert.ok(b.seen.fal[0].body.audio_url.includes('/app/api/skill/uploads/'));

  const iso = await run(['flow', 'prepare', 'aislar', '--code', code, '--take', '1', '--audio', separated.files[0].path, '--json'], null);
  const isoDone = await run(['flow', 'submit', lastJson(iso.stdout).quote_id, '--confirmed', '--output', out, '--json'], null);
  assert.equal(lastJson(isoDone.stdout).state, 'completado');
  assert.equal(lastJson(isoDone.stdout).files.length, 1);

  const voice = await run(['flow', 'prepare', 'voz', '--code', code, '--take', '1', '--audio', separated.files[0].path], null);
  const voiceDone = await run(['flow', 'submit', /Cotización: ([a-f0-9]{32})/.exec(voice.stdout)[1], '--confirmed', '--output', out], null);
  assert.match(voiceDone.stdout, /^Nivel del ambiente: -12 dB$/m);
  assert.match(voiceDone.stdout, new RegExp('Guardado: .*' + code + '_toma-1_v1_voz-final\\.mp3'));

  // Repetir la toma crea una versión nueva; el cierre usa la v2 y descarta la v1.
  const retake = await run(['flow', 'prepare', 'toma', '--code', code, '--take', '1', '--text', TEXT + ' Otra vez.', '--json'], null);
  const retakeDone = await run(['flow', 'submit', lastJson(retake.stdout).quote_id, '--confirmed', '--output', out, '--json'], 'toma');
  assert.equal(lastJson(retakeDone.stdout).version, 2);
  assert.equal(lastJson(retakeDone.stdout).files[0].name, code + '_toma-1_v2.mp4');
  const job = await run(['flow', 'job', lastJson(retakeDone.stdout).job_id, '--output', path.join(temp, 'otra'), '--json'], null);
  assert.equal(lastJson(job.stdout).files[0].name, code + '_toma-1_v2.mp4');

  const closed = await run(['flow', 'close', '--code', code, '--final-seconds', '9.5', '--used', '1:v2', '--json'], null);
  const video = lastJson(closed.stdout).video;
  assert.deepEqual([video.code, video.status, video.final_seconds, video.takes_generated, video.takes_needed, video.extra_takes], [code, 'entregado', 9.5, 2, 1, 1]);
  assert.equal(video.real_cr, undefined, 'el coste real interno no se imprime');
  assert.deepEqual(b.q('SELECT take, version, state FROM ailab_flow_takes ORDER BY version').map((r) => [r.take, r.version, r.state]), [[1, 1, 'descartada'], [1, 2, 'usada']]);
  assertQuiet(b, assertNeutral, temp, ...results);
  // Las solicitudes locales tampoco guardan nada interno.
  for (const name of fs.readdirSync(path.join(temp, 'config', 'flows'))) assertNeutral(fs.readFileSync(path.join(temp, 'config', 'flows', name), 'utf8'), b);
});

test('reintento idempotente: una respuesta perdida se repite con la misma petición y cobra una sola vez', parity, async (t) => {
  const { flowsBank, assertNeutral } = await loadBank();
  const b = await flowsBank(t);
  const c = await b.createClient();
  // Proxy que entrega la confirmación a AILAB y corta la respuesta: el cliente no sabe si llegó.
  let drop = 1;
  const proxy = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const headers = { ...req.headers };
    for (const key of ['host', 'connection', 'content-length', 'transfer-encoding']) delete headers[key];
    const upstream = await fetch(b.origin + req.url, { method: req.method, headers, body: req.method === 'GET' ? undefined : body });
    const payload = Buffer.from(await upstream.arrayBuffer());
    if (drop > 0 && body.includes('"action":"confirm"')) { drop--; return req.socket.destroy(); }
    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => { if (!['content-length', 'transfer-encoding', 'content-encoding', 'connection'].includes(key)) res.setHeader(key, value); });
    res.end(payload);
  });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { proxy.closeAllConnections?.(); proxy.close(resolve); }));
  const { temp, env } = setup(t, b, c);
  const proxied = { ...env, AILAB_BASE_URL: `http://127.0.0.1:${proxy.address().port}/app/`, AILAB_GENERATION_BASE_URL: `http://127.0.0.1:${proxy.address().port}/app/` };

  const code = lastJson((await cli(proxied, ['flow', 'open', '--case', 'servicio-empresas', '--json'])).stdout).code;
  const before = b.balance(c.userId);
  const prepared = await cli(proxied, ['flow', 'prepare', 'toma', '--code', code, '--take', '2', '--text', TEXT, '--json']);
  const quote = lastJson(prepared.stdout).quote_id;
  const pending = cli(proxied, ['flow', 'submit', quote, '--confirmed', '--output', path.join(temp, 'salida'), '--json']);
  await finishProvider(b, 'toma');
  const first = await pending;
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.equal(drop, 0, 'la primera confirmación se perdió');
  assert.equal(b.seen.kie.length, 1, 'una sola llamada al proveedor');
  const record = JSON.parse(fs.readFileSync(path.join(temp, 'config', 'flows', quote + '.json'), 'utf8'));
  assert.equal(b.q('SELECT COUNT(*) AS n FROM ailab_flow_jobs WHERE client_request_id = ?', [record.client_request_id])[0].n, 1);

  // Repetir el comando entero tampoco cobra otra vez: el trabajo ya está guardado en la solicitud.
  const second = await cli(proxied, ['flow', 'submit', quote, '--confirmed', '--output', path.join(temp, 'salida'), '--json']);
  assert.equal(second.status, 0, second.stdout + second.stderr);
  assert.equal(lastJson(second.stdout).job_id, lastJson(first.stdout).job_id);
  // Aunque se pierda la solicitud local del trabajo, la misma petición devuelve el mismo trabajo.
  fs.writeFileSync(path.join(temp, 'config', 'flows', quote + '.json'), JSON.stringify({ ...record, job_id: null }));
  const third = await cli(proxied, ['flow', 'submit', quote, '--confirmed', '--output', path.join(temp, 'salida'), '--json']);
  assert.equal(lastJson(third.stdout).job_id, lastJson(first.stdout).job_id);
  assert.equal(b.seen.kie.length, 1);
  assert.equal(b.balance(c.userId), before - 129);
  assert.deepEqual(b.ledger(c.userId).filter((r) => r.type === 'deduct').map((r) => r.credits), [-129]);
  assertQuiet(b, assertNeutral, temp, prepared, first, second, third);
});

test('fallo sin cobro: el rechazo del proveedor llega como mensaje neutro y no se cobra', parity, async (t) => {
  const { flowsBank, assertNeutral, wav } = await loadBank();
  const b = await flowsBank(t);
  const c = await b.createClient();
  const { temp, env } = setup(t, b, c);
  const code = lastJson((await cli(env, ['flow', 'open', '--case', 'segunda-mano', '--json'])).stdout).code;
  const before = b.balance(c.userId);
  b.control.kie = { status: 200, body: { code: 422, msg: 'prompt rechazado por la política del proveedor' } };
  const prepared = await cli(env, ['flow', 'prepare', 'toma', '--code', code, '--take', '1', '--text', TEXT, '--json']);
  const failed = await cli(env, ['flow', 'submit', lastJson(prepared.stdout).quote_id, '--confirmed', '--json']);
  assert.equal(failed.status, 1);
  const view = lastJson(failed.stdout);
  assert.deepEqual([view.ok, view.state, view.credits], [false, 'fallido', 0]);
  assert.match(view.error, /No se ha cobrado nada/);
  assert.doesNotMatch(failed.stdout + failed.stderr, /política|rechazado/);
  const text = await cli(env, ['flow', 'submit', lastJson(prepared.stdout).quote_id, '--confirmed']);
  assert.equal(text.status, 1);
  assert.match(text.stdout, /El paso no se ha completado: La toma no se ha podido completar\. No se ha cobrado nada\./);

  // Separación fallida en el proveedor: sin archivos y sin cobro.
  b.control.kie = 'ok';
  const audio = path.join(temp, 'a.wav');
  fs.writeFileSync(audio, wav(10));
  const sep = await cli(env, ['flow', 'prepare', 'separar', '--code', code, '--take', '1', '--audio', audio, '--json']);
  const pending = cli(env, ['flow', 'submit', lastJson(sep.stdout).quote_id, '--confirmed', '--json']);
  await finishProvider(b, 'separar', { fail: true });
  const sepFailed = await pending;
  assert.equal(sepFailed.status, 1);
  assert.equal(lastJson(sepFailed.stdout).state, 'fallido');
  // Un audio que no es de la cuenta se rechaza al preparar, sin gasto.
  const foreign = await cli(env, ['flow', 'prepare', 'voz', '--code', code, '--take', '1', '--audio', 'https://otro.example/audio.wav']);
  assert.notEqual(foreign.status, 0);
  assert.match(foreign.stderr, /No se ha cobrado nada/);
  assert.equal(b.balance(c.userId), before);
  assert.deepEqual(b.ledger(c.userId).filter((r) => r.type === 'deduct' && r.credits < 0), []);
  assertQuiet(b, assertNeutral, temp, prepared, failed, text, sep, sepFailed, foreign);
});

test('límite mensual y cuenta en pausa: la CLI explica el motivo sin gastar', parity, async (t) => {
  const { flowsBank, assertNeutral } = await loadBank();
  const b = await flowsBank(t);
  const c = await b.createClient({ limit: 100 });
  const { temp, env } = setup(t, b, c);
  const doctor = await cli(env, ['doctor']);
  assert.match(doctor.stdout, /^OK · Mes: .* · gastado 0 cr de 100 cr · quedan 100 cr · 0 vídeos$/m);
  const code = lastJson((await cli(env, ['flow', 'open', '--case', 'servicio-empresas', '--json'])).stdout).code;
  const over = await cli(env, ['flow', 'prepare', 'toma', '--code', code, '--take', '1', '--text', TEXT]);
  assert.notEqual(over.status, 0);
  assert.match(over.stderr, /supera el límite de gasto de este mes\. No se ha cobrado nada\./);
  await b.admin('client_save', { id: c.id, name: 'Café Ejemplo', email: 'cafe@cliente.test', status: 'pausado', limit_cr: 100, pricing_mode: 'medicion', prices: {} });
  const paused = await cli(env, ['doctor']);
  assert.equal(paused.status, 1);
  assert.match(paused.stdout, /^FALLO · Cuenta: en pausa/m);
  assert.equal(b.seen.kie.length, 0);
  assertQuiet(b, assertNeutral, temp, doctor, over, paused);
});
