import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-http-test-'));
const credentials = path.join(temporary, 'credentials');
fs.mkdirSync(credentials, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'a'.repeat(40) + '\n', { mode: 0o600 });

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response('<html><body>Too many requests</body></html>', {
  status: 429,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '17',
    'Connection': 'close',
  },
});

process.env.AILAB_GENERATION_BASE_URL = 'https://ailab.invalid/';
process.env.AILAB_CREDENTIALS_DIR = credentials;
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
const { apiPost, explain } = await import('../skills/ailab/scripts/lib/http.mjs');

test.after(() => {
  globalThis.fetch = originalFetch;
  fs.rmSync(temporary, { recursive: true, force: true });
});

test('un 429 no JSON conserva su tipo y el tiempo de espera', async () => {
  const result = await apiPost({ action: 'me' });
  assert.equal(result.ok, false);
  assert.equal(result.kind, 'rate_limited');
  assert.equal(result.httpStatus, 429);
  assert.equal(result.retryAfterSeconds, 17);
  assert.match(explain(result), /Espera 17 s/);
  assert.match(explain(result), /unico reintento/);
});
