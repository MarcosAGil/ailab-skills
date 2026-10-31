// Modo draft de Seedance 2.5: un draft (Normal por Kie, Lite por Sume) a 480p que luego se genera a 1080p. Contrato en el
// servidor: `gateway_seedance_25_draft_error` (api/wallet/gateway.php) y api/wallet/seedance-drafts.php. Detalle para el
// agente en references/seedance-draft.md.
//
// Este módulo no toca la red: catalog.mjs lo importa y su copia firmada debe seguir siendo autónoma. El precio de 1080p sale
// siempre del servidor (`credits` del listado); la CLI nunca lo calcula, así que no hay tarifa de draft en el runtime.
export const DRAFT_UPGRADE_ID = 'seedance-2-5-draft-1080p';
export const DRAFT_MODEL_IDS = ['seedance-2-5', 'seedance-2-5-lite'];
export const DRAFTS_ENDPOINT = 'api/wallet/history.php';
// 20 drafts por página en el servidor. Un draft vigente tiene menos de 7 días y el listado va del más reciente al más antiguo.
export const MAX_DRAFT_PAGES = 50;
// La cifra del listado vale mientras dure el manifiesto.
const QUOTE_TTL_MS = 15 * 60 * 1000;

const NOTHING_CHARGED = ' No se ha cobrado nada.';
const NOT_AVAILABLE = 'Ese draft no aparece en tu cuenta o todavía no ha terminado con vídeo. Consúltalo con el comando drafts.' + NOTHING_CHARGED;
const EXPIRED = 'Ese draft ha caducado y ya no se puede generar a 1080p.' + NOTHING_CHARGED;
const BUSY = 'Ese draft ya tiene una generación a 1080p en curso o terminada.' + NOTHING_CHARGED;
const INVALID_PRICE = 'El servidor no devolvió un coste válido para ese draft.' + NOTHING_CHARGED;

const VERSIONS = { normal: 'Normal', lite: 'Lite' };
const STATES = {
  ready: 'ready (se puede generar a 1080p)',
  upgrading: 'upgrading (1080p en curso)',
  upgraded: 'upgraded (1080p terminado)',
  expired: 'expired (caducado)',
  review: 'review (1080p en revisión; no repitas el envío)',
};

// Las reglas de la puerta del servidor, con su mismo texto. La duración de 4 a 30 s ya la limita el catálogo.
export function draftProblems(params) {
  const problems = [];
  if (params.mode === 'edit') problems.push('El modo draft de Seedance 2.5 no admite Editar vídeo.' + NOTHING_CHARGED);
  if (params.resolution !== '480p') problems.push('El modo draft de Seedance 2.5 solo admite 480p.' + NOTHING_CHARGED);
  if (params.auto_duration === true) problems.push('El modo draft de Seedance 2.5 necesita una duración fija de 4 a 30 segundos.' + NOTHING_CHARGED);
  return problems;
}

export function draftsRequest(cursor = null) {
  return { action: 'seedance_drafts', cursor };
}

// El cursor del servidor es un objeto; en la terminal viaja como un texto opaco.
export function encodeDraftCursor(cursor) {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeDraftCursor(text) {
  try {
    const value = JSON.parse(Buffer.from(String(text), 'base64url').toString('utf8'));
    return value && typeof value.created_at === 'string' && typeof value.task_id === 'string'
      ? { created_at: value.created_at, task_id: value.task_id }
      : null;
  } catch { return null; }
}

export function draftNotFound() {
  return { ok: false, normalized: { kind: 'bad_request', message: NOT_AVAILABLE } };
}

// Cotización local de `prepare`: congela en el manifiesto la cifra que el servidor reservará para este draft.
export function draftQuote(draft, now = Date.now()) {
  const refuse = (message) => ({ ok: false, normalized: { kind: 'bad_request', message } });
  if (draft.status === 'expired') return refuse(EXPIRED);
  if (draft.status !== 'ready') return refuse(BUSY);
  const credits = Number(draft.credits);
  if (!Number.isSafeInteger(credits) || credits <= 0) return refuse(INVALID_PRICE);
  return {
    ok: true,
    quote: {
      quote_id: 'draft:' + draft.task_id,
      estimated_credits: credits,
      max_credits_authorized: credits,
      expires_at: new Date(now + QUOTE_TTL_MS).toISOString(),
      verified_duration_seconds: draft.output_seconds,
      note: 'Draft ' + (VERSIONS[draft.version] || draft.version) + ' de ' + draft.output_seconds + ' s · '
        + (draft.approximate ? 'es el máximo reservado: se cobra el coste real del proveedor, nunca más.' : 'precio del servidor para este draft; el cargo final nunca lo supera.'),
    },
  };
}

// Cada draft en la salida de `drafts`, con la fecha límite y el coste que el usuario necesita para decidir.
export function draftLines(draft) {
  const input = Number(draft.input_seconds) > 0 ? ' + ' + draft.input_seconds + ' s de vídeo de referencia' : '';
  const lines = [
    'task_id: ' + draft.task_id,
    '  Versión: ' + (VERSIONS[draft.version] || draft.version) + ' · duración: ' + draft.output_seconds + ' s' + input + ' · formato: ' + (draft.aspect_ratio || 'adaptive'),
    '  Estado: ' + (STATES[draft.status] || draft.status) + ' · fecha límite: ' + draft.expires_at + ' UTC',
    '  Coste de 1080p: ' + draft.credits + ' cr' + (draft.approximate ? ' como máximo (se cobra el coste real)' : ''),
    '  URL: ' + draft.video_url,
  ];
  if (draft.upgrade_task_id) lines.push('  Tarea a 1080p: ' + draft.upgrade_task_id);
  if (draft.upgrade_video_url) lines.push('  URL a 1080p: ' + draft.upgrade_video_url);
  return lines;
}
