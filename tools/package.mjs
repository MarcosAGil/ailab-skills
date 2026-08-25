#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRepository } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
const { registry } = validateRepository();
const skill = registry.skills.find((item) => item.id === id);
if (!skill) throw new Error(`Skill desconocida: ${id || '(vacía)'}.`);

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-skill-package-'));
const target = path.join(staging, id);
const dist = path.resolve(process.env.AILAB_DIST_DIR || path.join(ROOT, 'dist'));
const epoch = Number(process.env.SOURCE_DATE_EPOCH || Date.parse(`${registry.updated_at}T00:00:00Z`) / 1000);
if (!Number.isInteger(epoch) || epoch < 0) throw new Error('SOURCE_DATE_EPOCH no es válido.');
fs.mkdirSync(dist, { recursive: true, mode: 0o755 });

function walk(directory, base = directory) {
  const files = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`No se admiten enlaces simbólicos: ${absolute}`);
    if (stat.isDirectory()) files.push(...walk(absolute, base));
    else if (stat.isFile()) files.push({
      absolute,
      relative: path.relative(base, absolute).split(path.sep).join('/'),
    });
  }
  return files;
}

try {
  const source = path.join(ROOT, skill.path);
  const files = walk(source);
  const fixedDate = new Date(epoch * 1000);
  for (const file of files) {
    const destination = path.join(target, ...file.relative.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o755 });
    fs.copyFileSync(file.absolute, destination);
    fs.chmodSync(destination, /\.(?:mjs|py)$/.test(file.relative) ? 0o755 : 0o644);
    fs.utimesSync(destination, fixedDate, fixedDate);
  }
  for (const directory of [target, ...files.map((file) => path.dirname(path.join(target, file.relative)))]) {
    if (fs.existsSync(directory)) fs.utimesSync(directory, fixedDate, fixedDate);
  }
  const filename = `${id}-skill-v${skill.version}-${skill.channel}.zip`;
  const temporary = path.join(dist, `.${filename}.${process.pid}.tmp`);
  const output = path.join(dist, filename);
  const zipped = spawnSync('zip', ['-X', '-q', temporary, ...files.map((file) => `${id}/${file.relative}`)], {
    cwd: staging,
    encoding: 'utf8',
  });
  if (zipped.error || zipped.status !== 0) throw new Error(zipped.stderr || zipped.error?.message || 'zip falló');
  fs.renameSync(temporary, output);
  const data = fs.readFileSync(output);
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  process.stdout.write(`${output}\nSHA-256 ${sha256}\n`);
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
