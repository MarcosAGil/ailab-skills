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
  if (['flux-3', 'ideogram-v45'].includes(model.id)) {
    // AILAB enruta por mode; solo se admiten campos públicos del contrato.
    // Nunca reenviar metadatos locales, tarifas ni opciones privadas de fal.
    const keys = model.id === 'flux-3'
      ? ['mode', 'prompt', 'resolution', 'aspect_ratio']
      : ['mode', 'prompt', 'quality', 'image_size', 'num_images', 'seed', ...(params.mode === 'edit' ? ['edit_precision'] : ['enable_prompt_expansion'])];
    const input = Object.fromEntries(keys.filter(key => params[key] !== undefined).map(key => [key, params[key]]));
    if (params.mode === 'edit') {
      const images = uploadedByParam.image_urls;
      const max = model.id === 'flux-3' ? 10 : 5;
      if (!Array.isArray(images) || images.length < 1 || images.length > max || images.some(url => typeof url !== 'string' || !url.trim())) {
        throw new Error('La edición necesita de 1 a ' + max + ' imágenes subidas, en su orden original.');
      }
      input.image_urls = [...images];
    }
    return { model: model.id, input };
  }
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
  if (String(d.status).trim().toUpperCase() === 'COMPLETED') {
    const imageUrls = Array.isArray(d.images)
      ? d.images.map((image) => typeof image === 'string' ? image : image && image.url).filter(Boolean)
      : [];
    const candidates = ['flux-3', 'ideogram-v45'].includes(model.id)
      ? imageUrls
      : [...imageUrls, d.target, d.residual, d.image, d.audio];
    const urls = candidates.filter(url => typeof url === 'string' && url.trim());
    return urls.length ? { status: 'success', urls } : { status: 'pending', recoveryRequired: true };
  }
  // Solo una respuesta aceptada por el gateway con uno de estos estados
  // confirma que la tarea termino. Los estados desconocidos siguen en cola,
  // mientras que los errores de transporte/negocio ya salen arriba como error.
  const status = String(d.status || '').trim().toUpperCase();
  if (['FAILED', 'ERROR', 'CANCELLED'].includes(status)) {
    return {
      status: 'fail',
      error: n.message || d.error || d.errorMessage || d.failMsg || 'La generacion fallo; consulta su liquidacion en el Historial.',
    };
  }
  return { status: 'pending' };
}

export async function realCost(taskRef) {
  const n = await apiPost({ action: 'task_costs' });
  return n.ok && n.raw && n.raw.costs && n.raw.costs[taskRef.costTaskId] !== undefined ? n.raw.costs[taskRef.costTaskId] : null;
}
