// Salida de resultados: por defecto ~/Downloads/AILAB/ (fuera de cualquier repo).
// Overrides: AILAB_OUTPUT_DIR, PG_OUTPUT_DIR o --output. Aviso si el destino esta
// dentro de un repositorio Git. Extension por MIME real, nunca por URL.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { OUTPUT_DIR } from './config.mjs';

const EXT_BY_MIME = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg', 'audio/webm': 'webm',
};
const DOWNLOAD_TIMEOUT_MS = Number(process.env.AILAB_DOWNLOAD_TIMEOUT_MS || 5 * 60 * 1000);
const MAX_DOWNLOAD_BYTES = Number(process.env.AILAB_MAX_DOWNLOAD_BYTES || 2 * 1024 * 1024 * 1024);

export function insideGitRepo(dir_) {
  let d = path.resolve(dir_);
  for (let i = 0; i < 40; i++) {
    if (fs.existsSync(path.join(d, '.git'))) return true;
    const up = path.dirname(d);
    if (up === d) return false;
    d = up;
  }
  return false;
}

export function resolveOutputDir(override) {
  const dir_ = override || OUTPUT_DIR;
  fs.mkdirSync(dir_, { recursive: true });
  const gi = path.join(dir_, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, '*\n');
  if (insideGitRepo(dir_)) {
    console.error('Aviso: la carpeta de salida esta dentro de un repositorio Git (' + dir_ + '). Se ha creado un .gitignore, pero valora usar la carpeta por defecto.');
  }
  return dir_;
}

function safeName(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'resultado';
}

export function nextFreePath(dir_, base, ext) {
  let p = path.join(dir_, base + '.' + ext);
  let i = 2;
  while (fs.existsSync(p)) { p = path.join(dir_, base + '-' + i + '.' + ext); i++; }
  return p;
}

function candidatePath(dir_, base, ext, index) {
  return path.join(dir_, base + (index === 1 ? '' : '-' + index) + '.' + ext);
}

// Publica el temporal sin sobrescribir nunca un resultado creado en paralelo.
// El hard link reclama el nombre de forma atomica y no vuelve a copiar archivos
// grandes; temp y destino siempre viven en el mismo directorio/filesystem.
function publishTempNoOverwrite(temp, dir_, base, ext) {
  for (let index = 1; index < 1000000; index++) {
    const dest = candidatePath(dir_, base, ext, index);
    try {
      fs.linkSync(temp, dest);
      try { fs.unlinkSync(temp); } catch {}
      return dest;
    } catch (e) {
      if (e && e.code === 'EEXIST') continue;
      throw e;
    }
  }
  throw new Error('No se pudo reservar un nombre de salida libre.');
}

function localHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function validateDownloadUrl(value) {
  let parsed;
  try { parsed = new URL(String(value)); } catch { throw new Error('URL de resultado no valida.'); }
  if (parsed.username || parsed.password) throw new Error('La URL de resultado contiene credenciales y se ha bloqueado.');
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && localHost(parsed.hostname))) {
    throw new Error('La descarga debe usar HTTPS.');
  }
  return parsed.toString();
}

