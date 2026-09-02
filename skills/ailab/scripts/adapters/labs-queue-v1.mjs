import { servicePost, apiPost } from '../lib/http.mjs';

function withUploads(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) {
    const type = model.params && model.params[key] && model.params[key].type;
    input[key] = type === 'file' ? urls[0] : urls;
  }
  return input;
}

export function buildPayload(model, params, uploadedByParam) {
  return { model: model.id, input: withUploads(model, params, uploadedByParam) };
}

export async function submit(model, payload, intent = {}) {
  const n = await servicePost('api/wallet/fal-gateway.php?action=submit', { action: 'submit', ...payload, ...intent });
  if (!n.ok) return { ok: false, normalized: n };
  const requestId = n.data && n.data.request_id;
  if (!requestId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio request_id.' } };
  return { ok: true, taskRef: { serverTaskId: 'fal:' + requestId, providerRequestId: String(requestId), costTaskId: 'fal:' + requestId, adapter: 'labs-queue-v1' } };
}

export async function check(model, taskRef) {
  const n = await servicePost('api/wallet/fal-gateway.php?action=status', { action: 'status', request_id: taskRef.providerRequestId });
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  if (String(d.status).toUpperCase() === 'COMPLETED') {
    const urls = [d.target, d.residual, d.image, d.audio].filter(Boolean);
    return urls.length ? { status: 'success', urls } : { status: 'fail', error: 'Completado pero sin URL de resultado.' };
  }
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined ? n.raw.costs[taskRef.costTaskId] : null;
}
