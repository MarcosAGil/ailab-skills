// Genjutsu Light (Higgsfield). Contrato del servidor: `ailab_skill_higgsfield_spec`, `ailab_skill_higgsfield_input`,
// `ailab_skill_higgsfield_genjutsu_billable` (api/skill/higgsfield.php) y `wallet_genjutsu_light_*` (api/wallet/lib.php).
//
// Misma operación que Genjutsu (modos `character_swap` y `object_swap`, un vídeo y de 1 a 8 imágenes) con tres
// diferencias: admite 480p, 720p y 1080p, usa como mucho 15 s del vídeo y se factura por segundo total, es decir,
// la salida (que dura lo mismo que el vídeo) más el vídeo de entrada: 2 x ceil(duración medida).
//
// El servidor mide el vídeo, cotiza (`quote`), reserva lo cotizado y es siempre la autoridad. Este módulo solo avisa
// antes de subir nada y calcula la misma cifra que el servidor para que el máximo autorizado nunca quede por debajo
// de la reserva (si lo hiciera, el servidor rechazaría con 402). La cuenta es exacta, con décimas de crédito enteras:
// 10,2 / 20,4 / 40,8 cr por segundo de vídeo (5,1 / 10,2 / 20,4 por segundo facturable).
import { inspectPricingMetadata } from './files.mjs';
import { phpRound } from './kling4.mjs';

export const LIGHT_ID = 'higgsfield-genjutsu-light';
export const LIGHT_MAX_VIDEO_SECONDS = 15;
export const LIGHT_MAX_PROMPT_BYTES = 5000;
export const LIGHT_TOO_LONG_MESSAGE = 'Genjutsu Light usa hasta 15 segundos de vídeo. Recórtalo a 15 s o usa la versión Normal.';

function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

// Segundos de vídeo que factura el servidor: ceil(round(duración, 6)), igual que `wallet_genjutsu_light_billable_seconds`.
export function lightVideoSeconds(duration) {
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return Math.ceil(phpRound(duration, 6));
}

// Valida lo que la CLI puede comprobar en local y mide el vídeo. Devuelve { problems, videoSeconds }:
// `videoSeconds` es null cuando la CLI no puede medir el contenedor (por ejemplo WebM, que sí mide el servidor).
export function lightInspect(params, fileParams = {}) {
  const problems = [];
  const result = { problems, videoSeconds: null };
  const prompt = String(params.prompt ?? '');
  // El servidor cuenta bytes (strlen) tras recortar espacios.
  if (Buffer.byteLength(prompt.trim(), 'utf8') > LIGHT_MAX_PROMPT_BYTES) {
    problems.push('El prompt de Genjutsu Light supera ' + LIGHT_MAX_PROMPT_BYTES + ' bytes (los caracteres con tilde o emoji ocupan más de uno).');
  }
  const videos = items(fileParams.video_url);
  for (const file of videos.slice(0, 1)) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok) {
      problems.push(metadata.error || 'No se pudo leer el vídeo: ' + file + '.');
      continue;
    }
    if (metadata.class !== 'video') {
      problems.push('El archivo de --video_url debe ser un vídeo válido: ' + file + '.');
      continue;
    }
    if (!Number.isFinite(metadata.duration)) continue;
    result.videoSeconds = lightVideoSeconds(metadata.duration);
    if (result.videoSeconds > LIGHT_MAX_VIDEO_SECONDS) problems.push(LIGHT_TOO_LONG_MESSAGE);
  }
  return result;
}

export function lightProblems(params, fileParams = {}) {
  return lightInspect(params, fileParams).problems;
}

// Décimas de crédito por segundo de vídeo, leídas de `estimate.credits_per_second` del catálogo. Si el catálogo trae
// una cifra que no es múltiplo de una décima, la cuenta entera no sería exacta y no se estima.
function tenthsPerVideoSecond(estimate, resolution) {
  const rate = Number(estimate && estimate.credits_per_second && estimate.credits_per_second[resolution]);
  const tenths = Math.round(rate * 10);
  return Number.isFinite(rate) && rate > 0 && Math.abs(rate * 10 - tenths) < 1e-9 ? tenths : null;
}

// ceil(segundos de vídeo x tarifa por segundo de vídeo): la misma cifra que `wallet_genjutsu_light_credits` con
// 2 x ceil(duración) segundos facturables.
export function lightCredits(estimate, resolution, videoSeconds) {
  const tenths = tenthsPerVideoSecond(estimate, resolution);
  if (tenths === null || !Number.isSafeInteger(videoSeconds) || videoSeconds < 1 || videoSeconds > LIGHT_MAX_VIDEO_SECONDS) return null;
  return Math.max(1, Math.floor((tenths * videoSeconds + 9) / 10));
}

export function lightEstimate(model, params, fileParams = {}) {
  const e = model.estimate || {};
  // `estimateCredits` recibe los parámetros y las rutas de archivo en un único objeto.
  const merged = { ...params, ...fileParams };
  const inspected = lightInspect(merged, merged);
  if (inspected.problems.length) return { credits: null, approximate: false, server_quote: true, note: inspected.problems[0] };
  const resolution = String(params.resolution ?? '720p');
  if (inspected.videoSeconds === null) {
    return {
      credits: null,
      approximate: true,
      server_quote: true,
      note: 'La CLI no puede medir este vídeo: lo mide y lo cotiza el servidor.',
    };
  }
  const credits = lightCredits(e, resolution, inspected.videoSeconds);
  if (credits === null) return { credits: null, approximate: true, server_quote: true, note: 'tarifa de Genjutsu Light no disponible para esta combinación: la cotiza el servidor' };
  const billable = 2 * inspected.videoSeconds;
  return {
    credits,
    approximate: false,
    server_quote: true,
    note: inspected.videoSeconds + ' s de salida + ' + inspected.videoSeconds + ' s de vídeo = ' + billable + ' s facturables · precio exacto; el servidor cotiza la misma cifra',
  };
}
