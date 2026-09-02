#!/usr/bin/env node
// Runtime publico de AILAB para Claude Code.
// Flujo seguro: prepare (sin gasto) -> confirmacion humana -> submit.
// Sin keys maestras ni contrasenas guardadas; usa tokens de dispositivo revocables.
import { CLI_VERSION, BASE_URL, CUENTA_URL } from './lib/config.mjs';
import { login, promptVisible, promptHidden, readCookie, readToken, saveToken, clearToken, clearCookie, openDevicePage, cookieAuthEnabled } from './lib/auth.mjs';
import { apiPost, servicePost, assistantPost, taskLookup, explain } from './lib/http.mjs';
import { loadCatalog, refreshCatalog, catalogCompatible, resolveModel, modelUsable, validateParams, estimateCredits, modelContractHash, stableStringify } from './lib/catalog.mjs';
import { refreshAssistantsCatalog, resolveAssistant, resolveAssistantModel, assistantContractHash } from './lib/assistants.mjs';
import { createAssistantRequest, loadAssistantRequest, updateAssistantRequest, loadSession, createSession, saveSession, assistantRequestIntact } from './lib/assistant-requests.mjs';
import { inspectFile, inspectPricingMetadata, rehashMatches } from './lib/files.mjs';
import { createManifest, loadManifest, manifestExpired, markSubmitted } from './lib/manifest.mjs';
import { resolveOutputDir, downloadTo, saveTextTo } from './lib/output.mjs';
import { uploadPath } from './lib/http.mjs';
import * as jobsV1 from './adapters/jobs-v1.mjs';
import * as labsQueueV1 from './adapters/labs-queue-v1.mjs';
import * as labsQueueMultiV1 from './adapters/labs-queue-multi-v1.mjs';
import * as hybridSeedreamV1 from './adapters/hybrid-seedream-v1.mjs';
import * as hybridGrokV1 from './adapters/hybrid-grok-v1.mjs';
import * as veoV1 from './adapters/veo-v1.mjs';
import * as elevenV1 from './adapters/eleven-v1.mjs';
import * as sunoV1 from './adapters/suno-v1.mjs';
import * as heygenV1 from './adapters/heygen-v1.mjs';
import * as jobsTextV1 from './adapters/jobs-text-v1.mjs';
import * as resembleV1 from './adapters/resemble-v1.mjs';
import { saveTaskReceipt, loadTaskReceipt, completeTaskReceipt } from './lib/tasks.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';

const ADAPTERS = {
  'jobs-v1': jobsV1,
  'labs-queue-v1': labsQueueV1,
  'labs-queue-multi-v1': labsQueueMultiV1,
  'hybrid-seedream-v1': hybridSeedreamV1,
  'hybrid-grok-v1': hybridGrokV1,
  'veo-v1': veoV1,
  'eleven-v1': elevenV1,
  'suno-v1': sunoV1,
  'heygen-v1': heygenV1,
  'jobs-text-v1': jobsTextV1,
  'resemble-v1': resembleV1,
};
const POLL_MS = 5000;
const TIMEOUT_MS = { image: 10 * 60 * 1000, video: 45 * 60 * 1000, audio: 15 * 60 * 1000, text: 15 * 60 * 1000 };
const UPLOAD_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  'audio/flac': 'flac', 'audio/x-flac': 'flac',
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg', 'application/ogg': 'ogg', 'audio/opus': 'opus',
  'audio/aac': 'aac',
};
function uploadName(prefix, mime) {
  const ext = UPLOAD_EXT[mime];
  if (!ext) fail('El formato ' + mime + ' no esta permitido para subidas.');
  return prefix + '.' + ext;
}

function terminalSafe(value) {
  return String(value)
    .replace(/\x1B\][^\x07]*(?:\x07|\x1B\\)/g, '')
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}
function out(line) { process.stdout.write(terminalSafe(line) + '\n'); }
function fail(line, code = 1) { process.stderr.write(terminalSafe(line) + '\n'); process.exit(code); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { opts[key] = opts[key] === undefined ? true : opts[key]; }
      else {
        if (opts[key] === undefined) opts[key] = next;
        else if (Array.isArray(opts[key])) opts[key].push(next);
        else opts[key] = [opts[key], next];
        i++;
      }
    } else pos.push(a);
  }
  return { pos, opts };
}

async function requireSession() {
  if (!readToken() && !readCookie()) fail('No hay sesion. Ejecuta: node scripts/ailab.mjs login');
  const me = await apiPost({ action: 'me' });
  if (!me.ok) fail(explain(me));
  return me.raw;
}

async function cmdLogin() {
  out('Autorizacion de AILAB con token de dispositivo.');
  const url = openDevicePage();
  out('1. Crea un token en: ' + url);
  out('2. Copialo y pegalo aqui. No se mostrara en pantalla ni se guardara en el historial del shell.');
  const token = await promptHidden('Token: ');
  try { saveToken(token); } catch (e) { fail(e.message); }
  const me = await apiPost({ action: 'me' });
  if (!me.ok) { clearToken(); fail('Token rechazado: ' + explain(me)); }
  const user = me.raw.user || {};
  out('Dispositivo autorizado para ' + (user.email || 'tu cuenta') + ' · saldo ' + me.raw.balance + ' cr.');
}

