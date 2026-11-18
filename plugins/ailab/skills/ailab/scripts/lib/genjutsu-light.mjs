// Genjutsu Light (Higgsfield). Contrato del servidor: `ailab_skill_higgsfield_spec`, `ailab_skill_higgsfield_input`,
// `ailab_skill_higgsfield_genjutsu_billable` (api/skill/higgsfield.php) y `wallet_genjutsu_light_*` (api/wallet/lib.php).
//
// Misma operación que Genjutsu (modos `character_swap` y `object_swap`, un vídeo y de 1 a 8 imágenes) con tres
// diferencias: admite 480p, 720p y 1080p, usa como mucho 15 s del vídeo y se factura por segundo total, es decir,
// la salida (que dura lo mismo que el vídeo) más el vídeo de entrada: 2 x ceil(duración medida).
//
// El servidor mide el vídeo, cotiza (`quote`), reserva lo cotizado y es siempre la autoridad. Este módulo solo avisa
// antes de subir nada (por ejemplo, un vídeo de más de 15 s).
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
