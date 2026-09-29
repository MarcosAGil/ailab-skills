// Driver sincrono para los servicios directos de voz, musica y efectos.
import { servicePost, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) {
    const spec = (model.params || {})[key] || {};
    input[key] = spec.type === 'file' ? urls[0] : urls;
  }
  if (model.id === 'eleven-tts') {
    input.voice_settings = {
      stability: input.stability,
      similarity_boost: input.similarity_boost,
      ...(input.version === 'v4' ? {} : { style: input.style, speed: input.speed }),
    };
    delete input.stability; delete input.similarity_boost; delete input.style; delete input.speed;
  }
  if (model.id === 'eleven-music') {
    input.music_length_ms = Number(input.duration_seconds || 30) * 1000;
    delete input.duration_seconds;
  }
  return { model: model.id, input };
}

export async function submit(model, payload, intent = {}) {
  const n = await servicePost('api/wallet/elevenlabs-gateway.php?action=generate', {
    action: 'generate', ...payload, ...intent,
  });
  if (!n.ok) return { ok: false, normalized: n };
  const taskId = n.data && n.data.taskId;
  const audio = n.data && n.data.audio;
  if (!taskId || (!audio && payload.input?.version !== 'v4')) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio el audio generado.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId),
    ...(payload.input?.version === 'v4' ? { version: 'v4' } : {}), immediateUrls: audio ? [audio] : [], immediateCost: n.data.credits } };
}

export async function check(model, taskRef) {
  if (taskRef.version === 'v4' || String(taskRef.serverTaskId).startsWith('el-v4:')) {
    const response = await servicePost('api/wallet/elevenlabs-gateway.php?action=v4_status', { action:'v4_status', task_id:taskRef.serverTaskId });
    if (!response.ok) return { status:'error', normalized:response };
    const data = response.data || {};
    if (data.state === 'success' && data.audio) return { status:'success', urls:[data.audio] };
    if (data.state === 'fail') return { status:'fail', error:'La generación fue rechazada, sin cargo.' };
    return { status:'pending' };
  }
  return taskRef.immediateUrls && taskRef.immediateUrls.length
    ? { status: 'success', urls: taskRef.immediateUrls }
    : { status: 'fail', error: 'La respuesta sincrona no contiene audio.' };
}

export async function realCost(taskRef) {
  if (taskRef.version === 'v4' || String(taskRef.serverTaskId).startsWith('el-v4:')) {
    const response = await apiPost({action:'task_costs'});
    const cost = response.raw?.costs?.[taskRef.costTaskId];
    return response.ok && Number.isFinite(Number(cost)) && cost !== null && cost !== undefined ? Number(cost) : null;
  }
  return Number.isFinite(Number(taskRef.immediateCost)) ? Number(taskRef.immediateCost) : null;
}
