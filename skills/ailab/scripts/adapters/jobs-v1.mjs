// Driver jobs-v1: modelos Kie por el camino /jobs/createTask + /jobs/recordInfo
// del gateway del wallet. Construye el payload de forma DECLARATIVA desde el
// catalogo (params validados + fixed) y extrae el resultado del record.
import { gatewayPost, gatewayGet, apiPost } from '../lib/http.mjs';
import { KLING4_ID, kling4Input } from '../lib/kling4.mjs';
import { LITE_ID, liteInput } from '../lib/seedance-lite.mjs';
import { MOTION_CONTROL_IDS } from '../lib/motion-control.mjs';

export function buildPayload(model, params, uploadedByParam) {
  // Kling 4.0 y Seedance 2.5 Lite: el servidor normaliza una forma exacta (sujetos y voces en listas de
  // objetos, campos que solo existen en una modalidad); la construye el módulo del modelo.
  if (model.id === KLING4_ID) return { model: model.id, input: kling4Input(params, uploadedByParam) };
  if (model.id === LITE_ID) return { model: model.id, input: liteInput(params, uploadedByParam) };
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

export async function submit(model, payload, intent = {}) {
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
