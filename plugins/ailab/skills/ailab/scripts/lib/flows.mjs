// Comando `flow` (skill 2.3.17): flujos de producción de las cuentas de cliente de AILAB
// (api/v1/flows/, contrato docs/operations/clientes-flujos-2026-11-03.md en AILAB).
//
// Mismo patrón que prepare/submit del catálogo: `flow prepare` cotiza sin gastar y guarda una
// solicitud local; `flow submit <id> --confirmed` gasta con un client_request_id persistido ANTES de
// enviar, de modo que repetir el comando nunca cobra dos veces. La salida es neutra por diseño: solo se
// imprimen campos de una lista cerrada, nunca prompts, modelos, proveedores ni direcciones de descarga.
// No usa el catálogo: los flujos viven en el runtime y el servidor decide modelo, precio y perfil.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_DIR, ensureConfigDir } from './config.mjs';
import { flowsPost, flowsFile, uploadPath, explain, errorCode } from './http.mjs';
import { inspectFile } from './files.mjs';
import { resolveOutputDir } from './output.mjs';
import { checkProject } from './account.mjs';

export const FLOWS = ['guion', 'toma', 'separar', 'aislar', 'voz'];
const AUDIO_FLOWS = ['separar', 'aislar', 'voz'];
const CODE_RE = /^[A-Z]{3}\d{2}-\d{2,3}$/;
const QUOTE_RE = /^[a-f0-9]{32}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POLL_MS = Number(process.env.AILAB_POLL_MS) > 0 ? Number(process.env.AILAB_POLL_MS) : 5000;
const TIMEOUT_MS = { toma: 45 * 60 * 1000, default: 15 * 60 * 1000 };
const TRANSIENT_MAX_STREAK = 8;
const TRANSIENT_MAX_WAIT_MS = 2 * 60 * 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const AUDIO_EXT = { 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/flac': 'flac', 'audio/x-flac': 'flac', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg', 'audio/aac': 'aac', 'audio/opus': 'opus', 'application/ogg': 'ogg' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Defensa en profundidad: el servidor ya responde con mensajes neutros, pero ninguna dirección llega a la salida.
export function neutral(value) {
  return String(value ?? '').replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, '[enlace omitido]').slice(0, 600);
}

export function flowsErrorText(n) {
  if (['session_expired', 'rate_limited', 'network', 'timeout'].includes(n.kind)) return explain(n);
  if (n.kind === 'insufficient_balance') return neutral(n.message || 'Saldo insuficiente.') + ' Pide a tu gestor que cargue créditos.';
  return neutral(n.message || 'Error inesperado del servidor.');
}

// Código de máquina del servidor (`project_required`, `invalid_project`, `client_update_required`, `price_changed`...)
// para la salida `--json`: quien llama distingue la causa sin leer el texto. Un 426 sin código es `client_update_required`.
export function serverCode(n) {
  const code = n && !n.ok ? errorCode(n) : null;
  if (typeof code === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(code)) return { code };
  if (n && (n.kind === 'client_update_required' || n.httpStatus === 426)) return { code: 'client_update_required' };
  return {};
}

const transient = (n) => ['network', 'timeout', 'server_error', 'invalid_response', 'rate_limited'].includes(n.kind);

// ---------------------------------------------------------------------------
// Solicitudes locales (una por cotización), con permisos 0600.
// ---------------------------------------------------------------------------

const requestsDir = () => path.join(CONFIG_DIR, 'flows');

function requestPath(id) {
  return QUOTE_RE.test(String(id || '')) ? path.join(requestsDir(), id + '.json') : null;
}

