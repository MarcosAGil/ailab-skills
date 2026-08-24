// Persistencia idempotente de mensajes de asistentes y sesiones opcionales.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_DIR, ensureConfigDir } from './config.mjs';
import { stableStringify } from './catalog.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requestDir = () => path.join(CONFIG_DIR, 'assistant-requests');
const sessionDir = () => path.join(CONFIG_DIR, 'sessions');

function safeFile(dir, id) {
  return UUID_RE.test(String(id || '')) ? path.join(dir, String(id) + '.json') : null;
}

function atomicWrite(file, value) {
  ensureConfigDir();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

function read(file) {
  if (!file || !fs.existsSync(file)) return null;
  try {
    const stat = fs.statSync(file);
    if (stat.size > 2 * 1024 * 1024) return null;
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value && typeof value === 'object' ? value : null;
  } catch { return null; }
}

export function createAssistantRequest(prepared) {
  const requestId = crypto.randomUUID();
  const preparedHash = crypto.createHash('sha256').update(stableStringify(prepared)).digest('hex');
  const value = {
    request_id: requestId,
    state: 'prepared',
    ...prepared,
    prepared_hash: preparedHash,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  atomicWrite(safeFile(requestDir(), requestId), value);
  return value;
}

export function assistantRequestIntact(value) {
  if (!value || !/^[0-9a-f]{64}$/.test(String(value.prepared_hash || ''))) return false;
  const prepared = {
    assistant_id: value.assistant_id,
    model_id: value.model_id,
    session_id: value.session_id ?? null,
    history: value.history,
    message: value.message,
    files: value.files,
    image_urls: [],
    catalog_version: value.catalog_version,
    contract_hash: value.contract_hash,
    estimated_credits: value.estimated_credits,
  };
  return crypto.createHash('sha256').update(stableStringify(prepared)).digest('hex') === value.prepared_hash;
}

export function loadAssistantRequest(id) {
  const value = read(safeFile(requestDir(), id));
  return value && value.request_id === String(id) ? value : null;
}

export function updateAssistantRequest(value, extra) {
  const file = safeFile(requestDir(), value && value.request_id);
  if (!file) throw new Error('ID de peticion no valido.');
  const next = { ...value, ...extra, updated_at: new Date().toISOString() };
  atomicWrite(file, next);
  return next;
}

export function loadSession(id) {
  const value = read(safeFile(sessionDir(), id));
  return value && value.session_id === String(id) ? value : null;
}

export function createSession(assistantId, modelId) {
  const id = crypto.randomUUID();
  const value = { session_id: id, assistant_id: assistantId, model_id: modelId, messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  atomicWrite(safeFile(sessionDir(), id), value);
  return value;
}

export function saveSession(value) {
  const file = safeFile(sessionDir(), value && value.session_id);
  if (!file) throw new Error('ID de sesion no valido.');
  const source = Array.isArray(value.messages) ? value.messages.slice(-20) : [];
  const messages = [];
  let chars = 0;
  for (let index = source.length - 1; index >= 0; index--) {
    const item = source[index];
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
    if (item.content.length > 20000 || chars + item.content.length > 60000) break;
    messages.unshift({ role: item.role, content: item.content });
    chars += item.content.length;
  }
  const next = { ...value, messages, updated_at: new Date().toISOString() };
  atomicWrite(file, next);
  return next;
}
