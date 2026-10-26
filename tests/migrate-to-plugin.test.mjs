import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inspectSkill, migrate } from '../tools/migrate-to-plugin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = path.join(ROOT, 'tools', 'migrate-to-plugin.mjs');
const SKILL = path.join(ROOT, 'skills', 'ailab');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-migrate-'));
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

function tree(dir) {
  const entries = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) walk(absolute);
      else entries.push(path.relative(dir, absolute) + ':' + crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'));
    }
  };
  walk(dir);
  return entries;
}

function home(name) {
  const dir = path.join(temporary, name);
  fs.mkdirSync(dir, { recursive: true });
  // Estado que la migracion jamas debe tocar.
  for (const state of ['.config/ailab', '.config/ailendra']) {
    fs.mkdirSync(path.join(dir, state), { recursive: true });
    fs.writeFileSync(path.join(dir, state, 'token'), 'ailp_' + 'x'.repeat(48) + '\n');
    fs.writeFileSync(path.join(dir, state, 'catalog.json'), '{}\n');
  }
  return dir;
}

function install(dir, agent, source = SKILL) {
  const target = path.join(dir, agent === 'claude' ? '.claude' : '.codex', 'skills', 'ailab');
  fs.cpSync(source, target, { recursive: true });
  return target;
}

const run = (args, env = {}) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, ...env } });

test('sin --apply solo muestra lo que haria y no cambia nada', () => {
  const dir = home('dry');
  const claude = install(dir, 'claude');
  const codex = install(dir, 'codex');
  const before = [tree(dir)];
  const result = run(['--home', dir]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Simulación|Simulacion/);
  assert.ok(result.stdout.includes('moveria ' + claude) && result.stdout.includes('moveria ' + codex));
  assert.match(result.stdout, /--apply/);
  assert.deepEqual(tree(dir), before[0]);
  assert.equal(fs.readdirSync(dir).some((name) => name.startsWith('ailab-skill-backup-')), false);
});

test('--apply mueve las dos skills a una copia de seguridad con fecha, sin borrar nada y sin tocar ~/.config', () => {
  const dir = home('apply');
  const claude = install(dir, 'claude');
  const codex = install(dir, 'codex');
  const original = tree(claude);
  const state = tree(path.join(dir, '.config'));
  const result = run(['--home', dir, '--apply']);
  assert.equal(result.status, 0, result.stderr);
  const backups = fs.readdirSync(dir).filter((name) => /^ailab-skill-backup-\d{8}-\d{6}$/.test(name));
  assert.equal(backups.length, 1, 'una carpeta de copia con fecha');
  const backup = path.join(dir, backups[0]);
  assert.equal(fs.existsSync(claude), false);
  assert.equal(fs.existsSync(codex), false);
  assert.deepEqual(tree(path.join(backup, 'claude', 'ailab')), original, 'contenido idéntico, byte a byte');
  assert.deepEqual(tree(path.join(backup, 'codex', 'ailab')), original);
  assert.deepEqual(tree(path.join(dir, '.config')), state, 'el estado de AILAB queda intacto');
  assert.match(result.stdout, /movida/);
  assert.match(result.stdout, /No se toca ~\/\.config\/ailab/);
  const again = run(['--home', dir, '--apply']);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /no hay skill manual/);
  assert.deepEqual(tree(path.join(backup, 'claude', 'ailab')), original, 'una segunda ejecución no toca la copia');
});

