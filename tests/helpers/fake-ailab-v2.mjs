// Una AILAB v2 falsa en 127.0.0.1 con los contratos que usa la CLI. Nada sale del equipo.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../../skills/ailab-v2/scripts/ailab.mjs', import.meta.url));
export const TOKEN = 'ailab_dt_' + 'F'.repeat(43);
export const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(40, 7)]);

const image = { type: 'string', format: 'uuid', 'x-ailab-media': 'image' };
const CATALOG = [{
  id: 'modelo-prueba',
  name: 'Modelo de prueba',
  modality: 'image',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['prompt'],
    properties: {
      prompt: { type: 'string', maxLength: 200 },
      size: { type: 'string', enum: ['1:1', '16:9'], default: '1:1' },
      steps: { type: 'integer', minimum: 1, maximum: 4 },
      upscale: { type: 'boolean' },
      duration: { anyOf: [{ type: 'number', const: -1 }, { type: 'integer', minimum: 4, maximum: 30 }] },
      seed: { type: ['number', 'string'] },
      image_urls: { type: 'array', maxItems: 3, items: image, 'x-ailab-media': 'image' },
      elements: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name'], properties: { name: { type: 'string' }, image, hidden: { not: {} } } } },
    },
  },
  presentation: { description: 'De prueba.' },
}];

