import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateCatalogShape } from '../skills/ailab/scripts/lib/catalog.mjs';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { handlePrice, estimates } from './helpers/price-server.mjs';

import { inspectPricingMetadata } from '../skills/ailab/scripts/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'skills/ailab/catalog/catalog.json');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(CATALOG, 'utf8')));
const model = catalog.models['sam-audio'];
const execute = promisify(execFile);

// Falso price.php: validate con sesión pide el precio orientativo a AILAB con la duración medida en local.
async function validateWithPrice(t, directory, args, prices) {
  const state = { prices };
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    if (handlePrice(state, new URL(req.url, 'http://x').pathname, body, res)) return;
    res.writeHead(500); res.end('Petición inesperada en una prueba sin gasto');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const credentials = path.join(directory, 'credentials-precio');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'V'.repeat(48), { mode: 0o600 });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_CATALOG_PATH: path.join(ROOT, 'skills/ailab/catalog/catalog.json'), AILAB_CONFIG_DIR: path.join(directory, 'config-precio'), AILAB_CREDENTIALS_DIR: credentials, AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base };
  let result;
  try { result = { status: 0, ...(await execute(process.execPath, [path.join(ROOT, 'skills/ailab/scripts/ailab.mjs'), 'validate', ...args], { env, timeout: 30000 })) }; }
  catch (error) { result = { status: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; }
  return { ...result, sent: estimates(state) };
}


function wavFixture(directory, seconds) {
  const sampleRate = 8000;
  const bytes = sampleRate * seconds * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(bytes, 40);
  const output = path.join(directory, 'sam-' + seconds + 's.wav');
  fs.writeFileSync(output, wav);
  return output;
}

test('el catálogo público expone SAM Audio text-guided con runtime 2.1.12', () => {
  assert.ok(model);
  assert.deepEqual(model.modes, ['text-guided']);
  assert.equal(model.min_cli_version, '2.1.12');
  assert.equal(model.params.duration_seconds.internal, true);
  assert.equal(model.estimate, undefined, 'el precio por bloques lo da AILAB');
});

test('la skill mide el audio local y AILAB presupuesta con esa duración', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-sam-skill-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const audio = wavFixture(dir, 31);
  const metadata = inspectPricingMetadata(audio);
  assert.equal(metadata.ok, true);
  assert.equal(metadata.duration, 31);

  const run = spawnSync(process.execPath, [
    'skills/ailab/scripts/ailab.mjs', 'validate', 'sam-audio',
    '--audio_url', audio,
    '--prompt', 'Isolate the main human speaking voice.'
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: CATALOG, AILAB_CONFIG_DIR: path.join(dir, 'config'), AILAB_CREDENTIALS_DIR: path.join(dir, 'credentials'), AILAB_BASE_URL: 'http://127.0.0.1:9/' }
  });
  assert.equal(run.status, 0, run.stderr);
  // Sin sesión no hay precio: validate remite a prepare.
  assert.match(run.stdout, /el precio lo da `prepare`/);
  const priced = await validateWithPrice(t, dir, ['sam-audio', '--audio_url', audio, '--prompt', 'Isolate the main human speaking voice.'], { 'sam-audio': 21 });
  assert.equal(priced.status, 0, priced.stderr);
  assert.match(priced.stdout, /estimacion ~21 cr/);
  assert.equal(priced.sent.length, 1);
  assert.equal(priced.sent[0].params.duration_seconds, 31);
  assert.equal(priced.sent[0].params.audio_url[0].duration, 31);
  assert.doesNotMatch(JSON.stringify(priced.sent), /sam-31s/);
});

test('el adapter recupera target y residual y la subida admite FLAC', () => {
  const adapter = fs.readFileSync(path.join(ROOT, 'skills/ailab/scripts/adapters/labs-queue-v1.mjs'), 'utf8');
  const runtime = fs.readFileSync(path.join(ROOT, 'skills/ailab/scripts/pg.mjs'), 'utf8');
  assert.match(adapter, /\[\.\.\.imageUrls, d\.target, d\.residual, d\.image, d\.audio\]/);
  assert.match(runtime, /'audio\/flac': 'flac'/);
});
