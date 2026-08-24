#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRepository } from './validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function fail(message) {
  process.stderr.write(message + '\n');
  process.exit(1);
}

const targetName = valueAfter('--target');
const customDirectory = valueAfter('--dir');
if (targetName && !['claude', 'codex'].includes(targetName)) fail('--target debe ser claude o codex.');
if (!customDirectory && !targetName) fail('Indica --target claude, --target codex o --dir <carpeta>.');

const destinationRoot = path.resolve(customDirectory || path.join(
  os.homedir(),
  targetName === 'claude' ? '.claude' : '.codex',
  'skills',
));

let validation;
try {
  validation = validateRepository();
} catch (error) {
  fail('El repositorio no es instalable: ' + error.message);
}

const requested = args.includes('--all')
  ? validation.registry.skills.map((skill) => skill.id)
  : args.filter((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--target' && args[index - 1] !== '--dir');
if (requested.length !== new Set(requested).size) fail('Hay skills duplicadas en la petición.');
if (!requested.length) fail('Indica una skill o usa --all.');

fs.mkdirSync(destinationRoot, { recursive: true, mode: 0o755 });

for (const id of requested) {
  const skill = validation.registry.skills.find((item) => item.id === id);
  if (!skill) fail(`Skill desconocida: ${id}.`);
  const source = path.join(ROOT, skill.path);
  const destination = path.join(destinationRoot, id);
  const nonce = `${process.pid}-${Date.now()}`;
  const temporary = path.join(destinationRoot, `.${id}.install-${nonce}`);
  const backup = path.join(destinationRoot, `.${id}.backup-${nonce}`);
  let hadPrevious = false;

  try {
    fs.cpSync(source, temporary, { recursive: true, errorOnExist: true, dereference: false });
    if (fs.existsSync(destination)) {
      fs.renameSync(destination, backup);
      hadPrevious = true;
    }
    fs.renameSync(temporary, destination);
    const check = spawnSync(process.execPath, [path.join(destination, 'scripts', 'ailab.mjs'), 'self-test'], {
      encoding: 'utf8',
      env: { ...process.env, AILAB_SKIP_UPDATE: '1' },
      timeout: 30000,
    });
    if (check.error || check.status !== 0) {
      throw new Error((check.stderr || check.stdout || check.error?.message || 'autodiagnóstico fallido').trim());
    }
    if (hadPrevious) fs.rmSync(backup, { recursive: true, force: true });
    process.stdout.write(`Instalada ${id} ${skill.version} en ${destination}\n`);
  } catch (error) {
    fs.rmSync(temporary, { recursive: true, force: true });
    fs.rmSync(destination, { recursive: true, force: true });
    if (hadPrevious && fs.existsSync(backup)) fs.renameSync(backup, destination);
    fail(`No se pudo instalar ${id}: ${error.message}`);
  }
}
