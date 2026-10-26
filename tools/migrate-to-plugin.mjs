#!/usr/bin/env node
// Retira la skill manual `ailab` de Claude Code y Codex antes de instalar el plugin.
//
//   node tools/migrate-to-plugin.mjs            solo muestra lo que haria
//   node tools/migrate-to-plugin.mjs --apply    MUEVE las skills a una copia de seguridad con fecha
//
// Reglas: nunca borra (mueve), nunca toca ~/.config/ailab ni ~/.config/ailendra, y solo
// mueve una carpeta si su SKILL.md declara `name: ailab` y su package.json es el de la
// skill de AILAB. Un enlace simbolico o una carpeta ajena se deja donde esta.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_PACKAGE_NAME = 'ailab-skill';

function pad(value) { return String(value).padStart(2, '0'); }

export function stamp(date = new Date()) {
  return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Devuelve { ok, reason } indicando si `dir` es la skill de AILAB y se puede mover.
export function inspectSkill(dir) {
  let stat;
  try { stat = fs.lstatSync(dir); } catch { return { ok: false, missing: true, reason: 'no existe' }; }
  if (stat.isSymbolicLink()) return { ok: false, reason: 'es un enlace simbolico (se deja como esta)' };
  if (!stat.isDirectory()) return { ok: false, reason: 'no es una carpeta' };
  let skill;
  try { skill = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'); } catch { return { ok: false, reason: 'no tiene SKILL.md' }; }
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill);
  if (!frontmatter || !/^name:\s*ailab\s*$/m.test(frontmatter[1])) return { ok: false, reason: 'su SKILL.md no declara name: ailab' };
  const pkg = readJson(path.join(dir, 'package.json'));
  if (!pkg || pkg.name !== SKILL_PACKAGE_NAME) return { ok: false, reason: 'su package.json no es el de la skill de AILAB' };
  return { ok: true, version: pkg.version || null };
}

function directorySignature(dir) {
  const entries = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) walk(absolute);
      else entries.push(path.relative(dir, absolute) + ':' + stat.size);
    }
  };
  walk(dir);
  return entries.join('\n');
}

// Mueve la carpeta. Si el destino esta en otro dispositivo, copia, verifica y solo entonces
// retira el origen (el resultado sigue siendo un movimiento: la copia de seguridad es completa).
function moveDirectory(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  try {
    fs.renameSync(source, destination);
    return 'rename';
  } catch (error) {
    if (!error || error.code !== 'EXDEV') throw error;
  }
  fs.cpSync(source, destination, { recursive: true, errorOnExist: true, dereference: false, preserveTimestamps: true });
  if (directorySignature(source) !== directorySignature(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
    throw new Error('La copia de seguridad de ' + source + ' no coincide con el original; no se ha movido nada.');
  }
  fs.rmSync(source, { recursive: true, force: true });
  return 'copy';
}

export function migrate({ home = os.homedir(), env = process.env, apply = false, now = new Date(), backupRoot = null } = {}) {
  const claudeHome = env.CLAUDE_CONFIG_DIR ? path.resolve(env.CLAUDE_CONFIG_DIR) : path.join(home, '.claude');
  const codexHome = env.CODEX_HOME ? path.resolve(env.CODEX_HOME) : path.join(home, '.codex');
  const backup = path.resolve(backupRoot || path.join(home, 'ailab-skill-backup-' + stamp(now)));
  const targets = [
    { agent: 'Claude Code', key: 'claude', dir: path.join(claudeHome, 'skills', 'ailab') },
    { agent: 'Codex', key: 'codex', dir: path.join(codexHome, 'skills', 'ailab') },
  ];
  const report = [];
  for (const target of targets) {
    const check = inspectSkill(target.dir);
    const entry = { ...target, ...check, destination: path.join(backup, target.key, 'ailab'), moved: false };
    if (check.ok && apply) {
      if (fs.existsSync(entry.destination)) throw new Error('Ya existe ' + entry.destination + '. Usa --backup-dir con otra carpeta.');
      entry.method = moveDirectory(target.dir, entry.destination);
      entry.moved = true;
    }
    report.push(entry);
  }
  return { backup, apply, report };
}

function main() {
  const args = process.argv.slice(2);
  const unknown = [];
  for (let index = 0; index < args.length; index++) {
    if (['--home', '--backup-dir'].includes(args[index])) index++;
    else if (!['--apply', '--help'].includes(args[index])) unknown.push(args[index]);
  }
  if (args.includes('--help') || unknown.length) {
    process.stdout.write('Uso: node tools/migrate-to-plugin.mjs [--apply] [--home <carpeta>] [--backup-dir <carpeta>]\n'
      + 'Sin --apply solo muestra lo que haria. Con --apply mueve (no borra) ~/.claude/skills/ailab y ~/.codex/skills/ailab a una copia de seguridad.\n');
    process.exit(unknown.length ? 1 : 0);
  }
  const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
  const apply = args.includes('--apply');
  let result;
  try {
    // Un --home explicito manda sobre CLAUDE_CONFIG_DIR y CODEX_HOME del entorno.
    result = migrate({ home: value('--home') ? path.resolve(value('--home')) : os.homedir(), env: value('--home') ? {} : process.env, apply, backupRoot: value('--backup-dir') });
  } catch (error) {
    process.stderr.write('No se pudo migrar: ' + error.message + '\n');
    process.exit(1);
  }
  process.stdout.write((apply ? 'Migracion de la skill manual de AILAB al plugin\n' : 'Simulacion (no se mueve nada; añade --apply para ejecutar)\n'));
  for (const item of result.report) {
    if (item.missing) process.stdout.write('- ' + item.agent + ': no hay skill manual en ' + item.dir + '\n');
    else if (!item.ok) process.stdout.write('- ' + item.agent + ': ' + item.dir + ' no se toca: ' + item.reason + '\n');
    else if (item.moved) process.stdout.write('- ' + item.agent + ': movida ' + item.dir + ' -> ' + item.destination + ' (version ' + (item.version || 'desconocida') + ')\n');
    else process.stdout.write('- ' + item.agent + ': moveria ' + item.dir + ' -> ' + item.destination + ' (version ' + (item.version || 'desconocida') + ')\n');
  }
  process.stdout.write('No se toca ~/.config/ailab ni ~/.config/ailendra: tu sesion y tu estado se conservan.\n');
  if (result.report.some((item) => item.moved)) {
    process.stdout.write('Copia de seguridad: ' + result.backup + ' (borrala tu cuando quieras; esta herramienta nunca borra).\n');
    process.stdout.write('Siguiente paso: instala el plugin (docs/instalacion-plugin.md) y abre una sesion nueva.\n');
  } else if (!apply && result.report.some((item) => item.ok)) {
    process.stdout.write('Para ejecutarlo: node tools/migrate-to-plugin.mjs --apply\n');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
