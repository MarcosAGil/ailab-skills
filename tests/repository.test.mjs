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
  assert.deepEqual(result.registry.skills.map((skill) => skill.id), ['ailab', 'vervideo']);
  assert.ok(result.results[0].files > 10);
  assert.equal(result.results.find((skill) => skill.id === 'vervideo').files, 3);
});

test('el instalador copia y verifica vervideo sin red ni API key', (t) => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'vervideo-skill-test-'));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  const installed = spawnSync(process.execPath, ['tools/install.mjs', 'vervideo', '--dir', destination], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
    timeout: 30000,
  });
  assert.equal(installed.status, 0, installed.stderr || installed.stdout);
  assert.match(installed.stdout, /Instalada vervideo 1\.0\.0/);
  assert.ok(fs.existsSync(path.join(destination, 'vervideo', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(destination, 'vervideo', 'scripts', 'vervideo.py')));
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
  assert.match(installed.stdout, /Instalada ailab 2\.2\.0/);
  assert.ok(fs.existsSync(path.join(destination, 'ailab', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(destination, 'ailab', 'scripts', 'ailab.mjs')));
});

test('la skill empaquetada supera su autodiagnóstico sin red de actualización', () => {
  const checked = spawnSync(process.execPath, ['skills/ailab/scripts/ailab.mjs', 'self-test'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      AILAB_SKIP_UPDATE: '1',
      AILAB_CATALOG_PATH: path.join(ROOT, 'skills', 'ailab', 'catalog', 'catalog.json'),
    },
    timeout: 30000,
  });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.match(checked.stdout, /SELF_TEST_OK 2\.2\.0 · 53 modelos/);
});

test('Seedance conserva 20.000 caracteres en 2.0 y admite 30.000 en 2.5', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'ailab', 'catalog', 'catalog.json'), 'utf8'));
  assert.equal(catalog.catalog_version, '1.9.0');
  assert.equal(catalog.models['seedance-2'].params.prompt.max_len, 20000);
  assert.equal(catalog.models['seedance-2-5'].params.prompt.max_len, 30000);
  assert.match(catalog.models['seedance-2-5'].params.aspect_ratio.help, /adaptive/i);
});

test('FLUX Video Upscale exige un tramo medido y documenta ffprobe', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills', 'ailab', 'catalog', 'catalog.json'), 'utf8'));
  const model = catalog.models['flux-video-upscale'];
  assert.ok(model);
  assert.equal(model.params.output_resolution.required, true);
  assert.equal(model.params.output_resolution.default, undefined);
  const instructions = fs.readFileSync(path.join(ROOT, 'skills', 'ailab', 'SKILL.md'), 'utf8');
  assert.match(instructions, /flux-video-upscale/);
  assert.match(instructions, /ffprobe/);
  assert.match(instructions, /hasta 1920 px/);
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
  const archive = path.join(destination, 'ailab-skill-v2.2.0-beta.zip');
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

test('el paquete de vervideo es reproducible, autocontenido y no contiene secretos', (t) => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'vervideo-package-test-'));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  const build = () => spawnSync(process.execPath, ['tools/package.mjs', 'vervideo'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AILAB_DIST_DIR: destination },
    timeout: 30000,
  });
  const first = build();
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const archive = path.join(destination, 'vervideo-skill-v1.0.0-beta.zip');
  const firstBytes = fs.readFileSync(archive);
  const second = build();
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.deepEqual(fs.readFileSync(archive), firstBytes);

  const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  const entries = listing.stdout.trim().split('\n');
  assert.deepEqual(entries, [
    'vervideo/SKILL.md',
    'vervideo/package.json',
    'vervideo/scripts/vervideo.py',
  ]);

  const strings = spawnSync('unzip', ['-p', archive], { encoding: 'utf8' });
  assert.equal(strings.status, 0, strings.stderr);
  assert.doesNotMatch(strings.stdout, /OPENROUTER_API_KEY=(?:sk-or-v1-|sk-)[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(strings.stdout, /\/Users\/marcosa\.martinez/);
  assert.doesNotMatch(strings.stdout, /\.config\/openrouter\/\.env\n[^\n]*sk-/);
});