function saveRequest(record) {
  ensureConfigDir();
  fs.mkdirSync(requestsDir(), { recursive: true, mode: 0o700 });
  const file = requestPath(record.quote_id);
  if (!file) throw new Error('Cotización no válida.');
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(record, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch { /* Windows */ }
}

function loadRequest(id) {
  const file = requestPath(id);
  if (!file || !fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// ---------------------------------------------------------------------------
// Vistas: listas cerradas de campos. Lo que no está aquí no se imprime.
// ---------------------------------------------------------------------------

function pick(source, keys) {
  const out = {};
  for (const key of keys) if (source && source[key] !== undefined && source[key] !== null) out[key] = source[key];
  return out;
}

export function statusView(raw) {
  return pick(raw, ['month', 'balance_cr', 'limit_cr', 'spent_month_cr', 'remaining_month_cr', 'videos_month', 'paused']);
}

export function statusLines(view) {
  const lines = ['Cuenta de cliente · saldo ' + view.balance_cr + ' cr'];
  const limit = Number(view.limit_cr) > 0 ? ' · límite ' + view.limit_cr + ' cr · quedan ' + view.remaining_month_cr + ' cr' : ' · sin límite mensual';
  lines.push('Mes ' + view.month + ': gastado ' + view.spent_month_cr + ' cr' + limit + ' · ' + view.videos_month + ' vídeos');
  lines.push('Estado: ' + (view.paused ? 'en pausa (no se puede gastar; habla con tu gestor)' : 'activa'));
  return lines;
}

export async function fetchFlowsStatus() {
  const r = await flowsPost({ action: 'status' });
  return r.ok ? { ok: true, view: statusView(r.raw) } : { ok: false, error: flowsErrorText(r), response: r, ...serverCode(r) };
}

function qcView(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(key) && typeof item === 'number' && Number.isFinite(item)) out[key] = item;
  }
  return out;
}

function jobView(raw) {
  const view = pick(raw, ['job_id', 'flow', 'code', 'take', 'version', 'attempt', 'state', 'credits']);
  view.message = neutral(raw.message || '');
  if (raw.state === 'completado') {
    if (raw.flow === 'separar') { view.has_more = Boolean(raw.has_more); view.qc = qcView(raw.qc); }
    if (raw.flow === 'voz' && typeof raw.ambient_db === 'number') view.ambient_db = raw.ambient_db;
    if (raw.flow === 'toma' && typeof raw.seconds === 'number') view.seconds = raw.seconds;
    if (raw.flow === 'guion' && typeof raw.markdown === 'string') view.markdown = raw.markdown;
  }
  return view;
}

const VIDEO_KEYS = ['code', 'case', 'status', 'opened_at', 'closed_at', 'final_seconds', 'gen_seconds', 'takes_needed', 'takes_generated', 'extra_takes', 'charged_cr', 'errors'];

// ---------------------------------------------------------------------------
// Utilidades de argumentos
// ---------------------------------------------------------------------------

function makeIo({ out, fail }, opts) {
  const json = Boolean(opts.json);
  return {
    json,
    say: (line) => { if (!json) out(line); },
    done: (obj) => { if (json) out(JSON.stringify({ ok: true, ...obj })); },
    die: (message, extra = {}) => {
      if (json) { out(JSON.stringify({ ok: false, error: message, ...extra })); process.exit(1); }
      fail(message);
    },
  };
}

function one(io, opts, key) {
  const value = opts[key];
  if (Array.isArray(value)) io.die('--' + key + ' solo puede aparecer una vez.');
  if (value === true) io.die('--' + key + ' necesita un valor.');
  return value === undefined ? undefined : String(value);
}

function many(opts, key) {
  if (opts[key] === undefined) return [];
  return (Array.isArray(opts[key]) ? opts[key] : [opts[key]]).map(String);
}

function textOpt(io, opts, key) {
  const direct = one(io, opts, key);
  const file = one(io, opts, key + '-file');
  if (direct !== undefined && file !== undefined) io.die('Usa --' + key + ' o --' + key + '-file, no ambos.');
  if (file === undefined) return direct;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 100 * 1024) io.die('--' + key + '-file debe ser un archivo de texto de hasta 100 KB.');
    return fs.readFileSync(file, 'utf8');
  } catch (e) { return io.die('No se pudo leer --' + key + '-file: ' + (e && e.message ? e.message : e)); }
}

