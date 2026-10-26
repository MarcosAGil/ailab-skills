import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'ailab');
const LONG_DASH = String.fromCharCode(0x2014);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-environment-'));
test.after(() => { try { fs.chmodSync(path.join(temporary, 'readonly'), 0o700); } catch {} fs.rmSync(temporary, { recursive: true, force: true }); });

function sandbox(name) {
  const home = path.join(temporary, name);
  fs.mkdirSync(home, { recursive: true });
  return { home, config: path.join(home, 'cfg'), credentials: path.join(home, 'cred'), output: path.join(home, 'out') };
}

function baseEnv(box, extra = {}) {
  return {
    PATH: process.env.PATH, HOME: box.home, USERPROFILE: box.home,
    AILAB_CONFIG_DIR: box.config, AILAB_CREDENTIALS_DIR: box.credentials, AILAB_OUTPUT_DIR: box.output,
    AILAB_SKIP_UPDATE: '1', AILAB_UPDATE_TIMEOUT_MS: '2000',
    ...extra,
  };
}

function cli(box, args, extra = {}, entry = path.join(SKILL, 'scripts', 'ailab.mjs')) {
  return spawnSync(process.execPath, [entry, ...args], { encoding: 'utf8', timeout: 60000, env: baseEnv(box, extra), cwd: box.home });
}

test('guide devuelve la guia con las reglas criticas sin sesion, sin red y sin rayas largas', () => {
  const box = sandbox('guide');
  const result = cli(box, ['guide'], { AILAB_BASE_URL: 'http://127.0.0.1:1/' });
  assert.equal(result.status, 0, result.stderr);
  const text = result.stdout;
  for (const rule of [/REGLAS CRÍTICAS/, /Solo se gastan créditos por una petición directa/, /No inventes/, /Recuperar, no repetir/, /`status <task_id>`/,
    /`login`/, /`doctor`/, /`models`/, /`info <modelo>`/, /`prepare </, /`submit </, /`assistants`/, /VOCES/, /nunca va dentro del proyecto/, /Guardado en:/]) {
    assert.match(text, rule);
  }
  assert.ok(text.includes(path.join(SKILL, 'scripts', 'ailab.mjs')), 'los comandos usan la ruta real del arranque');
  assert.equal(text.includes(LONG_DASH), false);
  assert.ok(Buffer.byteLength(text) < 12000, 'la guia debe ser breve');
  assert.equal(fs.existsSync(box.config), false, 'guide no escribe estado');
  assert.match(cli(box, ['help']).stdout, /Guia actualizada de uso y reglas criticas: guide/);
});

test('SKILL.md conserva las reglas criticas, las rutas portables y la referencia a guide', () => {
  const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
  assert.match(skill, /node <skill-dir>\/scripts\/ailab\.mjs <comando>/);
  assert.match(skill, /ailab\.mjs guide/);
  assert.match(skill, /Solo se gastan créditos por una petición directa/);
  assert.match(skill, /Nunca pidas contraseñas, cookies o tokens en el chat/);
  assert.match(skill, /No llames directamente a proveedores ni inventes endpoints o parámetros/);
  assert.match(skill, /`status <task_id>`|status <task_id>/);
  assert.match(skill, /no guardes el token en el proyecto/);
  assert.equal(skill.includes(LONG_DASH), false);
});

