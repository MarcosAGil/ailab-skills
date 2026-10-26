// Archivos sintéticos reales para las pruebas: la CLI los detecta por contenido y mide su duración o
// sus dimensiones sin ffprobe. Cada generador devuelve los bytes; `Media` los escribe en una carpeta.
import fs from 'node:fs';
import path from 'node:path';

const box = (type, payload) => {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payload.length, 0);
  header.write(type, 4, 'ascii');
  return Buffer.concat([header, payload]);
};

export function mp4(seconds, brand = 'isom') {
  const ftyp = box('ftyp', Buffer.concat([Buffer.from(brand.padEnd(4, ' ')), Buffer.alloc(4), Buffer.from(brand.padEnd(4, ' '))]));
  const mvhd = Buffer.alloc(100);
  mvhd.writeUInt32BE(1000, 12);
  mvhd.writeUInt32BE(Math.round(seconds * 1000), 16);
  return Buffer.concat([ftyp, box('moov', box('mvhd', mvhd)), box('mdat', Buffer.alloc(64))]);
}

export function wav(seconds) {
  const rate = 8000;
  const data = Buffer.alloc(Math.round(seconds * rate * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// MPEG-1 Layer III a 128 kbps (16.000 bytes por segundo), tramas sin audio real pero con cabecera válida.
export function mp3(seconds) {
  const frame = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
  return Buffer.concat([frame, Buffer.alloc(Math.round(seconds * 16000) - 4)]);
}

export function png(width, height, padding = 32) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const chunk = Buffer.alloc(12 + 13);
  chunk.writeUInt32BE(13, 0);
  chunk.write('IHDR', 4, 'ascii');
  ihdr.copy(chunk, 8);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk, Buffer.alloc(padding)]);
}

export class Media {
  constructor(directory) {
    this.directory = directory;
    fs.mkdirSync(directory, { recursive: true });
    // Metadatos que el servidor simulado devuelve por URL: sirven para la paridad con el PHP real.
    this.meta = {};
  }

  put(name, bytes, meta) {
    const file = path.join(this.directory, name);
    fs.writeFileSync(file, bytes);
    this.meta[file] = { bytes: bytes.length, valid: true, ...meta };
    return file;
  }

  image(name, width = 1024, height = 768) { return this.put(name, png(width, height), { mime: 'image/png', width, height }); }
  video(name, seconds, brand = 'isom') { return this.put(name, mp4(seconds, brand), { mime: brand === 'qt' ? 'video/quicktime' : 'video/mp4', duration: seconds, width: 1280, height: 720 }); }
  wavAudio(name, seconds) { return this.put(name, wav(seconds), { mime: 'audio/wav', duration: seconds }); }
  mp3Audio(name, seconds) { return this.put(name, mp3(seconds), { mime: 'audio/mpeg', duration: seconds }); }

  // URL de subida simulada para una ruta local (la misma que usaría el servidor para buscar sus metadatos).
  url(file) { return 'https://uploads.example.test/' + path.basename(file); }
}
