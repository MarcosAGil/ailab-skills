// Archivos que suben como referencia y resultados que bajan. La URL firmada es la única
// autorización del almacenamiento: el token de AILAB no sale nunca hacia él.
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { downloadsDir, isLoopback, stateDir } from './config.mjs';
import { mediaKind } from './catalog.mjs';
import { readLimited } from './http.mjs';
import { UserError, UUID, clean, quote, uuid } from './text.mjs';

const MB = 1024 * 1024;
const ascii = (bytes, start, end) => bytes.toString('latin1', start, end);
const riff = (bytes, format) => ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === format;
const iso = (bytes) => ascii(bytes, 4, 8) === 'ftyp';
const LIMITS = { image: 30 * MB, video: 200 * MB, audio: 150 * MB };

// La cabecera tiene que ser la del tipo: una clave renombrada a .png no sale del equipo.
const TYPES = {
  image: [
    ['image/jpeg', ['jpg', 'jpeg'], (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
    ['image/png', ['png'], (b) => b[0] === 0x89 && ascii(b, 1, 4) === 'PNG'],
    ['image/webp', ['webp'], (b) => riff(b, 'WEBP')],
  ],
  video: [
    ['video/mp4', ['mp4', 'm4v'], iso],
    ['video/quicktime', ['mov'], (b) => iso(b) || ['moov', 'mdat', 'wide', 'free'].includes(ascii(b, 4, 8))],
    ['video/webm', ['webm'], (b) => b.readUInt32BE(0) === 0x1a45dfa3],
  ],
  audio: [
    ['audio/mpeg', ['mp3'], (b) => ascii(b, 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)],
    ['audio/wav', ['wav'], (b) => riff(b, 'WAVE')],
    ['audio/flac', ['flac'], (b) => ascii(b, 0, 4) === 'fLaC'],
    ['audio/ogg', ['ogg', 'oga', 'opus'], (b) => ascii(b, 0, 4) === 'OggS'],
    ['audio/mp4', ['m4a'], iso],
    ['audio/aac', ['aac'], (b) => b[0] === 0xff && (b[1] & 0xf6) === 0xf0],
  ],
};
const FROM_RESULT = /^generaci[oó]n:([0-9a-f-]{36}):(\d{1,3})$/i;

function inside(file, dir) {
  const relative = path.relative(dir, file);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}

function localFile(value, kind) {
  let file;
  try {
    file = fs.realpathSync.native(path.resolve(value));
  } catch {
    throw new UserError('No encuentro ' + quote(value) + '. Usa una ruta local, un id de subida o generacion:<id>:<posición>.');
  }
  if (fs.existsSync(stateDir()) && inside(file, fs.realpathSync.native(stateDir()))) {
    throw new UserError('La carpeta privada de AILAB no se sube.');
  }
  const extension = path.extname(file).slice(1).toLowerCase();
  const type = (TYPES[kind] || []).find(([, extensions]) => extensions.includes(extension));
  if (!type) throw new UserError(quote(value) + ' no es un archivo de ' + clean(kind, 20) + ' admitido.');
  // Antes de abrir: una tubería dejaría la orden colgada.
  if (!fs.statSync(file).isFile()) throw new UserError(quote(value) + ' no es un archivo válido.');
  const handle = fs.openSync(file, 'r');
  try {
    const stat = fs.fstatSync(handle);
    if (!stat.isFile() || stat.size < 12) throw new UserError(quote(value) + ' no es un archivo válido.');
    if (stat.size > LIMITS[kind]) throw new UserError(quote(value) + ' pasa de ' + LIMITS[kind] / MB + ' MB.');
    const bytes = fs.readFileSync(handle);
    if (!type[2](bytes)) throw new UserError('El contenido de ' + quote(value) + ' no es ' + type[0] + '. No se sube.');
    return { file, contentType: type[0], hash: createHash('sha256').update(bytes).digest('hex') };
  } finally {
    fs.closeSync(handle);
  }
}

/** La entrada con cada campo de archivo pasado por `map`, también dentro de listas y objetos. */
function mapMedia(field, value, map) {
  if (!field) return value;
  if (Array.isArray(value)) {
    const item = { ...field.items };
    const kind = mediaKind(field);
    if (kind) item['x-ailab-media'] = kind;
    return value.map((entry) => mapMedia(item, entry, map));
  }
  if (typeof value === 'string' && field['x-ailab-media']) return map(value, field['x-ailab-media']);
  if (value && typeof value === 'object' && field.properties) {
    return Object.fromEntries(Object.entries(value).map(([name, child]) => [name, mapMedia(field.properties[name], child, map)]));
  }
  return value;
}

/**
 * Lee y comprueba los archivos de la entrada sin subir nada. `signed` es la entrada con la
 * huella de cada archivo: de ahí sale la firma del contenido.
 */
export function collectMedia(schema, input) {
  const pending = [];
  const signed = mapMedia(schema, input, (value, kind) => {
    if (UUID.test(value)) return value.toLowerCase();
    const result = FROM_RESULT.exec(value);
    if (result) {
      pending.push({ value, generationId: uuid(result[1]), position: Number(result[2]) });
      return 'generacion:' + result[1].toLowerCase() + ':' + result[2];
    }
    if (/^[a-z][a-z0-9+.-]+:\/\//i.test(value)) {
      throw new UserError('AILAB no acepta enlaces como referencia. Usa una ruta local, un id de subida o generacion:<id>:<posición>.');
    }
    const local = localFile(value, kind);
    pending.push({ value, ...local });
    return 'sha256:' + local.hash;
  });
  return { pending, signed };
}

function signedUrl(value, origin) {
  let url;
  try {
    url = new URL(value, origin);
  } catch {
    throw new UserError('AILAB ha devuelto una dirección de archivo no válida.');
  }
  const local = url.protocol === 'http:' && isLoopback(url) && isLoopback(new URL(origin));
  if ((url.protocol !== 'https:' && !local) || url.username || url.password) {
    throw new UserError('AILAB ha devuelto una dirección de archivo no segura. No se usa.');
  }
  return url;
}

async function uploadFile({ api, origin }, file) {
  const extension = path.extname(file.file).toLowerCase();
  // Se lee otra vez para no tener todos los archivos en memoria: tiene que seguir siendo el mismo.
  const bytes = fs.readFileSync(file.file);
  if (createHash('sha256').update(bytes).digest('hex') !== file.hash) throw new UserError(quote(file.value) + ' ha cambiado mientras se preparaba. Repite prepare.');
  const created = await api('POST', '/uploads', {
    body: { contentType: file.contentType, bytes: bytes.length, filename: 'referencia' + extension },
  });
  const id = uuid(created?.asset?.id, 'La subida');
  let response;
  try {
    response = await fetch(signedUrl(created.uploadUrl, origin), {
      method: 'PUT',
      headers: { 'content-type': file.contentType },
      body: bytes,
      redirect: 'error',
      signal: AbortSignal.timeout(300000),
    });
    await readLimited(response, MB, 'Respuesta del almacenamiento demasiado grande.');
  } catch (error) {
    throw new UserError('No se ha podido subir ' + quote(file.value) + '. No se ha gastado nada.', { cause: error });
  }
  if (!response.ok) throw new UserError('El almacenamiento ha rechazado ' + quote(file.value) + ' (' + response.status + '). No se ha gastado nada.');
  const asset = await api('POST', '/uploads/' + id + '/complete', { timeout: 120000 });
  if (asset?.status !== 'ready') {
    throw new UserError('AILAB no ha aceptado ' + quote(file.value) + (asset?.rejectReason ? ': ' + quote(asset.rejectReason) : '') + '. No se ha gastado nada.');
  }
  return id;
}

/** La entrada con ids de subida en lugar de rutas. Un archivo repetido sube una vez. */
export async function uploadMedia(session, schema, input, pending) {
  const ids = new Map();
  for (const item of pending) {
    if (ids.has(item.value)) continue;
    if (item.generationId) {
      const asset = await session.api('POST', '/generations/' + item.generationId + '/files/' + item.position + '/reference', { timeout: 120000 });
      ids.set(item.value, uuid(asset?.id, 'La referencia'));
    } else {
      ids.set(item.value, await uploadFile(session, item));
    }
  }
  return mapMedia(schema, input, (value) => ids.get(value) ?? value.toLowerCase());
}

// El nombre del archivo nunca lo pone el servidor: ni rutas ni extensiones ejecutables.
const EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'tif', 'tiff', 'mp4', 'mov', 'webm', 'mkv',
  'mp3', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'aac', 'json', 'txt', 'srt', 'vtt', 'zip', 'glb', 'psd',
]);

