// Falso `api/v1/skill/price.php` (contrato «precio-opaco-historial-2026-11-18», sección 4) para las pruebas de la CLI.
// Desde la 2.5.0 la CLI no conoce ninguna tarifa: cada importe sale de aquí. Las pruebas fijan las respuestas en
// `state` y comprueban lo que la CLI envió en `state.priceRequests`.
//
//   state.prices[modelo]       número | null | objeto de respuesta | (params, body) => número | null | objeto
//   state.defaultCredits       importe de un modelo sin entrada (por omisión 10)
//   state.priceInfo[modelo]    líneas de `info` (por omisión una línea con el importe de `estimate` sin params)
//   state.assistantPrices      { assistants: {...}, billing: {...} } de la acción `assistants`
//   state.priceDown            true: 503 sin cuerpo útil (AILAB no da precio)
//   state.priceError           { status, body } para un rechazo concreto (400 `invalid_params`, 401...)
export const PRICE_PATH = '/api/v1/skill/price.php';

export const DEFAULT_ASSISTANT_PRICES = Object.freeze({
  assistants: {
    'image-prompter': { estimated_credits: 11, max_authorized_credits: 48 },
    'audio-prompter': { estimated_credits: 11, max_authorized_credits: 48 },
    'video-prompter': { estimated_credits: 11, max_authorized_credits: 48 },
    'free-assistant': { estimated_credits: 11, max_authorized_credits: 48 },
  },
  billing: { max_authorized_credits: 160 },
});

function estimateBody(state, body) {
  const prices = state.prices || {};
  let entry = Object.prototype.hasOwnProperty.call(prices, body.model) ? prices[body.model] : (state.defaultCredits ?? 10);
  if (typeof entry === 'function') entry = entry(body.params || {}, body);
  if (entry === null || typeof entry === 'number') entry = { credits: entry };
  return { ok: true, credits: null, approximate: false, note: '', expensive: false, server_quote: false, ...entry };
}

// Devuelve { status, body } para una petición a price.php, o null si `pathname` no es price.php.
export function priceReply(state, pathname, body) {
  if (!String(pathname).endsWith(PRICE_PATH)) return null;
  state.priceRequests = state.priceRequests || [];
  state.priceRequests.push(body);
  if (state.priceDown) return { status: 503, body: { ok: false, error: 'Mantenimiento.' } };
  if (state.priceError) return state.priceError;
  if (body.action === 'estimate') return { status: 200, body: estimateBody(state, body) };
  if (body.action === 'info') {
    const lines = state.priceInfo && state.priceInfo[body.model];
    if (lines) return { status: 200, body: { ok: true, lines } };
    const estimate = estimateBody(state, { ...body, params: {} });
    return { status: 200, body: { ok: true, lines: ['Precio: ' + (estimate.credits === null ? 'según la solicitud' : estimate.credits + ' cr') + ' por generación.'] } };
  }
  if (body.action === 'assistants') return { status: 200, body: { ok: true, ...(state.assistantPrices || DEFAULT_ASSISTANT_PRICES) } };
  return { status: 400, body: { ok: false, code: 'invalid_action', error: 'Acción desconocida. No se ha cobrado nada.' } };
}

// Atajo para servidores http de las pruebas: responde y devuelve true si la petición era de price.php.
export function handlePrice(state, pathname, body, res) {
  const reply = priceReply(state, pathname, body);
  if (!reply) return false;
  res.writeHead(reply.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(reply.body));
  return true;
}

// Para pruebas en proceso que sustituyen globalThis.fetch: respuesta de price.php o null.
export function priceResponse(state, url, init = {}) {
  const pathname = new URL(String(url)).pathname;
  let body = {};
  try { body = init.body ? JSON.parse(String(init.body)) : {}; } catch { body = {}; }
  const reply = priceReply(state, pathname, body);
  if (!reply) return null;
  return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'Content-Type': 'application/json' } });
}

export const estimates = (state) => (state.priceRequests || []).filter((r) => r.action === 'estimate');
