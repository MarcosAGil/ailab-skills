import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

// Importa el adapter con una ruta de credenciales vacia. Las pruebas usan fetch
// mock y nunca deben consultar credenciales reales del entorno del desarrollador.
const adapterEnv = {
  AILAB_BASE_URL: process.env.AILAB_BASE_URL,
  AILAB_GENERATION_BASE_URL: process.env.AILAB_GENERATION_BASE_URL,
  AILAB_CONFIG_DIR: process.env.AILAB_CONFIG_DIR,
  AILAB_CREDENTIALS_DIR: process.env.AILAB_CREDENTIALS_DIR,
  AILAB_ALLOW_COOKIE_AUTH: process.env.AILAB_ALLOW_COOKIE_AUTH,
};
const adapterTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-veed-adapter-'));
const adapterConfig = path.join(adapterTemp, 'config');
const adapterCredentials = path.join(adapterTemp, 'credentials');
fs.mkdirSync(adapterConfig, { recursive: true, mode: 0o700 });
fs.mkdirSync(adapterCredentials, { recursive: true, mode: 0o700 });
process.env.AILAB_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_GENERATION_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_CONFIG_DIR = adapterConfig;
process.env.AILAB_CREDENTIALS_DIR = adapterCredentials;
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
const config = await import('../skills/ailab/scripts/lib/config.mjs');
assert.equal(config.CONFIG_DIR, adapterConfig);
assert.equal(config.CREDENTIALS_DIR, adapterCredentials);
const { estimateCredits, validateCatalogShape } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
const model = catalog.models['lipsync-veed-v2'];
const queueAdapter = await import('../skills/ailab/scripts/adapters/labs-queue-v1.mjs');
test.after(() => {
  for (const [key, value] of Object.entries(adapterEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(adapterTemp, { recursive: true, force: true });
});

test('VEED Lipsync publica un contrato remoto sin duración manual', () => {
  assert.equal(model.driver, 'labs-queue-v1');
  assert.equal(model.params.video_url.required, true);
  assert.equal(model.params.audio_url.required, true);
  assert.equal(model.params.duration_sec.internal, true);
  assert.equal(estimateCredits(model, { duration_sec: 1 }).credits, 14);
  assert.equal(estimateCredits(model, { duration_sec: 2.01 }).credits, 29);
});

test('la CLI mide el vídeo y calcula VEED antes de autorizar', (t) => {
  const available = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (available.status !== 0) return t.skip('ffmpeg no está disponible');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-veed-test-'));
  const video = path.join(temp, 'input.mp4');
  const audio = path.join(temp, 'voice.wav');
  try {
    const madeVideo = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=10:d=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    const madeAudio = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '2', audio]);
    assert.equal(madeVideo.status, 0, madeVideo.stderr && String(madeVideo.stderr));
    assert.equal(madeAudio.status, 0, madeAudio.stderr && String(madeAudio.stderr));
    const checked = spawnSync(process.execPath, [
      'skills/ailab/scripts/ailab.mjs', 'validate', 'lipsync-veed-v2',
      '--video_url', video, '--audio_url', audio,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        AILAB_SKIP_UPDATE: '1',
        AILAB_CATALOG_PATH: path.join(process.cwd(), 'skills', 'ailab', 'catalog', 'catalog.json'),
      },
    });
    assert.equal(checked.status, 0, checked.stderr);
    assert.match(checked.stdout, /estimacion ~28 cr/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('fal-gateway distingue estados pendientes, exito y fallo terminal', async () => {
  const originalFetch = globalThis.fetch;
  const taskRef = { providerRequestId: 'mock-request' };
  const media = 'https://media.invalid/veed.mp4';
  const accepted = (data, msg = '') => Response.json({ code: 200, msg, data });
  try {
    for (const status of ['IN_QUEUE', 'IN_PROGRESS']) {
      globalThis.fetch = async (url) => {
        assert.equal(new URL(url).host, 'ailendra.invalid');
        return accepted({ status });
      };
      assert.deepEqual(await queueAdapter.check(model, taskRef), { status: 'pending' });
    }

    globalThis.fetch = async (url) => {
      assert.equal(new URL(url).host, 'ailendra.invalid');
      return accepted({ status: 'COMPLETED', target: media });
    };
    assert.deepEqual(await queueAdapter.check(model, taskRef), { status: 'success', urls: [media] });

    for (const status of ['FAILED', 'ERROR', 'CANCELLED']) {
      const message = 'La generación falló. No se te ha cobrado.';
      globalThis.fetch = async (url) => {
        assert.equal(new URL(url).host, 'ailendra.invalid');
        return accepted({ status }, message);
      };
      assert.deepEqual(await queueAdapter.check(model, taskRef), { status: 'fail', error: message });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fal-gateway conserva como error un fallo transitorio del backend', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      assert.equal(new URL(url).host, 'ailendra.invalid');
      return Response.json(
        { code: 503, msg: 'Servicio temporalmente no disponible.', data: { status: 'FAILED' } },
        { status: 503 },
      );
    };
    const result = await queueAdapter.check(model, { providerRequestId: 'mock-request' });
    assert.equal(result.status, 'error');
    assert.equal(result.normalized.businessCode, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
