// Catalogo publico + validacion de parametros + estimacion en creditos.
// El catalogo solo SELECCIONA drivers de la lista blanca local (plan v2.1 §5).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CATALOG_PATH, CATALOG_URL, CLI_VERSION, CONFIG_DIR, SERVER_CONTRACT_VERSION, ensureConfigDir } from './config.mjs';
import { inspectPricingMetadata } from './files.mjs';

export const DRIVER_WHITELIST = ['jobs-v1', 'jobs-text-v1', 'labs-queue-v1', 'labs-queue-multi-v1', 'hybrid-seedream-v1', 'hybrid-grok-v1', 'veo-v1', 'eleven-v1', 'suno-v1', 'heygen-v1'];

const TOP_KEYS = new Set(['catalog_version', 'min_cli_version', 'models', 'server_contract_version']);
const MODEL_KEYS = new Set(['aliases', 'description', 'driver', 'enabled', 'estimate', 'expensive', 'id', 'label', 'min_cli_version', 'modes', 'output', 'params', 'section', 'status', 'tier', 'vendor']);
const PARAM_KEYS = new Set(['accept', 'default', 'help', 'internal', 'max', 'max_len', 'min', 'required', 'required_when', 'type', 'values']);
const ESTIMATE_KEYS = new Set(['approximate', 'audio_param', 'auto_duration_param', 'auto_duration_seconds', 'basic_credit_per_input', 'basic_credits', 'block_seconds', 'by_param', 'characters_param', 'characters_params', 'column_param', 'credit_usd', 'credits', 'credits_by_value', 'credits_matrix', 'credits_per_1000', 'credits_per_file', 'credits_per_second', 'credits_per_unit', 'credits_with_audio', 'credits_with_files', 'credits_with_video', 'credits_with_video_matrix', 'duration_by_mode', 'files_param', 'high_credits', 'kind', 'layers_max_credits', 'margin_multiplier', 'matrix_mode', 'minimum_credits', 'mode_param', 'note', 'promo', 'quality_param', 'round_up', 'row_param', 'seconds_param', 'units_param', 'usd_per_block', 'video_param']);
const PROMO_KEYS = new Set(['label', 'until', 'previous_credits_per_second', 'previous_credits_with_video', 'previous_credits_matrix', 'previous_credits_with_video_matrix']);
const ESTIMATE_KINDS = new Set(['flat_credits', 'per_second_table', 'per_second_matrix', 'mixed_mode', 'param_table', 'hybrid_seedream', 'matrix_table', 'unit_credits', 'per_1000_chars', 'duration_blocks']);
const PARAM_TYPES = new Set(['string', 'string[]', 'enum', 'int', 'number', 'bool', 'file', 'file[]']);
const OUTPUT_TYPES = new Set(['image', 'multi-image', 'video', 'audio', 'text']);

function parseSemver(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(String(value || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function semverGte(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) {
    const x = pa[i], y = pb[i];
    if (x > y) return true;
    if (x < y) return false;
  }
  return true;
}

function rejectExtraKeys(value, allowed, where) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) throw new Error('Catalogo invalido: campo no permitido ' + where + '.' + key + '.');
  }
}