function codeOpt(io, opts) {
  const code = one(io, opts, 'code');
  if (!code) io.die('Falta --code con el código del vídeo (por ejemplo NOV26-07). Ábrelo con `flow open --case <caso>`.');
  if (!CODE_RE.test(code)) io.die('El código del vídeo no es válido: ' + code + '. Tiene la forma NOV26-07.');
  return code;
}

function intOpt(io, opts, key, { min = 1, max = 999, required = false } = {}) {
  const value = one(io, opts, key);
  if (value === undefined) { if (required) io.die('Falta --' + key + '.'); return undefined; }
  const clean = key === 'version' ? value.replace(/^v/i, '') : value;
  if (!/^\d{1,3}$/.test(clean) || Number(clean) < min || Number(clean) > max) io.die('--' + key + ' debe ser un entero entre ' + min + ' y ' + max + '.');
  return Number(clean);
}

function expiryOf(record) {
  const at = Date.parse(String(record.expires_at || ''));
  return Number.isFinite(at) ? at : 0;
}

async function uploadAudio(io, value) {
  if (/^https:\/\//i.test(value)) return value;
  const inspected = inspectFile(value, 'audio');
  if (!inspected.ok) io.die(inspected.error);
  const ext = AUDIO_EXT[inspected.mime];
  if (!ext) io.die('El formato del audio no es compatible. Usa WAV, MP3 o FLAC.');
  io.say('Subiendo ' + inspected.path + '…');
  const up = await uploadPath(inspected.path, 'audio.' + ext, inspected.mime, inspected.sha256);
  if (!up.ok) io.die('No se pudo subir el audio: ' + flowsErrorText(up) + ' No se ha gastado nada.', serverCode(up));
  const url = up.data && up.data.url;
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) io.die('La subida no devolvió una dirección válida. No se ha gastado nada.');
  return url;
}

// ---------------------------------------------------------------------------
// Descarga de los archivos de un trabajo
// ---------------------------------------------------------------------------

function safeFileName(name, index, mime) {
  const base = path.basename(String(name || ''));
  if (/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(base) && !base.includes('..')) return base;
  const ext = { 'video/mp4': 'mp4', 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'text/markdown': 'md' }[String(mime || '').split(';')[0]] || 'bin';
  return 'archivo-' + (index + 1) + '.' + ext;
}

function publishNoOverwrite(temp, dir, name) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  for (let i = 1; i < 10000; i++) {
    const dest = path.join(dir, i === 1 ? name : stem + '-' + i + ext);
    try { fs.linkSync(temp, dest); fs.unlinkSync(temp); return dest; }
    catch (e) { if (!e || e.code !== 'EEXIST') throw e; }
  }
  throw new Error('No se pudo reservar un nombre de salida libre.');
}

async function downloadFile(dir, file, index) {
  const name = safeFileName(file.name, index, file.mime);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10 * 60 * 1000);
  const temp = path.join(dir, '.ailab-flow-' + process.pid + '-' + crypto.randomBytes(6).toString('hex') + '.tmp');
  let fd = null;
  try {
    const res = await flowsFile(file.id, controller.signal);
    if (!res.ok) {
      let message = '';
      try { message = (await res.json()).error || ''; } catch { /* sin cuerpo JSON */ }
      throw new Error(neutral(message || 'Descarga fallida (HTTP ' + res.status + ').'));
    }
    const reader = res.body.getReader();
    fd = fs.openSync(temp, 'wx', 0o600);
    let bytes = 0;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_FILE_BYTES) { try { await reader.cancel(); } catch {} throw new Error('El archivo supera el límite de descarga.'); }
      fs.writeSync(fd, Buffer.from(chunk.value));
    }
    fs.fsyncSync(fd); fs.closeSync(fd); fd = null;
    if (bytes < 1) throw new Error('El archivo descargado está vacío.');
    const dest = publishNoOverwrite(temp, dir, name);
    return { ok: true, path: dest, bytes, mime: String(res.headers.get('content-type') || file.mime || '').split(';')[0] };
  } catch (e) {
    if (fd !== null) { try { fs.closeSync(fd); } catch {} }
    try { fs.unlinkSync(temp); } catch {}
    return { ok: false, error: e && e.name === 'AbortError' ? 'La descarga superó el tiempo permitido.' : neutral(e && e.message ? e.message : e) };
  } finally { clearTimeout(timer); }
}

