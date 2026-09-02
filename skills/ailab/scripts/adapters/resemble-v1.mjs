import { servicePost, apiPost } from '../lib/http.mjs';

function withUploads(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) {
    input[key] = model.params && model.params[key] && model.params[key].type === 'file' ? urls[0] : urls;
  }
  return input;
}

export function buildPayload(model, params, uploadedByParam) {
  return { model: model.id, input: withUploads(model, params, uploadedByParam) };
}

export async function submit(model, payload, intent = {}) {
  const response = await servicePost('api/wallet/resemble-gateway.php?action=submit', { action: 'submit', ...payload, ...intent });
  if (!response.ok) return { ok: false, normalized: response };
  const taskId = response.data && response.data.task_id;
  if (!taskId) return { ok: false, normalized: { ...response, ok: false, kind: 'invalid_response', message: 'El servidor no devolvió task_id.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId), adapter: 'resemble-v1' } };
}

export async function check(model, taskRef) {
  const response = await servicePost('api/wallet/resemble-gateway.php?action=status', { action: 'status', task_id: taskRef.providerRequestId });
  if (!response.ok) return { status: 'error', normalized: response };
  const data = response.data || {};
  const status = String(data.status || '').toUpperCase();
  if (status === 'COMPLETED') return data.audio ? { status: 'success', urls: [data.audio] } : { status: 'fail', error: 'La mejora terminó sin WAV final.' };
  if (status === 'FAILED') return { status: 'fail', error: response.message || 'La mejora no se pudo completar.' };
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const response = await apiPost({ action: 'task_costs' });
  return response.ok && response.raw && response.raw.costs && response.raw.costs[taskRef.costTaskId] !== undefined
    ? response.raw.costs[taskRef.costTaskId] : null;
}
