import { servicePost, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) input[key] = urls;
  return { model: model.id, input };
}

export async function submit(model, payload, intent = {}) {
  const n = await servicePost('api/wallet/apimart-gateway.php?action=submit', { action: 'submit', ...payload, ...intent });
  if (!n.ok) return { ok: false, normalized: n };
  const requestId = n.data && n.data.request_id;
  if (!requestId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio request_id.' } };
  return { ok: true, taskRef: { serverTaskId: 'apimart:' + requestId, providerRequestId: String(requestId), costTaskId: 'apimart:' + requestId, adapter: 'labs-queue-multi-v1' } };
}

export async function check(model, taskRef) {
  const n = await servicePost('api/wallet/apimart-gateway.php?action=status', { action: 'status', request_id: taskRef.providerRequestId });
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  if (String(d.status).toUpperCase() === 'COMPLETED') {
    const urls = [...(Array.isArray(d.images) ? d.images : []), ...(Array.isArray(d.videos) ? d.videos : [])].filter(Boolean);
    return urls.length ? { status: 'success', urls } : { status: 'fail', error: 'Completado pero sin URLs de resultado.' };
  }
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined ? n.raw.costs[taskRef.costTaskId] : null;
}
