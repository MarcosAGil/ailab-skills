import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-updater-test-'));
process.env.AILAB_CONFIG_DIR = temporary;
process.env.AILAB_UPDATE_RETRY_MS = '60000';
const { checkAndMaybeUpdate } = await import('../skills/ailab/scripts/lib/updater.mjs');

test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

test('una instalación fallida entra en cooldown y no se relanza en cada comando', async () => {
  let manifestRequests = 0;
  let installRequests = 0;
  const envelope = {
    signed: {
      version: '2.2.0',
      minimum_supported_runtime: '2.1.0',
    },
  };
  const options = {
    manifestFetcher: async () => {
      manifestRequests++;
      return envelope;
    },
    releaseInstaller: async () => {
      installRequests++;
      return { ok: false, message: 'HTTP 429 al descargar runtime.' };
    },
  };

  const first = await checkAndMaybeUpdate(options);
  assert.equal(first.ok, false);
  assert.equal(manifestRequests, 1);
  assert.equal(installRequests, 1);

  const second = await checkAndMaybeUpdate(options);
  assert.equal(second.ok, true);
  assert.equal(manifestRequests, 1);
  assert.equal(installRequests, 1);

  const meta = JSON.parse(fs.readFileSync(path.join(temporary, 'runtime', 'update-meta.json'), 'utf8'));
  assert.match(meta.retry_after_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(meta.error, /HTTP 429/);
});
