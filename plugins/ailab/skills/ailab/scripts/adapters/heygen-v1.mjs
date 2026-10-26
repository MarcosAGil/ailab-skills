// Driver asincrono para Avatar Photo-to-Video.
import { servicePost, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) input[key] = urls[0];
  input.title = input.title || 'AILAB · avatar';
  return { model: model.id, input };
}

export async function submit(model, payload, intent = {}) {
  const n = await servicePost('api/wallet/heygen-gateway.php?action=submit', { action: 'submit', ...payload, ...intent });
  if (!n.ok) return { ok: false, normalized: n };
  const videoId = n.data && n.data.video_id;
  if (!videoId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio video_id.' } };
  return { ok: true, taskRef: { serverTaskId: 'heygen:' + videoId, providerRequestId: String(videoId), costTaskId: 'heygen:' + videoId } };
}

export async function check(model, taskRef) {
  const n = await servicePost('api/wallet/heygen-gateway.php?action=status', { action: 'status', video_id: taskRef.providerRequestId });
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  if (String(d.status).toUpperCase() === 'COMPLETED') {
    return d.video_url ? { status: 'success', urls: [d.video_url] } : { status: 'fail', error: 'Completado pero sin URL de video.' };
  }
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined ? n.raw.costs[taskRef.costTaskId] : null;
}
