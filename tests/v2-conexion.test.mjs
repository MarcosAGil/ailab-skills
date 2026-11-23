import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { TOKEN, start } from './helpers/fake-ailab-v2.mjs';

const mode = (file) => fs.statSync(file).mode & 0o777;

test('login por código: la credencial queda privada y el token no se enseña nunca', async (t) => {
  const api = await start(t);
  const out = await api.login();
  assert.match(out, /BCDF-GHJK/);
  assert.ok(out.includes(api.origin + '/cuenta/dispositivo'));
  assert.equal(out.includes(TOKEN), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(api.state, 'credential.json'), 'utf8')).token, TOKEN);
  if (process.platform !== 'win32') {
    assert.equal(mode(api.state), 0o700);
    assert.equal(mode(path.join(api.state, 'credential.json')), 0o600);
  }
  assert.equal(fs.existsSync(path.join(api.state, 'login.json')), false);
  for (const command of [['doctor'], ['balance'], ['login', '--origen', api.origin]]) assert.equal((await api.ok(command)).includes(TOKEN), false);
  for (const call of api.calls) assert.equal(call.headers.cookie, undefined);
});

test('con la carpeta de usuario versionada (dotfiles), git no ve la credencial', async (t) => {
  const api = await start(t);
  const git = (...args) => spawnSync('git', ['-C', api.home, '-c', 'core.excludesFile=', '-c', 'core.hooksPath=', ...args], {
    encoding: 'utf8', env: { PATH: process.env.PATH, HOME: api.home, GIT_CONFIG_NOSYSTEM: '1' },
  });
  if (git('init', '-q').status !== 0) return t.skip('sin git');
  await api.login();
  assert.equal(git('status', '--porcelain', '--untracked-files=all').stdout, '');
});

test('un login cortado se retoma con el mismo código', async (t) => {
  const api = await start(t);
  api.approval = 'pending';
  api.once((call) => call.url.pathname.endsWith('/auth/devices/token'), () => api.error(400, 'bad_request'));
  await api.fails(['login', '--origen', api.origin]);
  api.approval = 'approved';
  await api.login();
  assert.equal(api.calls.filter((call) => call.url.pathname.endsWith('/auth/devices/start')).length, 1);
});

test('rechazado o caducado: no guarda credencial', async (t) => {
  const api = await start(t);
  for (const approval of ['denied', 'expired']) {
    api.approval = approval;
    assert.match(await api.fails(['login', '--origen', api.origin]), /rechazado|caducado/);
    assert.equal(fs.existsSync(path.join(api.state, 'credential.json')), false);
  }
});

test('no se conecta a otro servidor ni con una opción, una variable o una dirección de aprobación', async (t) => {
  const api = await start(t);
  for (const origin of ['https://ailab.ailendra.com.malo.example', 'http://ailab.ailendra.com', 'https://otro.example', 'http://127.0.0.1.malo.example:80', api.origin + '/ruta', 'http://usuario@127.0.0.1:1']) {
    assert.match(await api.fails(['login', '--origen', origin]), /solo se conecta|no válido/i, origin);
  }
  for (const url of ['https://malo.example/cuenta/dispositivo', api.origin + '/otra', api.origin + '/cuenta/dispositivo?x=1']) {
    api.verificationUrl = url;
    assert.match(await api.fails(['login', '--origen', api.origin]), /no es suya/, url);
  }
  assert.equal(fs.existsSync(path.join(api.state, 'credential.json')), false);
});

test('una redirección no se lleva el token', async (t) => {
  const api = await start(t);
  await api.login();
  const before = api.calls.length;
  api.once((call) => call.url.pathname.endsWith('/me/balance'), () => ({ status: 302, raw: '', headers: { location: api.origin + '/robo' } }));
  await api.fails(['balance']);
  assert.equal(api.calls.length, before + 1);
});

test('un token manipulado hacia otro origen no sale', async (t) => {
  const api = await start(t);
  await api.login();
  const file = path.join(api.state, 'credential.json');
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), origin: 'https://malo.example' }));
  assert.match(await api.fails(['balance']), /solo se conecta/);
});

test('credencial legible por otros o enlazada: no se usa', { skip: process.platform === 'win32' }, async (t) => {
  const api = await start(t);
  await api.login();
  const file = path.join(api.state, 'credential.json');
  fs.chmodSync(file, 0o644);
  assert.match(await api.fails(['balance']), /otros usuarios/);
  fs.chmodSync(file, 0o600);
  fs.renameSync(file, file + '.real');
  fs.symlinkSync(file + '.real', file);
  assert.match(await api.fails(['balance']), /enlace/);
});

test('logout revoca y borra; si no puede revocar lo dice y la conserva', async (t) => {
  const api = await start(t);
  await api.login();
  const file = path.join(api.state, 'credential.json');
  api.once((call) => call.method === 'DELETE', () => api.error(503, 'service_unavailable'));
  assert.match(await api.fails(['logout']), /No se ha podido revocar/);
  assert.ok(fs.existsSync(file));
  await api.ok(['logout']);
  assert.ok(api.revoked);
  assert.equal(fs.existsSync(file), false);
});

test('revocado desde la web: pide login y no envía nada', async (t) => {
  const api = await start(t);
  await api.login();
  api.revoked = true;
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'hola']), /login/);
  assert.equal(api.sent().length, 0);
});

test('los textos legales se explican y no se aceptan por la persona', async (t) => {
  const api = await start(t);
  await api.login();
  api.once((call) => call.url.pathname.endsWith('/me/balance'), () => api.error(403, 'legal_acceptance_required', 'Hay textos por aceptar.'));
  assert.match(await api.fails(['balance']), /los acepta la persona/);
});

test('un 429 al leer se repite una sola vez', async (t) => {
  const api = await start(t);
  await api.login();
  const balance = (call) => call.url.pathname.endsWith('/me/balance');
  const limited = () => api.error(429, 'rate_limited', 'Espera.', { 'retry-after': '1' });
  api.once(balance, limited);
  await api.ok(['balance']);
  api.hooks.push((call) => (balance(call) ? limited() : undefined));
  const before = api.calls.length;
  await api.fails(['balance']);
  assert.equal(api.calls.length, before + 2);
});

test('la carpeta de estado no puede ir dentro de un repositorio', async (t) => {
  const api = await start(t);
  const repo = api.folder('repo');
  fs.mkdirSync(path.join(repo, '.git'));
  const env = { AILAB_V2_HOME: path.join(repo, 'estado') };
  assert.match(await api.fails(['login', '--origen', api.origin], { env }), /dentro de un repositorio/);
  assert.equal(api.calls.length, 0);
});

test('lo que no está en AILAB V2 se dice y no llama a nadie', async (t) => {
  const api = await start(t);
  for (const command of ['assistants', 'voices', 'flow', 'update', 'rollback', 'constructor', '__proto__']) await api.fails([command]);
  assert.equal(api.calls.length, 0);
});
