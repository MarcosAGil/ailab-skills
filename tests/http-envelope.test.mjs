// Sobre doble del servidor AILAB: {ok, code, msg, data}. La capa HTTP debe
// entregar a los adapters el objeto anidado en `data` sin romper los sobres
// planos de api.php ({ok, user, balance}), que siguen leyendose por `raw`.
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.AILAB_GENERATION_BASE_URL = 'https://ailab.invalid/';
process.env.AILAB_CREDENTIALS_DIR = path.join(ROOT, 'tests', '.no-credentials');
const { normalize } = await import('../skills/ailab/scripts/lib/http.mjs');

const QUOTE_ID = '11111111-2222-4333-8444-555555555555';
const EXPIRES_AT = '2026-09-23T12:30:00Z';
// Sobre real de la cotizacion de Higgsfield tal y como lo devuelve el endpoint.
const REAL_ENVELOPE = {
  ok: true,
  code: 200,
  msg: 'Presupuesto calculado.',
  data: { credits: 50, quote_id: QUOTE_ID, expires_at: EXPIRES_AT },
};

test('el sobre {ok, code, msg, data} expone data anidado y conserva el cuerpo en raw', () => {
  const result = normalize(200, REAL_ENVELOPE, 'application/json');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'ok');
  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.data, REAL_ENVELOPE.data, 'Los adapters leen el coste en response.data.');
  assert.equal(result.data.credits, 50);
  assert.equal(result.data.quote_id, QUOTE_ID);
  assert.equal(result.data.expires_at, EXPIRES_AT);
  assert.equal(result.raw, REAL_ENVELOPE, 'El sobre completo sigue disponible en raw.');
  assert.notEqual(result.data, result.raw);
});

test('los sobres planos sin data anidado no cambian de forma', () => {
  const legacy = { ok: true, user: { email: 'cuenta@example.test', tier: 'hub' }, balance: 1000 };
  const result = normalize(200, legacy, 'application/json');
  assert.equal(result.ok, true);
  assert.equal(result.data, legacy, 'api.php mantiene data = cuerpo completo.');
  assert.equal(result.raw, legacy);
  assert.equal(result.data.balance, 1000);

  for (const body of [{ ok: true, url: 'https://media.invalid/a.png' }, { ok: true }, { ok: true, data: null }, { ok: true, data: 'plano' }, { ok: true, data: ['a'] }]) {
    const flat = normalize(200, body, 'application/json');
    assert.equal(flat.ok, true);
    assert.equal(flat.data, body, 'Solo un data que sea objeto se desanida: ' + JSON.stringify(body));
  }
});

test('un sobre doble de fallo conserva el cuerpo y no se marca como exito', () => {
  const failure = normalize(402, { ok: false, code: 402, msg: 'Saldo insuficiente.', data: { required: 50, balance: 10 } }, 'application/json');
  assert.equal(failure.ok, false);
  assert.equal(failure.httpStatus, 402);
  assert.deepEqual(failure.data, { required: 50, balance: 10 });
  assert.equal(failure.raw.code, 402);

  const httpFailure = normalize(200, { ok: false, code: 200, msg: 'Rechazado.', data: {} }, 'application/json');
  assert.equal(httpFailure.ok, false, 'ok:false con HTTP 200 nunca es exito.');
  assert.equal(httpFailure.raw.msg, 'Rechazado.');
});

test('el adapter de Higgsfield cotiza con el sobre doble real', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json(REAL_ENVELOPE);
  };
  try {
    const adapter = await import('../skills/ailab/scripts/adapters/higgsfield-v1.mjs');
    const model = { id: 'soul-2', server_model: 'higgsfield-soul-2', params: { prompt: {} }, estimate: { max_credits: 1000 } };
    const payload = adapter.buildPayload(model, { prompt: 'retrato' }, {});
    const quoted = await adapter.quote(model, payload, { client_request_id: 'r1' });
    assert.equal(calls, 1);
    assert.equal(quoted.ok, true);
    assert.equal(quoted.quote.quote_id, QUOTE_ID);
    assert.equal(quoted.quote.estimated_credits, 50, 'Antes del arreglo el adapter no encontraba credits en el sobre doble.');
    assert.equal(quoted.quote.max_credits_authorized, 1000, 'Sin maximo cotizado el tope de seguridad acota la cotizacion.');
    assert.equal(quoted.quote.hard_cap_credits, 1000);
    assert.equal(quoted.quote.expires_at, EXPIRES_AT);
  } finally { globalThis.fetch = originalFetch; }
});
