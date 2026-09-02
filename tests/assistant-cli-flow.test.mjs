import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function waitForPort(child) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('El mock no publicó su puerto.')), 5000);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = /^(\d+)\s*$/m.exec(output);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error('El mock terminó antes de arrancar: ' + code));
    });
  });
}

test('la CLI usa el modelo fijo y reintenta una respuesta inválida sin otra confirmación', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-assistant-cli-'));
  const config = path.join(temp, 'config');
  const credentials = path.join(temp, 'credentials');
  const log = path.join(temp, 'requests.ndjson');
  fs.mkdirSync(credentials, { recursive: true });
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'A'.repeat(48) + '\n', { mode: 0o600 });
  const server = spawn(process.execPath, [path.join(ROOT, 'tests', 'fixtures', 'assistant-cli-mock.mjs')], {
    env: { ...process.env, AILAB_MOCK_LOG: log },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => {
    server.kill();
    fs.rmSync(temp, { recursive: true, force: true });
  });
  const port = await waitForPort(server);
  const base = `http://127.0.0.1:${port}/`;
  const env = {
    ...process.env,
    AILAB_SKIP_UPDATE: '1',
    AILAB_BASE_URL: base,
    AILAB_GENERATION_BASE_URL: base,
    AILAB_ASSISTANTS_URL: base + 'api/v1/skill/assistants.json',
    AILAB_ASSISTANT_ENDPOINT: base + 'api/v1/skill/assistant.php',
    AILAB_CONFIG_DIR: config,
    AILAB_CREDENTIALS_DIR: credentials,
  };
  const cli = path.join(ROOT, 'skills', 'ailab', 'scripts', 'ailab.mjs');
  const prepared = await execFileAsync(process.execPath, [cli, 'assistant-prepare', 'image-prompter', '--model', 'claude-sonnet-4-6', '--message', 'Mejora este prompt.'], { env });
  assert.match(prepared.stdout, /Modelo fijo: Gemini 3\.5 Flash Lite · OpenRouter · Priority/);
  assert.match(prepared.stdout, /confirmacion unica del plan/);
  const requestId = /Peticion: ([0-9a-f-]{36})/.exec(prepared.stdout)?.[1];
  assert.ok(requestId);

  const submitted = await execFileAsync(process.execPath, [cli, 'assistant-submit', requestId, '--confirmed'], { env });
  assert.match(submitted.stdout, /Reintentando una vez dentro del plan ya autorizado/);
  assert.match(submitted.stdout, /Prompt final devuelto por Gemini 3\.5 Flash Lite/);
  assert.match(submitted.stdout, /Coste: 9 cr · saldo: 991 cr/);
  const requests = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.client_request_id, requestId);
  assert.equal(requests[1].body.client_request_id, requestId);
  assert.equal(requests[0].body.model_id, 'gemini-3-5-flash-lite-priority');
  assert.equal(requests[0].body.assistant_id, 'image-prompter');
});