test('Seed Audio presupuesta la reserva maxima de 100 cr y conserva estimated_duration_seconds', async () => {
  const { estimateCredits, validateParams, validateCatalogShape } = await import('../skills/ailab/scripts/lib/catalog.mjs');
  const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(path.join(SKILL, 'catalog', 'catalog.json'), 'utf8')));
  const model = catalog.models['seed-audio'];
  assert.deepEqual({ ...model.estimate, note: undefined }, { kind: 'flat_credits', credits: 100, approximate: true, note: undefined });
  assert.equal(model.estimate.note, 'reserva maxima: la duracion la decide el modelo y no se puede fijar. Se cobra la duracion real a 0,625 cr/s (10 s = 7 cr, 1 min = 38 cr) y nunca mas de 100 cr. estimated_duration_seconds no cambia ni la duracion ni la reserva.');
  assert.equal(model.params.estimated_duration_seconds.default, 60);
  for (const seconds of [1, 5, 60, 160]) {
    const valid = validateParams(model, { prompt: 'voz cercana', estimated_duration_seconds: seconds });
    assert.equal(valid.ok, true, valid.errors?.join('\n'));
    const estimate = estimateCredits(model, { ...valid.params, ...valid.fileParams });
    assert.equal(estimate.credits, 100, 'la reserva no depende de estimated_duration_seconds');
    assert.equal(estimate.approximate, true);
  }
  assert.equal(Math.ceil(10 * 0.625), 7);
  assert.equal(Math.ceil(60 * 0.625), 38);
});

test('doctor sin token pide login con la ruta real, no llama al servidor y no gasta', async (t) => {
  const box = sandbox('doctor');
  const requests = [];
  const server = http.createServer((req, res) => { requests.push(req.method + ' ' + req.url); res.statusCode = 500; res.end('{}'); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const env = baseEnv(box, { AILAB_BASE_URL: `http://127.0.0.1:${server.address().port}/`, AILAB_CATALOG_PATH: path.join(SKILL, 'catalog', 'catalog.json') });
  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(SKILL, 'scripts', 'ailab.mjs'), 'doctor'], { env, cwd: box.home });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /FALLO · Autenticacion: no hay sesión/);
  assert.ok(result.stdout.includes('node ' + path.join(SKILL, 'scripts', 'ailab.mjs') + ' login'));
  assert.match(result.stdout, /no se ha gastado nada/);
  assert.deepEqual(requests, [], 'sin token no hay ninguna peticion al servidor');
  assert.equal(result.stdout.includes(LONG_DASH), false);
});

test('red bloqueada: con el sandbox de Codex indica el ajuste exacto; sin el, un mensaje de red generico', () => {
  const box = sandbox('network');
  fs.mkdirSync(box.credentials, { recursive: true });
  fs.writeFileSync(path.join(box.credentials, 'token'), 'ailp_' + 'a'.repeat(48) + '\n');
  const closed = { AILAB_BASE_URL: 'http://127.0.0.1:1/', AILAB_ALLOW_COOKIE_AUTH: '0' };
  const codex = cli(box, ['balance'], { ...closed, CODEX_SANDBOX: 'seatbelt', CODEX_SANDBOX_NETWORK_DISABLED: '1' });
  assert.equal(codex.status, 1);
  const output = codex.stdout + codex.stderr;
  assert.match(output, /sandbox de Codex/);
  assert.match(output, /\[sandbox_workspace_write\]/);
  assert.match(output, /network_access = true/);
  assert.match(output, /codex -c sandbox_workspace_write\.network_access=true/);
  assert.equal(output.includes(LONG_DASH), false);
  assert.doesNotMatch(output, /at .*\.mjs:\d+/, 'sin trazas de pila');
  const plain = cli(box, ['balance'], closed);
  assert.equal(plain.status, 1);
  assert.match(plain.stdout + plain.stderr, /No hay conexión con AILAB/);
  assert.doesNotMatch(plain.stdout + plain.stderr, /sandbox_workspace_write/);
});

