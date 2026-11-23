import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { PNG, TOKEN, start } from './helpers/fake-ailab-v2.mjs';

const create = (call) => call.method === 'POST' && /\/generations$/.test(call.url.pathname);
const connected = async (t) => {
  const api = await start(t);
  await api.login();
  return api;
};
const lost = (api) => api.once(create, (_call, normal) => { normal(); return { drop: true }; });

test('prepare no gasta, enseña proyecto y precio y submit exige el máximo confirmado', async (t) => {
  const api = await connected(t);
  api.price = { credits: 10, maxCredits: 25 };
  const { out, id, submit } = await api.prepare(['--size', '16:9']);
  assert.match(out, /Proyecto: ninguno/);
  assert.match(out, /máximo 25 cr/);
  assert.equal(api.sent().length, 0);
  for (const wrong of [['submit', id], ['submit', id, '--confirmado', '10'], ['submit', id, '--confirmado', '025']]) await api.fails(wrong);
  assert.equal(api.sent().length, 0);
  assert.match(await api.ok(submit), /Aceptado/);
  const [call] = api.sent();
  assert.equal(call.url.pathname, '/api/v1/generations');
  assert.deepEqual(call.body, { model: 'modelo-prueba', input: { prompt: 'un zorro', size: '16:9' }, maxCredits: 25 });
  assert.ok(call.headers['idempotency-key']);
  assert.match(await api.ok(submit), /no se repite/);
  assert.equal(api.sent().length, 1);
});

test('submit no admite proyecto ni otros cambios', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  for (const extra of [['--proyecto', 'otro'], ['--sin-proyecto', 'x'], ['--prompt', 'otro']]) assert.match(await api.fails([...submit, ...extra]), /Opción desconocida/);
  assert.equal(api.sent().length, 0);
});

test('sin respuesta: se repite con la misma clave, ruta y cuerpo, también desde otra carpeta', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Campaña');
  const { submit } = await api.prepare(['--proyecto', project.key]);
  lost(api);
  assert.match(await api.fails(submit), /No consta si se ha creado/);
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'un zorro', '--sin-proyecto']), /repite/);
  assert.match(await api.ok(['pendientes']), /SIN RESPUESTA/);
  api.projects.length = 0;
  await api.ok(submit, { cwd: api.folder('otra') });
  const [first, second] = api.sent();
  assert.equal(second.url.pathname, first.url.pathname);
  assert.equal(second.url.pathname, '/api/v1/projects/' + project.id + '/generations');
  assert.equal(second.headers['idempotency-key'], first.headers['idempotency-key']);
  assert.deepEqual(second.body, first.body);
  assert.equal(api.generations.size, 1);
});

test('con proyecto y una API sin esa ruta: falla sin probar la general', async (t) => {
  const api = await connected(t);
  const project = api.addProject('Campaña');
  const { submit } = await api.prepare(['--proyecto', project.key]);
  api.once(create, () => api.error(404, 'not_found', 'No existe.'));
  assert.match(await api.fails(submit), /No se ha probado sin proyecto/);
  await api.fails(submit);
  assert.deepEqual(api.sent().map((call) => call.url.pathname), ['/api/v1/projects/' + project.id + '/generations']);
  assert.equal(api.generations.size, 0);
});

const UNKNOWN = {
  'error del servidor': (api) => api.error(500, 'internal_error'),
  'página de un proxy': () => ({ status: 403, raw: '<html>no</html>' }),
  'respuesta sin JSON': () => ({ status: 202, raw: 'ok' }),
  'aceptado sin id': () => ({ status: 202, body: {} }),
  'clave en curso': (api) => api.error(409, 'idempotency_in_progress'),
};
for (const [name, answer] of Object.entries(UNKNOWN)) {
  test('se conserva la clave: ' + name, async (t) => {
    const api = await connected(t);
    const { submit } = await api.prepare();
    api.once(create, () => answer(api));
    await api.fails(submit);
    await api.ok(submit);
    const keys = api.sent().map((call) => call.headers['idempotency-key']);
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  });
}

test('una repetición sin prueba no suelta la clave: 401, 403, 409, 429 y un rechazo sin marca', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  lost(api);
  await api.fails(submit);
  const answers = [[401, 'unauthenticated'], [403, 'forbidden'], [409, 'conflict'], [429, 'rate_limited']];
  for (const [status, code] of answers) {
    api.once(create, () => api.error(status, code));
    assert.match(await api.fails(submit), /No consta si se ha creado/, code);
  }
  api.once(create, () => api.error(400, 'validation_error'));
  api.once(create, () => api.error(400, 'validation_error'));
  assert.match(await api.fails(submit), /No consta si se ha creado/);
  await api.ok(submit);
  assert.equal(new Set(api.sent().map((call) => call.headers['idempotency-key'])).size, 1);
  assert.equal(api.generations.size, 1);
});

