// Inspeccion de archivos locales: MIME real por bytes magicos (no por extension),
// sha256 y limites por tipo. Se usa en prepare y se re-verifica en submit.
import fs from 'node:fs';
import crypto from 'node:crypto';

const LIMITS = { image: 30 * 1024 * 1024, video: 200 * 1024 * 1024, audio: 150 * 1024 * 1024 };

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
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'OggS') return 'audio/ogg';
  if (buf.length >= 3 && buf.slice(0, 3).toString('ascii') === 'ID3') return 'audio/mpeg';
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xf6) === 0xf0) return 'audio/aac';
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  if (buf.length >= 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WAVE') return 'audio/wav';
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === 'fLaC') return 'audio/flac';
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
  const accepted = Array.isArray(accept) ? accept : (accept ? [accept] : []);
  if (accepted.length && !accepted.includes(cls) && !accepted.includes(mime)) {
    return { ok: false, error: 'Se esperaba ' + accepted.join(' o ') + ' y "' + path_ + '" es ' + cls + ' (' + mime + ').' };
  }
  if (inspected.size > LIMITS[cls]) return { ok: false, error: path_ + ' supera el limite de ' + Math.round(LIMITS[cls] / 1024 / 1024) + 'MB para ' + cls + '.' };
  return { ok: true, path: absolute, size: inspected.size, mime, class: cls, sha256: inspected.sha256 };
}

export function rehashMatches(fileEntry) {
  try {
    const inspected = hashFileSync(fs.realpathSync(fileEntry.path), 0);
    return inspected.size === fileEntry.size && inspected.sha256 === fileEntry.sha256;
  } catch { return false; }
}