test('carpeta de estado sin permisos: explica el ajuste de escritura y nunca escribe el token en el proyecto',
  { skip: process.platform === 'win32' || (typeof process.getuid === 'function' && process.getuid() === 0) }, () => {
    const box = sandbox('readonly-parent');
    const readonly = path.join(temporary, 'readonly');
    fs.mkdirSync(readonly, { mode: 0o500 });
    fs.chmodSync(readonly, 0o500);
    const project = path.join(box.home, 'proyecto');
    fs.mkdirSync(project);
    const blocked = { ...box, config: path.join(readonly, 'ailab'), credentials: path.join(readonly, 'cred'), output: path.join(readonly, 'out') };
    const before = fs.readdirSync(project);
    for (const extra of [{}, { CODEX_SANDBOX: 'seatbelt', CODEX_SANDBOX_NETWORK_DISABLED: '1' }]) {
      // models necesita la carpeta de estado y no la red: es el fallo de escritura puro.
      const result = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'ailab.mjs'), 'models'], { encoding: 'utf8', env: baseEnv(blocked, extra), cwd: project, timeout: 60000 });
      assert.equal(result.status, 1, result.stdout + result.stderr);
      const output = result.stdout + result.stderr;
      assert.match(output, /AILAB no puede escribir en /);
      assert.ok(output.includes(blocked.config), 'indica la carpeta exacta');
      assert.doesNotMatch(output, /at .*\.mjs:\d+/, 'sin trazas de pila');
      if (extra.CODEX_SANDBOX) {
        assert.match(output, /writable_roots = \[/);
        assert.ok(output.includes('--add-dir ' + blocked.config));
      } else assert.match(output, /Da permiso de escritura a /);
    }
    assert.deepEqual(fs.readdirSync(project), before, 'no se escribe nada en el proyecto');
  });

test('bootstrapInfo deduce la version del arranque 1.0.0 desde argv y clasifica la ubicacion', async () => {
  const { bootstrapInfo, environmentNotices, semverLess, INSTALL_GUIDE_URL } = await import('../skills/ailab/scripts/lib/environment.mjs');
  assert.equal(INSTALL_GUIDE_URL, 'https://github.com/MarcosAGil/ailab-skills/blob/main/docs/instalacion-plugin.md');
  const home = path.join(temporary, 'info-home');
  const legacy = path.join(home, '.claude', 'skills', 'ailab');
  fs.cpSync(path.join(ROOT, 'tests', 'fixtures', 'bootstrap-1.0.0'), legacy, { recursive: true });
  fs.writeFileSync(path.join(legacy, 'SKILL.md'), '---\nname: ailab\ndescription: x\n---\n');
  const info = bootstrapInfo({ env: {}, argv1: path.join(legacy, 'scripts', 'ailab.mjs'), home });
  assert.equal(info.version, '1.0.0');
  assert.equal(info.kind, 'manual-claude');
  assert.equal(bootstrapInfo({ env: { AILAB_BOOTSTRAP_VERSION: '1.1.0', AILAB_BOOTSTRAP_DIR: legacy }, argv1: '/otro/pg.mjs', home }).version, '1.1.0');
  assert.equal(bootstrapInfo({ env: {}, argv1: '/x/y/pg.mjs', home }).dir, null);
  assert.equal(semverLess('1.0.0', '1.1.0'), true);
  assert.equal(semverLess('1.1.0', '1.1.0'), false);
  assert.equal(semverLess('1.10.0', '1.2.0'), false);
  const notices = environmentNotices({ env: {}, home, info });
  assert.deepEqual(notices.map((notice) => notice.id), ['minimum_bootstrap']);
  // Skill manual: no se le manda "actualizar el plugin" (no tiene plugin), se le dice que existe y se le da la guia.
  assert.match(notices[0].text, /AILAB ya está disponible como plugin/);
  assert.match(notices[0].text, /solo se actualiza sola en modelos y precios/);
  assert.ok(notices[0].text.includes(INSTALL_GUIDE_URL));
  assert.doesNotMatch(notices[0].text, /Actualiza el plugin de AILAB|claude plugin update|codex plugin marketplace upgrade/);
  assert.equal(environmentNotices({ env: {}, home, info: { ...info, version: '1.1.0' } }).length, 0);
});

function fakePluginCache(home, agent, version = '2.3.13') {
  const base = agent === 'claude' ? path.join(home, '.claude', 'plugins', 'cache', 'ailendra-labs', 'ailab', version, 'skills', 'ailab')
    : path.join(home, '.codex', 'plugins', 'cache', 'ailendra-labs', 'ailab', version, 'skills', 'ailab');
  fs.cpSync(SKILL, base, { recursive: true });
  return base;
}