export function validateCatalogShape(cat) {
  if (!cat || typeof cat !== 'object' || Array.isArray(cat)) throw new Error('Catalogo invalido: raiz no valida.');
  rejectExtraKeys(cat, TOP_KEYS, 'raiz');
  if (!/^\d+\.\d+\.\d+$/.test(String(cat.catalog_version || ''))) throw new Error('Catalogo invalido: catalog_version no es semver estable.');
  if (!parseSemver(cat.min_cli_version)) throw new Error('Catalogo invalido: min_cli_version no es semver.');
  if (String(cat.server_contract_version) === '') throw new Error('Catalogo invalido: falta server_contract_version.');
  if (!cat.models || typeof cat.models !== 'object' || Array.isArray(cat.models)) throw new Error('Catalogo invalido: falta models.');
  const entries = Object.entries(cat.models);
  if (!entries.length || entries.length > 500) throw new Error('Catalogo invalido: numero de modelos fuera de rango.');
  for (const [id, model] of entries) {
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id) || !model || typeof model !== 'object' || Array.isArray(model)) throw new Error('Catalogo invalido: modelo ' + id + '.');
    rejectExtraKeys(model, MODEL_KEYS, 'models.' + id);
    if (model.id !== undefined && model.id !== id) throw new Error('Catalogo invalido: el id interno no coincide en ' + id + '.');
    if (typeof model.label !== 'string' || !model.label.trim() || model.label.length > 120) throw new Error('Catalogo invalido: label de ' + id + '.');
    if (!DRIVER_WHITELIST.includes(model.driver)) throw new Error('Catalogo invalido: driver desconocido en ' + id + '.');
    if (!OUTPUT_TYPES.has(model.output)) throw new Error('Catalogo invalido: output desconocido en ' + id + '.');
    if (!model.params || typeof model.params !== 'object' || Array.isArray(model.params)) throw new Error('Catalogo invalido: params de ' + id + '.');
    for (const [param, spec] of Object.entries(model.params)) {
      if (!/^[a-z][a-z0-9_]{0,79}$/.test(param) || !spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('Catalogo invalido: parametro ' + id + '.' + param + '.');
      rejectExtraKeys(spec, PARAM_KEYS, 'models.' + id + '.params.' + param);
      if (!PARAM_TYPES.has(spec.type)) throw new Error('Catalogo invalido: tipo de ' + id + '.' + param + '.');
      if (spec.type === 'enum' && (!Array.isArray(spec.values) || !spec.values.length || spec.values.length > 100)) throw new Error('Catalogo invalido: enum de ' + id + '.' + param + '.');
      if ((spec.type === 'file' || spec.type === 'file[]') && spec.accept !== undefined
          && !(typeof spec.accept === 'string' || (Array.isArray(spec.accept) && spec.accept.every((v) => typeof v === 'string')))) {
        throw new Error('Catalogo invalido: accept de ' + id + '.' + param + '.');
      }
      if (spec.required_when !== undefined) {
        if (!spec.required_when || typeof spec.required_when !== 'object' || Array.isArray(spec.required_when)) throw new Error('Catalogo invalido: required_when de ' + id + '.' + param + '.');
        for (const [dependency, expected] of Object.entries(spec.required_when)) {
          const dependencySpec = model.params[dependency];
          if (!dependencySpec) throw new Error('Catalogo invalido: required_when apunta a parametro inexistente en ' + id + '.' + param + '.');
          const expectedValues = Array.isArray(expected) ? expected : [expected];
          if (!expectedValues.length) throw new Error('Catalogo invalido: required_when vacio en ' + id + '.' + param + '.');
          if (dependencySpec.type === 'enum' && expectedValues.some((value) => !dependencySpec.values.includes(value))) throw new Error('Catalogo invalido: required_when fuera del enum en ' + id + '.' + param + '.');
          if (dependencySpec.type === 'bool' && expectedValues.some((value) => typeof value !== 'boolean')) throw new Error('Catalogo invalido: required_when booleano en ' + id + '.' + param + '.');
        }
      }
    }
    if (!model.estimate || typeof model.estimate !== 'object' || Array.isArray(model.estimate)) throw new Error('Catalogo invalido: estimate de ' + id + '.');
    rejectExtraKeys(model.estimate, ESTIMATE_KEYS, 'models.' + id + '.estimate');
    if (!ESTIMATE_KINDS.has(model.estimate.kind)) throw new Error('Catalogo invalido: estimate.kind de ' + id + '.');
    if (model.estimate.promo !== undefined) {
      if (!model.estimate.promo || typeof model.estimate.promo !== 'object' || Array.isArray(model.estimate.promo)) throw new Error('Catalogo invalido: promo de ' + id + '.');
      rejectExtraKeys(model.estimate.promo, PROMO_KEYS, 'models.' + id + '.estimate.promo');
      if (typeof model.estimate.promo.label !== 'string' || !model.estimate.promo.label.trim()) throw new Error('Catalogo invalido: promo.label de ' + id + '.');
      const until = String(model.estimate.promo.until || '');
      const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/.exec(until);
      if (!match) throw new Error('Catalogo invalido: promo.until de ' + id + '.');
      const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
      const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) throw new Error('Catalogo invalido: promo.until irreal de ' + id + '.');
    }
  }
  return cat;
}