// ---------------------------------------------------------------------------
// Espera de un trabajo y entrega
// ---------------------------------------------------------------------------

async function deliver(io, view, raw, outputDir, cliCommand) {
  const dir = resolveOutputDir(outputDir);
  const files = [];
  const list = Array.isArray(raw.files) ? raw.files : [];
  for (const [index, file] of list.entries()) {
    if (!file || !/^[a-f0-9]{32}$/.test(String(file.id))) continue;
    const saved = await downloadFile(dir, file, index);
    if (!saved.ok) {
      io.die('El paso está completado, pero no se pudo descargar un archivo: ' + saved.error + ' No lo repitas: recupéralo con ' + cliCommand('flow job ' + view.job_id + ' --output <carpeta>') + '.',
        { job_id: view.job_id, state: view.state });
    }
    const item = { kind: String(file.kind || ''), name: path.basename(saved.path), path: saved.path, mime: saved.mime, bytes: saved.bytes };
    if (typeof file.seconds === 'number') item.seconds = file.seconds;
    files.push(item);
    io.say('Guardado: ' + saved.path + ' (' + (saved.mime || 'archivo') + ', ' + Math.max(1, Math.round(saved.bytes / 1024)) + 'KB)');
  }
  if (!files.length) io.die('El paso está completado, pero no ha devuelto archivos. No lo repitas: recupéralo con ' + cliCommand('flow job ' + view.job_id) + '.', { job_id: view.job_id });
  if (view.flow === 'toma' && view.seconds !== undefined) io.say('Duración: ' + view.seconds + ' s');
  if (view.flow === 'separar') {
    io.say('Intento: ' + view.attempt + ' · quedan más intentos: ' + (view.has_more ? 'sí' : 'no'));
    io.say('Control de calidad: ' + JSON.stringify(view.qc));
  }
  if (view.flow === 'voz' && view.ambient_db !== undefined) io.say('Nivel del ambiente: ' + view.ambient_db + ' dB');
  const status = await fetchFlowsStatus();
  io.say('Coste real: ' + view.credits + ' cr' + (status.ok ? ' · saldo ' + status.view.balance_cr + ' cr' : ''));
  return { ...view, files, ...(status.ok ? { balance_cr: status.view.balance_cr } : {}) };
}

async function waitJob(io, jobId, flow, { outputDir, wait = true, cliCommand }) {
  const started = Date.now();
  const limit = TIMEOUT_MS[flow] || TIMEOUT_MS.default;
  let streak = 0;
  for (;;) {
    const r = await flowsPost({ action: 'job', job_id: jobId });
    if (!r.ok) {
      if (!transient(r)) io.die(flowsErrorText(r), { job_id: jobId, ...serverCode(r) });
      streak++;
      if (streak >= TRANSIENT_MAX_STREAK || !wait) {
        io.die('No se pudo consultar el trabajo (' + flowsErrorText(r) + '). Sigue en marcha y no se ha repetido nada. Recupéralo con ' + cliCommand('flow job ' + jobId + ' --output <carpeta>') + '.', { job_id: jobId, state: 'desconocido', ...serverCode(r) });
      }
      const asked = r.kind === 'rate_limited' && Number.isFinite(r.retryAfterSeconds) ? r.retryAfterSeconds * 1000 : 0;
      await sleep(Math.min(TRANSIENT_MAX_WAIT_MS, Math.max(asked, POLL_MS * 2 ** streak)));
      continue;
    }
    streak = 0;
    const view = jobView(r.raw);
    if (view.state === 'completado') return { view, raw: r.raw };
    if (view.state === 'fallido') return { view, raw: r.raw };
    if (view.state === 'en_revision') {
      io.die(view.message + ' Consulta más tarde con ' + cliCommand('flow job ' + jobId + ' --output <carpeta>') + '.', { job_id: jobId, state: view.state, message: view.message });
    }
    if (!wait) return { view, raw: r.raw };
    if (Date.now() - started > limit) {
      io.die('Sigue en curso tras el tiempo máximo de espera. No lo repitas: recupéralo con ' + cliCommand('flow job ' + jobId + ' --wait --output <carpeta>') + '.', { job_id: jobId, state: view.state });
    }
    await sleep(POLL_MS);
  }
}