async function cmdLoginCookie() {
  if (!cookieAuthEnabled()) fail('El login por contraseña está desactivado. Usa: node scripts/ailab.mjs login');
  out('Login privado por cookie (compatibilidad temporal de desarrollo).');
  const email = await promptVisible('Email: ');
  const password = await promptHidden('Contrasena (oculta): ');
  const r = await login(email, password);
  if (!r.ok) fail('Login fallido: ' + r.message);
  const name = r.user && r.user.first_name ? r.user.first_name : email;
  out('Sesion iniciada como ' + name + ' (tier ' + ((r.user && r.user.tier) || 'hub') + ') · saldo ' + r.balance + ' cr.');
}

function cmdLogout() {
  clearToken(); clearCookie();
  out('Credenciales locales eliminadas. Revoca tambien el dispositivo desde tu cuenta si ya no vas a usarlo.');
}

async function cmdBalance() {
  const me = await requireSession();
  out('Cuenta: ' + (me.user ? me.user.email : '¿?') + ' · tier ' + (me.user ? me.user.tier : '¿?') + ' · saldo ' + me.balance + ' cr.');
}

async function cmdVoices(provider = 'eleven') {
  await requireSession();
  const isHeygen = String(provider).toLowerCase() === 'heygen';
  const r = isHeygen
    ? await servicePost('api/wallet/heygen-gateway.php?action=list_voices', { action: 'list_voices' })
    : await servicePost('api/wallet/elevenlabs-gateway.php?action=voices', { action: 'voices' });
  if (!r.ok) fail(explain(r));
  const items = isHeygen ? (r.data.items || []) : (r.data.voices || []);
  if (!items.length) { out('No hay voces disponibles ahora mismo.'); return; }
  out('Voces disponibles (' + items.length + '):');
  for (const voice of items) {
    const id = voice.voice_id || voice.id || '';
    const name = voice.name || voice.display_name || 'Voz';
    const lang = voice.language || (voice.labels && voice.labels.language) || '';
    out('  ' + id + ' · ' + name + (lang ? ' · ' + lang : ''));
  }
}

function singleOpt(opts, key) {
  const value = opts[key];
  if (Array.isArray(value)) fail('--' + key + ' solo puede aparecer una vez.');
  return value;
}

function readAssistantMessage(opts) {
  const direct = singleOpt(opts, 'message');
  const file = singleOpt(opts, 'message-file');
  if (direct !== undefined && file !== undefined) fail('Usa --message o --message-file, no ambos.');
  let value = '';
  if (direct !== undefined && direct !== true) value = String(direct);
  else if (file !== undefined && file !== true) {
    try {
      const stat = fs.statSync(String(file));
      if (!stat.isFile() || stat.size > 100 * 1024) fail('El archivo del mensaje debe ser texto y pesar como maximo 100KB.');
      value = fs.readFileSync(String(file), 'utf8');
    } catch (e) { fail('No se pudo leer --message-file: ' + (e && e.message ? e.message : e)); }
  }
  value = value.trim();
  if (!value) fail('Falta el mensaje. Usa --message "..." o --message-file ruta.txt.');
  if (value.length > 20000) fail('El mensaje supera 20.000 caracteres.');
  return value;
}

async function cmdAssistants() {
  const catalog = await refreshAssistantsCatalog({ maxAgeMs: 10 * 60 * 1000, requireNetwork: false });
  out('Asistentes disponibles · cobro por consumo real:');
  for (const [id, item] of Object.entries(catalog.assistants)) {
    out('  ' + id + ' · ' + item.label + ' · ~' + item.estimated_credits + ' cr orientativos · ' + item.description);
  }
  const model = catalog.models[catalog.default_model];
  out('Modelo fijo: ' + model.label + ' · ' + model.vendor + ' · imagen, audio y video.');
}

function repeatedOpt(opts, key) {
  if (opts[key] === undefined) return [];
  return Array.isArray(opts[key]) ? opts[key] : [opts[key]];
}

function assistantFiles(opts, model) {
  const specs = [
    { option: 'image', kind: 'image', maxBytes: 10 * 1024 * 1024 },
    { option: 'audio', kind: 'audio', maxBytes: 20 * 1024 * 1024 },
    { option: 'video', kind: 'video', maxBytes: 40 * 1024 * 1024 },
  ];
  const files = [];
  for (const spec of specs) {
    const values = repeatedOpt(opts, spec.option);
    const capability = spec.kind === 'image' ? 'accepts_images' : 'accepts_' + spec.kind;
    if (values.length && !model[capability]) fail('El modelo fijo no admite ' + spec.kind + '.');
    for (const value of values) {
      if (value === true) fail('--' + spec.option + ' necesita una ruta.');
      const inspected = inspectFile(String(value), spec.kind);
      if (!inspected.ok) fail(inspected.error);
      if (inspected.size > spec.maxBytes) fail('Cada archivo de ' + spec.kind + ' debe pesar como maximo ' + Math.round(spec.maxBytes / 1024 / 1024) + 'MB.');
      files.push({ path: inspected.path, sha256: inspected.sha256, mime: inspected.mime, size: inspected.size, kind: spec.kind });
    }
  }
  if (files.length > 6) fail('El Asistente admite como maximo 6 archivos entre imagen, audio y video.');
  return files;
}

