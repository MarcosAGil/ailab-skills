// Driver jobs-v1: modelos Kie por el camino /jobs/createTask + /jobs/recordInfo
// del gateway del wallet. Construye el payload de forma DECLARATIVA desde el
// catalogo (params validados + fixed) y extrae el resultado del record.
import { gatewayPost, gatewayGet, apiPost, servicePost, serviceGet } from '../lib/http.mjs';
import { KLING4_ID, kling4Input } from '../lib/kling4.mjs';
import { LITE_ID, liteInput } from '../lib/seedance-lite.mjs';
import { MOTION_CONTROL_IDS } from '../lib/motion-control.mjs';
import { DRAFTS_ENDPOINT, MAX_DRAFT_PAGES, draftNotFound, draftQuote, draftsRequest } from '../lib/seedance-draft.mjs';
import {
  OMNI12_ID, OMNI12_EXTEND_ID, OMNI_RESOURCE_IDS, OMNI_RESOURCE_ENDPOINT, OMNI12_VIDEOS_ENDPOINT, OMNI12_MAX_PAGES,
  omni12Input, omni12ExtendInput, omni12ExtendQuote, omni12VideoNotFound, omni12VideosRequest,
  omniResourceAction, omniResourceInput, omniResourceText,
} from '../lib/omni12.mjs';

export function buildPayload(model, params, uploadedByParam) {
  // Kling 4.0 y Seedance 2.5 Lite: el servidor normaliza una forma exacta (sujetos y voces en listas de
  // objetos, campos que solo existen en una modalidad); la construye el módulo del modelo.
  if (model.id === KLING4_ID) return { model: model.id, input: kling4Input(params, uploadedByParam) };
  if (model.id === LITE_ID) return { model: model.id, input: liteInput(params, uploadedByParam) };
  // Gemini Omni Flash 1.2 (Kie), su Extend y los recursos de Gemini Omni: cada modalidad lleva solo sus campos.
  if (model.id === OMNI12_ID) return { model: model.id, input: omni12Input(params, uploadedByParam) };
  if (model.id === OMNI12_EXTEND_ID) return { model: model.id, input: omni12ExtendInput(params, uploadedByParam) };
  if (OMNI_RESOURCE_IDS.includes(model.id)) return { model: model.id, input: omniResourceInput(model, params, uploadedByParam) };
  const input = { ...(model.fixed || {}) };
  for (const [k, v] of Object.entries(params)) input[k] = v;
  for (const [k, urls] of Object.entries(uploadedByParam)) {
    const spec = (model.params || {})[k] || {};
    input[k] = spec.type === 'file' ? urls[0] : urls;
  }
  const payload = { model: model.id, input };
  // Seedance 2.5: la duración automática se pide con duration -1 (como la web). El servidor reserva 30 s en ese caso, que es
  // lo que presupuesta la CLI; con `auto_duration` suelto reservaba la duración numérica y generaba otra cosa.
  if (model.id === 'seedance-2-5' && input.auto_duration === true) {
    input.duration = -1;
    delete input.auto_duration;
  }
  // Kling O3 Transformación: la duración la marca el vídeo de origen, que mide el servidor, y la web no envía `duration`.
  // La CLI autoriza la cota de 16 s, que cubre cualquier reserva.
  if (model.id === 'kling-o3' && input.mode === 'transform') delete input.duration;
  // Motion Control: la duración no viaja al proveedor y tampoco fija el precio: el servidor mide el vídeo, igual que la CLI.
  if (MOTION_CONTROL_IDS.includes(model.id)) delete input.duration;
  return payload;
}

// Extend de Gemini Omni Flash 1.2: la cotización es la cifra que el servidor da para ese vídeo y esa duración en el
// listado de vídeos extensibles (`credits_by_duration`), la misma que reserva al enviar.
async function omni12ExtendQuoteFor(payload) {
  let cursor = null;
  for (let page = 0; page < OMNI12_MAX_PAGES; page++) {
    const n = await servicePost(OMNI12_VIDEOS_ENDPOINT, omni12VideosRequest(cursor));
    if (!n.ok) return { ok: false, normalized: n };
    const videos = Array.isArray(n.data?.videos) ? n.data.videos : [];
    const found = videos.find((video) => video.task_id === payload.input.task_id);
    if (found) return omni12ExtendQuote(found, payload.input.duration);
    if (!n.data?.has_more || !n.data?.next_cursor) break;
    cursor = n.data.next_cursor;
  }
  return omni12VideoNotFound();
}