test('una repetición con prueba suelta la clave', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  api.once(create, () => ({ drop: true }));
  await api.fails(submit);
  api.once(create, () => api.error(404, 'not_found'));
  api.once(create, () => api.error(404, 'not_found', 'No existe.', { 'idempotent-replayed': 'true' }));
  assert.match(await api.fails(submit), /No se ha creado nada/);
  await api.prepare();
});

test('sin saldo al repetir demuestra que no se creó', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  api.once(create, () => ({ drop: true }));
  await api.fails(submit);
  api.once(create, () => api.error(402, 'insufficient_credits'));
  assert.match(await api.fails(submit), /No se ha creado nada/);
});

test('un 429 al enviar no se repite solo y la preparación sigue valiendo', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  api.once(create, () => api.error(429, 'rate_limited', 'Espera.', { 'retry-after': '1' }));
  assert.match(await api.fails(submit), /sigue valiendo/);
  assert.equal(api.sent().length, 1);
  await api.ok(submit);
  // La API guarda el 429 para su clave: con la misma volvería a decir «espera».
  const [first, second] = api.sent().map((call) => call.headers['idempotency-key']);
  assert.notEqual(first, second);
});

test('veinte submit a la vez crean una sola generación', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  await Promise.all(Array.from({ length: 20 }, () => api.cli(submit)));
  await api.ok(submit);
  assert.equal(api.generations.size, 1);
  assert.equal(new Set(api.sent().map((call) => call.headers['idempotency-key'])).size, 1);
});

test('dos preparaciones iguales: con una sin respuesta, la otra no sale', async (t) => {
  const api = await connected(t);
  const first = await api.prepare();
  const second = await api.prepare();
  lost(api);
  await api.fails(first.submit);
  assert.match(await api.fails(second.submit), /repite/);
  assert.equal(api.sent().length, 1);
});

test('una preparación de otra cuenta no se envía', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  await api.ok(['logout']);
  api.revoked = false;
  api.accountId = '11111111-2222-4333-8444-555555555555';
  await api.login();
  assert.match(await api.fails(submit), /otra cuenta/);
  assert.equal(api.sent().length, 0);
});

test('un precio de más de un día no se envía', async (t) => {
  const api = await connected(t);
  const { id, submit } = await api.prepare();
  const file = path.join(api.state, 'requests', id + '.json');
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), createdAt: '2026-01-01T00:00:00.000Z' }));
  assert.match(await api.fails(submit), /24 horas/);
});

test('la entrada se comprueba con el esquema antes de subir o presupuestar', async (t) => {
  const api = await connected(t);
  const cases = [
    [], ['--prompt', 'x', '--no_existe', '1'], ['--prompt', 'x', '--size', '9:9'], ['--prompt', 'x', '--steps', '9'],
    ['--prompt', 'x', '--steps', '1.5'], ['--prompt', 'x', '--upscale', 'si'], ['--prompt', 'x', '--duration', '2'],
    ['--prompt', 'x'.repeat(201)], ['--prompt', 'x', '--prompt', 'y'], ['--prompt', 'x', '--elements', '{"name":"a","hidden":1}'],
    ['--prompt', 'x', '--constructor', '1'],
  ];
  for (const args of cases) await api.fails(['prepare', 'modelo-prueba', ...args]);
  assert.equal(api.calls.filter((call) => /quote|uploads/.test(call.url.pathname)).length, 0);
  const { submit } = await api.prepare(['--duration', '-1', '--seed=77', '--steps', '2', '--upscale', 'false', '--elements', '{"name":"ana"}']);
  await api.ok(submit);
  assert.deepEqual(api.sent()[0].body.input, { prompt: 'un zorro', duration: -1, seed: '77', steps: 2, upscale: false, elements: [{ name: 'ana' }] });
});

test('un texto entre corchetes en una lista es un texto', async (t) => {
  const api = await connected(t);
  const file = path.join(api.root, '[toma].png');
  fs.writeFileSync(file, PNG);
  await api.prepare(['--image_urls', '[toma].png'], { cwd: api.root });
  assert.equal(api.uploads.size, 1);
});