async function cmdAssistantPrepare(name, opts) {
  const catalog = await refreshAssistantsCatalog({ maxAgeMs: 10 * 60 * 1000, requireNetwork: true });
  const hit = resolveAssistant(catalog, name);
  if (!hit) fail('Asistente no encontrado: ' + name);
  // --model se acepta por compatibilidad con agentes que aprendieron el
  // contrato anterior, pero ya no decide el proveedor ni el modelo.
  singleOpt(opts, 'model');
  const modelHit = resolveAssistantModel(catalog, catalog.default_model);
  const message = readAssistantMessage(opts);
  const files = assistantFiles(opts, modelHit.model);

  let session = null;
  const sessionOption = singleOpt(opts, 'session');
  if (sessionOption !== undefined) {
    if (sessionOption === true) fail('--session necesita "new" o un UUID.');
    session = String(sessionOption).toLowerCase() === 'new'
      ? createSession(hit.id, modelHit.id)
      : loadSession(String(sessionOption));
    if (!session) fail('Sesion de asistente no encontrada: ' + String(sessionOption));
    if (session.assistant_id !== hit.id || session.model_id !== modelHit.id) {
      fail('La sesion usa ' + session.assistant_id + ' con ' + session.model_id + '. Crea otra sesion para cambiar asistente o modelo.');
    }
  }
  const history = session ? session.messages : [];
  const contextChars = history.reduce((total, item) => total + String(item.content || '').length, 0) + message.length;
  if (history.length > 24 || contextChars > 80000) fail('La conversacion supera el limite de contexto. Inicia una sesion nueva.');
  const request = createAssistantRequest({
    assistant_id: hit.id,
    model_id: modelHit.id,
    session_id: session ? session.session_id : null,
    history,
    message,
    files,
    attachment_urls: [],
    catalog_version: catalog.catalog_version,
    contract_hash: assistantContractHash(catalog, hit.id, modelHit.id),
    estimated_credits: hit.assistant.estimated_credits,
    max_credits_authorized: hit.assistant.max_authorized_credits,
  });
  const me = await requireSession();
  out('── PLAN DE ASISTENTE (sin gasto todavia) ──');
  out('Asistente: ' + hit.assistant.label + ' (' + hit.id + ')');
  out('Modelo fijo: ' + modelHit.model.label + ' · ' + modelHit.model.vendor);
  out('Mensaje: ' + JSON.stringify(message.length > 240 ? message.slice(0, 237) + '...' : message));
  out('Historial enviado: ' + history.length + ' mensaje(s)');
  const counts = { image: 0, audio: 0, video: 0 };
  for (const file of files) counts[file.kind] += 1;
  out('Adjuntos: ' + counts.image + ' imagen(es) · ' + counts.audio + ' audio(s) · ' + counts.video + ' video(s)');
  out('Estimacion: ~' + hit.assistant.estimated_credits + ' cr · se cobra el consumo real.');
  out('Maximo autorizado temporalmente: ' + hit.assistant.max_authorized_credits + ' cr · saldo actual: ' + me.balance + ' cr.');
  if (session) out('Sesion: ' + session.session_id);
  out('Peticion: ' + request.request_id + ' (caduca en 15 min)');
  out('Para enviar despues de la confirmacion unica del plan: node scripts/ailab.mjs assistant-submit ' + request.request_id + ' --confirmed');
  out('Si el usuario ya autorizo el flujo completo, ejecutalo ahora sin volver a preguntar.');
}

