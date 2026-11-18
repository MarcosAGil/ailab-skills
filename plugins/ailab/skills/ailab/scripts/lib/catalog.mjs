// Catalogo publico + validacion de parametros. Desde la 2.5.0 no lleva precios: el importe lo da siempre el servidor
// (price.mjs). El catalogo solo SELECCIONA drivers de la lista blanca local (plan v2.1 §5).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CATALOG_PATH, CATALOG_URL, CLI_VERSION, CONFIG_DIR, SERVER_CONTRACT_VERSION, ensureConfigDir } from './config.mjs';
import { inspectPricingMetadata } from './files.mjs';
import { WAN3_ID, wan3Problems } from './wan3.mjs';
import { KLING4_ID, kling4Problems } from './kling4.mjs';
import { LITE_ID, liteProblems } from './seedance-lite.mjs';
import { LIGHT_ID, lightProblems } from './genjutsu-light.mjs';
import { SEEDANCE_IDS, seedanceProblems } from './seedance.mjs';
import { DRAFT_MODEL_IDS, DRAFT_UPGRADE_ID, draftProblems } from './seedance-draft.mjs';
import { OMNI12_ID, OMNI12_EXTEND_ID, OMNI_RESOURCE_IDS, omni12Problems, omni12ExtendProblems, omniResourceProblems } from './omni12.mjs';

export const DRIVER_WHITELIST = ['jobs-v1', 'jobs-text-v1', 'labs-queue-v1', 'labs-queue-multi-v1', 'hybrid-seedream-v1', 'hybrid-grok-v1', 'veo-v1', 'eleven-v1', 'suno-v1', 'heygen-v1', 'resemble-v1', 'topaz-v1', 'higgsfield-v1'];

const TOP_KEYS = new Set(['catalog_version', 'min_cli_version', 'models', 'server_contract_version']);
const MODEL_KEYS = new Set(['aliases', 'description', 'driver', 'enabled', 'expensive', 'id', 'label', 'min_cli_version', 'modes', 'output', 'params', 'section', 'status', 'tier', 'vendor']);
const PARAM_KEYS = new Set(['accept', 'default', 'help', 'internal', 'max', 'max_len', 'min', 'required', 'required_when', 'step', 'type', 'values']);
// Bloque de precio de los catálogos anteriores (`catalog-v2.json`). `catalog-v3.json` no lo trae; si llegara, se
// descarta al leerlo y nunca se usa ni se guarda.
const LEGACY_PRICE_KEY = 'estimate';
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
    delete model[LEGACY_PRICE_KEY];
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
    expensive: !!model.expensive,
  };
  return crypto.createHash('sha256').update(stableStringify(contract)).digest('hex');
}

// Caché propia del catálogo sin precios: la de los runtimes anteriores (`catalog.json`) es la v2 con tarifas.
const CACHE_FILE = 'catalog-v3.json';
const CACHE_META_FILE = 'catalog-v3-meta.json';

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
  const cached = path.join(CONFIG_DIR, CACHE_FILE);
  const explicit = process.env.AILAB_CATALOG_PATH || process.env.PG_CATALOG_PATH;
  if (explicit) return parseCatalogFile(CATALOG_PATH);
  let bundled = null;
  let cachedCatalog = null;
  let cachedError = null;
  if (fs.existsSync(CATALOG_PATH)) bundled = parseCatalogFile(CATALOG_PATH);
  if (fs.existsSync(cached)) {
    try { cachedCatalog = parseCatalogFile(cached); }
    catch (error) { cachedError = error; }
  }
  if (bundled && cachedCatalog) {
    return semverGte(cachedCatalog.catalog_version, bundled.catalog_version) ? cachedCatalog : bundled;
  }
  if (cachedCatalog) return cachedCatalog;
  if (bundled) return bundled;
  if (cachedError) throw cachedError;
  throw new Error('Catalogo no encontrado.');
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
  const cacheFile = path.join(CONFIG_DIR, CACHE_FILE);
  const metaFile = path.join(CONFIG_DIR, CACHE_META_FILE);
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch {}
  const age = meta.fetched_at ? Date.now() - Date.parse(meta.fetched_at) : Infinity;
  if (fs.existsSync(cacheFile) && age <= maxAgeMs) return loadCatalog();
  const headers = { 'X-AILAB-Client': 'ailab-cli/' + CLI_VERSION };
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
    throw new Error('No se pudo validar un catalogo fresco: ' + (e && e.message ? e.message : e), { cause: e });
  }
}

