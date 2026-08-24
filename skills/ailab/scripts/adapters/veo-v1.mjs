// Driver dedicado para Veo: /veo/generate + /veo/record-info.
// El catalogo solo declara opciones publicas; los slugs del proveedor viven aqui.
import { gatewayPost, gatewayGet, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const body = {
    prompt: params.prompt,
    model: params.variant === 'quality' ? 'veo3' : 'veo3_fast',
    aspect_ratio: params.aspect_ratio || '16:9',
  };
  if (params.generation_type && params.generation_type !== 't2v') {
    body.generationType = params.generation_type === 'frames'
      ? 'FIRST_AND_LAST_FRAMES_2_VIDEO'
      : 'REFERENCE_2_VIDEO';
  }
  if (params.sound !== undefined) body.sound = params.sound;
  if (params.generation_type === 'frames') {
    body.imageUrls = [
      ...(uploadedByParam.first_frame || []).slice(0, 1),
      ...(uploadedByParam.last_frame || []).slice(0, 1),
    ];
  } else if (params.generation_type === 'reference') {
    body.imageUrls = (uploadedByParam.reference_images || []).slice(0, 3);
  }
  return body;
}

export async function submit(model, payload, intent = {}) {
  const n = await gatewayPost('/veo/generate', {
    ...payload,
    ...(intent.client_request_id ? { client_request_id: intent.client_request_id } : {}),
    ...(intent.max_credits_authorized ? { max_credits_authorized: intent.max_credits_authorized } : {}),
  });
  if (!n.ok) return { ok: false, normalized: n };
  const taskId = n.data && (n.data.taskId || n.data.task_id);
  if (!taskId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio taskId.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId) } };
}

export async function check(model, taskRef) {
  const n = await gatewayGet('/veo/record-info?taskId=' + encodeURIComponent(taskRef.providerRequestId));
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  const state = String(d.state || d.status || '').toLowerCase();
  const success = d.successFlag === 1 || state === 'success' || state === 'completed';
  const failed = d.successFlag === 2 || d.successFlag === 3 || ['fail','failed','error','generate_failed'].includes(state);
  if (failed) return { status: 'fail', error: d.errorMessage || d.failMsg || d.failReason || 'La generacion fallo (sin cargo).' };
  if (!success) return { status: 'pending' };
  let urls = [];
  if (d.videoUrl) urls.push(d.videoUrl);
  if (d.response && d.response.videoUrl) urls.push(d.response.videoUrl);
  if (d.response && Array.isArray(d.response.resultUrls)) urls.push(...d.response.resultUrls);
  if (d.resultJson) {
    try {
      const r = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : d.resultJson;
      if (Array.isArray(r.resultUrls)) urls.push(...r.resultUrls);
      if (r.videoUrl) urls.push(r.videoUrl);
      if (r.video_url) urls.push(r.video_url);
    } catch {}
  }
  urls = [...new Set(urls.filter(Boolean))];
  return urls.length ? { status: 'success', urls } : { status: 'fail', error: 'Completado pero sin URL de resultado.' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined
    ? n.raw.costs[taskRef.costTaskId]
    : null;
}