test('solo mueve lo que es la skill de AILAB: otro name, otro package.json o un enlace simbólico se quedan donde están', (t) => {
  const dir = home('foreign');
  const claude = install(dir, 'claude');
  fs.writeFileSync(path.join(claude, 'SKILL.md'), fs.readFileSync(path.join(claude, 'SKILL.md'), 'utf8').replace(/^name: ailab$/m, 'name: otra-cosa'));
  const codex = install(dir, 'codex');
  fs.writeFileSync(path.join(codex, 'package.json'), JSON.stringify({ name: 'mi-propia-skill', version: '1.0.0' }));
  const result = run(['--home', dir, '--apply']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(claude, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(codex, 'package.json')), true);
  assert.match(result.stdout, /no declara name: ailab/);
  assert.match(result.stdout, /package\.json no es el de la skill de AILAB/);
  assert.equal(fs.readdirSync(dir).some((name) => name.startsWith('ailab-skill-backup-')), false);

  const linkHome = home('link');
  const checkout = path.join(linkHome, 'checkout');
  fs.cpSync(SKILL, checkout, { recursive: true });
  fs.mkdirSync(path.join(linkHome, '.claude', 'skills'), { recursive: true });
  try { fs.symlinkSync(checkout, path.join(linkHome, '.claude', 'skills', 'ailab'), 'dir'); } catch (error) { t.diagnostic('sin permisos para symlink: ' + error.code); return; }
  const linked = run(['--home', linkHome, '--apply']);
  assert.equal(linked.status, 0, linked.stderr);
  assert.match(linked.stdout, /enlace simbolico/);
  assert.equal(fs.lstatSync(path.join(linkHome, '.claude', 'skills', 'ailab')).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(checkout, 'SKILL.md')), true);
});

test('respeta --backup-dir, no pisa una copia existente y un --home explícito ignora CLAUDE_CONFIG_DIR', () => {
  const dir = home('options');
  const claude = install(dir, 'claude');
  const backup = path.join(temporary, 'mi-copia');
  const decoy = home('decoy');
  const decoySkill = install(decoy, 'claude');
  const result = run(['--home', dir, '--apply', '--backup-dir', backup], { CLAUDE_CONFIG_DIR: path.join(decoy, '.claude') });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(claude), false);
  assert.equal(fs.existsSync(path.join(backup, 'claude', 'ailab', 'SKILL.md')), true);
  assert.equal(fs.existsSync(decoySkill), true, 'la variable de entorno no redirige un --home explícito');
  // Una segunda migración hacia la misma copia falla sin tocar nada.
  const again = install(dir, 'claude');
  const clash = run(['--home', dir, '--apply', '--backup-dir', backup]);
  assert.equal(clash.status, 1);
  assert.match(clash.stderr, /Ya existe/);
  assert.equal(fs.existsSync(path.join(again, 'SKILL.md')), true);
  assert.equal(run(['--home', dir, '--nope']).status, 1);
});

test('inspectSkill y migrate (API) usan el entorno recibido, no el HOME real', () => {
  const dir = home('api');
  const claude = install(dir, 'claude');
  assert.deepEqual({ ok: inspectSkill(claude).ok, version: inspectSkill(claude).version }, { ok: true, version: JSON.parse(fs.readFileSync(path.join(SKILL, 'package.json'), 'utf8')).version });
  assert.equal(inspectSkill(path.join(dir, 'no-existe')).missing, true);
  const dry = migrate({ home: dir, env: {}, apply: false, now: new Date(2026, 9, 26, 19, 30, 5) });
  assert.match(dry.backup, /ailab-skill-backup-20261026-193005$/);
  assert.equal(dry.report.filter((item) => item.ok).length, 1);
  assert.equal(fs.existsSync(claude), true);
  const applied = migrate({ home: dir, env: {}, apply: true, now: new Date(2026, 9, 26, 19, 30, 5) });
  assert.equal(applied.report.find((item) => item.key === 'claude').moved, true);
  assert.equal(fs.existsSync(claude), false);
});

test('sin --home usa el HOME del entorno (HOME temporal) y deja intacto el real', () => {
  const dir = home('env-home');
  const claude = install(dir, 'claude');
  const result = run(['--apply'], { HOME: dir, USERPROFILE: dir });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(claude), false);
  assert.ok(fs.readdirSync(dir).some((name) => name.startsWith('ailab-skill-backup-')));
  assert.ok(result.stdout.includes(dir));
});
