#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOCKED_NAMES = new Set([
  '.env', 'config.local.php', 'cookie.json', 'token', 'token.json',
]);
const BLOCKED_EXTENSIONS = new Set(['.key', '.p12', '.pem', '.sqlite', '.sqlite-shm', '.sqlite-wal']);
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bailp_[A-Za-z0-9_-]{40,80}\b/,
];

function fail(message) {
  throw new Error(message);
}

function readJson(relative) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
  } catch (error) {
    fail(`${relative} no es JSON válido: ${error.message}`);
  }
}

function walk(directory, base = directory) {
  const files = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) fail(`No se admiten enlaces simbólicos: ${absolute}`);
    if (stat.isDirectory()) files.push(...walk(absolute, base));
    else if (stat.isFile()) files.push({
      absolute,
      relative: path.relative(base, absolute).split(path.sep).join('/'),
      size: stat.size,
    });
  }
  return files;
}

function validateSkill(skill) {
  if (!skill || typeof skill !== 'object') fail('Entrada de skill inválida.');
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(skill.id || '')) fail(`ID de skill inválido: ${skill.id}`);
  if (!/^\d+\.\d+\.\d+$/.test(skill.version || '')) fail(`Versión inválida para ${skill.id}.`);
  if (!['beta', 'stable'].includes(skill.channel)) fail(`Canal inválido para ${skill.id}.`);
  if (skill.path !== `skills/${skill.id}`) fail(`Ruta no canónica para ${skill.id}.`);

  const root = path.resolve(ROOT, skill.path);
  const skillsRoot = path.resolve(ROOT, 'skills') + path.sep;
  if (!root.startsWith(skillsRoot) || !fs.statSync(root).isDirectory()) fail(`Falta la skill ${skill.id}.`);

  const skillFile = path.join(root, 'SKILL.md');
  const skillText = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) fail(`SKILL.md sin frontmatter: ${skill.id}.`);
  if (!new RegExp(`^name:\\s*${skill.id}\\s*$`, 'm').test(frontmatter[1])) fail(`name no coincide en ${skill.id}.`);
  if (!/^description:\s*(?:>|\|-?|[^\s].*)$/m.test(frontmatter[1])) fail(`description ausente en ${skill.id}.`);

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (pkg.version !== skill.version) fail(`registry y package.json divergen en ${skill.id}.`);

  if (skill.self_test !== undefined) {
    if (!skill.self_test || typeof skill.self_test !== 'object') fail(`self_test inválido en ${skill.id}.`);
    if (!['node', 'python3'].includes(skill.self_test.command)) fail(`Comando de self_test no permitido en ${skill.id}.`);
    if (!Array.isArray(skill.self_test.args) || skill.self_test.args.length < 1) fail(`args de self_test ausentes en ${skill.id}.`);
    if (skill.self_test.args.some((arg) => typeof arg !== 'string' || !arg || path.isAbsolute(arg) || arg.includes('..'))) {
      fail(`args de self_test no seguros en ${skill.id}.`);
    }
    if (typeof skill.self_test.expect !== 'string' || !skill.self_test.expect) fail(`expect de self_test ausente en ${skill.id}.`);
    const entrypoint = path.resolve(root, skill.self_test.args[0]);
    if (!entrypoint.startsWith(root + path.sep) || !fs.existsSync(entrypoint) || !fs.statSync(entrypoint).isFile()) {
      fail(`Falta el ejecutable de self_test en ${skill.id}.`);
    }
  }

  const files = walk(root);
  let total = 0;
  for (const file of files) {
    total += file.size;
    if (file.size < 1 || file.size > 10 * 1024 * 1024) fail(`Tamaño no permitido: ${skill.id}/${file.relative}`);
    const base = path.basename(file.relative);
    const extension = path.extname(base).toLowerCase();
    if (BLOCKED_NAMES.has(base) || BLOCKED_EXTENSIONS.has(extension)) fail(`Archivo privado bloqueado: ${skill.id}/${file.relative}`);
    if (file.size <= 2 * 1024 * 1024) {
      const content = fs.readFileSync(file.absolute, 'utf8');
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.test(content)) fail(`Posible secreto en ${skill.id}/${file.relative}.`);
      }
    }
  }
  if (total > 50 * 1024 * 1024) fail(`La skill ${skill.id} supera 50 MB.`);
  if (!skill.self_test && !files.some((file) => file.relative === 'scripts/ailab.mjs')) {
    fail(`Falta el bootstrap de ${skill.id}.`);
  }
  return { files: files.length, bytes: total };
}

export function validateRepository() {
  const registry = readJson('registry.json');
  if (registry.schema_version !== 1 || !Array.isArray(registry.skills) || registry.skills.length < 1) {
    fail('registry.json no cumple el esquema 1.');
  }
  const ids = new Set();
  const results = [];
  for (const skill of registry.skills) {
    if (ids.has(skill.id)) fail(`Skill duplicada: ${skill.id}.`);
    ids.add(skill.id);
    results.push({ id: skill.id, ...validateSkill(skill) });
  }
  return { registry, results };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = validateRepository();
    for (const skill of result.results) {
      process.stdout.write(`${skill.id} ${result.registry.skills.find((item) => item.id === skill.id).version}: ${skill.files} archivos · ${skill.bytes} bytes\n`);
    }
    process.stdout.write('Repositorio AILAB Skills válido.\n');
  } catch (error) {
    process.stderr.write(`Validación fallida: ${error.message}\n`);
    process.exit(1);
  }
}