export function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

export function modelContractHash(id, model) {
  const contract = {
    id,
    driver: model.driver,
    enabled: model.enabled,
    status: model.status,
    output: model.output,
    min_cli_version: model.min_cli_version || null,
    params: model.params || {},
    estimate: model.estimate || {},
    expensive: !!model.expensive,
  };
  return crypto.createHash('sha256').update(stableStringify(contract)).digest('hex');
}

function parseCatalogFile(source) {
  const stat = fs.statSync(source);
  if (stat.size < 2 || stat.size > 10 * 1024 * 1024) throw new Error('Catalogo invalido: tamaño fuera de rango.');
  return validateCatalogShape(JSON.parse(fs.readFileSync(source, 'utf8')));
}

function atomicJson(file, value) {
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

export function loadCatalog() {
  const cached = path.join(CONFIG_DIR, 'catalog.json');
  const explicit = process.env.AILAB_CATALOG_PATH || process.env.PG_CATALOG_PATH;
  const source = explicit ? CATALOG_PATH : (fs.existsSync(cached) ? cached : CATALOG_PATH);
  try { return parseCatalogFile(source); }
  catch (e) {
    if (!explicit && source === cached && fs.existsSync(CATALOG_PATH)) return parseCatalogFile(CATALOG_PATH);
    throw e;
  }
}

export function catalogCompatible(cat) {
  if (String(cat.server_contract_version) !== String(SERVER_CONTRACT_VERSION)) {
    return { ok: false, reason: 'Contrato de servidor incompatible: catalogo ' + cat.server_contract_version + ', CLI ' + SERVER_CONTRACT_VERSION + '.' };
  }
  if (cat.min_cli_version && !semverGte(CLI_VERSION, cat.min_cli_version)) {
    return { ok: false, reason: 'Actualiza la skill: el catalogo necesita CLI ' + cat.min_cli_version + '.' };
  }
  return { ok: true };
}

export async function refreshCatalog({ maxAgeMs, requireNetwork }) {
  if (process.env.AILAB_CATALOG_PATH || process.env.PG_CATALOG_PATH) return loadCatalog();
  ensureConfigDir();
  const cacheFile = path.join(CONFIG_DIR, 'catalog.json');
  const metaFile = path.join(CONFIG_DIR, 'catalog-meta.json');
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch {}
  const age = meta.fetched_at ? Date.now() - Date.parse(meta.fetched_at) : Infinity;
  if (fs.existsSync(cacheFile) && age <= maxAgeMs) return loadCatalog();
  const headers = {};
  if (meta.etag) headers['If-None-Match'] = meta.etag;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(CATALOG_URL, { headers, cache: 'no-store', signal: controller.signal });
      if (res.status === 304 && fs.existsSync(cacheFile)) {
        atomicJson(metaFile, { ...meta, fetched_at: new Date().toISOString() });
        return loadCatalog();
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const declared = Number(res.headers.get('content-length') || 0);
      if (declared > 10 * 1024 * 1024) throw new Error('catalogo demasiado grande');
      const raw = await res.text();
      if (Buffer.byteLength(raw, 'utf8') > 10 * 1024 * 1024) throw new Error('catalogo demasiado grande');
      const cat = validateCatalogShape(JSON.parse(raw));
      const compatibility = catalogCompatible(cat);
      if (!compatibility.ok) throw new Error(compatibility.reason);
      atomicJson(cacheFile, cat);
      atomicJson(metaFile, { etag: res.headers.get('etag') || '', fetched_at: new Date().toISOString(), catalog_version: cat.catalog_version });
      return cat;
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    if (!requireNetwork && fs.existsSync(cacheFile) && age <= maxAgeMs) return loadCatalog();
    throw new Error('No se pudo validar un catalogo fresco: ' + (e && e.message ? e.message : e));
  }
}

export function resolveModel(cat, nameOrAlias) {
  const q = String(nameOrAlias || '').trim().toLowerCase();
  if (cat.models[q]) return { id: q, model: cat.models[q] };
  for (const [id, m] of Object.entries(cat.models)) {
    if ((m.label || '').toLowerCase() === q) return { id, model: m };
    if (Array.isArray(m.aliases) && m.aliases.some((a) => a.toLowerCase() === q)) return { id, model: m };
  }
  return null;
}

export function modelUsable(model) {
  if (model.status !== 'active' || model.enabled !== true) {
    return { ok: false, reason: 'El modelo no esta disponible ahora mismo.' };
  }
  if (!DRIVER_WHITELIST.includes(model.driver)) {
    return { ok: false, reason: 'Este modelo necesita una version mas nueva de la skill (driver ' + model.driver + ').' };
  }
  if (model.min_cli_version && !semverGte(CLI_VERSION, model.min_cli_version)) {
    return { ok: false, reason: 'Actualiza la skill para usar este modelo (necesita CLI ' + model.min_cli_version + ').' };
  }
  return { ok: true };
}

// Valida y normaliza los parametros de la CLI contra el schema del modelo.
// Devuelve { ok, errors[], params, fileParams: {nombre: [rutas]} }.
export function validateParams(model, given) {
  const errors = [];
  const params = {};
  const fileParams = {};
  const schema = model.params || {};

  for (const key of Object.keys(given)) {
    if (!schema[key]) errors.push('Parametro desconocido: --' + key);
  }
  for (const [key, spec] of Object.entries(schema)) {
    let v = given[key];
    if (v === undefined || v === '') {
      if (spec.required) { errors.push('Falta el parametro obligatorio --' + key); continue; }
      if (spec.default !== undefined) v = spec.default; else continue;
    }
    if (v === true && spec.type !== 'bool') {
      errors.push('--' + key + ' necesita un valor.');
      continue;
    }
    switch (spec.type) {
      case 'string': {
        v = String(v);
        if (spec.max_len && v.length > spec.max_len) errors.push('--' + key + ' supera ' + spec.max_len + ' caracteres (' + v.length + ').');
        params[key] = v; break;
      }
      case 'string[]': {
        const list = (Array.isArray(v) ? v : [v]).map((item) => String(item).trim());
        const max = spec.max || 10;
        if (!list.length || list.some((item) => item === '')) errors.push('--' + key + ' contiene un valor vacio.');
        if (list.length > max) errors.push('--' + key + ' admite como mucho ' + max + ' valor(es).');
        if (spec.max_len && list.some((item) => item.length > spec.max_len)) errors.push('--' + key + ' contiene un valor que supera ' + spec.max_len + ' caracteres.');
        params[key] = list;
        break;
      }
      case 'enum': {
        v = String(v);
        if (!spec.values.includes(v)) errors.push('--' + key + ' debe ser uno de: ' + spec.values.join(', '));
        params[key] = v; break;
      }
      case 'int': {
        const raw = String(v).trim();
        if (!/^-?\d+$/.test(raw)) { errors.push('--' + key + ' debe ser un numero entero.'); break; }
        const n = Number(raw);
        if (!Number.isSafeInteger(n)) { errors.push('--' + key + ' debe ser un numero entero seguro.'); break; }
        if (spec.min !== undefined && n < spec.min) errors.push('--' + key + ' minimo ' + spec.min + '.');
        if (spec.max !== undefined && n > spec.max) errors.push('--' + key + ' maximo ' + spec.max + '.');
        params[key] = n; break;
      }
      case 'number': {
        const n = Number(v);
        if (!Number.isFinite(n)) { errors.push('--' + key + ' debe ser un numero.'); break; }
        if (spec.min !== undefined && n < spec.min) errors.push('--' + key + ' minimo ' + spec.min + '.');
        if (spec.max !== undefined && n > spec.max) errors.push('--' + key + ' maximo ' + spec.max + '.');
        params[key] = n; break;
      }
      case 'bool': {
        const s = String(v).toLowerCase();
        if (!['true','1','si','sí','false','0','no'].includes(s)) { errors.push('--' + key + ' debe ser true/false, si/no o 1/0.'); break; }
        params[key] = (s === 'true' || s === '1' || s === 'si' || s === 'sí');
        break;
      }
      case 'file':
      case 'file[]': {
        const list = Array.isArray(v) ? v : [v];
        const max = spec.type === 'file' ? 1 : (spec.max || 10);
        if (list.length > max) errors.push('--' + key + ' admite como mucho ' + max + ' archivo(s).');
        fileParams[key] = list.map(String);
        break;
      }
      default:
        errors.push('Tipo de parametro no soportado en el schema: ' + spec.type);
    }
  }
  for (const [key, spec] of Object.entries(schema)) {
    if (!spec.required_when) continue;
    const active = Object.entries(spec.required_when).every(([dep, expected]) => (
      Array.isArray(expected) ? expected.includes(params[dep]) : params[dep] === expected
    ));
    const present = spec.type === 'file' || spec.type === 'file[]' ? !!(fileParams[key] && fileParams[key].length) : params[key] !== undefined;
    if (active && !present) errors.push('Falta el parametro --' + key + ' cuando ' + Object.entries(spec.required_when).map(([k,v]) => '--' + k + '=' + v).join(', ') + '.');
  }
  return { ok: errors.length === 0, errors, params, fileParams };
}

// Estimacion en creditos segun la regla declarada (siempre en creditos, plan §3).
function effectivePerSecondTable(estimate, now = Date.now()) {
  const table = { ...(estimate.credits_per_second || {}) };
  const promo = estimate.promo;
  const ends = promo && promo.until ? Date.parse(String(promo.until)) : NaN;
  if (!Number.isFinite(ends) || now < ends) return table;
  return { ...table, ...(promo.previous_credits_per_second || {}) };
}

function effectiveMatrix(estimate, field, previousField, now = Date.now()) {
  const current = estimate[field] || {};
  const promo = estimate.promo;
  const ends = promo && promo.until ? Date.parse(String(promo.until)) : NaN;
  if (!Number.isFinite(ends) || now < ends || !promo[previousField]) return current;
  const merged = {};
  for (const [row, values] of Object.entries(current)) {
    merged[row] = { ...values, ...((promo[previousField] || {})[row] || {}) };
  }
  for (const [row, values] of Object.entries(promo[previousField] || {})) {
    if (!merged[row]) merged[row] = { ...values };
  }
  return merged;
}

export function estimateCredits(model, params, now = Date.now()) {
  const e = model.estimate || {};
  // El catálogo conserva `mixed_mode` para que runtimes antiguos sigan
  // pudiendo cargarlo. Desde 2.1.11 H3 Max autoriza el coste real local en vez
  // del máximo teórico de 1.300 cr; el servidor vuelve a medir y decide.
  if (model.id === 'minimax-h3-max') {
    const mode = String(params[e.mode_param || 'mode'] || 't2v');
    const seconds = Number(params.duration || 0);
    const resolution = String(params.resolution || '768P');
    if (!Number.isFinite(seconds) || seconds <= 0) return { credits: null, approximate: true, note: 'duración pendiente' };
    if (mode !== 'ref') {
      const rate = resolution === '480P' ? 10.2 : 16.32;
      return { credits: Math.ceil(rate * seconds), approximate: false, note: 'Salida exacta según duración y resolución.' };
    }
    const images = Array.isArray(params.reference_image_urls) ? params.reference_image_urls : [];
    const videos = Array.isArray(params.reference_video_urls) ? params.reference_video_urls : [];
    let tokens = 0;
    for (const file of images) {
      const metadata = inspectPricingMetadata(file);
      if (!metadata.ok || metadata.class !== 'image' || metadata.width > 4096 || metadata.height > 4096) {
        return { credits: 1300, approximate: true, note: metadata.error || 'Una imagen supera 4.096 px por lado.' };
      }
      tokens += metadata.pixels / 1024;
    }
    const videoTokenRate = resolution === '480P' ? 2886 : 7459.2;
    for (const file of videos) {
      const metadata = inspectPricingMetadata(file);
      if (!metadata.ok || metadata.mime !== 'video/mp4' || !Number.isFinite(metadata.duration)) {
        return { credits: 1300, approximate: true, note: metadata.error || 'Reference-to-Video requiere vídeos MP4 medibles.' };
      }
      tokens += metadata.duration * videoTokenRate;
    }
    const referenceCredits = Math.max(0, tokens - 4096) / 1000 * 4.08;
    return {
      credits: Math.ceil(16.32 * seconds + referenceCredits),
      approximate: false,
      note: seconds + ' s · ' + resolution + ' · ' + Math.round(tokens).toLocaleString('es-ES') + ' tokens de referencia'
    };
  }
  if (e.kind === 'flat_credits') return { credits: Math.ceil(e.credits), approximate: !!e.approximate, note: e.note || '' };
  if (e.kind === 'duration_blocks') {
    const seconds = Number(params[e.seconds_param] || 0);
    const blockSeconds = Number(e.block_seconds || 30);
    const unitUsd = Number(e.usd_per_block || 0);
    const margin = Number(e.margin_multiplier || 1);
    const creditUsd = Number(e.credit_usd || 0.005);
    if (![seconds, blockSeconds, unitUsd, margin, creditUsd].every(Number.isFinite) || seconds <= 0 || blockSeconds <= 0 || unitUsd <= 0 || margin <= 0 || creditUsd <= 0) {
      return { credits: null, approximate: true, note: 'duración pendiente' };
    }
    const blocks = Math.ceil(seconds / blockSeconds);
    const credits = Math.max(Number(e.minimum_credits || 1), Math.ceil(blocks * unitUsd * margin / creditUsd));
    return { credits, approximate: !!e.approximate, note: blocks + ' bloque(s) iniciado(s) de ' + blockSeconds + ' s' };
  }
  if (e.kind === 'per_second_table') {
    const key = params[e.by_param];
    const hasVideo = e.video_param && Array.isArray(params[e.video_param]) && params[e.video_param].length > 0;
    let table = effectivePerSecondTable(e, now);
    if (hasVideo && e.credits_with_video) {
      table = { ...e.credits_with_video };
      const ends = e.promo && e.promo.until ? Date.parse(String(e.promo.until)) : NaN;
      if (Number.isFinite(ends) && now >= ends) table = { ...table, ...(e.promo.previous_credits_with_video || {}) };
    } else if (e.audio_param && params[e.audio_param] && e.credits_with_audio) {
      table = { ...e.credits_with_audio };
    }
    const perSec = table[key];
    const modeDuration = e.mode_param && e.duration_by_mode && e.duration_by_mode[params[e.mode_param]];
    const secs = modeDuration !== undefined
      ? Number(modeDuration)
      : e.auto_duration_param && params[e.auto_duration_param]
      ? Number(e.auto_duration_seconds || 0)
      : Number(params[e.seconds_param] || 0);
    if (!perSec || !secs) return { credits: null, approximate: true, note: 'estimacion no disponible' };
    const fileCredits = e.files_param && Array.isArray(params[e.files_param])
      ? Number(e.credits_per_file || 0) * params[e.files_param].length
      : 0;
    return { credits: Math.ceil(perSec * secs + fileCredits), approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'per_second_matrix') {
    const row = params[e.row_param];
    const column = params[e.column_param];
    const hasVideo = e.video_param && Array.isArray(params[e.video_param]) && params[e.video_param].length > 0;
    const table = hasVideo && e.credits_with_video_matrix
      ? effectiveMatrix(e, 'credits_with_video_matrix', 'previous_credits_with_video_matrix', now)
      : effectiveMatrix(e, 'credits_matrix', 'previous_credits_matrix', now);
    const perSec = Number(table[row] && table[row][column]);
    const secs = e.auto_duration_param && params[e.auto_duration_param]
      ? Number(e.auto_duration_seconds || 0)
      : Number(params[e.seconds_param] || 0);
    const credits = perSec * secs;
    const fileCredits = e.files_param && Array.isArray(params[e.files_param])
      ? Number(e.credits_per_file || 0) * params[e.files_param].length
      : 0;
    return { credits: Number.isFinite(credits + fileCredits) && credits + fileCredits > 0 ? Math.ceil(credits + fileCredits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'param_table') {
    const key = params[e.by_param];
    const hasFiles = e.files_param && Array.isArray(params[e.files_param]) && params[e.files_param].length > 0;
    const table = hasFiles && e.credits_with_files ? e.credits_with_files : e.credits_by_value;
    const credits = table && Number(table[key]);
    return { credits: Number.isFinite(credits) ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'mixed_mode') {
    const mode = params[e.mode_param];
    if (mode === e.matrix_mode) {
      const row = params[e.row_param];
      const column = params[e.column_param];
      let credits = Number(e.credits_matrix && e.credits_matrix[row] && e.credits_matrix[row][column]);
      if (e.files_param && Array.isArray(params[e.files_param])) credits += Number(e.credits_per_file || 0) * params[e.files_param].length;
      return { credits: Number.isFinite(credits) && credits >= 0 ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
    }
    const credits = Number(e.credits_by_value && e.credits_by_value[mode]);
    return { credits: Number.isFinite(credits) && credits >= 0 ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'hybrid_seedream') {
    if (params[e.mode_param] === 'layers') {
      const maximum = Number(e.layers_max_credits);
      return { credits: Number.isFinite(maximum) && maximum > 0 ? Math.ceil(maximum) : null, approximate: true, note: e.note || '' };
    }
    const high = params[e.quality_param] === 'high';
    let credits = high ? Number(e.high_credits) : Number(e.basic_credits);
    if (!high && params[e.mode_param] === 'i2i' && Array.isArray(params[e.files_param])) credits += Number(e.basic_credit_per_input || 0) * params[e.files_param].length;
    return { credits: Number.isFinite(credits) ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'matrix_table') {
    const row = params[e.row_param];
    // Con clip de video (Gemini Omni) el servidor cobra tarifa PLANA por calidad
    // (la duracion la decide el modelo): sin esto la CLI autorizaba de menos y el
    // servidor devolvia 402 por superar max_credits_authorized.
    if (e.video_param && params[e.video_param] && e.credits_with_video) {
      const flat = Number(e.credits_with_video[row]);
      return { credits: Number.isFinite(flat) && flat > 0 ? Math.ceil(flat) : null, approximate: !!e.approximate, note: e.note || '' };
    }
    const column = params[e.column_param];
    let credits = Number(e.credits_matrix && e.credits_matrix[row] && e.credits_matrix[row][column]);
    if (e.multiplier_param) credits *= Number(params[e.multiplier_param] || 0);
    return { credits: Number.isFinite(credits) && credits > 0 ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'unit_credits') {
    const units = Number(params[e.units_param] || 0);
    const credits = Math.max(Number(e.minimum_credits || 0), units * Number(e.credits_per_unit || 0));
    return { credits: Number.isFinite(credits) && credits > 0 ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  if (e.kind === 'per_1000_chars') {
    const characterParams = Array.isArray(e.characters_params) ? e.characters_params : [e.characters_param];
    const chars = characterParams.reduce((total, key) => total + String(params[key] || '').length, 0);
    const credits = Math.max(Number(e.minimum_credits || 0), Math.ceil(chars / 1000) * Number(e.credits_per_1000 || 0));
    return { credits: Number.isFinite(credits) && credits > 0 ? Math.ceil(credits) : null, approximate: !!e.approximate, note: e.note || '' };
  }
  return { credits: null, approximate: true, note: 'sin regla de estimacion' };
}
