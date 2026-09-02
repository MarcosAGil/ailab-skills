// Catalogo remoto de asistentes. Solo contiene metadatos publicos: el system
// prompt, las rutas y las credenciales permanecen en el servidor.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ASSISTANTS_URL, CLI_VERSION, CONFIG_DIR, ensureConfigDir } from './config.mjs';
import { stableStringify } from './catalog.mjs';

const TOP_KEYS = new Set(['schema_version', 'catalog_version', 'min_cli_version', 'billing', 'default_model', 'assistants', 'models']);
const BILLING_KEYS = new Set(['type', 'max_authorized_credits']);
const ASSISTANT_KEYS = new Set(['label', 'description', 'prompt_version', 'prompt_sha256', 'estimated_credits', 'max_authorized_credits']);
const MODEL_KEYS = new Set(['label', 'vendor', 'accepts_images', 'accepts_audio', 'accepts_video']);

function parseSemver(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(String(value || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function semverGte(a, b) {
  const pa = parseSemver(a), pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return true;
}

function rejectExtra(value, allowed, where) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) throw new Error('Catalogo de asistentes invalido: campo ' + where + '.' + key + '.');
  }
}

export function validateAssistantsCatalog(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Catalogo de asistentes invalido.');
  rejectExtra(value, TOP_KEYS, 'raiz');
  if (value.schema_version !== 2) throw new Error('Version de schema de asistentes incompatible.');
  if (!parseSemver(value.catalog_version) || !parseSemver(value.min_cli_version)) throw new Error('Version del catalogo de asistentes no valida.');
  if (!semverGte(CLI_VERSION, value.min_cli_version)) throw new Error('Actualiza AILAB para usar los asistentes (necesita CLI ' + value.min_cli_version + ').');
  if (!value.billing || typeof value.billing !== 'object' || Array.isArray(value.billing)) throw new Error('Falta la facturacion de asistentes.');
  rejectExtra(value.billing, BILLING_KEYS, 'billing');
  if (value.billing.type !== 'actual_usage') throw new Error('Tipo de facturacion de asistentes no valido.');
  if (!Number.isInteger(value.billing.max_authorized_credits) || value.billing.max_authorized_credits < 1 || value.billing.max_authorized_credits > 10000) throw new Error('Maximo autorizado de asistentes no valido.');
  if (!value.assistants || typeof value.assistants !== 'object' || Array.isArray(value.assistants)) throw new Error('Faltan asistentes.');
  if (!value.models || typeof value.models !== 'object' || Array.isArray(value.models)) throw new Error('Faltan modelos de asistente.');
  if (!value.models[value.default_model]) throw new Error('El modelo por defecto no existe.');
  for (const [id, item] of Object.entries(value.assistants)) {
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id) || !item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Asistente no valido: ' + id + '.');
    rejectExtra(item, ASSISTANT_KEYS, 'assistants.' + id);
    if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 100) throw new Error('Nombre no valido en ' + id + '.');
    if (typeof item.description !== 'string' || item.description.length > 500) throw new Error('Descripcion no valida en ' + id + '.');
    if (item.prompt_sha256 !== null && !/^[0-9a-f]{64}$/.test(String(item.prompt_sha256))) throw new Error('Hash de prompt no valido en ' + id + '.');
    if (!Number.isInteger(item.estimated_credits) || item.estimated_credits < 1 || item.estimated_credits > value.billing.max_authorized_credits) throw new Error('Estimacion no valida en ' + id + '.');
    if (!Number.isInteger(item.max_authorized_credits) || item.max_authorized_credits < item.estimated_credits || item.max_authorized_credits > value.billing.max_authorized_credits) throw new Error('Maximo autorizado no valido en ' + id + '.');
  }
  for (const [id, item] of Object.entries(value.models)) {
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id) || !item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Modelo de asistente no valido: ' + id + '.');
    rejectExtra(item, MODEL_KEYS, 'models.' + id);
    if (typeof item.label !== 'string' || !item.label.trim() || typeof item.vendor !== 'string') throw new Error('Metadatos no validos en ' + id + '.');
    if (typeof item.accepts_images !== 'boolean') throw new Error('accepts_images no valido en ' + id + '.');
    if (typeof item.accepts_audio !== 'boolean') throw new Error('accepts_audio no valido en ' + id + '.');
    if (typeof item.accepts_video !== 'boolean') throw new Error('accepts_video no valido en ' + id + '.');
  }
  return value;
}

function atomicJson(file, value) {
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

function readCached() {
  const file = path.join(CONFIG_DIR, 'assistants.json');
  const raw = fs.readFileSync(file, 'utf8');
  if (Buffer.byteLength(raw, 'utf8') > 1024 * 1024) throw new Error('Catalogo de asistentes demasiado grande.');
  return validateAssistantsCatalog(JSON.parse(raw));
}

export async function refreshAssistantsCatalog({ maxAgeMs = 10 * 60 * 1000, requireNetwork = false } = {}) {
  ensureConfigDir();
  const cacheFile = path.join(CONFIG_DIR, 'assistants.json');
  const metaFile = path.join(CONFIG_DIR, 'assistants-meta.json');
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch {}
  const age = meta.fetched_at ? Date.now() - Date.parse(meta.fetched_at) : Infinity;
  let cached = null;
  if (fs.existsSync(cacheFile)) {
    try { cached = readCached(); } catch { cached = null; }
  }
  if (cached && age <= maxAgeMs) return cached;
  const headers = {};
  if (cached && meta.etag) headers['If-None-Match'] = meta.etag;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(ASSISTANTS_URL, { headers, cache: 'no-store', signal: controller.signal });
    if (res.status === 304 && cached) {
      atomicJson(metaFile, { ...meta, fetched_at: new Date().toISOString() });
      return cached;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > 1024 * 1024) throw new Error('respuesta demasiado grande');
    const raw = await res.text();
    if (Buffer.byteLength(raw, 'utf8') > 1024 * 1024) throw new Error('respuesta demasiado grande');
    const catalog = validateAssistantsCatalog(JSON.parse(raw));
    atomicJson(cacheFile, catalog);
    atomicJson(metaFile, { etag: res.headers.get('etag') || '', fetched_at: new Date().toISOString(), catalog_version: catalog.catalog_version });
    return catalog;
  } catch (e) {
    if (!requireNetwork && cached) return cached;
    throw new Error('No se pudo validar el catalogo de asistentes: ' + (e && e.message ? e.message : e));
  } finally {
    clearTimeout(timeout);
  }
}

export function resolveAssistant(catalog, value) {
  const query = String(value || '').trim().toLowerCase();
  if (catalog.assistants[query]) return { id: query, assistant: catalog.assistants[query] };
  for (const [id, item] of Object.entries(catalog.assistants)) {
    if (item.label.toLowerCase() === query) return { id, assistant: item };
  }
  return null;
}

export function resolveAssistantModel(catalog, value) {
  const query = String(value || catalog.default_model).trim().toLowerCase();
  if (catalog.models[query]) return { id: query, model: catalog.models[query] };
  for (const [id, item] of Object.entries(catalog.models)) {
    if (item.label.toLowerCase() === query) return { id, model: item };
  }
  return null;
}

export function assistantContractHash(catalog, assistantId, modelId) {
  const item = {
    schema_version: catalog.schema_version,
    billing: catalog.billing,
    assistant_id: assistantId,
    assistant: catalog.assistants[assistantId] || null,
    model_id: modelId,
    model: catalog.models[modelId] || null,
  };
  return crypto.createHash('sha256').update(stableStringify(item)).digest('hex');
}