// ---------------------------------------------------------------------------
// Subcomandos
// ---------------------------------------------------------------------------

async function cmdStatus(io) {
  const status = await fetchFlowsStatus();
  if (!status.ok) io.die(status.error, status.code ? { code: status.code } : {});
  for (const line of statusLines(status.view)) io.say(line);
  io.done(status.view);
}

const OPEN_OPTIONS = ['case', 'proyecto', 'titulo', 'request-id', 'json'];
const TITLE_MAX = 120;

async function cmdOpen(io, opts) {
  // Una opción desconocida se rechaza: la 2.4.0 ignoraba `--proyecto` en silencio y abría el vídeo sin proyecto.
  const unknown = Object.keys(opts).filter((key) => !OPEN_OPTIONS.includes(key));
  if (unknown.length) {
    io.die('Opción no válida en flow open: ' + unknown.map((key) => '--' + key).join(', ') + '. Admite --case, --proyecto, --titulo, --request-id y --json. No se ha abierto nada.', { code: 'unknown_option' });
  }
  const kase = one(io, opts, 'case');
  if (!kase || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(kase)) io.die('Falta --case con el caso del vídeo (por ejemplo servicio-empresas).');
  // Proyecto del vídeo (por ejemplo 06_super-cremita): el mismo formato que --proyecto en prepare, nunca el uso general.
  let project = null;
  if (opts.proyecto !== undefined) {
    const checked = checkProject(opts.proyecto, { general: false });
    if (!checked.ok) io.die(checked.error);
    project = checked.project;
  }
  // Título del vídeo (1 a 120 caracteres), por ejemplo el del guion del kit.
  let title = null;
  if (opts.titulo !== undefined) {
    const value = one(io, opts, 'titulo');
    title = String(value).replace(/\s+/g, ' ').trim();
    if (!title || [...title].length > TITLE_MAX || /[\u0000-\u001f\u007f]/.test(title)) io.die('--titulo admite de 1 a ' + TITLE_MAX + ' caracteres. No se ha abierto nada.');
  }
  let requestId = one(io, opts, 'request-id');
  if (requestId !== undefined && !UUID_RE.test(requestId)) io.die('--request-id debe ser un UUID.');
  requestId = (requestId || crypto.randomUUID()).toLowerCase();
  let r;
  for (let i = 0; i < 3; i++) {
    r = await flowsPost({ action: 'video_open', case: kase, ...(project ? { project } : {}), ...(title ? { title } : {}), client_request_id: requestId });
    if (r.ok || !transient(r)) break;
    await sleep(POLL_MS * (i + 1));
  }
  if (!r.ok) {
    const hint = transient(r) ? ' Repite con --request-id ' + requestId + (project || title ? ' y las mismas opciones' : '') + ' para no gastar otro número.' : '';
    io.die(flowsErrorText(r) + hint, { request_id: requestId, ...serverCode(r) });
  }
  const view = pick(r.raw, ['code', 'case', 'status', 'opened_at', 'references', 'project', 'project_key', 'title']);
  if (!CODE_RE.test(String(view.code || ''))) io.die('AILAB no ha devuelto un código de vídeo válido.');
  io.say('Vídeo abierto: ' + view.code + ' · caso ' + view.case + (view.project || project ? ' · proyecto ' + (view.project || project) : ''));
  io.say('Código: ' + view.code);
  if (typeof view.title === 'string' && view.title) io.say('Título: ' + neutral(view.title));
  if (typeof view.references === 'number') io.say('Fotos de referencia del caso: ' + view.references);
  io.done({ ...view, request_id: requestId });
}

