// Driver AILAB para Topaz. La CLI solo habla con el gateway de AILAB: la
// credencial, la subida al proveedor, la liquidación y la idempotencia viven en
// topaz-gateway.php y nunca se reproducen aquí.
import { servicePost, apiPost } from '../lib/http.mjs';

export function buildPayload(model, params, uploadedByParam) {
  const input = { ...params };
  for (const [key, urls] of Object.entries(uploadedByParam)) {
    const spec = (model.params || {})[key] || {};
    input[key] = spec.type === 'file' ? urls[0] : urls;
  }
  // Son mediciones locales exigidas para validar y cotizar, pero el servidor
  // vuelve a medirlas y no deben convertirse en parámetros del proveedor.
  delete input.output_megapixels;
  delete input.frame_count;
  return { model: model.id, input };
}

export async function submit(model, payload, intent = {}) {
  const response = await servicePost('api/wallet/topaz-gateway.php?action=submit', {
    action: 'submit', ...payload, ...intent,
  });
  if (!response.ok) return { ok: false, normalized: response };
  const requestId = response.data && response.data.request_id;
  if (!requestId) {
    return {
      ok: false,
      normalized: { ...response, ok: false, kind: 'invalid_response', message: 'El servidor no devolvio request_id.' },
    };
  }
  const providerRequestId = String(requestId);
  return {
    ok: true,
    taskRef: {
      serverTaskId: 'topaz:' + providerRequestId,
      providerRequestId,
      costTaskId: 'topaz:' + providerRequestId,
      adapter: 'topaz-v1',
    },
  };
}

export async function check(model, taskRef) {
  const response = await servicePost('api/wallet/topaz-gateway.php?action=status', {
    action: 'status', request_id: taskRef.providerRequestId,
  });
  if (!response.ok) {
    if (response.businessCode === 422) return { status: 'fail', error: response.message || 'El procesamiento no pudo completarse.' };
    return { status: 'error', normalized: response };
  }
  const data = response.data || {};
  const status = String(data.status || '').toUpperCase();
  if (status === 'COMPLETED') {
    const url = data.result_url || data.image;
    return url ? { status: 'success', urls: [url] } : { status: 'fail', error: 'Completado pero sin URL de resultado.' };
  }
  if (['FAILED', 'CANCELLED', 'ERROR'].includes(status)) return { status: 'fail', error: 'El procesamiento no pudo completarse.' };
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const response = await apiPost({ action: 'task_costs' });
  return response.ok && response.raw && response.raw.costs && response.raw.costs[taskRef.costTaskId] !== undefined
    ? response.raw.costs[taskRef.costTaskId] : null;
}
