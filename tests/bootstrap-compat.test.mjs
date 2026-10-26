import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Un arranque ya instalado valida stable.json con claves exactas (validateReleaseEnvelope). Estas pruebas
// demuestran que el arranque 1.0.0 congelado (el que tienen instalado los usuarios actuales) sigue
// actualizando a la release 2.3.13 y que el arranque 1.1.0 verifica con la clave vigente o con una de reserva.
// La clave real no se puede usar en un repositorio publico: se sustituye SOLO la clave publica en una copia
// temporal. El mismo envoltorio firmado real (stable.json de AILAB) se contrasta contra el arranque 1.0.0 en
// el repositorio de la plataforma.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'ailab');
const LEGACY = path.join(ROOT, 'tests', 'fixtures', 'bootstrap-1.0.0');
const VERSION = JSON.parse(fs.readFileSync(path.join(SKILL, 'package.json'), 'utf8')).version;
const PRODUCTION_KEY_BODY = 'MCowBQYDK2VwAyEAVjnUJTcIxxRRvRTo83RpaCI7eaPwTg5KIz65p49UZs0=';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-bootstrap-compat-'));
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

function walk(directory, base = directory) {
  const files = [];
  for (const name of fs.readdirSync(directory).sort()) {
    const absolute = path.join(directory, name);
    if (fs.statSync(absolute).isDirectory()) files.push(...walk(absolute, base));
    else files.push(path.relative(base, absolute).split(path.sep).join('/'));
  }
  return files;
}

function keyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return { publicKey, privateKey, pem: publicKey.export({ type: 'spki', format: 'pem' }).trim() };
}

// Copia el arranque y sustituye la clave publica de produccion por la de prueba.
function installBootstrap(source, name, pem) {
  const destination = path.join(temporary, name);
  fs.cpSync(source, destination, { recursive: true });
  const updater = path.join(destination, 'scripts', 'lib', 'updater.mjs');
  const text = fs.readFileSync(updater, 'utf8');
  assert.ok(text.includes(PRODUCTION_KEY_BODY), 'el arranque debe contener la clave publica de produccion');
  fs.writeFileSync(updater, text.replace(/-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAVjnUJTcIxxRRvRTo83RpaCI7eaPwTg5KIz65p49UZs0=\n-----END PUBLIC KEY-----/g, pem));
  return destination;
}

// Release con el codigo real de skills/ailab, sin empaquetar (el arranque acepta cualquier archivo scripts/ o catalog/).
function buildRelease(privateKey, port) {
  const files = [...walk(path.join(SKILL, 'scripts')).map((file) => 'scripts/' + file), 'catalog/catalog.json'];
  const items = files.map((relative) => {
    const data = fs.readFileSync(path.join(SKILL, ...relative.split('/')));
    return { relative, data, entry: { path: relative, url: `http://127.0.0.1:${port}/releases/${VERSION}/${relative}`, sha256: crypto.createHash('sha256').update(data).digest('hex'), size: data.length } };
  });
  const signed = {
    schema_version: 1, channel: 'stable', version: VERSION,
    published_at: new Date().toISOString().replace('.000Z', 'Z'),
    minimum_bootstrap_version: '1.0.0', minimum_supported_runtime: '2.1.0', entry: 'scripts/pg.mjs',
    files: items.map((item) => item.entry),
  };
  const envelope = { signed, signature: crypto.sign(null, Buffer.from(stableStringify(signed)), privateKey).toString('base64') };
  return { envelope, items };
}

async function serve(t, releaseFor) {
  let release = null;
  const server = http.createServer((req, res) => {
    if (req.url === '/stable.json') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(release.envelope)); }
    const match = new RegExp(`^/releases/${VERSION.replaceAll('.', '\\.')}/(.+)$`).exec(req.url);
    const item = match && release.items.find((candidate) => candidate.relative === match[1]);
    if (!item) { res.statusCode = 404; return res.end('no'); }
    res.setHeader('content-type', 'application/octet-stream');
    return res.end(item.data);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;
  release = releaseFor(port);
  return { port, manifest: `http://127.0.0.1:${port}/stable.json` };
}

// Asincrono a proposito: el servidor de la release vive en este mismo proceso y spawnSync lo bloquearia.
function run(bootstrap, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(bootstrap, 'scripts', 'ailab.mjs'), ...args], {
      env: { PATH: process.env.PATH, HOME: env.home, USERPROFILE: env.home, AILAB_CONFIG_DIR: env.config, AILAB_CREDENTIALS_DIR: env.credentials,
        AILAB_RELEASE_MANIFEST_URL: env.manifest, AILAB_UPDATE_DOWNLOAD_DELAY_MS: '0', AILAB_OUTPUT_DIR: path.join(env.home, 'out') },
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('timeout: ' + stdout + stderr)); }, 60000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
  });
}

function sandboxEnv(name, manifest) {
  const home = path.join(temporary, name + '-home');
  fs.mkdirSync(home, { recursive: true });
  return { home, config: path.join(home, 'config'), credentials: path.join(home, 'credentials'), manifest };
}

