#!/usr/bin/env node
// Regenera los PNG de marca del plugin (logo 512x512 e icono del compositor 256x256) a
// partir del logo bicolor de AILAB. Herramienta de desarrollo: necesita `rsvg-convert`
// y los PNG resultantes se versionan; el CI no la ejecuta.
//
//   node tools/build-plugin-assets.mjs <ruta/a/ailab-logo-bicolor.svg>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'plugins', 'ailab', 'assets');
const BRAND = '#16B2FF';
const ACCENT = '#0B5C9E';

const source = process.argv[2];
if (!source || !fs.existsSync(source)) {
  process.stderr.write('Uso: node tools/build-plugin-assets.mjs <ailab-logo-bicolor.svg de AILAB>\n');
  process.exit(1);
}
const svg = fs.readFileSync(source, 'utf8');
const match = /<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/.exec(svg);
if (!match) throw new Error('El SVG no tiene viewBox.');
const [, viewBox, rawInner] = match;
const [, , vw, vh] = viewBox.split(/\s+/).map(Number);
// El acento original (#499aee) se pierde sobre el azul de marca: se oscurece.
const inner = rawInner.replace(/<title>[\s\S]*?<\/title>/g, '').replaceAll('#499aee', ACCENT);

function square(size, scale) {
  const width = size * scale;
  const height = width * vh / vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
    + `<rect width="${size}" height="${size}" fill="${BRAND}"/>`
    + `<svg x="${(size - width) / 2}" y="${(size - height) / 2}" width="${width}" height="${height}" viewBox="${viewBox}">${inner}</svg></svg>`;
}

fs.mkdirSync(OUTPUT, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-plugin-assets-'));
try {
  for (const [name, size, scale] of [['ailab-logo.png', 512, 0.78], ['ailab-composer-icon.png', 256, 0.82]]) {
    const input = path.join(temporary, name.replace('.png', '.svg'));
    fs.writeFileSync(input, square(size, scale));
    const result = spawnSync('rsvg-convert', ['-w', String(size), '-h', String(size), input, '-o', path.join(OUTPUT, name)], { encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error('rsvg-convert fallo: ' + (result.stderr || result.error?.message));
    process.stdout.write('plugins/ailab/assets/' + name + ' (' + size + 'x' + size + ')\n');
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
