// Actualizador firmado del runtime AILAB.
// La clave privada nunca vive en la skill. Este modulo solo contiene la clave
// publica Ed25519 y acepta archivos declarados en un manifiesto firmado.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { CONFIG_DIR, RELEASE_MANIFEST_URL, SKILL_ROOT, UPDATE_CHANNEL, ensureConfigDir } from './config.mjs';

export const BOOTSTRAP_VERSION = '1.0.0';
export const BUNDLED_RUNTIME_VERSION = '2.1.3';
export const UPDATE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAVjnUJTcIxxRRvRTo83RpaCI7eaPwTg5KIz65p49UZs0=
-----END PUBLIC KEY-----`;

const CHECK_INTERVAL_MS = Number(process.env.AILAB_UPDATE_CHECK_MS || 6 * 60 * 60 * 1000);
const FETCH_TIMEOUT_MS = Number(process.env.AILAB_UPDATE_TIMEOUT_MS || 30000);
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_RELEASE_BYTES = 50 * 1024 * 1024;
const ALLOWED_PREFIXES = ['scripts/', 'catalog/'];
const runtimeRoot = () => path.join(CONFIG_DIR, 'runtime');
const currentFile = () => path.join(runtimeRoot(), 'current.json');
const metaFile = () => path.join(runtimeRoot(), 'update-meta.json');
const lockDir = () => path.join(runtimeRoot(), '.update-lock');
const lockOwnerFile = () => path.join(lockDir(), 'owner.json');

function parseSemver(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(String(value || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function compareSemver(a, b) {
  const pa = parseSemver(a), pb = parseSemver(b);
  if (!pa || !pb) throw new Error('Version semver no valida.');
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

export function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function exactKeys(value, allowed, where) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) throw new Error('Manifiesto invalido: campo no permitido ' + where + '.' + key + '.');
  }
}

export function safeReleasePath(value) {
  if (typeof value !== 'string' || value.length < 3 || value.length > 240) return null;
  if (value.includes('\\') || value.includes('\0') || value.startsWith('/') || value.split('/').includes('..') || path.posix.normalize(value) !== value) return null;
  if (!ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix))) return null;
  if (!/^[A-Za-z0-9._/-]+$/.test(value)) return null;
  return value;
}

export function validateReleaseEnvelope(value, { publicKey = UPDATE_PUBLIC_KEY_PEM, manifestUrl = RELEASE_MANIFEST_URL } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Manifiesto de actualizacion no valido.');
  exactKeys(value, new Set(['signed', 'signature']), 'raiz');
  if (!value.signed || typeof value.signed !== 'object' || Array.isArray(value.signed)) throw new Error('Falta el contenido firmado.');
  if (typeof value.signature !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.signature)) throw new Error('Firma no valida.');
  const signature = Buffer.from(value.signature, 'base64');
  if (signature.length !== 64 || !crypto.verify(null, Buffer.from(stableStringify(value.signed)), publicKey, signature)) {
    throw new Error('La firma de la actualizacion no es valida.');
  }
  const signed = value.signed;
  exactKeys(signed, new Set(['schema_version', 'channel', 'version', 'published_at', 'minimum_bootstrap_version', 'minimum_supported_runtime', 'entry', 'files']), 'signed');
  if (signed.schema_version !== 1 || signed.channel !== UPDATE_CHANNEL) throw new Error('Canal o schema de actualizacion incompatible.');
  if (!parseSemver(signed.version) || !parseSemver(signed.minimum_bootstrap_version) || !parseSemver(signed.minimum_supported_runtime)) throw new Error('Version de actualizacion no valida.');
  if (compareSemver(BOOTSTRAP_VERSION, signed.minimum_bootstrap_version) < 0) throw new Error('Esta instalacion necesita un bootstrap mas reciente.');
  const published = String(signed.published_at || '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(published) || !Number.isFinite(Date.parse(published))) throw new Error('Fecha de publicacion no valida.');
  const canonicalPublished = new Date(Date.parse(published)).toISOString();
  if (canonicalPublished !== (published.includes('.') ? published : published.replace('Z', '.000Z'))) throw new Error('Fecha de publicacion no valida.');
  if (Date.parse(published) > Date.now() + 48 * 60 * 60 * 1000) throw new Error('Fecha de publicacion futura.');
  if (compareSemver(signed.minimum_supported_runtime, signed.version) > 0) throw new Error('La version minima no puede superar la version publicada.');
  if (!Array.isArray(signed.files) || !signed.files.length || signed.files.length > 200) throw new Error('Lista de archivos no valida.');
  if (!safeReleasePath(signed.entry)) throw new Error('Entry point no valido.');
  let manifestParsed;
  try { manifestParsed = new URL(manifestUrl); } catch { throw new Error('URL del manifiesto no valida.'); }
  if (manifestParsed.protocol !== 'https:' && !(manifestParsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(manifestParsed.hostname))) throw new Error('URL del manifiesto no segura.');
  if (manifestParsed.username || manifestParsed.password) throw new Error('La URL del manifiesto no admite credenciales.');
  const origin = manifestParsed.origin;
  const seen = new Set();
  let total = 0;
  for (const item of signed.files) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Entrada de archivo no valida.');
    exactKeys(item, new Set(['path', 'url', 'sha256', 'size']), 'files');
    const rel = safeReleasePath(item.path);
    if (!rel || seen.has(rel)) throw new Error('Ruta de archivo no valida o duplicada.');
    seen.add(rel);
    if (!/^[0-9a-f]{64}$/.test(String(item.sha256 || ''))) throw new Error('SHA-256 no valido para ' + rel + '.');
    if (!Number.isSafeInteger(item.size) || item.size < 1 || item.size > MAX_FILE_BYTES) throw new Error('Tamano no valido para ' + rel + '.');
    let parsed;
    try { parsed = new URL(item.url); } catch { throw new Error('URL no valida para ' + rel + '.'); }
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname))) throw new Error('URL no segura para ' + rel + '.');
    if (parsed.username || parsed.password || parsed.hash) throw new Error('URL con credenciales o fragmento no permitida para ' + rel + '.');
    if (parsed.origin !== origin) throw new Error('Los archivos de release deben usar el mismo origen que el manifiesto.');
    total += item.size;
  }
  if (!seen.has(signed.entry)) throw new Error('El entry point no figura en files.');
  if (total > MAX_RELEASE_BYTES) throw new Error('La actualizacion supera el tamano total permitido.');
  return value;
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = file + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch {}
}

function readJson(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > MAX_MANIFEST_BYTES) return null;
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value && typeof value === 'object' ? value : null;
  } catch { return null; }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const length = Number(res.headers.get('content-length') || 0);
    if (length > MAX_MANIFEST_BYTES) throw new Error('manifiesto demasiado grande');
    const raw = await res.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_MANIFEST_BYTES) throw new Error('manifiesto demasiado grande');
    return JSON.parse(raw);
  } finally { clearTimeout(timeout); }
}

export async function fetchReleaseManifest(url = RELEASE_MANIFEST_URL) {
  const envelope = await fetchJson(url);
  return validateReleaseEnvelope(envelope, { manifestUrl: url });
}

function acquireLock() {
  fs.mkdirSync(runtimeRoot(), { recursive: true, mode: 0o700 });
  try {
    fs.mkdirSync(lockDir(), { mode: 0o700 });
    atomicJson(lockOwnerFile(), { pid: process.pid, created_at: new Date().toISOString() });
    return true;
  }
  catch (e) {
    if (!e || e.code !== 'EEXIST') throw e;
    try {
      const stat = fs.statSync(lockDir());
      const owner = readJson(lockOwnerFile());
      let ownerAlive = false;
      if (owner && Number.isSafeInteger(owner.pid) && owner.pid > 0) {
        try { process.kill(owner.pid, 0); ownerAlive = true; } catch {}
      }
      if (!ownerAlive && Date.now() - stat.mtimeMs > 2 * 60 * 1000) {
        fs.rmSync(lockDir(), { recursive: true, force: true });
        fs.mkdirSync(lockDir(), { mode: 0o700 });
        atomicJson(lockOwnerFile(), { pid: process.pid, created_at: new Date().toISOString(), recovered_stale: true });
        return true;
      }
    } catch {}
    return false;
  }
}

function touchLock() {
  const now = new Date();
  try { fs.utimesSync(lockDir(), now, now); } catch {}
}

function releaseDir(version) { return path.join(runtimeRoot(), version); }

async function downloadFile(item, root, manifestOrigin) {
  const target = path.join(root, item.path);
  const relative = path.relative(root, target);
  if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Ruta fuera del runtime.');
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let fd = null;
  try {
    const res = await fetch(item.url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      // Node descomprime gzip/br antes de entregar el stream. Pedir identidad
      // evita que Content-Length describa bytes comprimidos mientras el hash
      // firmado describe el fichero original.
      headers: { 'accept-encoding': 'identity' },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' al descargar ' + item.path + '.');
    const finalUrl = new URL(res.url || item.url);
    if (finalUrl.origin !== manifestOrigin) throw new Error('Redireccion fuera del origen permitido.');
    const declared = Number(res.headers.get('content-length') || 0);
    const encoded = String(res.headers.get('content-encoding') || '').trim().toLowerCase();
    if (!encoded && declared && declared !== item.size) throw new Error('Tamano HTTP distinto para ' + item.path + '.');
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    if (!reader) throw new Error('Descarga sin streaming no permitida.');
    fd = fs.openSync(target, 'wx', 0o600);
    const hash = crypto.createHash('sha256');
    let bytes = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      const chunk = Buffer.from(part.value);
      bytes += chunk.length;
      if (bytes > item.size || bytes > MAX_FILE_BYTES) throw new Error('La descarga supera el tamano firmado.');
      hash.update(chunk);
      fs.writeSync(fd, chunk);
    }
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    if (bytes !== item.size || hash.digest('hex') !== item.sha256) throw new Error('Hash o tamano incorrecto para ' + item.path + '.');
  } finally {
    clearTimeout(timeout);
    if (fd !== null) { try { fs.closeSync(fd); } catch {} }
  }
}

function verifyInstalledRelease(root, envelope) {
  for (const item of envelope.signed.files) {
    const file = path.join(root, item.path);
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== item.size) return false;
      const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      if (hash !== item.sha256) return false;
    } catch { return false; }
  }
  return true;
}

function currentRuntime(options = {}) {
  const current = readJson(currentFile());
  if (!current || !parseSemver(current.version) || typeof current.entry !== 'string') return null;
  const root = releaseDir(current.version);
  const envelope = readJson(path.join(root, 'release.json'));
  if (!envelope) return null;
  try {
    validateReleaseEnvelope(envelope, {
      publicKey: options.publicKey || UPDATE_PUBLIC_KEY_PEM,
      manifestUrl: options.manifestUrl || RELEASE_MANIFEST_URL,
    });
  } catch { return null; }
  if (envelope.signed.version !== current.version || envelope.signed.entry !== current.entry) return null;
  if (!verifyInstalledRelease(root, envelope)) return null;
  return { version: current.version, root, entry: path.join(root, current.entry), envelope };
}

// Solo expone un runtime que haya vuelto a superar firma, manifiesto y hashes.
// El bootstrap lo usa para recuperarse si un módulo falla al importarse después
// de una actualización que sí pasó el autodiagnóstico inicial.
export function activeRuntime(options = {}) { return currentRuntime(options); }

function runSelfTest(root, envelope) {
  const entry = path.join(root, envelope.signed.entry);
  const catalog = path.join(root, 'catalog', 'catalog.json');
  const result = spawnSync(process.execPath, [entry, 'self-test'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: catalog },
  });
  if (result.error || result.status !== 0 || !String(result.stdout || '').includes('SELF_TEST_OK')) {
    throw new Error('El runtime descargado no supero el autodiagnostico.');
  }
}

export async function installRelease(envelope, manifestUrl = RELEASE_MANIFEST_URL, options = {}) {
  validateReleaseEnvelope(envelope, { manifestUrl, publicKey: options.publicKey || UPDATE_PUBLIC_KEY_PEM });
  ensureConfigDir();
  if (!acquireLock()) return { ok: false, busy: true, message: 'Otro proceso esta actualizando AILAB.' };
  const version = envelope.signed.version;
  const destination = releaseDir(version);
  const staging = path.join(runtimeRoot(), '.staging-' + version + '-' + crypto.randomBytes(6).toString('hex'));
  try {
    if (fs.existsSync(destination)) {
      const installedEnvelope = readJson(path.join(destination, 'release.json'));
      if (installedEnvelope
          && stableStringify(installedEnvelope) === stableStringify(envelope)
          && verifyInstalledRelease(destination, envelope)) {
        const previous = currentRuntime({ publicKey: options.publicKey, manifestUrl });
        atomicJson(currentFile(), { version, entry: envelope.signed.entry, previous_version: previous ? previous.version : null, activated_at: new Date().toISOString() });
        return { ok: true, version, reused: true };
      }
      throw new Error('Ya existe un runtime incompleto con esa version.');
    }
    fs.mkdirSync(staging, { recursive: false, mode: 0o700 });
    const origin = new URL(manifestUrl).origin;
    for (const item of envelope.signed.files) {
      touchLock();
      await downloadFile(item, staging, origin);
      touchLock();
    }
    atomicJson(path.join(staging, 'release.json'), envelope);
    if (!verifyInstalledRelease(staging, envelope)) throw new Error('La verificacion local de la release fallo.');
    if (typeof options.selfTest === 'function') options.selfTest(staging, envelope);
    else runSelfTest(staging, envelope);
    fs.renameSync(staging, destination);
    const previous = currentRuntime({ publicKey: options.publicKey, manifestUrl });
    atomicJson(currentFile(), { version, entry: envelope.signed.entry, previous_version: previous ? previous.version : null, activated_at: new Date().toISOString() });
    return { ok: true, version, previous: previous ? previous.version : null };
  } catch (e) {
    try { fs.rmSync(staging, { recursive: true, force: true }); } catch {}
    return { ok: false, message: e && e.message ? e.message : String(e) };
  } finally {
    try { fs.rmSync(lockDir(), { recursive: true, force: true }); } catch {}
  }
}

function latestCheckDue(force) {
  if (force) return true;
  const meta = readJson(metaFile());
  return !meta || !meta.checked_at || Date.now() - Date.parse(meta.checked_at) >= CHECK_INTERVAL_MS;
}

export async function checkAndMaybeUpdate({
  force = false,
  apply = true,
  manifestFetcher = fetchReleaseManifest,
  releaseInstaller = installRelease,
} = {}) {
  ensureConfigDir();
  const current = currentRuntime();
  const localVersion = current ? current.version : BUNDLED_RUNTIME_VERSION;
  if (!latestCheckDue(force)) return { ok: true, current: localVersion, update: null, runtime: current };
  try {
    const envelope = await manifestFetcher();
    atomicJson(metaFile(), { checked_at: new Date().toISOString(), latest_version: envelope.signed.version });
    const newer = compareSemver(envelope.signed.version, localVersion) > 0;
    const belowMinimum = compareSemver(localVersion, envelope.signed.minimum_supported_runtime) < 0;
    if (!newer && !belowMinimum) return { ok: true, current: localVersion, update: null, runtime: current, envelope };
    if (!apply) return { ok: true, current: localVersion, update: envelope.signed.version, required: belowMinimum, runtime: current, envelope };
    const installed = await releaseInstaller(envelope);
    if (!installed.ok) {
      // No consideramos comprobada una release que no pudo instalarse: el
      // siguiente arranque reintenta. Si la minima es obligatoria, el bootstrap
      // recibe `required` y se bloquea en vez de ejecutar código obsoleto.
      atomicJson(metaFile(), {
        latest_version: envelope.signed.version,
        last_attempt_at: new Date().toISOString(),
        required: belowMinimum,
        error: installed.message || 'No se pudo instalar.',
      });
      return {
        ok: false,
        required: belowMinimum,
        current: localVersion,
        update: envelope.signed.version,
        runtime: current,
        message: installed.message || 'No se pudo instalar.',
      };
    }
    return { ok: true, current: installed.version, updated: true, previous: installed.previous || null, runtime: currentRuntime(), envelope };
  } catch (e) {
    atomicJson(metaFile(), { checked_at: new Date().toISOString(), error: e && e.message ? e.message : String(e) });
    return { ok: false, current: localVersion, runtime: current, message: e && e.message ? e.message : String(e) };
  }
}

export function bundledEntryUrl() { return pathToFileURL(path.join(SKILL_ROOT, 'scripts', 'pg.mjs')).href; }
export function runtimeEntryUrl(runtime) { return pathToFileURL(runtime.entry).href; }

export function rollbackRuntime(options = {}) {
  const current = readJson(currentFile());
  if (!current || !parseSemver(current.previous_version)) return { ok: false, message: 'No hay una version anterior registrada.' };
  const previousRoot = releaseDir(current.previous_version);
  const envelope = readJson(path.join(previousRoot, 'release.json'));
  if (!envelope) return { ok: false, message: 'La version anterior ya no esta disponible.' };
  try {
    validateReleaseEnvelope(envelope, {
      publicKey: options.publicKey || UPDATE_PUBLIC_KEY_PEM,
      manifestUrl: options.manifestUrl || RELEASE_MANIFEST_URL,
    });
  } catch (e) { return { ok: false, message: e.message }; }
  if (!verifyInstalledRelease(previousRoot, envelope)) return { ok: false, message: 'La version anterior no supera la verificacion.' };
  atomicJson(currentFile(), { version: envelope.signed.version, entry: envelope.signed.entry, previous_version: current.version, activated_at: new Date().toISOString(), rollback: true });
  return { ok: true, version: envelope.signed.version };
}