test('el arranque 1.0.0 congelado actualiza a la release 2.3.13 y el runtime nuevo detecta que su arranque es antiguo', async (t) => {
  const pair = keyPair();
  const legacy = installBootstrap(LEGACY, 'legacy-1.0.0', pair.pem);
  assert.match(fs.readFileSync(path.join(legacy, 'scripts/lib/updater.mjs'), 'utf8'), /BOOTSTRAP_VERSION = '1\.0\.0'/);
  const server = await serve(t, (port) => buildRelease(pair.privateKey, port));
  const env = sandboxEnv('legacy', server.manifest);

  const first = await run(legacy, ['guide'], env);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stderr, new RegExp('actualizado automaticamente a ' + VERSION.replaceAll('.', '\\.')));
  assert.match(first.stdout, new RegExp('GUÍA DE USO DE AILAB · runtime ' + VERSION.replaceAll('.', '\\.')));
  assert.match(first.stdout, /REGLAS CRÍTICAS/);
  // El runtime deduce la version del arranque a partir de process.argv[1] porque el 1.0.0 no la anuncia.
  assert.match(first.stdout + first.stderr, /arranque 1\.0\.0 es anterior al mínimo recomendado 1\.1\.0/);
  // Una skill manual (o una copia local) no tiene plugin que actualizar: se le dice que existe y se le da la guia.
  assert.match(first.stderr, /AILAB ya está disponible como plugin/);
  assert.ok(first.stderr.includes('https://github.com/MarcosAGil/ailab-skills/blob/main/docs/instalacion-plugin.md'));
  assert.doesNotMatch(first.stderr, /Actualiza el plugin de AILAB/);

  const current = JSON.parse(fs.readFileSync(path.join(env.config, 'runtime', 'current.json'), 'utf8'));
  assert.equal(current.version, VERSION);
  const second = await run(legacy, ['help'], env);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, new RegExp('AILAB CLI v' + VERSION.replaceAll('.', '\\.')));
  assert.doesNotMatch(second.stderr, /actualizado automaticamente/);
});

test('el arranque 1.1.0 acepta la release firmada, anuncia su version y no avisa de arranque antiguo', async (t) => {
  const pair = keyPair();
  const bootstrap = installBootstrap(SKILL, 'current-1.1.0', pair.pem);
  const server = await serve(t, (port) => buildRelease(pair.privateKey, port));
  const env = sandboxEnv('current', server.manifest);
  const result = await run(bootstrap, ['guide'], env);
  assert.equal(result.status, 0, result.stderr);
  // Su runtime incluido ya es la 2.3.13: no hay nada que instalar, pero la comprobacion firmada no falla.
  assert.doesNotMatch(result.stderr, /no se pudo comprobar/);
  assert.match(result.stdout, /GUÍA DE USO DE AILAB/);
  assert.ok(result.stdout.includes(path.join(bootstrap, 'scripts', 'ailab.mjs')), 'la guia muestra la ruta real del arranque');
  assert.doesNotMatch(result.stdout + result.stderr, /anterior al mínimo recomendado/);
});

test('el arranque rechaza una release firmada con otra clave y conserva la skill incluida', async (t) => {
  const trusted = keyPair();
  const stranger = keyPair();
  const bootstrap = installBootstrap(SKILL, 'untrusted', trusted.pem);
  const server = await serve(t, (port) => buildRelease(stranger.privateKey, port));
  const env = sandboxEnv('untrusted', server.manifest);
  const result = await run(bootstrap, ['help'], env);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /no se pudo comprobar la actualizacion firmada/);
  assert.equal(fs.existsSync(path.join(env.config, 'runtime', 'current.json')), false);
});

test('la clave de produccion es la unica de confianza y el mecanismo acepta una de reserva sin cambiar stable.json', async () => {
  const updater = await import('../skills/ailab/scripts/lib/updater.mjs');
  assert.equal(updater.BOOTSTRAP_VERSION, '1.1.0');
  assert.deepEqual(updater.UPDATE_PUBLIC_KEYS_PEM, [updater.UPDATE_PUBLIC_KEY_PEM]);
  assert.ok(updater.UPDATE_PUBLIC_KEY_PEM.includes(PRODUCTION_KEY_BODY));
  const primary = keyPair();
  const reserve = keyPair();
  const other = keyPair();
  const { envelope } = buildRelease(reserve.privateKey, 1);
  const options = { manifestUrl: 'http://127.0.0.1:1/stable.json' };
  assert.doesNotThrow(() => updater.validateReleaseEnvelope(envelope, { ...options, publicKey: [primary.pem, reserve.pem] }));
  assert.doesNotThrow(() => updater.validateReleaseEnvelope(envelope, { ...options, publicKey: reserve.pem }));
  assert.throws(() => updater.validateReleaseEnvelope(envelope, { ...options, publicKey: [primary.pem, other.pem] }), /firma de la actualizacion no es valida/);
  assert.throws(() => updater.validateReleaseEnvelope(envelope, options), /firma de la actualizacion no es valida/, 'con las claves de produccion, una firma ajena no pasa');
  // La forma del sobre no cambia: seguir exigiendo claves exactas protege a los arranques ya instalados.
  assert.throws(() => updater.validateReleaseEnvelope({ ...envelope, signatures: [] }, { ...options, publicKey: reserve.pem }), /campo no permitido raiz\.signatures/);
  // Aunque este bien firmado, un campo nuevo dentro de `signed` lo rechaza todo arranque instalado.
  const extended = { ...envelope.signed, minimum_plugin_version: '1.1.0' };
  const extendedEnvelope = { signed: extended, signature: crypto.sign(null, Buffer.from(stableStringify(extended)), reserve.privateKey).toString('base64') };
  assert.throws(() => updater.validateReleaseEnvelope(extendedEnvelope, { ...options, publicKey: reserve.pem }), /campo no permitido signed\.minimum_plugin_version/);
});
