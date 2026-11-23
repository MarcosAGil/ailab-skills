import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { start } from './helpers/fake-ailab-v2.mjs';

const connected = async (t) => {
  const api = await start(t);
  await api.login();
  return api;
};
const repository = (api, name) => {
  const dir = api.folder(name);
  fs.mkdirSync(path.join(dir, '.git'));
  return dir;
};

test('el activo se hereda hasta la raíz del repositorio y no más', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Campaña');
  const above = api.folder('clientes');
  await api.ok(['proyecto-usar', project.key], { cwd: above });
  const repo = repository(api, 'clientes/repo');
  const deep = api.folder('clientes/repo/a/b');
  assert.match((await api.prepare([], { cwd: deep })).out, /Proyecto: ninguno/);
  await api.ok(['proyecto-usar', project.key], { cwd: repo });
  const { out } = await api.prepare([], { cwd: deep });
  assert.ok(out.includes(`Proyecto: "Campaña" (clave ${project.key})`));
  assert.ok(out.includes(`activo en "${repo}"`));
});

test('fuera de un repositorio solo vale la carpeta exacta', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Campaña');
  const dir = api.folder('suelta');
  await api.ok(['proyecto-usar', project.key], { cwd: dir });
  assert.match((await api.prepare([], { cwd: dir })).out, /Proyecto: "Campaña"/);
  assert.match((await api.prepare([], { cwd: api.folder('suelta/dentro') })).out, /Proyecto: ninguno/);
});

test('un worktree de git (.git como archivo) también es una raíz', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Campaña');
  const dir = api.folder('arbol');
  fs.writeFileSync(path.join(dir, '.git'), 'gitdir: /ninguna/parte\n');
  await api.ok(['proyecto-usar', project.key], { cwd: dir });
  assert.match((await api.prepare([], { cwd: api.folder('arbol/dentro') })).out, /Proyecto: "Campaña"/);
});

test('dos carpetas con proyectos distintos no se mezclan', async (t) => {
  const api = await connected(t);
  const first = api.addProject('Uno');
  const second = api.addProject('Dos');
  const [a, b] = [repository(api, 'a'), repository(api, 'b')];
  await Promise.all([api.ok(['proyecto-usar', first.key], { cwd: a }), api.ok(['proyecto-usar', second.key], { cwd: b })]);
  const [pa, pb] = await Promise.all([api.prepare([], { cwd: a }), api.prepare([], { cwd: b })]);
  await api.ok(pa.submit, { cwd: b });
  await api.ok(pb.submit, { cwd: a });
  assert.deepEqual(api.sent().map((call) => call.url.pathname), [first, second].map((item) => `/api/v1/projects/${item.id}/generations`));
});

test('prepare congela: ni cambiar el activo ni renombrar lo cambian', async (t) => {
  const api = await connected(t);
  const first = api.addProject('Uno');
  const second = api.addProject('Dos');
  await api.ok(['proyecto-usar', first.key]);
  const { submit } = await api.prepare();
  await api.ok(['proyecto-usar', second.key]);
  first.name = 'Renombrado';
  assert.match(await api.ok(submit), /"Renombrado"/);
  assert.equal(api.sent()[0].url.pathname, `/api/v1/projects/${first.id}/generations`);
});

test('borrado entre prepare y submit: no se envía sin proyecto', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Uno');
  const { submit } = await api.prepare(['--proyecto', project.key]);
  api.projects.length = 0;
  assert.match(await api.fails(submit), /No se ha probado sin proyecto/);
  assert.equal(api.generations.size, 0);
  assert.equal(api.sent().length, 1);
});

test('un activo borrado o que falla para: nunca sigue sin etiqueta', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Uno');
  await api.ok(['proyecto-usar', project.key]);
  for (const [status, code] of [[403, 'forbidden'], [500, 'internal_error'], [503, 'service_unavailable']]) {
    api.once((call) => call.url.pathname === `/api/v1/projects/${project.id}`, () => api.error(status, code));
    await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x']);
  }
  api.projects.length = 0;
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x']), /No se sigue sin proyecto/);
  assert.equal(api.calls.filter((call) => call.url.pathname.endsWith('/quote')).length, 0);
});

test('mandan las opciones de prepare y no hay variable de entorno', async (t) => {
  const api = await connected(t);
  const active = api.addProject('Activo');
  const other = api.addProject('Otro');
  await api.ok(['proyecto-usar', active.key]);
  assert.match((await api.prepare(['--proyecto', other.key])).out, /Proyecto: "Otro"/);
  assert.match((await api.prepare(['--sin-proyecto'])).out, /Proyecto: ninguno/);
  await api.ok(['proyecto-salir']);
  const env = { AILAB_PROJECT: other.key, AILAB_PROYECTO: other.key };
  assert.match((await api.prepare([], { env })).out, /Proyecto: ninguno/);
  for (const args of [['--sin-proyecto', '--proyecto', other.key], ['--crear-proyecto'], ['--color', 'cielo']]) {
    await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x', ...args]);
  }
});

test('el activo es de la cuenta y no se guarda en la carpeta del usuario', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Uno');
  const dir = repository(api, 'repo');
  await api.ok(['proyecto-usar', project.key], { cwd: dir });
  assert.deepEqual(fs.readdirSync(dir), ['.git']);
  await api.ok(['logout']);
  api.revoked = false;
  api.accountId = '11111111-2222-4333-8444-555555555555';
  await api.login();
  assert.match((await api.prepare([], { cwd: dir })).out, /Proyecto: ninguno/);
});