test('doble instalacion: avisa desde la skill manual y desde el plugin, y no avisa cuando solo hay una', async () => {
  const { environmentNotices, bootstrapInfo, INSTALL_GUIDE_URL } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const home = path.join(temporary, 'double-home');
  const manual = path.join(home, '.codex', 'skills', 'ailab');
  fs.cpSync(SKILL, manual, { recursive: true });
  const infoManual = bootstrapInfo({ env: { AILAB_BOOTSTRAP_VERSION: '1.1.0', AILAB_BOOTSTRAP_DIR: manual }, home });
  assert.equal(infoManual.kind, 'manual-codex');
  assert.deepEqual(environmentNotices({ env: {}, home, info: infoManual }), [], 'solo la skill manual: sin aviso');

  const claudePlugin = fakePluginCache(home, 'claude');
  const warned = environmentNotices({ env: {}, home, info: infoManual });
  assert.deepEqual(warned.map((notice) => notice.id), ['double_install']);
  assert.ok(warned[0].text.includes(manual) && warned[0].text.includes(claudePlugin));
  assert.ok(warned[0].text.includes(INSTALL_GUIDE_URL), 'la guia con URL absoluta');
  assert.match(warned[0].text, /desde una copia del repositorio, node tools\/migrate-to-plugin\.mjs --apply/);

  const infoPlugin = bootstrapInfo({ env: { AILAB_BOOTSTRAP_VERSION: '1.1.0', AILAB_BOOTSTRAP_DIR: claudePlugin }, home });
  assert.equal(infoPlugin.kind, 'plugin');
  const fromPlugin = environmentNotices({ env: {}, home, info: infoPlugin });
  assert.deepEqual(fromPlugin.map((notice) => notice.id), ['double_install']);
  assert.ok(fromPlugin[0].text.includes(manual));
  assert.ok(fromPlugin[0].text.includes(INSTALL_GUIDE_URL), 'tambien desde el plugin se da la guia con URL absoluta');
  assert.match(fromPlugin[0].text, /desde una copia del repositorio/);

  fs.rmSync(manual, { recursive: true, force: true });
  assert.deepEqual(environmentNotices({ env: {}, home, info: infoPlugin }), [], 'solo el plugin: sin aviso');
  // Tambien se reconoce el plugin de Codex y el registro installed_plugins.json de Claude Code.
  const codexPlugin = fakePluginCache(home, 'codex');
  fs.cpSync(SKILL, manual, { recursive: true });
  fs.mkdirSync(path.join(home, '.claude', 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(home, '.claude', 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins: { 'ailab@ailendra-labs': [{ installPath: path.dirname(path.dirname(path.dirname(claudePlugin))) + '/2.3.13' }] } }));
  const all = environmentNotices({ env: {}, home, info: infoManual })[0].text;
  assert.ok(all.includes(codexPlugin) && all.includes(claudePlugin));
});

test('por la CLI: la skill manual junto al plugin avisa por stderr una vez al dia y siempre en help', () => {
  const box = sandbox('cli-double');
  const manual = path.join(box.home, '.claude', 'skills', 'ailab');
  fs.cpSync(SKILL, manual, { recursive: true });
  fakePluginCache(box.home, 'claude');
  const entry = path.join(manual, 'scripts', 'ailab.mjs');
  const first = cli(box, ['help'], {}, entry);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stderr, /AILAB está instalada dos veces/);
  const second = cli(box, ['help'], {}, entry);
  assert.match(second.stderr, /AILAB está instalada dos veces/, 'help siempre avisa');
  // models consulta el catalogo incluido sin red: el primer comando "normal" avisa y el segundo no.
  const config = { AILAB_CATALOG_PATH: path.join(SKILL, 'catalog', 'catalog.json') };
  const normal = cli(box, ['models'], config, entry);
  assert.match(normal.stderr, /AILAB está instalada dos veces/);
  const again = cli(box, ['models'], config, entry);
  assert.doesNotMatch(again.stderr, /AILAB está instalada dos veces/);
  const silent = cli(box, ['models'], { ...config, AILAB_SKIP_NOTICES: '1' }, entry);
  assert.doesNotMatch(silent.stderr, /dos veces/);
});

