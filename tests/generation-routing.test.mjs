import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const skill = new URL('../skills/ailab/', import.meta.url);
const configURL = new URL('scripts/lib/config.mjs', skill).href;
const base = 'https://ailendra.com/ailab/';
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-routing-'));
const credentials = path.join(temporary, 'credentials');
fs.mkdirSync(credentials, { mode: 0o700 });
fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'b'.repeat(40), { mode: 0o600 });
for (const key of ['AILAB_BASE_URL', 'AILAB_GENERATION_BASE_URL', 'PG_BASE_URL', 'AILAB_ASSISTANT_ENDPOINT', 'AILAB_TASK_ENDPOINT']) delete process.env[key];
process.env.AILAB_CREDENTIALS_DIR = credentials;
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
const http = await import(new URL('scripts/lib/http.mjs', skill));
const catalog = JSON.parse(fs.readFileSync(new URL('catalog/catalog.json', skill), 'utf8'));
const originalFetch = globalThis.fetch;
const calls = [];
const media = 'https://media.invalid/result.mp4';
let failure = false;
globalThis.fetch = async (url, init) => {
  assert.ok(String(url).startsWith(base), 'Petición fuera de AILAB: ' + url);
  let body = null;
  if (typeof init.body === 'string') body = JSON.parse(init.body);
  else if (init.body?.[Symbol.asyncIterator]) for await (const chunk of init.body) { assert.ok(chunk.length); }
  calls.push({ url: String(url), init, body });
  const parsed = new URL(url);
  const endpoint = parsed.pathname;
  let data;
  if (failure) return Response.json({ code: 400, msg: 'Model not supported' });
  if (endpoint.endsWith('/api.php')) return Response.json({ ok: true, credits: 100, costs: { mock: 7, 'fal:mock': 7, 'apimart:mock': 7, 'heygen:mock': 7, 'topaz:mock': 7 } });
  if (endpoint.endsWith('/upload.php')) return Response.json({ ok: true, url: 'https://media.invalid/reference.png' });
  if (endpoint.endsWith('/assistant.php') || endpoint.endsWith('/task.php')) return Response.json({ ok: true });
  if (endpoint.endsWith('/gateway.php')) {
    const route = parsed.searchParams.get('path');
    if (init.method === 'GET') {
      assert.match(route, /^\/(jobs\/recordInfo|veo\/record-info|generate\/record-info)\?taskId=mock$/);
      data = { state: 'success', status: 'success', resultJson: JSON.stringify({ resultUrls: [media], text: 'Transcripción' }), videoUrl: media, response: { sunoData: [{ audioUrl: media }] } };
    } else {
      assert.ok(['/jobs/createTask', '/veo/generate', '/generate'].includes(route), route);
      data = { taskId: 'mock' };
    }
  } else {
    assert.match(endpoint, /\/api\/wallet\/(fal|apimart|heygen|elevenlabs|resemble|topaz)-gateway\.php$/);
    data = parsed.searchParams.get('action') === 'status'
      ? { status: 'COMPLETED', image: media, audio: media, video_url: media, images: [media] }
      : { request_id: 'mock', video_id: 'mock', task_id: 'mock', taskId: 'mock', audio: media, credits: 7 };
  }
  return Response.json({ code: 200, data });
};
test.after(() => { globalThis.fetch = originalFetch; fs.rmSync(temporary, { recursive: true, force: true }); });