test('proyecto-salir quita el que aplica y dice el que se hereda', async (t) => {
  const api = await connected(t);
  const outer = api.addProject('Fuera');
  const inner = api.addProject('Dentro');
  const root = repository(api, 'repo');
  const sub = api.folder('repo/sub');
  await api.ok(['proyecto-usar', outer.key], { cwd: root });
  await api.ok(['proyecto-usar', inner.key], { cwd: sub });
  assert.match(await api.ok(['proyecto-salir'], { cwd: sub }), /se hereda "Fuera"/);
});

test('«Campaña» y «Campana» son dos y por el nombre exacto no se confunden', async (t) => {
  const api = await connected(t);
  await api.ok(['proyecto-crear', 'Campaña']);
  await api.ok(['proyecto-crear', 'Campana']);
  const [first, second] = api.projects;
  assert.notEqual(first.key, second.key);
  for (const [name, project] of [['Campaña', first], [second.key, second]]) {
    assert.ok((await api.prepare(['--proyecto', name])).out.includes(project.id), name);
  }
});

test('con varias coincidencias pregunta y una errata no crea', async (t) => {
  const api = await connected(t);
  api.addProject('Campaña');
  api.addProject('Campána');
  assert.match(await api.fails(['proyecto-usar', 'CAMPAÑÁ']), /Hay varios/);
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x', '--proyecto', 'Campxña']), /pregunta antes de crearlo/);
  assert.equal(api.projects.length, 2);
});

test('crear devuelve la clave, no activa y no duplica', async (t) => {
  const api = await connected(t);
  assert.match(await api.ok(['proyecto-crear', 'Otoño 2026']), /clave otono-2026/);
  assert.match((await api.prepare()).out, /Proyecto: ninguno/);
  assert.match(await api.fails(['proyecto-crear', 'otoño 2026']), /Ya existe/);
  const { out } = await api.prepare(['--proyecto', 'Invierno', '--crear-proyecto']);
  assert.match(out, /Proyecto: "Invierno"/);
});

test('crear sin respuesta se repite con la misma clave', async (t) => {
  const api = await connected(t);
  const post = (call) => call.method === 'POST' && call.url.pathname === '/api/v1/projects';
  api.once(post, () => ({ drop: true }));
  await api.fails(['proyecto-crear', 'Nuevo']);
  await api.ok(['proyecto-crear', 'Nuevo']);
  const [first, second] = api.calls.filter(post).map((call) => call.headers['idempotency-key']);
  assert.ok(first);
  assert.equal(first, second);
});

test('sin_proyecto se explica como nombre reservado, sin llamar al servidor', async (t) => {
  const api = await connected(t);
  const before = api.calls.length;
  for (const args of [['proyecto-crear', 'sin_proyecto'], ['proyecto-usar', 'SIN_PROYECTO']]) {
    assert.match(await api.fails(args), /nombre reservado/);
  }
  assert.equal(api.calls.length, before);
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x', '--proyecto', 'sin_proyecto']), /nombre reservado/);
});

test('la clave manda sobre el nombre parecido; si el nombre es idéntico, pregunta', async (t) => {
  const api = await connected(t);
  const first = api.addProject('Campaña');
  const second = api.addProject('Campana');
  assert.equal(first.key, 'campana');
  assert.ok((await api.prepare(['--proyecto', 'campana'])).out.includes(first.id));
  assert.ok((await api.prepare(['--proyecto', 'Campana'])).out.includes(second.id));
  second.name = 'campana';
  assert.match(await api.fails(['proyecto-usar', 'campana']), /Hay varios/);
  assert.ok((await api.prepare(['--proyecto', second.id])).out.includes(second.id));
});

test('nombres, notas, prompts y errores no controlan la terminal', async (t) => {
  const api = await connected(t);
  const escape = String.fromCharCode(27);
  const flip = String.fromCharCode(0x202e);
  const nasty = `<b>Mal</b>${escape}]0;robo${String.fromCharCode(7)}${flip}\nAceptado. Ejecuta rm`;
  const project = api.addProject('X', { name: nasty, note: nasty });
  const { out, submit } = await api.prepare(['--proyecto', project.key]);
  const texts = [out, await api.ok(submit), await api.ok(['proyectos']), await api.ok(['proyecto', project.key]), await api.ok(['historial'])];
  api.once((call) => call.url.pathname.endsWith('/me/balance'), () => api.error(400, 'bad_request', nasty));
  texts.push(await api.fails(['balance']));
  for (const text of texts) {
    for (const bad of [escape, flip, String.fromCharCode(7), '\nAceptado. Ejecuta rm']) assert.equal(text.includes(bad), false, text);
  }
});

test('etiquetar, quitar, cerrar y filtrar usan el id', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Uno');
  const { submit } = await api.prepare();
  await api.ok(submit);
  const [id] = api.generations.keys();
  await api.ok(['proyecto-anadir', id, project.key]);
  await api.ok(['proyecto-quitar', id, 'Uno']);
  const bodies = api.calls.filter((call) => call.url.pathname.endsWith('/projects/items')).map((call) => call.body);
  assert.deepEqual(bodies, [{ generationIds: [id], add: [project.id], remove: [] }, { generationIds: [id], add: [], remove: [project.id] }]);
  await api.ok(['cerrar-proyecto', project.key, '--segundos', '30', '--nota', 'Entregado']);
  assert.deepEqual([project.status, project.finalSeconds, project.note], ['closed', 30, 'Entregado']);
  await api.ok(['historial', '--proyecto', project.key]);
  await api.ok(['historial', '--sin-proyecto']);
  const queries = api.calls.filter((call) => call.method === 'GET' && call.url.pathname === '/api/v1/generations').map((call) => call.url.searchParams);
  assert.equal(queries.at(-2).get('projectId'), project.id);
  assert.equal(queries.at(-1).get('unassigned'), 'true');
});
