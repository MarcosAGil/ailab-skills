#!/usr/bin/env node
// Regenera los PNG de marca del plugin (logo 512x512 e icono del compositor 256x256) a
// partir del logo cuadrado de Ailendra Labs (`branding/aill-logo.png`, 1000x1000).
// Herramienta de desarrollo: usa `sips` (macOS) o, si no existe, `ffmpeg`. Los PNG
// resultantes se versionan; el CI no la ejecuta.
//
//   node tools/build-plugin-assets.mjs [ruta/a/logo-cuadrado.png]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'plugins', 'ailab', 'assets');
const DEFAULT_SOURCE = path.join(ROOT, 'branding', 'aill-logo.png');

const source = path.resolve(process.argv[2] || DEFAULT_SOURCE);
if (!fs.existsSync(source) || !/\.png$/i.test(source)) {
  process.stderr.write('Uso: node tools/build-plugin-assets.mjs [logo cuadrado en PNG] (por defecto branding/aill-logo.png)\n');
  process.exit(1);
}

function has(command) {
  return !spawnSync(command, ['--help'], { encoding: 'utf8' }).error;
}

function resize(size, target) {
  const result = has('sips')
    ? spawnSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), source, '--out', target], { encoding: 'utf8' })
    : spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-vf', 'scale=' + size + ':' + size + ':flags=lanczos', target], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error('No se pudo redimensionar el logo: ' + (result.stderr || result.error?.message));
}

fs.mkdirSync(OUTPUT, { recursive: true });
for (const [name, size] of [['ailab-logo.png', 512], ['ailab-composer-icon.png', 256]]) {
  resize(size, path.join(OUTPUT, name));
  process.stdout.write('plugins/ailab/assets/' + name + ' (' + size + 'x' + size + ')\n');
}
