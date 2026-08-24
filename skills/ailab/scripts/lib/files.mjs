// Inspeccion de archivos locales: MIME real por bytes magicos (no por extension),
// sha256 y limites por tipo. Se usa en prepare y se re-verifica en submit.
import fs from 'node:fs';
import crypto from 'node:crypto';

const LIMITS = { image: 30 * 1024 * 1024, video: 200 * 1024 * 1024, audio: 50 * 1024 * 1024 };

export function sniffMime(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.length >= 12 && buf.slice(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.slice(8, 12).toString('ascii');
    if (['M4A ', 'M4B ', 'M4P ', 'F4A ', 'F4B '].includes(brand)) return 'audio/mp4';
    if (brand.startsWith('qt')) return 'video/quicktime';
    return 'video/mp4';
  }
  if (buf.length >= 4 && buf.slice(0, 4).toString('hex') === '1a45dfa3') return 'video/webm';
  if (buf.length >= 3 && buf.slice(0, 3).toString('ascii') === 'ID3') return 'audio/mpeg';
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE') return 'audio/wav';
  return null;
}

export function classFor(mime) {
  if (!mime) return null;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return null;
}

function hashFileSync(absolute, captureBytes = 64) {
  const hash = crypto.createHash('sha256');
  const header = Buffer.alloc(captureBytes);
  const chunk = Buffer.alloc(1024 * 1024);
  let headerBytes = 0;
  let total = 0;
  let fd = null;
  try {
    fd = fs.openSync(absolute, 'r');
    for (;;) {
      const read = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (read === 0) break;
      if (headerBytes < captureBytes) {
        const copy = Math.min(read, captureBytes - headerBytes);
        chunk.copy(header, headerBytes, 0, copy);
        headerBytes += copy;
      }
      hash.update(chunk.subarray(0, read));
      total += read;
    }
    return { size: total, header: header.subarray(0, headerBytes), sha256: hash.digest('hex') };
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

// Inspecciona un archivo local para un parametro con accept image|video|audio.
export function inspectFile(path_, accept) {
  let absolute;
  let stat;
  try {
    absolute = fs.realpathSync(String(path_));
    stat = fs.statSync(absolute);
  } catch { return { ok: false, error: 'No existe el archivo: ' + path_ }; }
  if (!stat.isFile()) return { ok: false, error: 'La ruta no es un archivo normal: ' + path_ };
  if (!stat.size) return { ok: false, error: 'El archivo esta vacio: ' + path_ };
  // El mayor limite se comprueba antes de leer para no recorrer archivos enormes.
  if (stat.size > LIMITS.video) return { ok: false, error: path_ + ' supera el limite maximo de 200MB.' };
  let inspected;
  try { inspected = hashFileSync(absolute); }
  catch (e) { return { ok: false, error: 'No se pudo leer el archivo: ' + path_ + '.' }; }
  if (inspected.size !== stat.size) return { ok: false, error: 'El archivo cambio mientras se inspeccionaba: ' + path_ };
  const mime = sniffMime(inspected.header);
  const cls = classFor(mime);
  if (!cls) return { ok: false, error: 'Tipo de archivo no reconocido (se detecta por contenido, no por nombre): ' + path_ };
  if (accept && cls !== accept) return { ok: false, error: 'Se esperaba ' + accept + ' y "' + path_ + '" es ' + cls + ' (' + mime + ').' };
  if (inspected.size > LIMITS[cls]) return { ok: false, error: path_ + ' supera el limite de ' + Math.round(LIMITS[cls] / 1024 / 1024) + 'MB para ' + cls + '.' };
  return { ok: true, path: absolute, size: inspected.size, mime, class: cls, sha256: inspected.sha256 };
}

export function rehashMatches(fileEntry) {
  try {
    const inspected = hashFileSync(fs.realpathSync(fileEntry.path), 0);
    return inspected.size === fileEntry.size && inspected.sha256 === fileEntry.sha256;
  } catch { return false; }
}
