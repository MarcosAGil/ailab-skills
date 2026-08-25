import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateRepository } from '../tools/validate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('el registro público y todas las skills son válidos', () => {
  const result = validateRepository();
  assert.equal(result.registry.schema_version, 1);
  assert.deepEqual(result.registry.skills.map((skill) => skill.id), ['ailab']);
  assert.ok(result.results[0].files > 10);
});

test('el instalador copia y verifica AILAB de forma aislada', (t) => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-skills-test-'));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  const installed = spawnSync(process.execPath, ['tools/install.mjs', 'ailab', '--dir', destination], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.equal(installed.status, 0, installed.stderr || installed.stdout);
  assert.match(installed.stdout, /Instalada ailab 2\.1\.4/);
  assert.ok(fs.existsSync(path.join(destination, 'ailab', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(destination, 'ailab', 'scripts', 'ailab.mjs')));
});

test('la skill empaquetada supera su autodiagnóstico sin red de actualización', () => {
  const checked = spawnSync(process.execPath, ['skills/ailab/scripts/ailab.mjs', 'self-test'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AILAB_SKIP_UPDATE: '1' },
    timeout: 30000,
  });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.match(checked.stdout, /SELF_TEST_OK 2\.1\.3 · 47 modelos/);
});

test('el paquete es reproducible y contiene una única carpeta raíz', (t) => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-package-test-'));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  const build = () => spawnSync(process.execPath, ['tools/package.mjs', 'ailab'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AILAB_DIST_DIR: destination },
    timeout: 30000,
  });
  const first = build();
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const archive = path.join(destination, 'ailab-skill-v2.1.4-beta.zip');
  const firstBytes = fs.readFileSync(archive);
  const second = build();
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.deepEqual(fs.readFileSync(archive), firstBytes);
  const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  const entries = listing.stdout.trim().split('\n');
  assert.ok(entries.length > 10);
  assert.ok(entries.every((entry) => entry.startsWith('ailab/')));
  assert.ok(entries.includes('ailab/SKILL.md'));
});
