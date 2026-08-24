// Driver jobs-v1: modelos Kie por el camino /jobs/createTask + /jobs/recordInfo
// del gateway del wallet. Construye el payload de forma DECLARATIVA desde el
// catalogo (params validados + fixed) y extrae el resultado del record.
import { gatewayPost, gatewayGet, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const input = { ...(model.fixed || {}) };
  for (const [k, v] of Object.entries(params)) input[k] = v;
  for (const [k, urls] of Object.entries(uploadedByParam)) {
    const spec = (model.params || {})[k] || {};
    input[k] = spec.type === 'file' ? urls[0] : urls;
  }
  return { model: model.id, input };
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