async function cmdAssistantSubmit(requestId, opts) {
  if (!opts.confirmed) fail('Falta la confirmacion. Este mensaje gasta creditos: usa --confirmed solo despues de que el usuario acepte el plan.');
  let request = loadAssistantRequest(requestId);
  if (!request) fail('Peticion de asistente no encontrada: ' + requestId);
  if (!assistantRequestIntact(request)) fail('La peticion local cambio despues de prepare. Vuelve a preparar y confirmar.');
  if (request.state === 'completed') fail('La peticion ya se completo. Crea una nueva.');
  if (!['prepared', 'sending', 'ambiguous'].includes(request.state)) fail('La peticion no se puede enviar desde el estado ' + request.state + '.');
  if (request.state === 'prepared' && (!request.expires_at || Date.now() > Date.parse(request.expires_at))) fail('La peticion ha caducado. Vuelve a preparar el mensaje.');

  const catalog = await refreshAssistantsCatalog({ maxAgeMs: 5 * 60 * 1000, requireNetwork: true });
  if (!catalog.assistants[request.assistant_id] || !catalog.models[request.model_id]) fail('El asistente o el modelo ya no esta disponible. Vuelve a preparar.');
  const currentHash = assistantContractHash(catalog, request.assistant_id, request.model_id);
  if (currentHash !== request.contract_hash) fail('El contrato o el precio del asistente cambio. Vuelve a preparar y confirmar.');
  await requireSession();

  let attachmentUrls = Array.isArray(request.attachment_urls) ? request.attachment_urls.slice() : [];
  if (!attachmentUrls.length && Array.isArray(request.files) && request.files.length) {
    for (const file of request.files) {
      if (!rehashMatches(file)) fail('El archivo cambio despues de preparar: ' + file.path + '. Vuelve a preparar.');
      const inspected = inspectFile(file.path, file.kind);
      if (!inspected.ok) fail(inspected.error);
      out('Subiendo ' + file.path + '…');
      const uploaded = await uploadPath(inspected.path, uploadName('assistant-' + file.kind, inspected.mime), inspected.mime, file.sha256);
      if (!uploaded.ok) fail('Fallo la subida: ' + explain(uploaded) + ' (no se ha gastado nada)');
      const url = uploaded.data && uploaded.data.url;
      if (!url) fail('La subida no devolvio URL (no se ha gastado nada).');
      attachmentUrls.push(url);
      request = updateAssistantRequest(request, { attachment_urls: attachmentUrls });
    }
  }
  request = updateAssistantRequest(request, {
    state: 'sending',
    confirmed_at: request.confirmed_at || new Date().toISOString(),
  });
  const payload = {
    assistant_id: request.assistant_id,
    model_id: request.model_id,
    message: request.message,
    history: request.history,
    attachments: attachmentUrls,
    client_request_id: request.request_id,
  };
  let response = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    request = updateAssistantRequest(request, { send_attempts: Number(request.send_attempts || 0) + 1 });
    response = await assistantPost(payload);
    const retrySame = !response.ok && response.raw && response.raw.retry_same_request === true;
    if (!retrySame || attempt === 2) break;
    if (response.kind === 'rate_limited') {
      const seconds = Number.isFinite(response.retryAfterSeconds) ? Math.max(1, Math.ceil(response.retryAfterSeconds)) : 60;
      out('AILAB ha limitado temporalmente el mensaje. Esperando ' + seconds + ' s antes del unico reintento autorizado…');
      await sleep(seconds * 1000);
    } else {
      out('El proveedor rechazo el primer intento sin cobrar. Reintentando una vez dentro del plan ya autorizado…');
    }
  }
  if (!response.ok) {
    const serverCode = response.raw && response.raw.error_code;
    const serverNeedsReview = ['ambiguous_upstream', 'ambiguous_internal', 'ambiguous_previous'].includes(serverCode)
      || response.kind === 'ambiguous_submit';
    if (serverNeedsReview) {
      updateAssistantRequest(request, { state: 'needs_review', last_error: explain(response) });
      fail(explain(response) + ' No vuelvas a enviarla: revisa la operacion pendiente en la cuenta o con administracion.');
    }
    if (response.kind === 'network' || response.kind === 'timeout') {
      updateAssistantRequest(request, { state: 'ambiguous', last_error: explain(response) });
      fail(explain(response) + ' Ejecuta una sola vez el mismo assistant-submit para recuperar una respuesta ya guardada; no prepares otra peticion.');
    }
    updateAssistantRequest(request, { state: 'failed', last_error: explain(response) });
    fail(explain(response));
  }
  const raw = response.raw || {};
  const answer = raw.message && typeof raw.message.content === 'string' ? raw.message.content : '';
  if (!answer) {
    updateAssistantRequest(request, { state: 'failed', last_error: 'Respuesta sin texto.' });
    fail('El servidor no devolvio texto utilizable y no se ha cargado el resultado.');
  }
  updateAssistantRequest(request, { state: 'completed', response: raw, completed_at: new Date().toISOString() });
  if (request.session_id) {
    const session = loadSession(request.session_id);
    if (session) {
      session.messages.push({ role: 'user', content: request.message });
      session.messages.push({ role: 'assistant', content: answer });
      saveSession(session);
    }
  }
  out('── RESPUESTA DE ' + request.assistant_id.toUpperCase() + ' ──');
  out(answer);
  out('── Coste: ' + raw.charged_credits + ' cr · saldo: ' + raw.balance + ' cr' + (request.session_id ? ' · sesion ' + request.session_id : '') + ' ──');
}

function cmdModels(cat) {
  out('Modelos disponibles (' + Object.keys(cat.models).length + '):');
  for (const [id, m] of Object.entries(cat.models)) {
    const usable = modelUsable(m);
    out('  ' + id + ' · ' + m.label + ' [' + m.section + ']' + (m.expensive ? ' · CARO' : '') + (usable.ok ? '' : ' · NO DISPONIBLE: ' + usable.reason));
  }
}

function cmdInfo(cat, name) {
  const hit = resolveModel(cat, name);
  if (!hit) fail('Modelo no encontrado: ' + name);
  const m = hit.model;
  out(m.label + ' (' + hit.id + ') · seccion ' + m.section + ' · salida ' + m.output + (m.expensive ? ' · MODELO CARO' : ''));
  out(m.description || '');
  out('Parametros:');
  for (const [k, s] of Object.entries(m.params || {})) {
    if (s.internal) continue;
    const bits = [s.type];
    if (s.values) bits.push(s.values.join('|'));
    if (s.min !== undefined) bits.push('min ' + s.min);
    if (s.max !== undefined && s.type === 'int') bits.push('max ' + s.max);
    if (s.default !== undefined) bits.push('def ' + s.default);
    out('  --' + k + ' (' + bits.join(', ') + (s.required ? ', OBLIGATORIO' : '') + ')' + (s.help ? ' · ' + s.help : ''));
  }
  out('Estimacion: ' + JSON.stringify(m.estimate));
}