for (const [name, overrides, expectedBase, expectedGeneration] of [
  ['producción', {}, base, base],
  ['AILAB_BASE_URL', { AILAB_BASE_URL: 'https://test.invalid/ailab///' }, 'https://test.invalid/ailab/', 'https://test.invalid/ailab/'],
  ['PG_BASE_URL legacy', { PG_BASE_URL: 'http://127.0.0.1:9876/' }, 'http://127.0.0.1:9876/', 'http://127.0.0.1:9876/'],
  ['AILAB gana al override legacy', { AILAB_BASE_URL: 'https://new.invalid/', PG_BASE_URL: 'https://old.invalid/' }, 'https://new.invalid/', 'https://new.invalid/'],
  ['override explícito de generación', { AILAB_GENERATION_BASE_URL: 'https://explicit.invalid//' }, base, 'https://explicit.invalid/'],
]) {
  test('bases coherentes: ' + name, () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as c from ${JSON.stringify(configURL)}; console.log(JSON.stringify([c.BASE_URL,c.GENERATION_BASE_URL,c.CATALOG_URL,c.TASK_ENDPOINT]));`], { env: { PATH: process.env.PATH, ...overrides }, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), [expectedBase, expectedGeneration, expectedBase + 'api/v1/skill/catalog.json', expectedBase + 'api/v1/skill/task.php']);
  });
}

async function exercise(model, overrides = {}, uploads = {}) {
  const adapter = await import(new URL('scripts/adapters/' + model.driver + '.mjs', skill));
  const params = Object.fromEntries(Object.entries(model.params || {}).filter(([, spec]) => spec.default !== undefined).map(([key, spec]) => [key, spec.default]));
  const payload = adapter.buildPayload(model, { ...params, ...overrides }, uploads);
  const intent = { client_request_id: crypto.randomUUID(), max_credits_authorized: 1000 };
  const submitted = await adapter.submit(model, payload, intent);
  assert.equal(submitted.ok, true, JSON.stringify(submitted));
  const sent = calls.at(-1);
  assert.equal(sent.body.client_request_id, intent.client_request_id);
  assert.equal(sent.body.max_credits_authorized, intent.max_credits_authorized);
  const result = await adapter.check(model, submitted.taskRef);
  assert.equal(result.status, 'success', JSON.stringify(result));
  assert.equal(await adapter.realCost(submitted.taskRef), 7);
  return sent;
}

for (const [id, value] of Object.entries(catalog.models)) {
  test('transporte, recuperación y coste pasan por AILAB: ' + id, async () => {
    await exercise({ ...value, id });
  });
}

test('las rutas alternativas de Grok y Seedream también usan el gateway de AILAB', async () => {
  for (const [id, params, fileParam, gateway] of [
    ['grok-imagine-image-2', { mode: 'i2i' }, 'image_urls', 'fal'],
    ['grok-imagine-image-2', { mode: 'segment', task_id: 'previous' }, null, 'jobs'],
    ['grok-imagine-image-2', { mode: 'edit', task_id: 'previous' }, null, 'jobs'],
    ['seedream-v5-pro', { mode: 't2i', quality: 'high' }, null, 'fal'],
    ['seedream-v5-pro', { mode: 'i2i', quality: 'high' }, 'image_urls', 'fal'],
    ['seedream-v5-pro', { mode: 'layers' }, 'layer_image', 'jobs'],
  ]) {
    const sent = await exercise({ ...catalog.models[id], id }, params, fileParam ? { [fileParam]: ['https://media.invalid/input.png'] } : {});
    assert.ok(sent.url.includes(gateway === 'fal' ? '/fal-gateway.php' : '/gateway.php?path='), sent.url);
  }
});

test('Omni conserva el ID público, modalidad y referencias para que AILAB los traduzca', async () => {
  const id = 'gemini-omni-flash-1-1';
  const model = { ...catalog.models[id], id };
  const adapter = await import(new URL('scripts/adapters/jobs-v1.mjs', skill));
  for (const [mode, uploads] of [['t2v', {}], ['frames', { first_frame_url: ['https://media.invalid/first.png'], last_frame_url: ['https://media.invalid/last.png'] }], ['reference', { image_urls: ['https://media.invalid/ref.png'], video_url: ['https://media.invalid/ref.mp4'] }]]) {
    const payload = adapter.buildPayload(model, { mode, prompt: 'Prueba', duration: '4', resolution: '720p', aspect_ratio: '16:9' }, uploads);
    const sent = await exercise(model, { mode, prompt: 'Prueba', duration: '4', resolution: '720p', aspect_ratio: '16:9' }, uploads);
    assert.equal(sent.body.model, id);
    assert.deepEqual(sent.body.input, payload.input);
    for (const [key, urls] of Object.entries(uploads)) assert.deepEqual(sent.body.input[key], model.params[key]?.type === 'file' ? urls[0] : urls);
  }
});

test('saldo, asistentes, recuperación remota y las dos vías de subida usan AILAB', async () => {
  await http.apiPost({ action: 'me' });
  await http.assistantPost({ action: 'prepare' });
  await http.taskLookup('existing-task');
  await http.uploadFile(Buffer.from('test'), 'reference.png', 'image/png');
  const source = path.join(temporary, 'reference.png');
  fs.writeFileSync(source, 'test');
  const uploaded = await http.uploadPath(source, 'reference.png', 'image/png', crypto.createHash('sha256').update('test').digest('hex'));
  assert.equal(uploaded.ok, true);
  assert.deepEqual(calls.slice(-5).map((call) => call.url), ['api/wallet/api.php', 'api/v1/skill/assistant.php', 'api/v1/skill/task.php', 'api/skill/upload.php', 'api/skill/upload.php'].map((suffix) => base + suffix));
});

test('un rechazo de proveedor no reenvía al backend legacy ni crea otra petición', async () => {
  failure = true;
  const before = calls.length;
  try {
    const adapter = await import(new URL('scripts/adapters/jobs-v1.mjs', skill));
    const result = await adapter.submit({}, { model: 'gemini-omni-flash-1-1', input: { prompt: 'test' } }, { client_request_id: 'same-operation', max_credits_authorized: 100 });
    assert.equal(result.ok, false);
    assert.equal(result.normalized.businessCode, 400);
    assert.equal(calls.length - before, 1);
  } finally { failure = false; }
});