export async function start(t) {
  const root = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-v2-')));
  const api = {
    root, projects: [], generations: new Map(), byKey: new Map(), calls: [], uploads: new Map(), hooks: [],
    accountId: randomUUID(), revoked: false, approval: 'approved', price: { credits: 12 }, file: PNG,
  };
  const error = (status, code, message = 'Fallo de prueba.', headers = {}) =>
    ({ status, headers, body: { error: { code, message, requestId: randomUUID() } } });
  api.error = error;

  function route(call) {
    const { method, url, body, headers } = call;
    const at = url.pathname.replace(/^\/api\/v1/, '');
    let match;
    if (at === '/auth/devices/start') return { status: 201, body: { deviceCode: 'd'.repeat(43), userCode: 'BCDF-GHJK', verificationUrl: api.verificationUrl ?? api.origin + '/cuenta/dispositivo', expiresIn: 600, interval: 1 } };
    if (at === '/auth/devices/token') return { body: api.approval === 'approved' ? { status: 'approved', token: TOKEN, accountId: api.accountId, expiresAt: '2027-01-21T00:00:00.000Z' } : { status: api.approval } };
    if (url.pathname.startsWith('/storage/put/')) {
      api.uploads.set(url.pathname.split('/').pop(), call.raw);
      return { status: 200, raw: Buffer.alloc(0) };
    }
    if (url.pathname.startsWith('/storage/')) return { status: 200, raw: api.file };
    if (headers.cookie || headers.authorization !== 'Bearer ' + TOKEN || api.revoked) return error(401, 'unauthenticated', 'Sesión no válida.');
    if (at === '/me/device' && method === 'DELETE') { api.revoked = true; return { status: 204 }; }
    if (at === '/me/device') return { body: { id: randomUUID(), accountId: api.accountId, name: 'Prueba', expiresAt: '2027-01-21T00:00:00.000Z' } };
    if (at === '/me/balance') return { body: { available: 500, held: 0, frozen: 0 } };
    if (at === '/catalog') return { body: { items: CATALOG } };
    if (at === '/generations/quote') return { body: api.price };
    if (at === '/uploads') {
      const id = randomUUID();
      return { status: 201, body: { asset: { id, status: 'pending' }, uploadUrl: api.origin + '/storage/put/' + id } };
    }
    if ((match = at.match(/^\/uploads\/([^/]+)\/complete$/))) return { body: { id: match[1], status: 'ready', rejectReason: null } };
    if (at.match(/^\/generations\/[^/]+\/files\/\d+\/reference$/)) return { status: 201, body: { id: randomUUID(), status: 'ready' } };
    if (at === '/projects' && method === 'GET') return { body: { items: api.projects, nextCursor: null } };
    if (at === '/projects' && method === 'POST') {
      const project = api.addProject(body.name, { color: body.color });
      return { status: 201, body: project };
    }
    if (at === '/projects/items') return { status: 204 };
    if ((match = at.match(/^\/projects\/([^/]+)$/))) {
      const project = api.projects.find((item) => item.id === match[1] || item.key === match[1]);
      if (!project) return error(404, 'not_found', 'Ese proyecto ya no existe.');
      if (method === 'PATCH') Object.assign(project, body);
      return { body: project };
    }
    match = at.match(/^\/projects\/([^/]+)\/generations$/);
    if (method === 'POST' && (match || at === '/generations')) {
      const key = headers['idempotency-key'];
      if (api.byKey.has(key)) return { status: 202, body: api.byKey.get(key) };
      const project = match && api.projects.find((item) => item.id === match[1]);
      if (match && !project) return error(404, 'not_found', 'Ese proyecto ya no existe.');
      const generation = {
        id: randomUUID(), model: body.model, status: 'succeeded', prompt: body.input.prompt, input: body.input,
        chargedCredits: body.maxCredits, reservedCredits: 0, error: null, text: null,
        files: [{ url: api.origin + '/storage/get/resultado', filename: '../../fuera.sh', position: 0 }],
        projects: project ? [{ id: project.id, key: project.key, name: project.name }] : [],
      };
      api.byKey.set(key, generation);
      api.generations.set(generation.id, generation);
      return { status: 202, body: generation };
    }
    if (at === '/generations') return { body: { items: [...api.generations.values()], nextCursor: null } };
    if (at === '/generations/drafts') return { body: { items: [] } };
    if ((match = at.match(/^\/generations\/([^/]+)$/))) {
      return api.generations.has(match[1]) ? { body: api.generations.get(match[1]) } : error(404, 'not_found');
    }
    return error(404, 'not_found');
  }

  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    let body = null;
    try { body = JSON.parse(raw.toString('utf8')); } catch { /* un archivo o nada */ }
    const call = { method: request.method, url: new URL(request.url, 'http://127.0.0.1'), headers: request.headers, body, raw };
    api.calls.push(call);
    let result;
    for (const hook of api.hooks) {
      result = await hook(call, () => route(call));
      if (result) break;
    }
    result ??= route(call);
    if (result.drop) { request.socket.destroy(); return; }
    const status = result.status ?? 200;
    if (result.raw !== undefined || status === 204) {
      response.writeHead(status, result.headers);
      response.end(result.raw);
      return;
    }
    response.writeHead(status, { 'content-type': 'application/json', ...result.headers });
    response.end(JSON.stringify(result.body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  api.origin = 'http://127.0.0.1:' + server.address().port;
  t.after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  });

  api.addProject = (name, extra = {}) => {
    let key = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proyecto';
    while (api.projects.some((item) => item.key === key)) key += '-2';
    const project = { id: randomUUID(), key, name, status: 'open', color: 'niebla', count: 0, chargedCredits: 0, heldCredits: 0, finalSeconds: null, note: null, ...extra };
    api.projects.push(project);
    return project;
  };
  /** La siguiente llamada que cumpla `match` responde lo que diga `answer`. */
  api.once = (match, answer) => {
    const hook = (call, normal) => {
      if (!match(call)) return undefined;
      api.hooks.splice(api.hooks.indexOf(hook), 1);
      return answer(call, normal);
    };
    api.hooks.push(hook);
  };
  api.sent = () => api.calls.filter((call) => call.method === 'POST' && /\/generations$/.test(call.url.pathname));
  api.folder = (name) => {
    const dir = path.join(root, name);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  };
  api.home = api.folder('home');
  api.state = path.join(api.home, '.config', 'ailab-v2');
  const work = api.folder('trabajo');

  api.cli = (args, { cwd = work, env = {} } = {}) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd, env: { PATH: process.env.PATH, HOME: api.home, USERPROFILE: api.home, ...env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 60000);
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, all: stdout + stderr });
    });
  });
  api.ok = async (args, options) => {
    const result = await api.cli(args, options);
    if (result.code !== 0) throw new Error(args.join(' ') + '\n' + result.all);
    return result.stdout;
  };
  api.fails = async (args, options) => {
    const result = await api.cli(args, options);
    if (result.code === 0) throw new Error('Tenía que fallar: ' + args.join(' ') + '\n' + result.all);
    return result.all;
  };
  api.login = () => api.ok(['login', '--origen', api.origin]);
  api.prepare = async (args = [], options) => {
    const out = await api.ok(['prepare', 'modelo-prueba', '--prompt', 'un zorro', ...args], options);
    const [, id, credits] = out.match(/submit ([0-9a-f-]{36}) --confirmado (\d+)/);
    return { out, id, submit: ['submit', id, '--confirmado', credits] };
  };
  return api;
}