test('una actualizacion deja la version anterior en la cache: solo cuenta la mas reciente', async () => {
  const { findPluginInstalls } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const home = path.join(temporary, 'stale-home');
  const stale = fakePluginCache(home, 'claude', '2.3.9');
  const newest = fakePluginCache(home, 'claude', '2.3.13');
  fakePluginCache(home, 'claude', '2.3.10');
  assert.deepEqual(findPluginInstalls({ env: {}, home }).map((item) => item.skillDir), [newest], 'comparacion semver, no alfabetica');
  assert.equal(fs.existsSync(stale), true);
});

test('describeEnvironmentError no confunde un archivo ilegible del usuario con un fallo de la carpeta de estado', async () => {
  const { describeEnvironmentError } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const denied = (target) => Object.assign(new Error('EACCES: permission denied, open ' + target), { code: 'EACCES', path: target, syscall: 'open' });
  assert.equal(describeEnvironmentError(denied('/proyecto/referencia.png'), {}), null, 'fuera del sandbox: se conserva el error original');
  const inSandbox = describeEnvironmentError(denied('/otra/carpeta/salida/x.png'), { CODEX_SANDBOX: 'seatbelt' });
  assert.match(inSandbox, /AILAB no puede escribir en \/otra\/carpeta\/salida\/x\.png/);
  assert.match(inSandbox, /writable_roots = \[.*"\/otra\/carpeta\/salida"/);
  assert.equal(describeEnvironmentError(new Error('otro fallo'), {}), null);
  const wrapped = new Error('No se pudo validar un catalogo fresco: fetch failed', { cause: Object.assign(new Error('fetch failed'), { cause: Object.assign(new Error('getaddrinfo'), { code: 'ENOTFOUND' }) }) });
  assert.match(describeEnvironmentError(wrapped, {}), /No hay conexión con AILAB/);
});

test('aviso de arranque antiguo: la skill manual recibe la guia; el plugin antiguo conserva los comandos exactos', async () => {
  const { environmentNotices, bootstrapInfo, INSTALL_GUIDE_URL } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const home = path.join(temporary, 'old-notice-home');
  const manualClaude = path.join(home, '.claude', 'skills', 'ailab');
  const manualCodex = path.join(home, '.codex', 'skills', 'ailab');
  for (const manual of [manualClaude, manualCodex]) {
    const info = { dir: manual, version: '1.0.0', kind: manual === manualClaude ? 'manual-claude' : 'manual-codex' };
    const [notice] = environmentNotices({ env: {}, home, info });
    assert.equal(notice.id, 'minimum_bootstrap');
    assert.match(notice.text, /AILAB ya está disponible como plugin/);
    assert.match(notice.text, /solo se actualiza sola en modelos y precios/);
    assert.ok(notice.text.includes(INSTALL_GUIDE_URL));
    assert.doesNotMatch(notice.text, /Actualiza el plugin/);
    assert.equal(notice.text.includes(LONG_DASH), false);
  }
  // Una carpeta cualquiera (copia local) tampoco es un plugin: mismo mensaje de migracion.
  assert.match(environmentNotices({ env: {}, home, info: { dir: '/x/ailab', version: '1.0.0', kind: 'other' } })[0].text, /AILAB ya está disponible como plugin/);
  const pluginDir = fakePluginCache(home, 'claude', '2.3.13');
  const pluginInfo = bootstrapInfo({ env: { AILAB_BOOTSTRAP_VERSION: '1.0.0', AILAB_BOOTSTRAP_DIR: pluginDir }, home });
  assert.equal(pluginInfo.kind, 'plugin');
  const [old] = environmentNotices({ env: {}, home, info: pluginInfo });
  assert.equal(old.id, 'minimum_bootstrap');
  assert.match(old.text, /^Actualiza el plugin de AILAB/);
  assert.ok(old.text.includes('claude plugin marketplace update ailendra-labs && claude plugin update ailab@ailendra-labs'));
  assert.ok(old.text.includes('codex plugin marketplace upgrade ailendra-labs'));
  assert.doesNotMatch(old.text, /disponible como plugin/);
});

test('el aviso de skill manual con arranque antiguo sale una sola vez al dia y siempre en help', () => {
  const box = sandbox('cli-old-manual');
  const manual = path.join(box.home, '.claude', 'skills', 'ailab');
  fs.cpSync(SKILL, manual, { recursive: true });
  // pg.mjs es el runtime que el arranque importa: recibe por entorno la version y la carpeta que anunciaria un 1.0.0.
  const entry = path.join(manual, 'scripts', 'pg.mjs');
  const old = { AILAB_BOOTSTRAP_VERSION: '1.0.0', AILAB_BOOTSTRAP_DIR: manual, AILAB_CATALOG_PATH: path.join(SKILL, 'catalog', 'catalog.json') };
  const first = cli(box, ['models'], old, entry);
  assert.match(first.stderr, /AILAB ya está disponible como plugin/);
  assert.ok(first.stderr.includes('https://github.com/MarcosAGil/ailab-skills/blob/main/docs/instalacion-plugin.md'));
  assert.doesNotMatch(first.stderr, /Actualiza el plugin de AILAB/);
  const again = cli(box, ['models'], old, entry);
  assert.doesNotMatch(again.stderr, /disponible como plugin/, 'una vez cada 24 h');
  const help = cli(box, ['help'], old, entry);
  assert.match(help.stderr, /AILAB ya está disponible como plugin/, 'help siempre avisa');
  const current = cli(box, ['help'], { ...old, AILAB_BOOTSTRAP_VERSION: '1.1.0' }, entry);
  assert.doesNotMatch(current.stderr, /disponible como plugin/, 'con el arranque al dia no hay aviso');
});

test('SKILL.md en CRLF (clon de Windows) se reconoce como skill de AILAB en las instalaciones manuales', async () => {
  const { findManualInstalls, skillFrontmatter } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const home = path.join(temporary, 'crlf-home');
  const manual = path.join(home, '.claude', 'skills', 'ailab');
  fs.cpSync(SKILL, manual, { recursive: true });
  const text = fs.readFileSync(path.join(manual, 'SKILL.md'), 'utf8').replace(/\r?\n/g, '\r\n');
  assert.ok(text.includes('\r\n---\r\n'));
  fs.writeFileSync(path.join(manual, 'SKILL.md'), text);
  assert.deepEqual(findManualInstalls({ env: {}, home }).map((item) => item.agent), ['claude']);
  fs.writeFileSync(path.join(manual, 'SKILL.md'), '\uFEFF' + text);
  assert.equal(findManualInstalls({ env: {}, home }).length, 1, 'con BOM tambien');
  fs.writeFileSync(path.join(manual, 'SKILL.md'), text.replace('name: ailab', 'name: otra'));
  assert.equal(findManualInstalls({ env: {}, home }).length, 0, 'otra skill no cuenta');
  assert.equal(skillFrontmatter('---\r\nname: ailab\r\n---\r\n# x'), 'name: ailab');
  assert.equal(skillFrontmatter('---\nname: ailab\n---\n# x'), 'name: ailab');
  assert.equal(skillFrontmatter('# sin frontmatter'), null);
});

test('pathKind respeta CLAUDE_CONFIG_DIR, CODEX_HOME y CLAUDE_CODE_PLUGIN_CACHE_DIR, y reconoce el plugin aunque la variable no llegue', async () => {
  const { pathKind } = await import('../skills/ailab/scripts/lib/environment.mjs');
  const home = path.join(temporary, 'kind-home');
  const claudeDir = path.join(temporary, 'kind-claude');
  const codexDir = path.join(temporary, 'kind-codex');
  const cacheDir = path.join(temporary, 'kind-cache');
  const skillIn = (root) => path.join(root, 'plugins', 'cache', 'ailendra-labs', 'ailab', '2.3.13', 'skills', 'ailab');
  for (const root of [claudeDir, codexDir]) fs.mkdirSync(skillIn(root), { recursive: true });
  fs.mkdirSync(path.join(cacheDir, 'ailendra-labs', 'ailab', '2.3.13', 'skills', 'ailab'), { recursive: true });
  // Con la variable apuntando a otra carpeta.
  assert.equal(pathKind(skillIn(claudeDir), { CLAUDE_CONFIG_DIR: claudeDir }, home), 'plugin');
  assert.equal(pathKind(skillIn(codexDir), { CODEX_HOME: codexDir }, home), 'plugin');
  assert.equal(pathKind(path.join(cacheDir, 'ailendra-labs', 'ailab', '2.3.13', 'skills', 'ailab'), { CLAUDE_CODE_PLUGIN_CACHE_DIR: cacheDir }, home), 'plugin');
  // La skill manual tambien vive bajo la carpeta configurada.
  fs.mkdirSync(path.join(claudeDir, 'skills', 'ailab'), { recursive: true });
  fs.mkdirSync(path.join(codexDir, 'skills', 'ailab'), { recursive: true });
  assert.equal(pathKind(path.join(claudeDir, 'skills', 'ailab'), { CLAUDE_CONFIG_DIR: claudeDir }, home), 'manual-claude');
  assert.equal(pathKind(path.join(codexDir, 'skills', 'ailab'), { CODEX_HOME: codexDir }, home), 'manual-codex');
  // Sin la variable (otra terminal): la estructura plugins/cache/<marketplace>/ailab/<version> basta.
  assert.equal(pathKind(skillIn(claudeDir), {}, home), 'plugin');
  assert.equal(pathKind(skillIn(codexDir), {}, home), 'plugin');
  // Un directorio de plugin con su manifiesto (claude --plugin-dir) tambien es un plugin.
  const dev = path.join(temporary, 'kind-dev');
  fs.mkdirSync(path.join(dev, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(dev, 'skills', 'ailab'), { recursive: true });
  fs.writeFileSync(path.join(dev, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'ailab' }));
  assert.equal(pathKind(path.join(dev, 'skills', 'ailab'), {}, home), 'plugin');
  // Lo demas sigue siendo "otra ubicacion".
  assert.equal(pathKind(path.join(temporary, 'kind-elsewhere', 'ailab'), {}, home), 'other');
  assert.equal(pathKind(path.join(temporary, 'kind-elsewhere', 'plugins', 'cache', 'x', 'otra', '1.0.0', 'skills', 'ailab'), {}, home), 'other');
  assert.equal(pathKind(null, {}, home), 'unknown');
});

test('doctor desde una instalacion del plugin bajo CLAUDE_CONFIG_DIR o CODEX_HOME propios dice "plugin", no "otra ubicación"', () => {
  const box = sandbox('doctor-kind');
  for (const [agent, variable] of [['claude', 'CLAUDE_CONFIG_DIR'], ['codex', 'CODEX_HOME']]) {
    const configHome = path.join(box.home, 'otra-' + agent);
    const skillDir = path.join(configHome, 'plugins', 'cache', 'ailendra-labs', 'ailab', '2.3.13', 'skills', 'ailab');
    fs.cpSync(SKILL, skillDir, { recursive: true });
    const entry = path.join(skillDir, 'scripts', 'ailab.mjs');
    for (const env of [{ [variable]: configHome }, {}]) {
      const result = cli(box, ['doctor'], { ...env, AILAB_BASE_URL: 'http://127.0.0.1:1/', AILAB_CATALOG_PATH: path.join(SKILL, 'catalog', 'catalog.json') }, entry);
      assert.match(result.stdout, /INFO · Arranque: 1\.1\.0 · plugin · /, agent + ' ' + JSON.stringify(Object.keys(env)) + '\n' + result.stdout);
      assert.doesNotMatch(result.stdout, /otra ubicación/);
      assert.doesNotMatch(result.stdout, /AVISO/);
    }
  }
});