// Paso a 1080p de un draft: la cotización es el `credits` que el servidor da para ese draft en el listado. No hay endpoint de
// cotización: la puerta del gateway solo admite model, input, client_request_id y max_credits_authorized.
export async function quote(model, payload) {
  if (model.id === OMNI12_EXTEND_ID) return omni12ExtendQuoteFor(payload);
  let cursor = null;
  for (let page = 0; page < MAX_DRAFT_PAGES; page++) {
    const n = await servicePost(DRAFTS_ENDPOINT, draftsRequest(cursor));
    if (!n.ok) return { ok: false, normalized: n };
    const drafts = Array.isArray(n.data?.drafts) ? n.data.drafts : [];
    const found = drafts.find((draft) => draft.task_id === payload.input.draft_task_id);
    if (found) return draftQuote(found);
    if (!n.data?.has_more || !n.data?.next_cursor) break;
    cursor = n.data.next_cursor;
  }
  return draftNotFound();
}

// Character ID y Voice ID: omni-resource.php los crea en el acto, gratis, y registra una tarea ya terminada.
async function submitResource(model, payload, intent) {
  const body = { input: payload.input, ...(intent.client_request_id ? { client_request_id: intent.client_request_id } : {}) };
  const n = await servicePost(OMNI_RESOURCE_ENDPOINT + '?action=' + omniResourceAction(model), body);
  if (!n.ok) return { ok: false, normalized: n };
  const taskId = n.data && n.data.taskId;
  const resource = n.data && n.data.resource;
  if (!taskId || !resource || !resource.resource_id) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvió el recurso creado. Revisa el historial antes de reintentar.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId), resource } };
}

async function checkResource(taskRef) {
  if (taskRef.resource && taskRef.resource.resource_id) return { status: 'success', texts: [omniResourceText(taskRef.resource)], urls: [] };
  const n = await serviceGet(OMNI_RESOURCE_ENDPOINT, { action: 'status', task_id: taskRef.providerRequestId });
  if (!n.ok) return { status: 'error', normalized: n };
  const resource = n.data && n.data.resource;
  if (String(n.data?.state) === 'success' && resource && resource.resource_id) return { status: 'success', texts: [omniResourceText(resource)], urls: [] };
  return { status: 'fail', error: 'El recurso no se creó.' };
}

export async function submit(model, payload, intent = {}) {
  if (OMNI_RESOURCE_IDS.includes(model.id)) return submitResource(model, payload, intent);
  const body = {
    ...payload,
    ...(intent.client_request_id ? { client_request_id: intent.client_request_id } : {}),
    ...(intent.max_credits_authorized ? { max_credits_authorized: intent.max_credits_authorized } : {}),
  };
  const n = await gatewayPost('/jobs/createTask', body);
  if (!n.ok) return { ok: false, normalized: n };
  const taskId = n.data && n.data.taskId;
  if (!taskId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio taskId.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId) } };
}

// Una consulta de estado. Devuelve {status:'pending'|'success'|'fail', urls, error, normalized}
export async function check(model, taskRef) {
  if (OMNI_RESOURCE_IDS.includes(model.id)) return checkResource(taskRef);
  const recordPath = model.record_path || '/jobs/recordInfo';
  const n = await gatewayGet(recordPath + '?taskId=' + encodeURIComponent(taskRef.providerRequestId));
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  const state = String(d.state || '').toLowerCase();
  if (state === 'success') {
    let urls = [];
    try {
      const rj = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : (d.resultJson || {});
      if (Array.isArray(rj.resultUrls)) urls = rj.resultUrls.filter(Boolean);
      const layers = Array.isArray(rj.layers_data)
        ? rj.layers_data
        : (rj.resultObject && Array.isArray(rj.resultObject.layers_data) ? rj.resultObject.layers_data : []);
      urls.push(...layers.map((layer) => layer && (layer.url || layer.image_url)).filter(Boolean));
      const segments = Array.isArray(rj.segments)
        ? rj.segments
        : (rj.resultObject && Array.isArray(rj.resultObject.segments) ? rj.resultObject.segments : []);
      urls.push(...segments.map((segment) => segment && (segment.maskUrl || segment.mask_url)).filter(Boolean));
    } catch { /* abajo */ }
    if (!urls.length && Array.isArray(d.resultUrls)) urls = d.resultUrls.filter(Boolean);
    if (!urls.length && model.id === 'nano-banana-2-1') return { status: 'pending' };
    if (!urls.length) return { status: 'fail', error: 'Completado pero sin URLs de resultado.' };
    return { status: 'success', urls };
  }
  if (state === 'fail') {
    return { status: 'fail', error: d.failMsg || d.errorMessage || 'La generacion fallo (sin cargo).' };
  }
  return { status: 'pending' };
}

// Coste real liquidado (tras exito): api.php task_costs usa el id persistido.
export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  if (n.ok && n.raw && n.raw.costs && typeof n.raw.costs[taskRef.costTaskId] !== 'undefined') {
    return n.raw.costs[taskRef.costTaskId];
  }
  return null;
}
