// Driver dedicado para la generacion principal de Suno.
import { gatewayPost, gatewayGet, apiPost } from '../lib/http.mjs';

const VERSIONS = { v5_5: 'V5_5', v5: 'V5', v4_5plus: 'V4_5PLUS', v4_5: 'V4_5', v4: 'V4' };

export function buildPayload(model, params) {
  const body = {
    prompt: params.prompt || '',
    model: VERSIONS[params.version] || VERSIONS.v5_5,
    instrumental: !!params.instrumental,
    customMode: !!params.custom_mode,
    callBackUrl: 'https://ailendra.com/callback',
  };
  if (params.custom_mode) {
    if (params.title) body.title = params.title;
    if (params.style) body.style = params.style;
    if (params.lyrics) body.prompt = params.lyrics;
    if (params.negative_tags) body.negativeTags = params.negative_tags;
    if (params.vocal_gender) body.vocalGender = params.vocal_gender;
    if (params.style_weight !== undefined) body.styleWeight = params.style_weight;
  }
  return body;
}

export async function submit(model, payload, intent = {}) {
  const n = await gatewayPost('/generate', { ...payload, ...intent });
  if (!n.ok) return { ok: false, normalized: n };
  const taskId = n.data && n.data.taskId;
  if (!taskId) return { ok: false, normalized: { ...n, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio taskId.' } };
  return { ok: true, taskRef: { serverTaskId: String(taskId), providerRequestId: String(taskId), costTaskId: String(taskId) } };
}

export async function check(model, taskRef) {
  const n = await gatewayGet('/generate/record-info?taskId=' + encodeURIComponent(taskRef.providerRequestId));
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  const state = String(d.status || d.state || '').toLowerCase();
  const success = state === 'success' || d.successFlag === 1;
  const failed = ['failed','fail','error','generate_failed'].includes(state) || d.successFlag === 2 || d.successFlag === 3;
  if (failed) return { status: 'fail', error: d.errorMessage || d.failMsg || d.failReason || 'La generacion fallo (sin cargo).' };
  if (!success) return { status: 'pending' };
  const tracks = d.response && Array.isArray(d.response.sunoData) ? d.response.sunoData : [];
  const urls = tracks.map((track) => track.audioUrl || track.streamAudioUrl).filter(Boolean);
  return urls.length ? { status: 'success', urls } : { status: 'fail', error: 'Completado pero sin pistas de audio.' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined ? n.raw.costs[taskRef.costTaskId] : null;
}
