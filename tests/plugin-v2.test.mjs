import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SPECS, buildPlugin, diffPlugin, expectedFiles } from '../tools/build-plugin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V1 = SPECS.ailab;
const V2 = SPECS['ailab-v2'];
const PLUGIN = path.join(ROOT, 'plugins', 'ailab-v2');
const LONG_DASH = String.fromCharCode(0x2014);
const read = (...parts) => JSON.parse(fs.readFileSync(path.join(ROOT, ...parts), 'utf8'));
const text = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');
const version = read('skills', 'ailab-v2', 'package.json').version;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? walk(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]);
}

test('plugins/ailab-v2 coincide con lo que genera tools/build-plugin.mjs desde skills/ailab-v2', (t) => {
  assert.deepEqual(diffPlugin({ spec: V2 }), []);
  assert.deepEqual(diffPlugin({ spec: V1 }), []);
  const check = spawnSync(process.execPath, ['tools/build-plugin.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-v2-sync-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const plugin = path.join(temporary, 'plugins', 'ailab-v2');
  fs.cpSync(path.join(PLUGIN, 'assets'), path.join(plugin, 'assets'), { recursive: true });
  buildPlugin({ spec: V2, plugin, root: temporary });
  assert.deepEqual(diffPlugin({ spec: V2, plugin, root: temporary }), []);
  fs.appendFileSync(path.join(plugin, 'skills', 'ailab-v2', 'SKILL.md'), '\nEdicion a mano.\n');
  assert.match(diffPlugin({ spec: V2, plugin, root: temporary }).join('\n'), /difiere de skills\/ailab-v2: skills\/ailab-v2\/SKILL\.md/);
});

test('generar un plugin no escribe en el otro: cada uno tiene su propia carpeta de skill', () => {
  assert.deepEqual(fs.readdirSync(path.join(PLUGIN, 'skills')), ['ailab-v2']);
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'plugins', 'ailab', 'skills')), ['ailab']);
  for (const relative of expectedFiles({ spec: V2 }).keys()) assert.equal(relative.startsWith('skills/ailab/'), false, relative);
  for (const forbidden of ['bin', 'hooks', 'hooks.json', 'settings.json', '.mcp.json', 'commands', 'agents']) assert.equal(fs.existsSync(path.join(PLUGIN, forbidden)), false, forbidden);
});

test('los manifiestos de ailab-v2 no se pisan con los de ailab y llevan la version de su skill', () => {
  const claude = read('plugins', 'ailab-v2', '.claude-plugin', 'plugin.json');
  const codex = read('plugins', 'ailab-v2', 'plugin.json');
  const v1 = read('plugins', 'ailab', '.claude-plugin', 'plugin.json');
  assert.equal(claude.name, 'ailab-v2');
  assert.equal(codex.name, 'ailab-v2');
  assert.notEqual(claude.name, v1.name);
  assert.equal(claude.displayName, 'AILAB V2');
  assert.equal(codex.extensions['com.openai'].interface.displayName, 'AILAB V2');
  assert.equal(claude.version, version);
  assert.equal(codex.version, version);
  assert.equal(claude.homepage, 'https://ailab.ailendra.com/');
  assert.equal(claude.homepage, V2.website);
  assert.equal(claude.license, 'MIT');
  assert.ok(!/(^|[^a-z])claude([^a-z]|$)/i.test(claude.name));
  for (const prompt of codex.extensions['com.openai'].interface.defaultPrompt) assert.match(prompt, /AILAB V2/);
  for (const file of ['.claude-plugin/plugin.json', 'plugin.json']) assert.equal(text('plugins', 'ailab-v2', file).includes(LONG_DASH), false, file);
});

test('el marketplace lista ailab-v2 con su descripcion y no cambia la entrada de ailab', () => {
  const claude = read('.claude-plugin', 'marketplace.json');
  const entry = claude.plugins.find((plugin) => plugin.name === 'ailab-v2');
  assert.equal(entry.source, './plugins/ailab-v2');
  assert.equal(entry.homepage, 'https://ailab.ailendra.com/');
  assert.match(entry.description, /AILAB V2/);
  assert.match(entry.description, /plugin ailab/);
  assert.equal('version' in entry, false);
  assert.deepEqual(claude.plugins.find((plugin) => plugin.name === 'ailab'), {
    name: 'ailab',
    source: './plugins/ailab',
    description: 'Genera imagen, vídeo, voz, audio, música y más con AILAB desde Claude Code o Codex, con tu cuenta y tus créditos. Los modelos, los precios y las mejoras llegan solos desde el servidor.',
    category: 'creativity',
    homepage: 'https://ailendra.com/ailab/',
  });
});