function deriveInternalParams(model, given) {
  const derived = { ...given };
  if (model.id === 'sam-audio' || model.id === 'resemble-audio-enhancement') {
    const value = derived.audio_url;
    if (Array.isArray(value)) fail('--audio_url solo admite un archivo.');
    if (value === undefined || value === true || value === '') return derived;
    const metadata = inspectPricingMetadata(String(value));
    const allowedClass = model.id === 'resemble-audio-enhancement'
      ? (metadata.class === 'audio' || metadata.mime === 'video/mp4')
      : metadata.class === 'audio';
    if (!metadata.ok || !allowedClass || !Number.isFinite(metadata.duration)) {
      fail(metadata.error || 'No se pudo medir la duración del audio.');
    }
    if (model.id === 'sam-audio' && metadata.duration > 3600) fail('SAM Audio admite audios de hasta 60 minutos.');
    derived.duration_seconds = Math.round(metadata.duration * 100) / 100;
  }
  return derived;
}

function cmdValidate(cat, name, opts) {
  const hit = resolveModel(cat, name);
  if (!hit) fail('Modelo no encontrado: ' + name);
  let given = { ...opts }; delete given.output; delete given.confirmed;
  given = deriveInternalParams(hit.model, given);
  const v = validateParams(hit.model, given);
  if (!v.ok) fail('Parametros no validos:\n  - ' + v.errors.join('\n  - '));
  for (const [param, paths] of Object.entries(v.fileParams)) {
    const accept = (hit.model.params[param] || {}).accept || null;
    for (const p of paths) { const inspected = inspectFile(p, accept); if (!inspected.ok) fail(inspected.error); }
  }
  const est = estimateCredits(hit.model, { ...v.params, ...v.fileParams });
  out('OK ' + hit.model.label + ': parametros validos · estimacion ' + (est.credits === null ? 'no disponible' : '~' + est.credits + ' cr') + ' · sin gasto.');
}

async function cmdDoctor(cat) {
  const checks = [];
  const add = (ok, name, detail) => { checks.push(ok); out((ok ? 'OK' : 'FALLO') + ' · ' + name + (detail ? ': ' + detail : '')); };
  add(Number(process.versions.node.split('.')[0]) >= 18, 'Node', process.version);
  const compat = catalogCompatible(cat); add(compat.ok, 'Contrato', compat.ok ? 'v' + cat.server_contract_version + ' · catalogo ' + cat.catalog_version : compat.reason);
  const me = await apiPost({ action: 'me' }); add(me.ok, 'Autenticacion', me.ok ? (me.raw.user.email + ' · saldo ' + me.raw.balance + ' cr') : explain(me));
  try { const dir = resolveOutputDir(); add(true, 'Salida', dir); } catch (e) { add(false, 'Salida', e.message); }
  if (me.ok) {
    const intents = await apiPost({ action: 'submission_intents' });
    if (intents.ok) {
      const open = (intents.raw.items || []).filter((i) => i.state === 'ambiguous' || i.state === 'reserved');
      add(open.length === 0, 'Intenciones abiertas', open.length ? open.length + ' requieren revision en Historial/admin' : 'ninguna');
    } else add(false, 'Intenciones', explain(intents));
  } else {
    out('OMITIDO · Intenciones: se evita una segunda peticion mientras falla la autenticacion.');
  }
  try {
    const { spawnSync } = await import('node:child_process');
    const ff = spawnSync('ffprobe', ['-version'], { stdio: 'ignore' });
    if (ff.status === 0) add(true, 'ffprobe', 'disponible'); else out('AVISO · ffprobe: opcional, no encontrado');
  } catch { out('AVISO · ffprobe: opcional, no encontrado'); }
  if (checks.some((ok) => !ok)) process.exitCode = 1;
}

async function cmdPrepare(cat, name, opts) {
  const hit = resolveModel(cat, name);
  if (!hit) fail('Modelo no encontrado: ' + name);
  const m = hit.model;
  const usable = modelUsable(m);
  if (!usable.ok) fail(usable.reason);

  let given = { ...opts };
  delete given.output; delete given.confirmed;
  given = deriveInternalParams(m, given);
  const v = validateParams(m, given);
  if (!v.ok) fail('Parametros no validos:\n  - ' + v.errors.join('\n  - '));

  const files = [];
  for (const [param, paths] of Object.entries(v.fileParams)) {
    const accept = (m.params[param] || {}).accept || null;
    for (const p of paths) {
      const insp = inspectFile(p, accept);
      if (!insp.ok) fail(insp.error);
      files.push({ ...insp, param });
    }
  }

  const est = estimateCredits(m, { ...v.params, ...v.fileParams });
  const me = await requireSession();

  const manifest = createManifest({
    modelId: hit.id,
    catalogVersion: cat.catalog_version,
    modelContractHash: modelContractHash(hit.id, m),
    params: v.params,
    files,
    estimate: { ...est, expensive: m.expensive },
  });

  out('── PLAN DE GENERACION (sin gasto todavia) ──');
  out('Modelo: ' + m.label + ' (' + hit.id + ')' + (m.expensive ? ' · MODELO CARO' : ''));
  for (const [k, val] of Object.entries(v.params)) out('  ' + k + ': ' + JSON.stringify(val));
  for (const f of files) out('  archivo (' + f.param + '): ' + f.path + ' · ' + f.mime + ' · ' + Math.round(f.size / 1024) + 'KB');
  out('Estimacion: ' + (est.credits === null ? 'no disponible' : '~' + est.credits + ' cr') + (est.note ? ' (' + est.note + ')' : ''));
  if (m.expensive && est.credits !== null) out('Maximo autorizado por este manifiesto: ' + est.credits + ' cr.');
  out('Saldo actual: ' + me.balance + ' cr.');
  if (est.credits !== null && me.balance < est.credits) {
    out('AVISO: el saldo no cubre la estimacion. Recarga en: ' + CUENTA_URL);
  }
  out('Manifiesto: ' + manifest.manifest_id + ' (caduca en 15 min)');
  out('Para ejecutar despues de la confirmacion unica del plan: node scripts/ailab.mjs submit ' + manifest.manifest_id + ' --confirmed');
  out('Si el usuario ya autorizo el flujo completo, ejecutalo ahora sin volver a preguntar.');
}