async function cmdPrepare(io, pos, opts, cliCommand) {
  const flow = pos[0];
  if (!FLOWS.includes(flow)) io.die('Flujo no válido: ' + (flow || '(ninguno)') + '. Usa ' + FLOWS.join(', ') + '.');
  const code = codeOpt(io, opts);
  const body = { action: 'prepare', flow, code, input: {} };
  let take;
  if (flow !== 'guion') { take = intOpt(io, opts, 'take', { max: 99, required: true }); body.take = take; }
  let audioSha = null;
  if (flow === 'guion') {
    const idea = textOpt(io, opts, 'idea');
    const texto = textOpt(io, opts, 'texto');
    if (!String(idea || '').trim() && !String(texto || '').trim()) io.die('Indica --idea o --texto (o --idea-file / --texto-file) para el guion.');
    if (idea) body.input.idea = idea;
    if (texto) body.input.texto = texto;
    const kase = one(io, opts, 'case');
    if (kase) body.input.case = kase;
    const datos = {};
    for (const pair of many(opts, 'dato')) {
      const m = pair.match(/^([^=]{1,40})=(.*)$/s);
      if (!m || !m[2].trim()) io.die('--dato espera clave=valor, no «' + pair + '».');
      datos[m[1].trim()] = m[2].trim();
    }
    if (Object.keys(datos).length) body.input.datos = datos;
  } else if (flow === 'toma') {
    const text = textOpt(io, opts, 'text') ?? textOpt(io, opts, 'texto');
    if (!String(text || '').trim()) io.die('Indica --text con el texto exacto de la toma.');
    body.input.text = text;
    // Prompt propio y duración de la toma (4, 6, 8 o 10 s). Sin ellos, AILAB usa los del perfil.
    const prompt = textOpt(io, opts, 'prompt');
    if (prompt !== undefined) {
      if (!String(prompt).trim()) io.die('--prompt no puede estar vacío.');
      body.input.prompt = prompt;
    }
    const duration = one(io, opts, 'duration');
    if (duration !== undefined) {
      if (!['4', '6', '8', '10'].includes(duration)) io.die('--duration debe ser 4, 6, 8 o 10 (segundos).');
      body.input.duration = Number(duration);
    }
  } else {
    const audio = one(io, opts, 'audio');
    if (!audio) io.die('Indica --audio con la ruta del audio de la toma.');
    const version = intOpt(io, opts, 'version', { max: 999 });
    if (version !== undefined) body.input.version = version;
    if (flow === 'separar') {
      const attempt = intOpt(io, opts, 'attempt', { max: 20 });
      if (attempt !== undefined) body.input.attempt = attempt;
    } else if (opts.attempt !== undefined) io.die('--attempt solo existe en separar.');
    if (!/^https:\/\//i.test(audio)) {
      const inspected = inspectFile(audio, 'audio');
      if (!inspected.ok) io.die(inspected.error);
      audioSha = inspected.sha256;
    }
    body.input.audio = await uploadAudio(io, audio);
  }
  const r = await flowsPost(body);
  if (!r.ok) io.die(flowsErrorText(r), serverCode(r));
  const raw = r.raw;
  if (!QUOTE_RE.test(String(raw.quote_id || ''))) io.die('AILAB no ha devuelto una cotización válida. No se ha gastado nada.');
  const record = {
    quote_id: raw.quote_id, flow, code, take: raw.take ?? take ?? null, attempt: raw.attempt ?? null, version: body.input.version ?? null,
    credits: Number(raw.credits), approximate: Boolean(raw.approximate), expires_at: String(raw.expires_at || ''),
    audio_sha256: audioSha, created_at: new Date().toISOString(), client_request_id: null, job_id: null,
  };
  saveRequest(record);
  const status = await fetchFlowsStatus();
  const where = ['Flujo: ' + flow, 'vídeo ' + code];
  if (record.take !== null) where.push('toma ' + record.take);
  if (record.version !== null) where.push('versión ' + record.version);
  if (record.attempt !== null) where.push('intento ' + record.attempt);
  io.say(where.join(' · '));
  io.say(record.approximate ? 'Coste máximo: ' + record.credits + ' cr (se cobra el consumo real) · sin gasto todavía.' : 'Coste: ' + record.credits + ' cr · sin gasto todavía.');
  if (status.ok) {
    io.say('Saldo actual: ' + status.view.balance_cr + ' cr' + (Number(status.view.limit_cr) > 0 ? ' · quedan ' + status.view.remaining_month_cr + ' cr este mes' : ''));
    if (status.view.balance_cr < record.credits) io.say('AVISO: el saldo no cubre este paso. Pide a tu gestor que cargue créditos.');
  }
  io.say('Cotización: ' + record.quote_id + ' (caduca en 15 min)');
  io.say('Para ejecutar dentro de la autorización del encargo: ' + cliCommand('flow submit ' + record.quote_id + ' --confirmed --output <carpeta>'));
  io.done({ quote_id: record.quote_id, flow, code, take: record.take, version: record.version, attempt: record.attempt, credits: record.credits,
    approximate: record.approximate, expires_at: record.expires_at, ...(status.ok ? { balance_cr: status.view.balance_cr } : {}) });
}

