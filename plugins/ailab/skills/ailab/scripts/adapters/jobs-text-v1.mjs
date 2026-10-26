// Variante del driver jobs para resultados textuales, como Speech-to-Text.
import * as jobs from './jobs-v1.mjs';
import { gatewayGet } from '../lib/http.mjs';

export const buildPayload = jobs.buildPayload;
export const submit = jobs.submit;
export const realCost = jobs.realCost;

export async function check(model, taskRef) {
  const n = await gatewayGet('/jobs/recordInfo?taskId=' + encodeURIComponent(taskRef.providerRequestId));
  if (!n.ok) return { status: 'error', normalized: n };
  const d = n.data || {};
  const state = String(d.state || d.status || '').toLowerCase();
  if (state === 'fail' || state === 'failed' || state === 'error' || d.successFlag === 0) {
    return { status: 'fail', error: d.failMsg || d.errorMessage || 'La tarea fallo (sin cargo).' };
  }
  if (state !== 'success' && state !== 'completed' && d.successFlag !== 1) return { status: 'pending' };
  try {
    const r = typeof d.resultJson === 'string' ? JSON.parse(d.resultJson) : (d.resultJson || {});
    const value = r.text || r.resultText || (r.response && (r.response.text || r.response.resultText));
    if (value) return { status: 'success', texts: [String(value)] };
    return { status: 'success', texts: [JSON.stringify(r, null, 2)] };
  } catch {
    return { status: 'success', texts: [String(d.resultJson || '')] };
  }
}