async function cmdSubmit(cat, manifestId, opts) {
  const m0 = loadManifest(manifestId);
  if (!m0) fail('Manifiesto no encontrado: ' + manifestId);
  if (m0.submitted_task) fail('Ese manifiesto ya se ejecuto (tarea ' + m0.submitted_task + '). Crea uno nuevo con prepare.');
  if (manifestExpired(m0)) fail('El manifiesto ha caducado (15 min). Vuelve a ejecutar prepare.');
  if (!opts.confirmed) fail('Falta la confirmacion. Este comando gasta creditos: ejecuta submit con --confirmed SOLO despues de que el usuario haya dicho que si al plan.');

  const hit = resolveModel(cat, m0.model);
  if (!hit) fail('El modelo del manifiesto ya no existe en el catalogo.');
  const model = hit.model;
  const usable = modelUsable(model);
  if (!usable.ok) fail(usable.reason);
  if (!m0.model_contract_hash || m0.model_contract_hash !== modelContractHash(hit.id, model)) {
    fail('El contrato o el precio de este modelo cambio desde el prepare. Vuelve a preparar y confirmar.');
  }

  const paramsHash = crypto.createHash('sha256').update(stableStringify(m0.params || {})).digest('hex');
  if (!m0.params_hash || paramsHash !== m0.params_hash) {
    fail('Los parametros del manifiesto cambiaron despues de prepare. Vuelve a preparar y confirmar.');
  }

  const frozenFiles = Array.isArray(m0.files) ? m0.files : [];
  const givenAgain = { ...(m0.params || {}) };
  for (const file of frozenFiles) {
    if (!file || typeof file.param !== 'string' || typeof file.path !== 'string') fail('El manifiesto contiene un archivo no valido. Vuelve a preparar.');
    const spec = (model.params || {})[file.param];
    if (!spec || !['file', 'file[]'].includes(spec.type)) fail('El contrato de archivos del manifiesto no es valido. Vuelve a preparar.');
    if (givenAgain[file.param] === undefined) givenAgain[file.param] = spec.type === 'file' ? file.path : [file.path];
    else if (spec.type === 'file[]') givenAgain[file.param] = [...(Array.isArray(givenAgain[file.param]) ? givenAgain[file.param] : [givenAgain[file.param]]), file.path];
    else fail('El manifiesto contiene mas de un archivo para --' + file.param + '.');
  }
  const validatedAgain = validateParams(model, givenAgain);
  if (!validatedAgain.ok || stableStringify(validatedAgain.params) !== stableStringify(m0.params || {})) {
    fail('El manifiesto ya no supera la validacion del modelo. Vuelve a preparar y confirmar.');
  }
  const estimateAgain = estimateCredits(model, { ...validatedAgain.params, ...validatedAgain.fileParams });
  if (estimateAgain.credits !== m0.estimated_credits || estimateAgain.credits !== m0.max_credits_authorized) {
    fail('La estimacion o el maximo autorizado del manifiesto no coincide con el plan confirmado. Vuelve a preparar.');
  }

  for (const f of frozenFiles) {
    if (!rehashMatches(f)) fail('El archivo cambio despues del prepare: ' + f.path + '. Vuelve a ejecutar prepare.');
  }

  const me = await requireSession();
  if (m0.estimated_credits !== null && me.balance < m0.estimated_credits) {
    fail('Saldo insuficiente para la estimacion (~' + m0.estimated_credits + ' cr; saldo ' + me.balance + ' cr). Recarga en: ' + CUENTA_URL);
  }

  // client_request_id: generado y persistido ANTES de enviar (base de la
  // idempotencia; el envio al servidor llega con los intents de la Fase B).
  const clientRequestId = m0.client_request_id || crypto.randomUUID();
  let manifestState = { ...m0, client_request_id: clientRequestId, confirmed_at: m0.confirmed_at || new Date().toISOString() };
  markSubmitted(manifestState, {});

  // Subir archivos de entrada (si los hay)
  const uploadedByParam = {};
  const cachedUploads = Array.isArray(m0.uploaded_files) ? m0.uploaded_files : [];
  const savedUploads = [];
  for (let fileIndex = 0; fileIndex < frozenFiles.length; fileIndex++) {
    const f = frozenFiles[fileIndex];
    const cached = cachedUploads[fileIndex];
    const cachedMatches = cached && cached.param === f.param
      && cached.path === f.path && cached.sha256 === f.sha256 && typeof cached.url === 'string';
    const cachedExpiry = cachedMatches && typeof cached.expires_at === 'string'
      ? Date.parse(cached.expires_at.replace(' ', 'T') + (cached.expires_at.includes('T') ? '' : 'Z'))
      : NaN;
    if (cachedMatches && Number.isFinite(cachedExpiry) && cachedExpiry > Date.now() + 60 * 1000) {
      (uploadedByParam[f.param] = uploadedByParam[f.param] || []).push(cached.url);
      savedUploads.push(cached);
      out('Reutilizando la subida verificada de ' + f.path + '…');
      continue;
    }
    const insp = inspectFile(f.path, null);
    if (!insp.ok) fail(insp.error);
    out('Subiendo ' + f.path + '…');
    const up = await uploadPath(insp.path, uploadName('input', insp.mime), insp.mime, f.sha256);
    if (!up.ok) fail('Fallo la subida de ' + f.path + ': ' + explain(up) + ' (no se ha gastado nada)');
    const url = up.data && up.data.url;
    if (!url) fail('La subida no devolvio URL (no se ha gastado nada).');
    (uploadedByParam[f.param] = uploadedByParam[f.param] || []).push(url);
    const uploadRecord = {
      param: f.param,
      path: f.path,
      sha256: f.sha256,
      url,
      expires_at: up.data && up.data.expires_at ? String(up.data.expires_at) : '',
    };
    savedUploads.push(uploadRecord);
    manifestState = { ...manifestState, uploaded_files: [...savedUploads] };
    // Persistir la URL antes del submit mantiene estable el hash idempotente si
    // la respuesta del gateway se pierde y el usuario recupera con la misma UUID.
    markSubmitted(manifestState, {});
  }

  const adapter = ADAPTERS[model.driver];
  const payload = adapter.buildPayload(model, m0.params, uploadedByParam);
  out('Enviando a ' + model.label + '…');
  const sub = await adapter.submit(model, payload, {
    client_request_id: clientRequestId,
    max_credits_authorized: estimateAgain.credits,
  });
  if (!sub.ok) fail(explain(sub.normalized));
  markSubmitted(manifestState, { submitted_task: sub.taskRef.serverTaskId, submitted_at: new Date().toISOString() });
  saveTaskReceipt(hit.id, sub.taskRef);
  out('Tarea encolada: ' + sub.taskRef.serverTaskId);

  const done = await pollAndDownload(model, sub.taskRef, opts.output);
  process.exit(done ? 0 : 1);
}

