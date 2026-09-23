// Driver AILAB para Higgsfield (SOUL 2 y Genjutsu). La CLI solo habla con
// /api/skill/higgsfield.php: la credencial del proveedor, la verificacion del
// video y de las referencias, la reserva y la liquidacion viven en el servidor.
// Este modulo NUNCA recibe ni envia la clave del proveedor; si algun dia se
// enviara, el servidor la rechazaria y se filtraria al historial local.
//
// Contrato de dos fases:
//   1) quote  (POST ?action=quote)  exige max_credits_authorized y devuelve la
//      cotizacion del servidor: credits (estimacion real), billable_seconds,
//      expires_at y max_credits_authorized.
//   2) create (POST ?action=create) se envia con el maximo APROBADO en el
//      manifiesto, nunca con un maximo inventado aqui y nunca por encima de lo
//      aprobado ni por encima del maximo que cotizo el servidor. Antes de
//      llamar al proveedor exige la cotizacion verificada (quote_id), su
//      caducidad vigente y el maximo cotizado por el servidor; si falta algo
//      rechaza en local, sin red.
// El estado se consulta con GET ?action=status&taskId=ID.
//
// El tope configurado (hard cap) es solo la cota de seguridad de la cotizacion:
// acota lo que se autoriza a cotizar, no lo que se aprueba. La aprobacion real
// es la estimacion que el manifiesto congela tras el quote.
import { servicePost, serviceGet, apiPost } from '../lib/http.mjs';

const ENDPOINT = 'api/skill/higgsfield.php';

// IDs publicos del servidor de AILAB. El catalogo usa nombres locales cortos;
// la traduccion vive aqui para que el catalogo pueda renombrarse sin tocar el
// contrato del servidor. Si el catalogo ya usa el ID del servidor se respeta.
const SERVER_MODEL_IDS = {
  'soul-2': 'higgsfield-soul-2',
  'genjutsu': 'higgsfield-genjutsu-motion-transfer',
};

// Cota de seguridad por modelo del servidor. El catalogo puede sobrescribirla
// (max_credits / hard_cap_credits); estos valores son el respaldo verificado.
const HARD_CREDIT_CAPS = {
  'higgsfield-soul-2': 1000,
  'higgsfield-genjutsu-motion-transfer': 2100,
};

// Campos que jamas deben viajar desde la CLI: la credencial es del servidor.
const FORBIDDEN_FIELDS = /^(api[_-]?key|apikey|key|token|secret|password|authorization|credential|access[_-]?key|provider[_-]?(key|secret|token))$/i;

// Forma del identificador de cotizacion. El servidor puede devolver un UUID o
// un id opaco; un id opaco se respeta tal cual, pero si empieza con una cabecera
// de UUID tiene que ser un UUID completo y bien formado: un id truncado o con la
// version mal puesta no debe viajar en el create.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_HEAD_RE = /^[0-9a-f]{8}-/i;

function quoteIdProblem(value) {
  if (typeof value !== 'string' || !value.trim()) return 'missing';
  const id = value.trim();
  if (id.length > 200 || /[\s\u0000-\u001f]/.test(id)) return 'malformed';
  if (UUID_HEAD_RE.test(id) && !UUID_RE.test(id)) return 'malformed';
  return null;
}

function hasForbiddenFields(value, depth = 0) {
  if (depth > 6 || value === null || typeof value !== 'object') return false;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELDS.test(key)) return true;
    if (hasForbiddenFields(child, depth + 1)) return true;
  }
  return false;
}

export function serverModelId(model) {
  const explicit = (model && (model.server_model || model.provider_model || model.api_model)) || '';
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const id = String((model && model.id) || '');
  if (id.startsWith('higgsfield-')) return id;
  return SERVER_MODEL_IDS[id] || null;
}

export function hardCreditCap(model) {
  const estimate = (model && model.estimate) || {};
  for (const candidate of [estimate.max_credits, estimate.max_credits_authorized, model && model.max_credits, model && model.hard_cap_credits]) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }
  const id = serverModelId(model);
  return id && HARD_CREDIT_CAPS[id] ? HARD_CREDIT_CAPS[id] : null;
}

function positiveNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function inputWithFiles(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam || {})) {
    const spec = (model.params || {})[key] || {};
    input[key] = spec.type === 'file' ? urls[0] : urls;
  }
  return input;
}

// Genjutsu recibe el modo ARRIBA (modelo + mode) y su input no debe repetirlo.
// Los modelos de un solo modo no lo envian: su modo es el contrato del modelo.
function resolveMode(model, input) {
  const modes = Array.isArray(model.modes) ? model.modes.map(String) : [];
  if (modes.length < 2) return { ok: true, mode: null };
  const declared = (model.params && model.params.mode) || {};
  const chosen = String((input && input.mode) || declared.default || '').trim();
  if (!modes.includes(chosen)) {
    return { ok: false, error: 'El modo no es valido para este modelo: usa ' + modes.join(' o ') + '.' };
  }
  return { ok: true, mode: chosen };
}

export function buildPayload(model, params, uploadedByParam) {
  const input = inputWithFiles(model, params, uploadedByParam);
  const resolved = resolveMode(model, input);
  delete input.mode;
  return {
    model: serverModelId(model) || String((model && model.id) || ''),
    mode: resolved.ok ? resolved.mode : null,
    input,
  };
}

function localRejection(message) {
  return {
    ok: false,
    normalized: {
      ok: false,
      kind: 'local_quote',
      httpStatus: 0,
      businessCode: null,
      message,
      data: null,
      raw: null,
    },
  };
}

// Respuesta 200 con cuerpo inservible: se normaliza como invalid_response.
function invalidResponse(response, message) {
  return { ok: false, normalized: { ...response, ok: false, kind: 'invalid_response', message } };
}

// Comprobaciones que NO llaman al proveedor: contrato resoluble, modo valido y
// ningun campo de credencial en el cuerpo.
function payloadRejection(model, payload) {
  if (!serverModelId(model)) {
    return 'Este modelo no declara el identificador que espera el servidor de Higgsfield. Actualiza AILAB antes de continuar; no se ha llamado al proveedor.';
  }
  const resolved = resolveMode(model, payload.input);
  if (!resolved.ok) return resolved.error + ' No se ha llamado al proveedor.';
  if (hasForbiddenFields(payload.input)) {
    return 'Los parametros incluyen un campo de credencial. La clave del proveedor es del servidor y no debe viajar desde la CLI; no se ha llamado al proveedor.';
  }
  return null;
}

// Maximo que se puede autorizar en la cotizacion: el tope configurado (o el
// --max-credits del manifiesto, si es mas bajo). Es una cota, no una aprobacion.
function quoteCeiling(model, intent) {
  const cap = hardCreditCap(model);
  if (cap === null) return null;
  const requested = positiveNumber(intent && intent.max_credits_authorized);
  return requested === null ? cap : Math.min(requested, cap);
}

// Maximo APROBADO en el manifiesto: lo que el usuario autorizo (y con lo que se
// pidio la cotizacion). Los sinonimos cubren manifiestos ya emitidos;
// quote_max_credits queda como ultimo recurso, nunca por encima de lo autorizado.
function approvedMaximum(intent) {
  for (const candidate of [intent && intent.max_credits_authorized, intent && intent.approved_credits, intent && intent.estimated_credits, intent && intent.quote_max_credits]) {
    const value = positiveNumber(candidate);
    if (value !== null) return value;
  }
  return null;
}

// Maximo cotizado por el servidor y congelado por prepare tras el quote.
function serverQuoteCeiling(intent) {
  return positiveNumber(intent && intent.quote_max_credits);
}

function requestBody(action, model, payload, extra) {
  return {
    action,
    ...extra,
    model: payload.model,
    ...(payload.mode ? { mode: payload.mode } : {}),
    input: payload.input,
  };
}

