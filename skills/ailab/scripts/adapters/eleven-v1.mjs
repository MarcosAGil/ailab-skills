// Driver sincrono para los servicios directos de voz, musica y efectos.
import { servicePost } from '../lib/http.mjs';

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
      style: input.style,
      speed: input.speed,
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
  if (!taskId || !audio) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio el audio generado.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId), immediateUrls: [audio], immediateCost: n.data.credits } };
}

export async function check(model, taskRef) {
  return taskRef.immediateUrls && taskRef.immediateUrls.length
    ? { status: 'success', urls: taskRef.immediateUrls }
    : { status: 'fail', error: 'La respuesta sincrona no contiene audio.' };
}

export async function realCost(taskRef) {
  return Number.isFinite(Number(taskRef.immediateCost)) ? Number(taskRef.immediateCost) : null;
}