async function finish(io, result, outputDir, cliCommand) {
  const { view, raw } = result;
  if (view.state === 'fallido') {
    io.say('El paso no se ha completado: ' + view.message);
    if (io.json) io.die(view.message, { job_id: view.job_id, state: view.state, credits: 0 });
    process.exit(1);
  }
  if (view.state !== 'completado') {
    io.say('Estado: ' + view.state + ' · ' + view.message);
    io.done(view);
    return;
  }
  const delivered = await deliver(io, view, raw, outputDir, cliCommand);
  io.done(delivered);
}

async function cmdSubmit(io, pos, opts, cliCommand) {
  const id = pos[0];
  const record = loadRequest(id);
  if (!record) io.die('Solicitud de flujo no encontrada: ' + (id || '(ninguna)') + '. Prepárala con `flow prepare`.');
  if (!opts.confirmed) io.die('Falta la confirmación. Este paso gasta créditos: usa --confirmed solo con la autorización del usuario para este encargo.');
  const outputDir = one(io, opts, 'output');
  if (!record.job_id) {
    if (!record.client_request_id) {
      if (Date.now() > expiryOf(record)) io.die('La cotización ha caducado (15 min). Vuelve a ejecutar `flow prepare`. No se ha gastado nada.');
      const ceiling = one(io, opts, 'max-credits');
      if (ceiling !== undefined && !(Number(ceiling) > 0)) io.die('--max-credits debe ser un número mayor que cero.');
      if (ceiling !== undefined && record.credits > Number(ceiling)) io.die('El coste (' + record.credits + ' cr) supera el máximo que autorizaste (--max-credits ' + ceiling + '). No se ha enviado nada.');
      // Se guarda ANTES de enviar: un reintento tras una respuesta perdida reutiliza la misma petición.
      record.client_request_id = crypto.randomUUID();
      record.confirmed_at = new Date().toISOString();
      saveRequest(record);
    }
    let r;
    for (let i = 0; i < 4; i++) {
      r = await flowsPost({ action: 'confirm', quote_id: record.quote_id, client_request_id: record.client_request_id });
      if (r.ok || !transient(r)) break;
      await sleep(Math.min(TRANSIENT_MAX_WAIT_MS, POLL_MS * 2 ** i));
    }
    if (!r.ok) {
      if (transient(r)) {
        io.die('No se ha podido confirmar si el envío llegó (' + flowsErrorText(r) + '). No se ha repetido con otra petición. Vuelve a ejecutar '
          + cliCommand('flow submit ' + record.quote_id + ' --confirmed') + ': reutiliza la misma petición y no cobra dos veces.', { quote_id: record.quote_id, ...serverCode(r) });
      }
      io.die(flowsErrorText(r), { quote_id: record.quote_id, ...serverCode(r) });
    }
    if (!/^[a-f0-9]{32}$/.test(String(r.raw.job_id || ''))) io.die('AILAB no ha devuelto un trabajo válido. No lo repitas; consulta a tu gestor.', { quote_id: record.quote_id });
    record.job_id = r.raw.job_id;
    if (r.raw.version !== undefined) record.version = r.raw.version;
    saveRequest(record);
  }
  io.say('Trabajo: ' + record.job_id + (record.version ? ' · versión ' + record.version : ''));
  const result = await waitJob(io, record.job_id, record.flow, { outputDir, cliCommand });
  record.state = result.view.state;
  saveRequest(record);
  await finish(io, result, outputDir, cliCommand);
}