// action=quote: el servidor mide el video y las referencias y devuelve la
// cotizacion. Se pide con el mismo client_request_id del manifiesto para que el
// servidor pueda hacerla idempotente.
export async function quote(model, payload, intent = {}) {
  const rejection = payloadRejection(model, payload);
  if (rejection) return localRejection(rejection);
  const ceiling = quoteCeiling(model, intent);
  if (ceiling === null) {
    return localRejection('Este modelo no tiene un tope de creditos configurado, asi que no se puede cotizar con seguridad. Actualiza AILAB; no se ha llamado al proveedor.');
  }
  const response = await servicePost(ENDPOINT + '?action=quote', requestBody('quote', model, payload, {
    ...(intent.client_request_id ? { client_request_id: String(intent.client_request_id) } : {}),
    max_credits_authorized: ceiling,
  }));
  if (!response.ok) return { ok: false, normalized: response };

  const data = response.data || {};
  const credits = positiveNumber(data.credits !== undefined ? data.credits : data.estimated_credits);
  if (credits === null) {
    return invalidResponse(response, 'El servidor no devolvio el coste cotizado.');
  }
  // Sin identificador de cotizacion no hay nada que congelar en el manifiesto:
  // el create no podria demostrar que existe una cotizacion verificada.
  const quoteId = quoteIdProblem(data.quote_id);
  if (quoteId) {
    return invalidResponse(response, quoteId === 'missing'
      ? 'El servidor no devolvio el identificador de la cotizacion (quote_id). No se ha autorizado nada.'
      : 'El servidor devolvio un identificador de cotizacion mal formado. No se ha autorizado nada.');
  }
  // La caducidad la fija el servidor: si no llega o no se puede leer, la
  // cotizacion no se puede considerar vigente en el submit.
  const expiresAt = typeof data.expires_at === 'string' ? data.expires_at.trim() : '';
  if (!expiresAt || !Number.isFinite(Date.parse(expiresAt))) {
    return invalidResponse(response, 'El servidor no devolvio una caducidad valida para la cotizacion (expires_at). No se ha autorizado nada.');
  }
  const serverMaximum = positiveNumber(data.max_credits_authorized);
  const billable = positiveNumber(data.billable_seconds !== undefined ? data.billable_seconds : data.verified_duration_seconds);
  return {
    ok: true,
    quote: {
      quote_id: String(data.quote_id).trim(),
      estimated_credits: credits,
      billable_seconds: billable,
      verified_duration_seconds: billable,
      // El maximo autorizado por el servidor nunca supera la cota de seguridad.
      max_credits_authorized: serverMaximum === null ? ceiling : Math.min(serverMaximum, ceiling),
      hard_cap_credits: ceiling,
      expires_at: expiresAt,
    },
  };
}

