#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr.trim() || 'falló'}`);
  return result.stdout;
}

function probe(file) {
  return JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
}

function finite(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write('Extrae audio original para UGC AILAB\nUso: node extract-audio.mjs --input VIDEO --output AUDIO.wav\nRequiere ffmpeg y ffprobe. No sobrescribe archivos.\n');
  } else {
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
      const flag = args[i];
      if (!['--input', '--output'].includes(flag) || options[flag] || !args[i + 1]) {
        throw new Error('Argumentos inválidos. Usa --help.');
      }
      options[flag] = args[i + 1];
    }
    if (!options['--input'] || !options['--output']) throw new Error('Faltan --input y --output.');
    const input = path.resolve(options['--input']);
    const output = path.resolve(options['--output']);
    if (!fs.statSync(input).isFile()) throw new Error('La entrada no es un archivo.');
    if (path.extname(output).toLowerCase() !== '.wav') throw new Error('La salida debe tener extensión .wav.');
    if (fs.existsSync(output)) throw new Error('La salida ya existe; no se sobrescribe.');
    const source = probe(input);
    const video = source.streams.find(stream => stream.codec_type === 'video');
    const audio = source.streams.find(stream => stream.codec_type === 'audio');
    if (!video) throw new Error('La entrada no contiene vídeo.');
    if (!audio) throw new Error('El vídeo no contiene audio original.');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const staging = fs.mkdtempSync(path.join(path.dirname(output), '.ugc-audio-'));
    try {
      const temporary = path.join(staging, 'original.wav');
      run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', input,
        '-map', '0:a:0', '-vn', '-c:a', 'pcm_s16le', '-ar', '48000', temporary]);
      const extracted = probe(temporary);
      const stream = extracted.streams.find(item => item.codec_type === 'audio');
      const duration = finite(stream?.duration) ?? finite(extracted.format?.duration);
      if (!stream || duration === null || duration <= 0) throw new Error('El audio extraído no es válido.');
      const audioStart = finite(audio.start_time);
      const videoStart = finite(video.start_time);
      // El enlace publica el resultado completo y falla si otro proceso creó la salida.
      fs.linkSync(temporary, output);
      process.stdout.write(JSON.stringify({
        input, output, duration_seconds: duration, channels: stream.channels,
        sample_rate: Number(stream.sample_rate), codec: stream.codec_name,
        source_audio_stream: audio.index,
        source_audio_start_seconds: audioStart,
        source_video_start_seconds: videoStart,
        audio_offset_from_video_seconds: audioStart !== null && videoStart !== null ? audioStart - videoStart : null,
      }, null, 2) + '\n');
    } finally {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }
} catch (error) {
  process.stderr.write(`Extracción fallida: ${error.message}\n`);
  process.exitCode = 1;
}