// Ids con los que el Playground y el servidor conocen modelos que la skill publica con un id corto desde la
// 2.3.0. Viven en el runtime y no en el catalogo: el contrato publicado de esos modelos no puede cambiar.
export const PLAYGROUND_ID_ALIASES = {
  'higgsfield-soul-2': 'soul-2',
  'higgsfield-genjutsu-motion-transfer': 'genjutsu',
};

export function resolveModel(cat, nameOrAlias) {
  const q = String(nameOrAlias || '').trim().toLowerCase();
  if (cat.models[q]) return { id: q, model: cat.models[q] };
  for (const [id, m] of Object.entries(cat.models)) {
    if ((m.label || '').toLowerCase() === q) return { id, model: m };
    if (Array.isArray(m.aliases) && m.aliases.some((a) => a.toLowerCase() === q)) return { id, model: m };
  }
  const mapped = Object.hasOwn(PLAYGROUND_ID_ALIASES, q) ? PLAYGROUND_ID_ALIASES[q] : null;
  if (mapped && cat.models[mapped]) return { id: mapped, model: cat.models[mapped] };
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
    if (model.id === 'eleven-tts' && given.version === 'v4' && ['style','speed'].includes(key)) {
      if (given[key] !== undefined) errors.push('La versión v4 no admite --' + key + '.');
      continue;
    }
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
        const count = (model.id === 'eleven-tts' && given.version === 'v4' && key === 'text') || (['nano-banana-2-1', KLING4_ID].includes(model.id) && key === 'prompt') ? Array.from(v.trim()).length : (model.id === LITE_ID && key === 'prompt' ? Array.from(v).length : v.length);
        const limit = model.id === 'eleven-tts' && given.version === 'v4' && key === 'text' ? 10000 : spec.max_len;
        if (limit && count > limit) errors.push('--' + key + ' supera ' + limit + ' caracteres (' + count + ').');
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
        // Minimo de archivos: explicito con min o implicito (1) cuando el
        // parametro es obligatorio. Sin esto un array vacio pasaba por valido.
        const min = spec.min !== undefined ? Number(spec.min) : (spec.required ? 1 : 0);
        if (list.length > max) errors.push('--' + key + ' admite como mucho ' + max + ' archivo(s).');
        if (Number.isFinite(min) && min > 0 && list.length < min) {
          errors.push('--' + key + ' necesita al menos ' + min + ' archivo(s).');
        }
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
  if (model.id === 'eleven-tts' && params.version === 'v4') {
    params.text = String(params.text || '').trim();
    if (!params.text) errors.push('La versión v4 necesita texto.');
    if (!params.voice_id && !params.private_voice_id) errors.push('Selecciona una voz con --voice_id o --private_voice_id.');
  }
  if (['eleven-tts', 'eleven-voice-changer'].includes(model.id)) {
    if (params.voice_id && params.private_voice_id) errors.push('Usa solo --voice_id o --private_voice_id, no ambos.');
    if (params.voice_id && !/^[A-Za-z0-9]{12,40}$/.test(params.voice_id)) errors.push('Identificador de voz no válido. Consulta voices.');
    if (params.private_voice_id && !/^[0-9a-f]{32}$/.test(params.private_voice_id)) errors.push('Referencia privada AILAB no válida. Consulta voice-list.');
  }
  if(model.id==='krea-3') {
    if(!String(params.prompt||'').trim())errors.push('El prompt no puede estar vacío.');
    const images=fileParams.image_urls||[];
    if(params.mode==='edit'&&(images.length<1||images.length>8))errors.push('La edición necesita de 1 a 8 imágenes ordenadas.');
    if(params.mode==='t2i'&&images.length)errors.push('Texto a imagen no admite referencias.');
    if(params.mode==='t2i'&&params.reasoning_level==='high')errors.push('Alto solo está disponible en edición.');
    if(params.variant==='jam'&&params.negative_prompt)errors.push('El prompt negativo solo funciona con Berry.');
    if(params.resolution==='auto'&&params.reasoning_level==='high')errors.push('Alto necesita un tamaño explícito.');
    if(params.resolution==='custom'&&Math.ceil(Number(params.width)/16)*16*Math.ceil(Number(params.height)/16)*16>4220160)errors.push('Las dimensiones superan 4.220.160 píxeles después del redondeo.');
  }
  if (['flux-3', 'ideogram-v45', 'nano-banana-2-1'].includes(model.id)) {
    const images = fileParams.image_urls || [];
    if (!String(params.prompt || '').trim()) errors.push('El prompt no puede estar vacío.');
    if (params.mode === 't2i' && images.length) errors.push('La modalidad t2i no admite --image_urls.');
    if (params.mode === 'edit' && !images.length) errors.push('La modalidad edit necesita al menos una imagen en --image_urls.');
    if (model.id === 'nano-banana-2-1') {
      const length = Array.from(String(params.prompt || '').trim()).length;
      if (length < 1 || length > 20000) errors.push('El prompt necesita entre 1 y 20.000 caracteres.');
      for (const image of images) {
        try {
          const metadata = inspectPricingMetadata(image);
          const bytes = fs.statSync(image).size;
          if (!metadata.ok || metadata.class !== 'image' || !metadata.width || !metadata.height
            || !['.jpg','.jpeg','.png','.webp'].includes(path.extname(image).toLowerCase())
            || bytes < 1 || bytes > 30 * 1024 * 1024) errors.push('Usa JPG, PNG o WebP válidos de hasta 30 MB: ' + image + '.');
        } catch { errors.push('No se puede leer la referencia: ' + image + '.'); }
      }
    }
    if (model.id === 'ideogram-v45') {
      if (params.mode === 't2i') {
        if (params.quality === 'very_low') errors.push('La calidad very_low solo está disponible en edición.');
        if (params.image_size === 'auto') errors.push('El tamaño auto solo está disponible en edición.');
        if (given.edit_precision !== undefined) errors.push('--edit_precision solo está disponible en edición.');
        delete params.edit_precision;
      } else if (params.mode === 'edit') {
        if (params.edit_precision === 'high' && params.image_size !== 'auto') errors.push('La precisión high exige --image_size auto.');
        if (given.enable_prompt_expansion !== undefined && params.enable_prompt_expansion) errors.push('La edición no admite expansión del prompt.');
        // El valor por defecto pertenece a t2i; no se envía a la ruta edit.
        delete params.enable_prompt_expansion;
      }
    }
    if (model.id === 'flux-3') {
      for (const image of images) {
        const metadata = inspectPricingMetadata(image);
        if (!metadata.ok || metadata.class !== 'image' || !Number.isSafeInteger(metadata.width) || !Number.isSafeInteger(metadata.height)) {
          errors.push(metadata.error || 'No se pudieron medir las dimensiones de una referencia de Flux 3.');
        } else if (metadata.width < 256 || metadata.height < 256 || metadata.pixels > 4000000) {
          errors.push('Cada referencia de Flux 3 necesita al menos 256 px por lado y como máximo 4 megapíxeles: ' + image + '.');
        }
      }
    }
  }
  if (model.id === WAN3_ID) {
    // Wan 3.0: compatibilidad de modalidades, límites de los materiales y duración medida de los
    // vídeos de entrada (Kie los factura). El servidor repite todo esto con su propia medición.
    if (!String(params.prompt || '').trim()) errors.push('El prompt no puede estar vacío.');
    errors.push(...wan3Problems(params, fileParams));
  }
  if (model.id === KLING4_ID) {
    // Kling 4.0: reglas de materiales, sujetos, voces y menciones del servidor, más los segundos de
    // vídeo de entrada que se facturan. Los dos parámetros que solo existen en Referencias no viajan
    // en Fotogramas clave (el servidor los rechaza) y se retiran para que el manifiesto sea estable.
    errors.push(...kling4Problems(params, fileParams, given));
    if (params.mode === 'keyframe') { delete params.aspect_ratio; delete params.keep_original_sound; }
  }
  if (DRAFT_MODEL_IDS.includes(model.id)) {
    // Modo draft: `--draft false` equivale a no pedirlo, porque el servidor solo admite `draft: true`. Sin --resolution, 480p.
    if (params.draft === true) {
      if (given.resolution === undefined || given.resolution === '') params.resolution = '480p';
      errors.push(...draftProblems(params));
    } else delete params.draft;
  }
  if (model.id === DRAFT_UPGRADE_ID && params.draft_task_id !== undefined) {
    params.draft_task_id = params.draft_task_id.trim();
    if (!params.draft_task_id) errors.push('--draft_task_id no puede estar vacío.');
  }
  if (model.id === OMNI12_ID) {
    // Gemini Omni Flash 1.2: una modalidad por petición, con las reglas del servidor, y el vídeo a editar medido en
    // local (se cobra su duración). Al editar no se elige duración: la salida dura lo que el vídeo de entrada.
    if (params.mode === 'edit') {
      if (given.duration !== undefined && given.duration !== '') errors.push('Al editar no se elige la duración: la salida dura lo mismo que el vídeo de entrada. Quita --duration.');
      delete params.duration;
    }
    errors.push(...omni12Problems(params, fileParams));
  }
  if (model.id === OMNI12_EXTEND_ID) {
    params.task_id = String(params.task_id ?? '').trim();
    errors.push(...omni12ExtendProblems(params, fileParams));
  }
  if (OMNI_RESOURCE_IDS.includes(model.id)) errors.push(...omniResourceProblems(model, params, fileParams));
  if (model.id === LITE_ID) {
    // Seedance 2.5 Lite: modalidades excluyentes y vídeo de referencia medido en local.
    errors.push(...liteProblems(params, fileParams));
  }
  if (SEEDANCE_IDS.includes(model.id)) {
    // Seedance 2.5 Normal, 2.0 y Mini: los vídeos de referencia se facturan y deben ser medibles.
    errors.push(...seedanceProblems(model, params, fileParams));
  }
  if (model.id === LIGHT_ID) {
    // Genjutsu Light: el vídeo se mide en local y no puede pasar de 15 s (el servidor repite la medición).
    errors.push(...lightProblems(params, fileParams));
  }
  if (model.driver === 'topaz-v1') {
    const frames = Number(params.frame_count);
    const prompt = typeof params.prompt === 'string' ? params.prompt.trim() : '';
    if (model.id === 'topaz-astra-creative-2' && prompt && Number.isSafeInteger(frames) && frames > 450) {
      errors.push('Con prompt, Astra Creative admite hasta 450 fotogramas.');
    }
    if (model.id === 'topaz-astra-creative-2' && !prompt && Number.isSafeInteger(frames) && frames > 9000) {
      errors.push('Astra Creative admite hasta 9.000 fotogramas sin prompt.');
    }
    const megapixels = Number(params.output_megapixels);
    if (model.output === 'image' && Number.isFinite(megapixels) && megapixels > 100) {
      errors.push('La salida supera los 100 megapíxeles. Reduce el factor.');
    }
  }
  return { ok: errors.length === 0, errors, params, fileParams };
}