// action=create: envia la cotizacion congelada y el maximo aprobado. Nunca
// inventa un maximo, nunca supera lo aprobado y nunca supera el tope.
export async function submit(model, payload, intent = {}) {
  const payloadIssue = payloadRejection(model, payload);
  if (payloadIssue) return localRejection(payloadIssue);

  const nonce = intent && intent.client_request_id;
  if (typeof nonce !== 'string' || !nonce.trim()) {
    return localRejection('Falta client_request_id: sin el, el envio no es idempotente. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  // Cotizacion verificada del manifiesto. Los cuatro rechazos siguientes son
  // locales: sin quote_id, sin maximo cotizado, por encima de ese maximo o con
  // la caducidad ausente, ilegible o pasada, no se llama al proveedor.
  const quoteIssue = quoteIdProblem(intent && intent.quote_id);
  if (quoteIssue) {
    return localRejection(quoteIssue === 'missing'
      ? 'El manifiesto no tiene la cotizacion verificada del servidor (quote_id). Vuelve a ejecutar prepare; no se ha llamado al proveedor.'
      : 'La cotizacion del manifiesto trae un quote_id mal formado. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  const ceiling = serverQuoteCeiling(intent);
  if (ceiling === null) {
    return localRejection('El manifiesto no tiene el maximo cotizado por el servidor. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  const approved = approvedMaximum(intent);
  if (approved === null) {
    return localRejection('Este modelo exige una cotizacion aprobada antes de enviar: el manifiesto no tiene el maximo autorizado. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  if (approved > ceiling) {
    return localRejection('El maximo autorizado (' + approved + ' cr) supera el maximo que cotizo el servidor (' + ceiling + ' cr). Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  const cap = hardCreditCap(model);
  if (cap === null) {
    return localRejection('Este modelo no tiene un tope de creditos configurado. Actualiza AILAB; no se ha llamado al proveedor.');
  }
  if (approved > cap) {
    return localRejection('El maximo aprobado (' + approved + ' cr) supera el tope del contrato (' + cap + ' cr). Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  const expires = intent && intent.quote_expires_at;
  if (expires === undefined || expires === null || String(expires).trim() === '') {
    return localRejection('La cotizacion aprobada no trae caducidad (quote_expires_at), asi que no se puede comprobar que siga vigente. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  const parsed = Date.parse(String(expires));
  if (!Number.isFinite(parsed)) {
    return localRejection('La cotizacion aprobada no tiene una caducidad valida. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }
  if (Date.now() > parsed) {
    return localRejection('La cotizacion aprobada ha caducado. Vuelve a ejecutar prepare; no se ha llamado al proveedor.');
  }

  // El maximo enviado es el menor de los tres limites: lo aprobado, lo cotizado
  // por el servidor y el tope del contrato. Jamas por encima de ninguno.
  const submittedMaximum = Math.min(approved, ceiling, cap);

  const response = await servicePost(ENDPOINT + '?action=create', requestBody('create', model, payload, {
    client_request_id: nonce,
    max_credits_authorized: submittedMaximum,
    quote_id: String(intent.quote_id).trim(),
  }));
  if (!response.ok) return { ok: false, normalized: response };

  const data = response.data || {};
  const requestId = data.taskId || data.request_id || data.task_id || data.id;
  if (!requestId) {
    return invalidResponse(response, 'El servidor no devolvio el identificador de la tarea.');
  }
  const providerRequestId = String(requestId);
  return {
    ok: true,
    taskRef: {
      serverTaskId: 'higgsfield:' + providerRequestId,
      providerRequestId,
      costTaskId: 'higgsfield:' + providerRequestId,
      adapter: 'higgsfield-v1',
      max_credits_authorized: submittedMaximum,
    },
  };
}

function firstUrl(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) return candidate;
  }
  return null;
}

function resultUrls(data) {
  const list = [];
  if (Array.isArray(data.urls)) {
    for (const url of data.urls) if (typeof url === 'string' && url) list.push(url);
  }
  if (Array.isArray(data.results)) {
    for (const item of data.results) {
      const url = item && typeof item === 'object' ? firstUrl(item.url, item.result_url, item.video_url) : (typeof item === 'string' ? item : null);
      if (url) list.push(url);
    }
  }
  if (!list.length) {
    const single = firstUrl(data.result_url, data.video_url, data.output_url, data.url);
    if (single) list.push(single);
  }
  return [...new Set(list)];
}

// action=status va por GET con el id de la tarea en la query (?taskId=).
export async function check(model, taskRef) {
  const taskId = taskRef && (taskRef.providerRequestId || taskRef.taskId);
  if (typeof taskId !== 'string' || !taskId.trim()) {
    return { status: 'error', normalized: { ok: false, kind: 'invalid_response', httpStatus: 0, businessCode: null, message: 'La tarea no tiene identificador de Higgsfield.', data: null, raw: null } };
  }
  const response = await serviceGet(ENDPOINT, { action: 'status', taskId });
  if (!response.ok) {
    if (response.businessCode === 422) return { status: 'fail', error: response.message || 'El procesamiento no pudo completarse.' };
    return { status: 'error', normalized: response };
  }
  const data = response.data || {};
  const status = String(data.status || data.state || '').toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'SUCCEEDED', 'DONE'].includes(status)) {
    const urls = resultUrls(data);
    return urls.length ? { status: 'success', urls } : { status: 'fail', error: 'Completado pero sin URL de resultado.' };
  }
  if (['FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'ERROR', 'EXPIRED'].includes(status)) {
    return { status: 'fail', error: 'El procesamiento no pudo completarse.' };
  }
  return { status: 'pending' };
}

// Coste real y saldo siguen usando la wallet compartida de AILAB.
export async function realCost(taskRef) {
  const response = await apiPost({ action: 'task_costs' });
  if (!response.ok || !response.raw || !response.raw.costs) return null;
  const costs = response.raw.costs;
  if (costs[taskRef.costTaskId] !== undefined) return costs[taskRef.costTaskId];
  return costs[taskRef.providerRequestId] !== undefined ? costs[taskRef.providerRequestId] : null;
}