test('una tubería no cuelga la orden', { skip: process.platform === 'win32' }, async (t) => {
  const api = await connected(t);
  const pipe = path.join(api.root, 'tubo.png');
  if (spawnSync('mkfifo', [pipe]).status !== 0) return;
  assert.match(await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x', '--image_urls', pipe]), /no es un archivo válido/);
});

test('--entrada lleva textos difíciles sin pasar por el shell', async (t) => {
  const api = await connected(t);
  const file = path.join(api.root, 'entrada.json');
  const prompt = 'línea "uno"\n$(no se ejecuta) `nada`';
  fs.writeFileSync(file, JSON.stringify({ prompt }));
  const out = await api.ok(['prepare', 'modelo-prueba', '--entrada', file]);
  await api.ok(out.match(/submit [0-9a-f-]{36} --confirmado \d+/)[0].split(' '));
  assert.equal(api.sent()[0].body.input.prompt, prompt);
});

test('sube una vez cada archivo, sin token ni nombre real hacia el almacenamiento', async (t) => {
  const api = await connected(t);
  const file = path.join(api.root, 'cliente-secreto.png');
  fs.writeFileSync(file, PNG);
  const { submit } = await api.prepare(['--image_urls', file, '--image_urls', file, '--elements', JSON.stringify({ name: 'ana', image: file })]);
  const puts = api.calls.filter((call) => call.method === 'PUT');
  assert.equal(puts.length, 1);
  assert.equal(puts[0].headers.authorization, undefined);
  assert.deepEqual(puts[0].raw, PNG);
  assert.equal(api.calls.find((call) => call.url.pathname.endsWith('/uploads')).body.filename, 'referencia.png');
  await api.ok(submit);
  const [id] = api.uploads.keys();
  assert.deepEqual(api.sent()[0].body.input.image_urls, [id, id]);
  assert.equal(api.sent()[0].body.input.elements[0].image, id);
});

test('un resultado propio sirve de referencia', async (t) => {
  const api = await connected(t);
  const id = '11111111-2222-4333-8444-555555555555';
  await api.prepare(['--image_urls', `generacion:${id}:1`]);
  assert.ok(api.calls.some((call) => call.url.pathname === `/api/v1/generations/${id}/files/1/reference`));
});

test('no sale del equipo una clave renombrada, la carpeta privada ni un enlace', async (t) => {
  const api = await connected(t);
  const fake = path.join(api.root, 'clave.png');
  fs.writeFileSync(fake, '-----BEGIN clave falsa de prueba-----');
  const link = path.join(api.root, 'enlace.png');
  fs.symlinkSync(path.join(api.state, 'credential.json'), link);
  for (const value of [fake, link, path.join(api.state, 'credential.json'), 'https://example.com/a.png', path.join(api.root, 'no-existe.png')]) {
    await api.fails(['prepare', 'modelo-prueba', '--prompt', 'x', '--image_urls', value]);
  }
  assert.equal(api.calls.filter((call) => /uploads|storage/.test(call.url.pathname)).length, 0);
});

test('status descarga sin token, con nombre propio y sin sobrescribir', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  await api.ok(submit);
  const [id] = api.generations.keys();
  const out = await api.ok(['status', id]);
  const file = out.match(/Guardado en: (.+)/)[1];
  assert.equal(path.dirname(file), path.join(api.home, 'Downloads', 'AILAB', id));
  assert.equal(path.basename(file), `ailab-${id}-0.bin`);
  assert.deepEqual(fs.readFileSync(file), PNG);
  assert.equal(api.calls.find((call) => call.url.pathname === '/storage/get/resultado').headers.authorization, undefined);
  fs.writeFileSync(file, 'lo del usuario');
  assert.match(await api.ok(['status', id]), /ya existía/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'lo del usuario');
  assert.equal(out.includes(TOKEN), false);
});

test('descarga cortada, carpeta enlazada o dirección insegura: la generación no se repite', async (t) => {
  const api = await connected(t);
  const { submit } = await api.prepare();
  await api.ok(submit);
  const [id, generation] = [...api.generations][0];
  api.once((call) => call.url.pathname.startsWith('/storage/get'), () => ({ drop: true }));
  assert.match(await api.fails(['status', id]), /repite status, no generes otra/);
  const link = path.join(api.root, 'salida');
  fs.symlinkSync(api.folder('real'), link);
  assert.match(await api.fails(['status', id, '--output', link]), /enlace/);
  generation.files[0].url = 'http://malo.example/robo';
  assert.match(await api.fails(['status', id, '--output', api.folder('salida-2')]), /no segura/);
  assert.equal(api.sent().length, 1);
});