async function pollAndDownload(model, taskRef, outputOverride) {
  const t0 = Date.now();
  const limit = TIMEOUT_MS[model.output] || TIMEOUT_MS.image;
  const adapter = ADAPTERS[model.driver];
  for (;;) {
    if (Date.now() - t0 > limit) {
      out('Sigue en curso tras el tiempo maximo de espera. Reanuda con: node scripts/ailab.mjs status ' + taskRef.serverTaskId + ' · o mira el Historial de la web.');
      return false;
    }
    const st = await adapter.check(model, taskRef);
    if (st.status === 'success') {
      const dir = resolveOutputDir(outputOverride);
      const saved = [];
      for (let i = 0; i < (st.texts || []).length; i++) {
        const file = saveTextTo(dir, model.label, st.texts[i], i);
        saved.push(file);
        out('Guardado: ' + file + ' (texto)');
      }
      for (let i = 0; i < (st.urls || []).length; i++) {
        const d = await downloadTo(dir, model.label, st.urls[i], i);
        if (d.ok) { saved.push(d.path); out('Guardado: ' + d.path + ' (' + d.mime + ', ' + Math.round(d.bytes / 1024) + 'KB)'); }
        else out(d.error + ' · URL: ' + st.urls[i]);
      }
      const cost = await adapter.realCost(taskRef);
      const me = await apiPost({ action: 'me' });
      out('Coste real: ' + (cost === null ? 'pendiente de liquidar' : cost + ' cr') + (me.ok ? ' · saldo ' + me.raw.balance + ' cr' : ''));
      completeTaskReceipt(taskRef.serverTaskId);
      return saved.length > 0;
    }
    if (st.status === 'fail') { out('La generacion fallo (sin cargo): ' + st.error); return false; }
    if (st.status === 'error') { out('Error consultando el estado: ' + explain(st.normalized)); return false; }
    await sleep(POLL_MS);
  }
}