async function cmdJob(io, pos, opts, cliCommand) {
  const jobId = pos[0];
  if (!/^[a-f0-9]{32}$/.test(String(jobId || ''))) io.die('Indica el identificador del trabajo (32 caracteres) que imprimió `flow submit`.');
  const outputDir = one(io, opts, 'output');
  const result = await waitJob(io, jobId, null, { outputDir, wait: Boolean(opts.wait), cliCommand });
  await finish(io, result, outputDir, cliCommand);
}

async function cmdClose(io, opts) {
  const code = codeOpt(io, opts);
  const seconds = one(io, opts, 'final-seconds');
  const final = Number(String(seconds || '').replace(',', '.'));
  if (!seconds || !Number.isFinite(final) || final <= 0 || final > 3600) io.die('--final-seconds debe ser la duración real del vídeo final en segundos.');
  const used = [];
  for (const item of many(opts, 'used').flatMap((v) => v.split(/[,\s]+/)).filter(Boolean)) {
    const m = item.match(/^(\d{1,2}):v?(\d{1,3})$/i);
    if (!m) io.die('--used espera toma:versión (por ejemplo 1:2), no «' + item + '».');
    used.push({ take: Number(m[1]), version: Number(m[2]) });
  }
  if (!used.length) io.die('Indica las tomas usadas con --used toma:versión (una por toma).');
  const r = await flowsPost({ action: 'video_close', code, final_seconds: Math.round(final * 1000) / 1000, used_takes: used });
  if (!r.ok) io.die(flowsErrorText(r), serverCode(r));
  const video = pick(r.raw.video || {}, VIDEO_KEYS);
  io.say('Vídeo ' + video.code + ' ' + video.status + ' · ' + video.final_seconds + ' s finales · ' + video.gen_seconds + ' s generados');
  io.say('Tomas: ' + video.takes_generated + ' generadas · ' + video.takes_needed + ' necesarias · ' + video.extra_takes + ' de más');
  io.say('Coste del vídeo: ' + video.charged_cr + ' cr');
  io.done({ video });
}

export async function runFlowCommand(pos, opts, deps) {
  const io = makeIo(deps, opts);
  const [sub, ...rest] = pos;
  if (sub === 'status') return cmdStatus(io);
  if (sub === 'open') return cmdOpen(io, opts);
  if (sub === 'prepare') return cmdPrepare(io, rest, opts, deps.cliCommand);
  if (sub === 'submit') return cmdSubmit(io, rest, opts, deps.cliCommand);
  if (sub === 'job') return cmdJob(io, rest, opts, deps.cliCommand);
  if (sub === 'close') return cmdClose(io, opts);
  io.die('Subcomando de flow no válido. Usa: status · open · prepare · submit · job · close.');
}

export const FLOW_HELP = 'Flujos de cliente: flow status · flow open --case <caso> [--proyecto NN_slug] [--titulo texto] · flow prepare <guion|toma|separar|aislar|voz> --code <código> [--take N] [--text|--prompt|--duration|--idea|--texto|--audio|--version|--attempt|--dato clave=valor] · flow submit <cotización> --confirmed [--output dir] · flow job <trabajo> [--wait] [--output dir] · flow close --code <código> --final-seconds S --used toma:versión… (todos admiten --json)';
