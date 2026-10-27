// Archivos sintéticos válidos para el servidor real de AILAB (PNG completo, MP4 con mvhd y tkhd, WAV). Cada generador
// anota en `meta` lo que el servidor va a medir (dimensiones, duración) para poder reproducir el cálculo de la web.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

export const hasFfmpeg = () => spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0 && spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status === 0;

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buffer) => { let c = 0xffffffff; for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

export function png(width, height, seed = 0) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + width * 3, seed);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const box = (type, payload) => {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payload.length, 0);
  header.write(type, 4, 'ascii');
  return Buffer.concat([header, payload]);
};

export function mp4(seconds, width = 1280, height = 720) {
  const mvhd = Buffer.alloc(100);
  mvhd.writeUInt32BE(1000, 12);
  mvhd.writeUInt32BE(Math.round(seconds * 1000), 16);
  const tkhd = Buffer.alloc(84);
  tkhd.writeUInt32BE(width * 65536, 76);
  tkhd.writeUInt32BE(height * 65536, 80);
  const ftyp = box('ftyp', Buffer.concat([Buffer.from('isom'), Buffer.alloc(4), Buffer.from('isom')]));
  return Buffer.concat([ftyp, box('moov', Buffer.concat([box('mvhd', mvhd), box('trak', box('tkhd', tkhd))])), box('mdat', Buffer.alloc(64))]);
}

export function wav(seconds) {
  const rate = 8000;
  const data = Buffer.alloc(Math.round(seconds * rate * 2));
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

export class PriceFixtures {
  constructor(directory) {
    this.directory = directory;
    fs.mkdirSync(directory, { recursive: true });
    this.meta = new Map();
  }

  put(name, bytes, meta) {
    const file = path.join(this.directory, name);
    if (!this.meta.has(file)) {
      fs.writeFileSync(file, bytes);
      this.meta.set(file, meta);
    }
    return file;
  }

  image(width = 1024, height = 768) { return this.put(`img-${width}x${height}.png`, png(width, height), { kind: 'image', width, height }); }
  video(seconds = 8, width = 1280, height = 720) { return this.put(`vid-${seconds}s-${width}x${height}.mp4`, mp4(seconds, width, height), { kind: 'video', seconds, width, height }); }
  // Vídeo H.264 real (ffmpeg), medible por ffprobe: lo piden Topaz y los modelos que miden fotogramas o pistas.
  realVideo(seconds = 2, width = 320, height = 180, fps = 24) {
    const file = path.join(this.directory, `real-${seconds}s-${width}x${height}-${fps}fps.mp4`);
    if (!this.meta.has(file)) {
      const made = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}:r=${fps}:d=${seconds}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', file]);
      if (made.status !== 0) throw new Error('ffmpeg no pudo crear el vídeo de prueba.');
      this.meta.set(file, { kind: 'video', seconds, width, height, frames: Math.round(seconds * fps) });
    }
    return file;
  }

  audio(seconds = 10) { return this.put(`aud-${seconds}s.wav`, wav(seconds), { kind: 'audio', seconds }); }

  // Los argumentos de un caso con cada ruta de archivo sustituida por lo que mide el servidor.
  describe(args) {
    const out = {};
    for (const [name, value] of Object.entries(args)) {
      const read = (item) => (typeof item === 'string' && this.meta.has(item) ? this.meta.get(item) : item);
      out[name] = Array.isArray(value) ? value.map(read) : read(value);
    }
    return out;
  }
}