function destination(generationId, output) {
  const dir = path.resolve(output ?? path.join(downloadsDir(), generationId));
  if (inside(dir, path.resolve(stateDir()))) throw new UserError('Los resultados no se guardan en la carpeta privada de AILAB.');
  fs.mkdirSync(dir, { recursive: true });
  const stat = fs.lstatSync(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new UserError(dir + ' es un enlace o no es una carpeta. No se guarda ahí.');
  return dir;
}

async function fetchResult(value, origin) {
  let url = signedUrl(value, origin);
  for (let hop = 0; hop < 4; hop += 1) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(900000) });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      await response.body?.cancel();
      url = signedUrl(new URL(response.headers.get('location'), url).href, origin);
      continue;
    }
    if (!response.ok || !response.body) throw new UserError('La descarga ha respondido ' + response.status + '.');
    return response;
  }
  throw new UserError('La descarga tiene demasiadas redirecciones.');
}

async function save(response, file) {
  const temporary = path.join(path.dirname(file), '.ailab-' + randomBytes(6).toString('hex') + '.part');
  const handle = fs.openSync(temporary, 'wx', 0o644);
  let open = true;
  try {
    const reader = response.body.getReader();
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048 * MB) {
        await reader.cancel().catch(() => {});
        throw new UserError('El resultado pasa de 2 GB.');
      }
      fs.writeFileSync(handle, value);
    }
    if (!size) throw new UserError('El resultado ha llegado vacío.');
    fs.closeSync(handle);
    open = false;
    try {
      fs.linkSync(temporary, file);
    } catch (error) {
      if (error.code === 'EEXIST') return;
      fs.copyFileSync(temporary, file, fs.constants.COPYFILE_EXCL);
    }
  } finally {
    if (open) fs.closeSync(handle);
    fs.rmSync(temporary, { force: true });
  }
}

/** Baja todos los resultados sin sobrescribir nada. Un fallo no cambia la generación. */
export async function download(origin, generation, output) {
  const files = (generation.files || []).filter((file) => file?.url);
  if (!files.length) return { saved: [], failed: [] };
  const id = uuid(generation.id, 'La generación');
  const dir = destination(id, output);
  const saved = [];
  const failed = [];
  for (const [index, result] of files.entries()) {
    const position = Number.isSafeInteger(result.position) && result.position >= 0 ? result.position : index;
    const found = String(result.filename ?? '').toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1];
    const file = path.join(dir, 'ailab-' + id + '-' + position + '.' + (EXTENSIONS.has(found) ? found : 'bin'));
    try {
      const existing = fs.lstatSync(file, { throwIfNoEntry: false });
      if (existing) {
        if (!existing.isFile()) throw new UserError(file + ' ya existe y no es un archivo.');
        saved.push({ file, existed: true });
        continue;
      }
      await save(await fetchResult(result.url, origin), file);
      saved.push({ file, existed: false });
    } catch (error) {
      failed.push({ position, reason: error instanceof UserError ? error.message : 'sin conexión o sin permiso para escribir en ' + dir + '.' });
    }
  }
  return { saved, failed };
}