function sniffMime(header) {
  if (header.length >= 8 && header.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return 'image/png';
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if (header.length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (header.length >= 6 && (header.toString('ascii', 0, 6) === 'GIF87a' || header.toString('ascii', 0, 6) === 'GIF89a')) return 'image/gif';
  if (header.length >= 12 && header.toString('ascii', 4, 8) === 'ftyp') return 'application/mp4';
  if (header.length >= 4 && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) return 'application/webm';
  if (header.length >= 3 && header.toString('ascii', 0, 3) === 'ID3') return 'audio/mpeg';
  if (header.length >= 2 && header[0] === 0xff && (header[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  if (header.length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE') return 'audio/wav';
  if (header.length >= 4 && header.toString('ascii', 0, 4) === 'OggS') return 'audio/ogg';
  return null;
}

function resolvedMime(declared, sniffed) {
  const clean = String(declared || '').split(';')[0].trim().toLowerCase();
  if (sniffed === 'application/mp4') {
    if (clean === 'audio/mp4' || clean === 'audio/x-m4a' || clean === 'video/quicktime') return clean;
    return 'video/mp4';
  }
  if (sniffed === 'application/webm') {
    return clean === 'audio/webm' ? 'audio/webm' : 'video/webm';
  }
  if (sniffed && clean && clean !== 'application/octet-stream' && EXT_BY_MIME[clean] && clean !== sniffed) {
    throw new Error('El tipo real del archivo no coincide con el Content-Type del servidor.');
  }
  return sniffed || (EXT_BY_MIME[clean] ? clean : 'application/octet-stream');
}

export async function downloadTo(dir_, modelId, url, index) {
  let safeUrl;
  try { safeUrl = validateDownloadUrl(url); }
  catch (e) { return { ok: false, error: e.message, url }; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  let res;
  try { res = await fetch(safeUrl, { signal: controller.signal, redirect: 'follow' }); }
  catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e && e.name === 'AbortError' ? 'La descarga supero el tiempo permitido.' : 'No se pudo descargar el resultado: ' + (e && e.message ? e.message : e), url };
  }
  if (!res.ok) { clearTimeout(timer); return { ok: false, error: 'Descarga fallida (HTTP ' + res.status + ').', url }; }
  try { validateDownloadUrl(res.url || safeUrl); }
  catch (e) { clearTimeout(timer); return { ok: false, error: 'La redireccion de descarga no es segura.', url }; }
  const declaredBytes = Number(res.headers.get('content-length') || 0);
  if (declaredBytes > MAX_DOWNLOAD_BYTES) {
    clearTimeout(timer);
    try { await res.body?.cancel(); } catch {}
    return { ok: false, error: 'El resultado supera el limite de descarga configurado.', url };
  }

  const temp = path.join(dir_, '.ailab-download-' + process.pid + '-' + crypto.randomBytes(8).toString('hex') + '.tmp');
  let fd = null;
  let bytes = 0;
  let header = Buffer.alloc(0);
  try {
    fd = fs.openSync(temp, 'wx', 0o600);
    const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
    if (!reader) throw new Error('El entorno no permite descargar el resultado en streaming.');
    for (;;) {
      const item = await reader.read();
      if (item.done) break;
      const chunk = Buffer.from(item.value);
      bytes += chunk.length;
      if (bytes > MAX_DOWNLOAD_BYTES) {
        try { await reader.cancel(); } catch {}
        throw new Error('El resultado supera el limite de descarga configurado.');
      }
      if (header.length < 64) header = Buffer.concat([header, chunk.subarray(0, 64 - header.length)]);
      fs.writeSync(fd, chunk);
    }
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    if (bytes < 1) throw new Error('El archivo descargado esta vacio.');
    const mime = resolvedMime(res.headers.get('content-type') || '', sniffMime(header));
    const ext = EXT_BY_MIME[mime] || 'bin';
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '');
    const base = safeName(modelId) + '-' + stamp + (index > 0 ? '-' + (index + 1) : '');
    const dest = publishTempNoOverwrite(temp, dir_, base, ext);
    clearTimeout(timer);
    return { ok: true, path: dest, bytes, mime };
  } catch (e) {
    clearTimeout(timer);
    if (fd !== null) { try { fs.closeSync(fd); } catch {} }
    try { fs.unlinkSync(temp); } catch {}
    return { ok: false, error: e && e.name === 'AbortError' ? 'La descarga supero el tiempo permitido.' : 'No se pudo guardar el resultado: ' + (e && e.message ? e.message : e), url };
  }
}

export function saveTextTo(dir_, modelId, value, index = 0) {
  const dir = resolveOutputDir(dir_);
  const base = safeName(modelId) + '-' + new Date().toISOString().replace(/[:.]/g, '') + (index ? '-' + (index + 1) : '');
  for (let suffix = 1; suffix < 1000000; suffix++) {
    const file = candidatePath(dir, base, 'txt', suffix);
    let fd = null;
    try {
      fd = fs.openSync(file, 'wx', 0o600);
      fs.writeFileSync(fd, String(value), { encoding: 'utf8' });
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      return file;
    } catch (e) {
      if (fd !== null) { try { fs.closeSync(fd); } catch {} }
      if (e && e.code === 'EEXIST') continue;
      try { fs.unlinkSync(file); } catch {}
      throw e;
    }
  }
  throw new Error('No se pudo reservar un nombre de salida libre.');
}
