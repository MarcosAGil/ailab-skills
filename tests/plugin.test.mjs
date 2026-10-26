import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPlugin, diffPlugin, expectedFiles, expectedRootFiles } from '../tools/build-plugin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins', 'ailab');
const LONG_DASH = String.fromCharCode(0x2014);
const read = (...parts) => JSON.parse(fs.readFileSync(path.join(ROOT, ...parts), 'utf8'));
const skillVersion = read('skills', 'ailab', 'package.json').version;

function png(file) {
  const data = fs.readFileSync(file);
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file + ' no es PNG');
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

test('plugins/ailab coincide con lo que genera tools/build-plugin.mjs desde skills/ailab', () => {
  assert.deepEqual(diffPlugin(), []);
  const check = spawnSync(process.execPath, ['tools/build-plugin.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
});

test('la prueba de sincronia falla si la copia del plugin se desincroniza de skills/ailab', (t) => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-plugin-sync-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const plugin = path.join(temporary, 'plugins', 'ailab');
  fs.cpSync(path.join(PLUGIN, 'assets'), path.join(plugin, 'assets'), { recursive: true });
  buildPlugin({ plugin, root: temporary });
  assert.deepEqual(diffPlugin({ plugin, root: temporary }), [], 'recien generado no hay diferencias');

  const skill = path.join(plugin, 'skills', 'ailab', 'SKILL.md');
  fs.appendFileSync(skill, '\nEdicion a mano que no existe en skills/ailab.\n');
  assert.match(diffPlugin({ plugin, root: temporary }).join('\n'), /difiere de skills\/ailab: skills\/ailab\/SKILL\.md/);
  buildPlugin({ plugin, root: temporary });
  assert.deepEqual(diffPlugin({ plugin, root: temporary }), [], 'regenerar restaura la copia');

  fs.writeFileSync(path.join(plugin, 'skills', 'ailab', 'scripts', 'extra.mjs'), 'export {};\n');
  assert.match(diffPlugin({ plugin, root: temporary }).join('\n'), /sobra en el plugin: skills\/ailab\/scripts\/extra\.mjs/);
  buildPlugin({ plugin, root: temporary });
  fs.rmSync(path.join(plugin, 'skills', 'ailab', 'catalog', 'catalog.json'));
  assert.match(diffPlugin({ plugin, root: temporary }).join('\n'), /falta en el plugin: skills\/ailab\/catalog\/catalog\.json/);
  buildPlugin({ plugin, root: temporary });
  fs.appendFileSync(path.join(plugin, '.claude-plugin', 'plugin.json'), ' ');
  assert.match(diffPlugin({ plugin, root: temporary }).join('\n'), /difiere de skills\/ailab: \.claude-plugin\/plugin\.json/);

  // Una version distinta en skills/ailab que el plugin no ha regenerado tambien se detecta.
  const source = path.join(temporary, 'source');
  fs.cpSync(path.join(ROOT, 'skills', 'ailab'), source, { recursive: true });
  buildPlugin({ plugin, root: temporary });
  const pkgFile = path.join(source, 'package.json');
  fs.writeFileSync(pkgFile, fs.readFileSync(pkgFile, 'utf8').replace(skillVersion, '9.9.9'));
  assert.match(diffPlugin({ plugin, root: temporary, source }).join('\n'), /difiere de skills\/ailab/);
});

test('los manifiestos de Claude Code y Codex describen el mismo plugin, con la version de la skill', () => {
  const claude = read('plugins', 'ailab', '.claude-plugin', 'plugin.json');
  const codex = read('plugins', 'ailab', 'plugin.json');
  assert.equal(claude.name, 'ailab');
  assert.equal(codex.name, 'ailab');
  assert.equal(claude.version, skillVersion);
  assert.equal(codex.version, skillVersion);
  assert.equal(read('registry.json').skills.find((skill) => skill.id === 'ailab').version, skillVersion);
  assert.ok(!/^claude-/.test(claude.name) && !/(^|[^a-z])claude([^a-z]|$)/i.test(claude.name), 'el nombre no puede llevar "claude"');
  assert.equal(claude.displayName, 'AILAB');
  assert.equal(claude.license, 'MIT');
  assert.equal(codex.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.deepEqual(Object.keys(codex).filter((key) => !['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'].includes(key)), [], 'el esquema portable no admite otros campos');
  const face = codex.extensions['com.openai.interface'];
  for (const key of ['displayName', 'shortDescription', 'longDescription', 'developerName', 'category', 'capabilities', 'websiteURL', 'privacyPolicyURL', 'termsOfServiceURL', 'defaultPrompt', 'brandColor', 'composerIcon', 'logo', 'screenshots']) assert.ok(key in face, key);
  assert.equal(face.brandColor, '#16B2FF');
  assert.equal(face.displayName, 'AILAB');
  assert.ok(face.defaultPrompt.includes('Prepara una imagen con AILAB, muéstrame el coste y espera mi confirmación antes de gastar'));
  for (const url of [face.websiteURL, face.privacyPolicyURL, face.termsOfServiceURL, claude.homepage, claude.repository]) assert.match(url, /^https:\/\//);
  assert.deepEqual(png(path.join(PLUGIN, face.logo)), { width: 512, height: 512 });
  assert.deepEqual(png(path.join(PLUGIN, face.composerIcon)).width, png(path.join(PLUGIN, face.composerIcon)).height);
  assert.deepEqual(png(path.join(PLUGIN, claude.icon)), { width: 512, height: 512 });
  for (const file of ['.claude-plugin/plugin.json', 'plugin.json']) assert.equal(fs.readFileSync(path.join(PLUGIN, file), 'utf8').includes(LONG_DASH), false, file);
  for (const forbidden of ['bin', 'hooks', 'hooks.json', 'settings.json', '.mcp.json']) assert.equal(fs.existsSync(path.join(PLUGIN, forbidden)), false, forbidden + ' no debe existir');
  assert.deepEqual(fs.readdirSync(path.join(PLUGIN, 'skills')), ['ailab'], 'el plugin contiene unicamente la skill ailab');
});

test('los marketplaces de Claude Code y Codex apuntan al plugin y no repiten la version', () => {
  const claude = read('.claude-plugin', 'marketplace.json');
  const codex = read('.agents', 'plugins', 'marketplace.json');
  assert.equal(claude.name, 'ailendra-labs');
  assert.equal(codex.name, 'ailendra-labs');
  assert.equal(claude.plugins.length, 1);
  assert.equal(codex.plugins.length, 1);
  const manifest = read('plugins', 'ailab', '.claude-plugin', 'plugin.json');
  assert.equal(claude.plugins[0].name, manifest.name);
  assert.equal(codex.plugins[0].name, manifest.name);
  assert.equal(claude.plugins[0].source, './plugins/ailab');
  assert.deepEqual(codex.plugins[0].source, { source: 'local', path: './plugins/ailab' });
  assert.equal('version' in claude.plugins[0], false, 'la version solo va en plugin.json');
  assert.deepEqual(codex.plugins[0].policy, { installation: 'AVAILABLE', authentication: 'ON_INSTALL' });
  assert.equal(codex.interface.displayName, 'Ailendra Labs');
  assert.ok(fs.existsSync(path.join(ROOT, claude.plugins[0].source, '.claude-plugin', 'plugin.json')));
  for (const [file, expected] of expectedRootFiles()) assert.deepEqual(fs.readFileSync(path.join(ROOT, file)), expected, file);
});

test('el marketplace de la web (marketplace.json de la raiz) no se ha tocado y no lista el plugin', () => {
  const web = read('marketplace.json');
  assert.equal(web.schema_version, 1);
  assert.deepEqual(web.skills.map((skill) => skill.id).sort(), read('registry.json').skills.map((skill) => skill.id).sort());
  assert.equal(JSON.stringify(web).includes('ailendra-labs'), false);
  assert.equal('plugins' in web, false);
});

test('la skill del plugin conserva rutas portables, reglas criticas y la guia actualizada', () => {
  const skill = fs.readFileSync(path.join(PLUGIN, 'skills', 'ailab', 'SKILL.md'), 'utf8');
  assert.match(skill, /^---\nname: ailab\n/);
  assert.match(skill, /node <skill-dir>\/scripts\/ailab\.mjs <comando>/);
  assert.match(skill, /ailab\.mjs guide/);
  assert.match(skill, /Solo se gastan créditos por una petición directa del usuario en el chat/);
  assert.match(skill, /Nunca pidas contraseñas, cookies o tokens en el chat/);
  assert.match(skill, /No llames directamente a proveedores ni inventes endpoints o parámetros/);
  assert.equal(skill.includes(LONG_DASH), false);
  assert.equal(skill.includes('${CLAUDE_PLUGIN_ROOT}'), false, 'esa variable no existe en los comandos Bash del agente');
  const files = expectedFiles();
  for (const required of ['skills/ailab/scripts/ailab.mjs', 'skills/ailab/scripts/pg.mjs', 'skills/ailab/scripts/lib/updater.mjs', 'skills/ailab/catalog/catalog.json', 'skills/ailab/agents/openai.yaml']) assert.ok(files.has(required), required);
});

test('el arranque del plugin ejecuta help, guide y doctor sin sesion con HOME y estado temporales', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-plugin-run-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const entry = path.join(PLUGIN, 'skills', 'ailab', 'scripts', 'ailab.mjs');
  const env = { PATH: process.env.PATH, HOME: home, USERPROFILE: home, AILAB_CONFIG_DIR: path.join(home, 'cfg'), AILAB_CREDENTIALS_DIR: path.join(home, 'cred'),
    AILAB_OUTPUT_DIR: path.join(home, 'out'), AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: path.join(PLUGIN, 'skills', 'ailab', 'catalog', 'catalog.json'), AILAB_BASE_URL: 'http://127.0.0.1:1/' };
  const run = (args) => spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8', env, cwd: home, timeout: 60000 });
  const help = run(['help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, new RegExp('AILAB CLI v' + skillVersion.replaceAll('.', '\\.')));
  const guide = run(['guide']);
  assert.equal(guide.status, 0, guide.stderr);
  assert.match(guide.stdout, new RegExp('runtime ' + skillVersion.replaceAll('.', '\\.')));
  assert.match(guide.stdout, /GUÍA DE USO DE AILAB/);
  const doctor = run(['doctor']);
  assert.equal(doctor.status, 1, 'sin token doctor falla y pide login');
  assert.match(doctor.stdout, /no hay sesión/);
  assert.ok(doctor.stdout.includes(entry + ' login'));
  assert.match(doctor.stdout, /no se ha gastado nada/);
  assert.equal(fs.existsSync(path.join(home, 'cred', 'token')), false);
  assert.equal(fs.existsSync(path.join(home, 'cfg', 'runtime', 'current.json')), false, 'AILAB_SKIP_UPDATE no instala runtimes');
});