function uint24le(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function imageDimensions(absolute, mime) {
  const data = fs.readFileSync(absolute);
  if (mime === 'image/png' && data.length >= 24) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (mime === 'image/jpeg') {
    let offset = 2;
    const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    while (offset + 8 < data.length) {
      if (data[offset] !== 0xff) { offset += 1; continue; }
      while (offset < data.length && data[offset] === 0xff) offset += 1;
      const marker = data[offset++];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > data.length) break;
      const length = data.readUInt16BE(offset);
      if (length < 2 || offset + length > data.length) break;
      if (sof.has(marker) && length >= 7) {
        return { width: data.readUInt16BE(offset + 5), height: data.readUInt16BE(offset + 3) };
      }
      offset += length;
    }
  }
  if (mime === 'image/webp' && data.length >= 30) {
    const chunk = data.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8X') {
      return { width: uint24le(data, 24) + 1, height: uint24le(data, 27) + 1 };
    }
    if (chunk === 'VP8 ' && data.length >= 30 && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
      return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L' && data.length >= 25 && data[20] === 0x2f) {
      const bits = data.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

function mp4Box(fd, position, end) {
  if (position + 8 > end) return null;
  const header = Buffer.alloc(16);
  const read = fs.readSync(fd, header, 0, 16, position);
  if (read < 8) return null;
  let size = header.readUInt32BE(0);
  let headerSize = 8;
  if (size === 1) {
    if (read < 16) return null;
    const extended = header.readBigUInt64BE(8);
    if (extended > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    size = Number(extended);
    headerSize = 16;
  } else if (size === 0) {
    size = end - position;
  }
  if (size < headerSize || position + size > end) return null;
  return { type: header.subarray(4, 8).toString('ascii'), position, size, headerSize };
}

function mp4Duration(absolute) {
  const stat = fs.statSync(absolute);
  const fd = fs.openSync(absolute, 'r');
  try {
    let position = 0;
    while (position < stat.size) {
      const box = mp4Box(fd, position, stat.size);
      if (!box) break;
      if (box.type === 'moov') {
        let childPosition = box.position + box.headerSize;
        const childEnd = box.position + box.size;
        while (childPosition < childEnd) {
          const child = mp4Box(fd, childPosition, childEnd);
          if (!child) break;
          if (child.type === 'mvhd') {
            const payload = Buffer.alloc(Math.min(40, child.size - child.headerSize));
            fs.readSync(fd, payload, 0, payload.length, child.position + child.headerSize);
            if (payload.length < 20) return null;
            const version = payload[0];
            const timescaleOffset = version === 1 ? 20 : 12;
            const durationOffset = version === 1 ? 24 : 16;
            if (payload.length < durationOffset + (version === 1 ? 8 : 4)) return null;
            const timescale = payload.readUInt32BE(timescaleOffset);
            const rawDuration = version === 1 ? Number(payload.readBigUInt64BE(durationOffset)) : payload.readUInt32BE(durationOffset);
            if (timescale > 0 && rawDuration > 0 && Number.isFinite(rawDuration)) return rawDuration / timescale;
            return null;
          }
          childPosition += child.size;
        }
      }
      position += box.size;
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

function audioDuration(absolute, mime) {
  const stat = fs.statSync(absolute);
  if (mime === 'audio/wav') {
    const fd = fs.openSync(absolute, 'r');
    try {
      const head = Buffer.alloc(12);
      if (fs.readSync(fd, head, 0, 12, 0) !== 12 || head.subarray(0, 4).toString('ascii') !== 'RIFF' || head.subarray(8, 12).toString('ascii') !== 'WAVE') return null;
      let offset = 12, byteRate = 0, dataBytes = 0;
      while (offset + 8 <= stat.size) {
        const chunk = Buffer.alloc(8);
        if (fs.readSync(fd, chunk, 0, 8, offset) !== 8) break;
        const id = chunk.subarray(0, 4).toString('ascii');
        const size = chunk.readUInt32LE(4);
        if (size > stat.size || offset + 8 + size > stat.size) return null;
        if (id === 'fmt ' && size >= 12) {
          const fmt = Buffer.alloc(12);
          if (fs.readSync(fd, fmt, 0, 12, offset + 8) !== 12) return null;
          byteRate = fmt.readUInt32LE(8);
        } else if (id === 'data') dataBytes = size;
        if (byteRate > 0 && dataBytes > 0) break;
        offset += 8 + size + (size % 2);
      }
      const duration = byteRate > 0 && dataBytes > 0 ? dataBytes / byteRate : 0;
      return Number.isFinite(duration) && duration > 0 ? duration : null;
    } finally { fs.closeSync(fd); }
  }
  if (mime === 'audio/flac') {
    const fd = fs.openSync(absolute, 'r');
    try {
      const head = Buffer.alloc(42);
      if (fs.readSync(fd, head, 0, 42, 0) !== 42 || head.subarray(0, 4).toString('ascii') !== 'fLaC' || (head[4] & 0x7f) !== 0) return null;
      const sampleRate = (head[18] << 12) | (head[19] << 4) | (head[20] >> 4);
      const totalSamples = Number(BigInt(head[21] & 0x0f) << 32n | BigInt(head.readUInt32BE(22)));
      const duration = sampleRate > 0 ? totalSamples / sampleRate : 0;
      return Number.isFinite(duration) && duration > 0 ? duration : null;
    } finally { fs.closeSync(fd); }
  }
  if (mime === 'audio/mpeg') {
    const bytes = Buffer.alloc(Math.min(stat.size, 262144));
    const fd = fs.openSync(absolute, 'r');
    try { fs.readSync(fd, bytes, 0, bytes.length, 0); } finally { fs.closeSync(fd); }
    let offset = 0;
    if (bytes.length >= 10 && bytes.subarray(0, 3).toString('ascii') === 'ID3') {
      offset = 10 + ((bytes[6] & 0x7f) << 21) + ((bytes[7] & 0x7f) << 14) + ((bytes[8] & 0x7f) << 7) + (bytes[9] & 0x7f);
      if ((bytes[5] & 0x10) !== 0) offset += 10;
    }
    let frameOffset = -1, header = 0;
    for (let i = Math.max(0, offset); i + 4 <= bytes.length; i++) {
      if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) continue;
      const value = bytes.readUInt32BE(i);
      const versionBits = (value >>> 19) & 3, layerBits = (value >>> 17) & 3;
      const bitrateIndex = (value >>> 12) & 15, sampleIndex = (value >>> 10) & 3;
      if (versionBits === 1 || layerBits !== 1 || bitrateIndex < 1 || bitrateIndex > 14 || sampleIndex > 2) continue;
      frameOffset = i; header = value; break;
    }
    if (frameOffset < 0) return null;
    const versionBits = (header >>> 19) & 3, bitrateIndex = (header >>> 12) & 15;
    const sampleIndex = (header >>> 10) & 3, channelMode = (header >>> 6) & 3;
    let sampleRate = [44100, 48000, 32000][sampleIndex];
    if (versionBits === 2) sampleRate /= 2; else if (versionBits === 0) sampleRate /= 4;
    const bitrate = (versionBits === 3
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160])[bitrateIndex] * 1000;
    const samplesPerFrame = versionBits === 3 ? 1152 : 576;
    const sideInfo = versionBits === 3 ? (channelMode === 3 ? 17 : 32) : (channelMode === 3 ? 9 : 17);
    const xing = frameOffset + 4 + sideInfo;
    if (xing + 12 <= bytes.length && ['Xing', 'Info'].includes(bytes.subarray(xing, xing + 4).toString('ascii')) && (bytes.readUInt32BE(xing + 4) & 1)) {
      const duration = bytes.readUInt32BE(xing + 8) * samplesPerFrame / sampleRate;
      if (Number.isFinite(duration) && duration > 0) return duration;
    }
    let id3v1Bytes = 0;
    if (stat.size >= 128) {
      const tail = Buffer.alloc(3); const tailFd = fs.openSync(absolute, 'r');
      try { fs.readSync(tailFd, tail, 0, 3, stat.size - 128); } finally { fs.closeSync(tailFd); }
      if (tail.toString('ascii') === 'TAG') id3v1Bytes = 128;
    }
    const duration = bitrate > 0 ? Math.max(0, stat.size - frameOffset - id3v1Bytes) * 8 / bitrate : 0;
    return Number.isFinite(duration) && duration > 0 ? duration : null;
  }
  if (['audio/mp4', 'video/mp4'].includes(mime)) return mp4Duration(absolute);
  if (mime === 'audio/ogg') {
    const headSize = Math.min(stat.size, 65536);
    const tailSize = Math.min(stat.size, 262144);
    const fd = fs.openSync(absolute, 'r');
    try {
      const head = Buffer.alloc(headSize); fs.readSync(fd, head, 0, head.length, 0);
      const tail = Buffer.alloc(tailSize); fs.readSync(fd, tail, 0, tail.length, stat.size - tailSize);
      let sampleRate = 0, preskip = 0;
      const opus = head.indexOf(Buffer.from('OpusHead'));
      if (opus >= 0 && opus + 12 <= head.length) { sampleRate = 48000; preskip = head.readUInt16LE(opus + 10); }
      else {
        const vorbis = head.indexOf(Buffer.from([0x01, 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73]));
        if (vorbis >= 0 && vorbis + 16 <= head.length) sampleRate = head.readUInt32LE(vorbis + 12);
      }
      if (sampleRate < 8000 || sampleRate > 384000) return null;
      for (let at = tail.lastIndexOf(Buffer.from('OggS')); at >= 0; at = tail.lastIndexOf(Buffer.from('OggS'), at - 1)) {
        if (at + 14 > tail.length) continue;
        const granule = Number(tail.readBigUInt64LE(at + 6));
        const duration = (granule - preskip) / sampleRate;
        if (Number.isFinite(duration) && duration > 0) return duration;
      }
      return null;
    } finally { fs.closeSync(fd); }
  }
  if (mime === 'audio/aac') {
    const fd = fs.openSync(absolute, 'r');
    const rates = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
    try {
      let offset = 0, sampleRate = 0, frames = 0;
      const header = Buffer.alloc(7);
      while (offset < stat.size) {
        if (fs.readSync(fd, header, 0, 7, offset) !== 7 || header[0] !== 0xff || (header[1] & 0xf6) !== 0xf0) return null;
        const rateIndex = (header[2] >> 2) & 0x0f;
        const currentRate = rates[rateIndex];
        const length = ((header[3] & 3) << 11) | (header[4] << 3) | ((header[5] >> 5) & 7);
        if (!currentRate || length < 7 || length > 8192 || offset + length > stat.size) return null;
        if (!sampleRate) sampleRate = currentRate;
        if (sampleRate !== currentRate) return null;
        frames += 1 + (header[6] & 3);
        offset += length;
      }
      const duration = sampleRate > 0 ? frames * 1024 / sampleRate : 0;
      return Number.isFinite(duration) && duration > 0 ? duration : null;
    } finally { fs.closeSync(fd); }
  }
  return null;
}

// Metadatos mínimos y deterministas usados para presupuestar H3 Max antes de
// autorizar gasto. El servidor vuelve a medirlos y es siempre la autoridad.
export function inspectPricingMetadata(path_) {
  const inspected = inspectFile(path_, null);
  if (!inspected.ok) return inspected;
  try {
    if (inspected.class === 'image') {
      const dimensions = imageDimensions(inspected.path, inspected.mime);
      if (!dimensions || dimensions.width < 1 || dimensions.height < 1) return { ok: false, error: 'No se pudieron leer las dimensiones de ' + path_ + '.' };
      return { ...inspected, ...dimensions, pixels: dimensions.width * dimensions.height };
    }
    if (inspected.class === 'video' && inspected.mime === 'video/mp4') {
      const duration = mp4Duration(inspected.path);
      if (!Number.isFinite(duration) || duration <= 0) return { ok: false, error: 'No se pudo leer la duración MP4 de ' + path_ + '.' };
      return { ...inspected, duration };
    }
    if (inspected.class === 'audio' && ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/ogg', 'audio/aac'].includes(inspected.mime)) {
      const duration = audioDuration(inspected.path, inspected.mime);
      if (!Number.isFinite(duration) || duration <= 0) return { ok: false, error: 'No se pudo leer la duración del audio ' + path_ + '.' };
      return { ...inspected, duration };
    }
    return inspected;
  } catch {
    return { ok: false, error: 'No se pudieron leer los metadatos de ' + path_ + '.' };
  }
}
