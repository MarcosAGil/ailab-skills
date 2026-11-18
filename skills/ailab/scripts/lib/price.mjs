// Precios desde el servidor (contrato «precio-opaco-historial-2026-11-18», sección 4). Desde la 2.5.0 la CLI no
// conoce ninguna tarifa: `prepare`, `validate`, `info`, `assistants` y `assistant-prepare` piden el importe a
// `POST api/v1/skill/price.php`, que ya devuelve el precio de la cuenta. Si el servidor no responde, no se envía nada.
//
// Acciones:
//   estimate   { action, model, params } -> { credits (entero o null), approximate, note, expensive, server_quote,
//              max_credits (opcional: techo de la cuenta para los modelos que cotiza el servidor) }
//   info       { action, model }         -> { lines: [texto] }
//   assistants { action }                -> { assistants: { id: { estimated_credits, max_authorized_credits } },
//                                            billing: { max_authorized_credits } }
//
// Los archivos no viajan a price.php: cada ruta local de un parámetro de archivo se sustituye por lo que la CLI mide
// de él (clase, tipo, tamaño, dimensiones y duración), en el mismo orden. Nunca se envían la ruta ni el hash.
import { pricePost, explain } from './http.mjs';
import { inspectPricingMetadata } from './files.mjs';

export const PRICE_UNAVAILABLE_TEXT = 'No se ha podido obtener el precio de AILAB. No se ha enviado nada.';
const NOTHING_SENT = ' No se ha enviado nada.';
const MAX_LINES = 80;
const MAX_LINE = 600;
const MAX_NOTE = 1000;

// Medida de un archivo tal como la usa el servidor para presupuestar. Un archivo que no se puede medir viaja como
// { ok: false } y el servidor decide (normalmente sin importe o con el máximo de su regla).
export function measureFile(file) {
  const metadata = inspectPricingMetadata(String(file));
  if (!metadata || !metadata.ok) return { ok: false };
  const measured = { ok: true, class: metadata.class, mime: metadata.mime, size: metadata.size };
  for (const key of ['width', 'height', 'pixels', 'duration']) {
    if (Number.isFinite(metadata[key])) measured[key] = metadata[key];
  }
  return measured;
}

// Parámetros de `estimate`: los validados más, por cada parámetro de archivo, la lista de medidas.
export function priceParams(params, fileParams = {}) {
  const result = { ...(params || {}) };
  for (const [param, files] of Object.entries(fileParams || {})) {
    result[param] = (Array.isArray(files) ? files : [files]).map(measureFile);
  }
  return result;
}

function body(response) {
  const raw = response && response.raw && typeof response.raw === 'object' ? response.raw : {};
  const nested = raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : null;
  return nested || raw;
}

// Mensaje para un rechazo de price.php. Sin respuesta útil del servidor (red, 5xx, JSON roto) el texto es siempre
// el mismo: no se ha enviado nada. Un 400 del motor (`unknown_model`, `invalid_params`) trae su propio mensaje.
export function priceFailure(response) {
  if (!response) return PRICE_UNAVAILABLE_TEXT;
  if (['network', 'timeout', 'server_error', 'invalid_response'].includes(response.kind)) return PRICE_UNAVAILABLE_TEXT;
  if (['session_expired', 'rate_limited'].includes(response.kind)) return explain(response) + NOTHING_SENT;
  const message = String(response.message || '').trim();
  if (!message) return PRICE_UNAVAILABLE_TEXT;
  return /No se ha (cobrado|enviado) nada\.?$/.test(message) ? message : message + NOTHING_SENT;
}

const isCredits = (value) => Number.isSafeInteger(value) && value >= 0;

// Presupuesto de una generación con el precio de la cuenta. Devuelve { ok, price } o { ok: false, error }.
export async function priceEstimate(modelId, params, fileParams = {}) {
  const response = await pricePost({ action: 'estimate', model: String(modelId), params: priceParams(params, fileParams) });
  if (!response.ok) return { ok: false, error: priceFailure(response), response };
  const data = body(response);
  const credits = data.credits === null || data.credits === undefined ? null : data.credits;
  if (credits !== null && !isCredits(credits)) return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
  if (data.max_credits !== undefined && data.max_credits !== null && !(Number.isSafeInteger(data.max_credits) && data.max_credits > 0)) {
    return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
  }
  return {
    ok: true,
    price: {
      credits,
      approximate: data.approximate === true,
      note: typeof data.note === 'string' ? data.note.slice(0, MAX_NOTE) : '',
      expensive: data.expensive === true,
      server_quote: data.server_quote === true,
      max_credits: Number.isSafeInteger(data.max_credits) ? data.max_credits : null,
    },
  };
}

// Líneas de precio de `info`, ya con el precio de la cuenta.
export async function priceInfo(modelId) {
  const response = await pricePost({ action: 'info', model: String(modelId) });
  if (!response.ok) return { ok: false, error: priceFailure(response), response };
  const lines = body(response).lines;
  if (!Array.isArray(lines) || lines.length > MAX_LINES || lines.some((line) => typeof line !== 'string')) {
    return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
  }
  return { ok: true, lines: lines.map((line) => line.slice(0, MAX_LINE)) };
}

// Importes orientativos y máximos de los asistentes con el precio de la cuenta.
export async function priceAssistants() {
  const response = await pricePost({ action: 'assistants' });
  if (!response.ok) return { ok: false, error: priceFailure(response), response };
  const data = body(response);
  const raw = data.assistants;
  const billingMax = data.billing && typeof data.billing === 'object' ? data.billing.max_authorized_credits : undefined;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !(Number.isSafeInteger(billingMax) && billingMax > 0)) {
    return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
  }
  const assistants = {};
  for (const [id, item] of Object.entries(raw)) {
    if (!item || typeof item !== 'object') return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
    const estimated = item.estimated_credits;
    const maximum = item.max_authorized_credits;
    if (!(Number.isSafeInteger(estimated) && estimated > 0) || !(Number.isSafeInteger(maximum) && maximum >= estimated && maximum <= billingMax)) {
      return { ok: false, error: PRICE_UNAVAILABLE_TEXT, response };
    }
    assistants[id] = { estimated_credits: estimated, max_authorized_credits: maximum };
  }
  return { ok: true, assistants, billing: { max_authorized_credits: billingMax } };
}