async function cmdStatus(cat, taskId, opts) {
  await requireSession();
  const receipt = loadTaskReceipt(taskId);
  let model;
  let taskRef;
  if (receipt && cat.models[receipt.model_id]) {
    model = cat.models[receipt.model_id];
    taskRef = receipt.task_ref;
  } else {
    const remote = await taskLookup(taskId);
    if (!remote.ok || !remote.raw || !remote.raw.task) {
      fail('No hay recibo local ni metadatos recuperables para esa tarea: ' + explain(remote));
    }
    const meta = remote.raw.task;
    if (!cat.models[meta.model_id]) {
      fail('La tarea existe, pero su modelo (' + meta.model_id + ') no tiene un contrato publico recuperable. Actualiza AILAB o consulta el Historial web.');
    }
    model = cat.models[meta.model_id];
    const state = String(meta.state || '').toLowerCase();
    if (state === 'failed' || state === 'fail' || state === 'expired') {
      fail('La tarea termino con estado ' + state + ' y no tiene un resultado descargable.');
    }
    const recoveredUrls = Array.isArray(meta.result_urls) && meta.result_urls.length
      ? meta.result_urls
      : (meta.result_url ? [meta.result_url] : []);
    if (state === 'success' && recoveredUrls.length) {
      const dir = resolveOutputDir(opts.output);
      for (let index = 0; index < recoveredUrls.length; index++) {
        const downloaded = await downloadTo(dir, model.label, recoveredUrls[index], index);
        if (!downloaded.ok) fail(downloaded.error + ' · URL: ' + recoveredUrls[index]);
        out('Recuperado del servidor: ' + downloaded.path + ' (' + downloaded.mime + ', ' + Math.round(downloaded.bytes / 1024) + 'KB)');
      }
      out('Coste real: ' + (meta.charged_credits === null ? 'pendiente de liquidar' : meta.charged_credits + ' cr'));
      return;
    }
    let providerRequestId = String(taskId);
    if (model.driver === 'labs-queue-v1') providerRequestId = providerRequestId.replace(/^fal:/, '');
    if (model.driver === 'labs-queue-multi-v1') providerRequestId = providerRequestId.replace(/^apimart:/, '');
    if (model.driver === 'heygen-v1') providerRequestId = providerRequestId.replace(/^heygen:/, '');
    taskRef = { serverTaskId: String(taskId), providerRequestId, costTaskId: String(taskId) };
    saveTaskReceipt(meta.model_id, taskRef);
    out('Tarea recuperada desde la wallet compartida: ' + meta.model_id + '.');
  }
  const ok = await pollAndDownload(model, taskRef, opts.output);
  process.exit(ok ? 0 : 1);
}

async function main() {
  const { pos, opts } = parseArgs(process.argv.slice(2));
  const cmd = pos[0];
  if (!cmd || cmd === 'help') {
    out('AILAB CLI v' + CLI_VERSION + ' · Playground y asistentes desde Claude Code');
    out('Base: ' + BASE_URL);
    out('Comandos: login · logout · doctor · balance · voices [eleven|heygen] · models · info <modelo> · validate <modelo> [params] · prepare <modelo> [params] · submit <manifest_id> --confirmed [--output dir] · status <taskId> · assistants · assistant-prepare <asistente> --message <texto> [--image|--audio|--video ruta] · assistant-submit <request_id> --confirmed');
    return;
  }
  if (cmd === 'login') return cmdLogin();
  if (cmd === 'self-test') {
    const local = loadCatalog();
    const compatibility = catalogCompatible(local);
    if (!compatibility.ok) fail(compatibility.reason);
    for (const [id, model] of Object.entries(local.models)) {
      const usable = modelUsable(model);
      if (!usable.ok) fail('SELF_TEST_FAIL ' + id + ': ' + usable.reason);
      if (!ADAPTERS[model.driver] || typeof ADAPTERS[model.driver].buildPayload !== 'function') fail('SELF_TEST_FAIL driver ' + model.driver + '.');
    }
    out('SELF_TEST_OK ' + CLI_VERSION + ' · ' + Object.keys(local.models).length + ' modelos');
    return;
  }
  if (cmd === 'login-cookie') return cmdLoginCookie();
  if (cmd === 'logout') return cmdLogout();
  if (cmd === 'balance') return cmdBalance();
  if (cmd === 'voices') return cmdVoices(pos[1] || 'eleven');
  if (cmd === 'assistants') return cmdAssistants();
  if (cmd === 'assistant-prepare') return cmdAssistantPrepare(pos[1], opts);
  if (cmd === 'assistant-submit') return cmdAssistantSubmit(pos[1], opts);
  const cat = (cmd === 'submit' || cmd === 'doctor' || cmd === 'status')
    ? await refreshCatalog({ maxAgeMs: 10 * 60 * 1000, requireNetwork: true })
    : await refreshCatalog({ maxAgeMs: 60 * 60 * 1000, requireNetwork: false });
  const compat = catalogCompatible(cat);
  if (!compat.ok) fail(compat.reason);
  if (cmd === 'models') return cmdModels(cat);
  if (cmd === 'info') return cmdInfo(cat, pos[1]);
  if (cmd === 'validate') return cmdValidate(cat, pos[1], opts);
  if (cmd === 'prepare') return cmdPrepare(cat, pos[1], opts);
  if (cmd === 'submit') return cmdSubmit(cat, pos[1], opts);
  if (cmd === 'doctor') return cmdDoctor(cat);
  if (cmd === 'status') return cmdStatus(cat, pos[1], opts);
  fail('Comando desconocido: ' + cmd);
}

main().catch((e) => fail('Error: ' + (e && e.stack ? e.stack : e)));