test('la web de AILAB no ve ailab-v2: ni registry.json ni marketplace.json la listan', () => {
  assert.equal(read('registry.json').skills.some((skill) => skill.id === 'ailab-v2'), false);
  assert.equal(read('marketplace.json').skills.some((skill) => skill.id === 'ailab-v2'), false);
  assert.equal(JSON.stringify(read('marketplace.json')).includes('ailab-v2'), false);
});

test('las dos skills no chocan: nombre, descripcion, estado, credencial y variables', () => {
  const v1 = text('skills', 'ailab', 'SKILL.md');
  const v2 = text('skills', 'ailab-v2', 'SKILL.md');
  assert.match(v1, /^---\nname: ailab\n/);
  assert.match(v2, /^---\nname: ailab-v2\n/);
  const description = v2.match(/^description: >-\n([\s\S]*?)\n---\n/m)[1];
  assert.match(description, /AILAB V2/);
  assert.match(description, /ailab\.ailendra\.com/);
  assert.match(description, /ailendra\.com\/ailab/);
  assert.match(description, /usa la skill ailab/);
  assert.match(v2, /no mezcles credenciales ni comandos/);

  const config = text('skills', 'ailab-v2', 'scripts', 'lib', 'config.mjs');
  assert.match(config, /'\.config', 'ailab-v2'/);
  assert.match(config, /AILAB_V2_HOME/);
  const state = path.join('.config', 'ailab-v2');
  assert.notEqual(state, path.join('.config', 'ailab'));
  assert.notEqual(state, path.join('.config', 'ailendra'));

  // Ninguna variable de entorno ni carpeta de la skill ailab se lee desde ailab-v2.
  const code = walk(path.join(ROOT, 'skills', 'ailab-v2', 'scripts')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.equal(/process\.env\.(?:AILAB|PG)_/.test(code), false, 'no lee variables de la skill ailab');
  assert.equal(/'\.config', 'ailab'\b|'\.config', 'ailendra'|\.config\/ailab['"/]|\.config\/ailendra/.test(code.replace(/^\s*\/\/.*$/gm, '')), false);
  for (const reference of walk(path.join(ROOT, 'skills', 'ailab-v2', 'references'))) {
    assert.equal(/\.config\/ailab(?!-v2)/.test(fs.readFileSync(reference, 'utf8')), false, reference);
  }
});

test('la skill de ailab-v2 funciona sola: help, version y self-test sin red ni estado', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-v2-run-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const entry = path.join(PLUGIN, 'skills', 'ailab-v2', 'scripts', 'ailab.mjs');
  const run = (...args) => spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8', env: { PATH: process.env.PATH, HOME: home, USERPROFILE: home }, cwd: home, timeout: 60000 });
  assert.match(run('help').stdout, new RegExp('AILAB V2 \\(plugin ' + version.replaceAll('.', '\\.') + '\\)'));
  assert.equal(run('self-test').stdout.trim(), 'SELF_TEST_OK ' + version);
  assert.deepEqual(fs.readdirSync(home), [], 'no escribe nada al arrancar');
});

test('si alguien instala los dos plugins, sus skills se llaman distinto y las copias generadas son independientes', () => {
  const names = [];
  for (const plugin of ['ailab', 'ailab-v2']) {
    for (const skill of fs.readdirSync(path.join(ROOT, 'plugins', plugin, 'skills'))) {
      const md = text('plugins', plugin, 'skills', skill, 'SKILL.md');
      names.push(md.match(/^name: (.+)$/m)[1]);
    }
  }
  assert.deepEqual(names, ['ailab', 'ailab-v2']);
  assert.equal(new Set(names).size, 2);
  for (const relative of walk(PLUGIN)) assert.equal(path.relative(path.join(ROOT, 'plugins', 'ailab'), relative).startsWith('..'), true);
});
