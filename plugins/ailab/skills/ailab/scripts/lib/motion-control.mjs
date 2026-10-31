// Kling 2.6 y 3.0 Motion Control. La salida dura lo que el vídeo de movimiento y Kie cobra por él, así que el coste sale del
// vídeo y no de `--duration`. Contrato en el servidor: `gateway_source_video_billing` y `gateway_estimate_credits`
// (api/wallet/gateway.php). El vídeo se redondea al segundo superior, entre 3 y 30 s. Si la CLI no puede medirlo (WebM, por
// ejemplo) autoriza el peor caso de 30 s, el mismo que reserva el servidor sin medición. El cálculo vive aquí y no en el
// catálogo porque las CLI anteriores rechazan el catálogo entero ante una clave de `estimate` que no conocen.
import { inspectPricingMetadata } from './files.mjs';
import { phpRound } from './kling4.mjs';

export const MOTION_CONTROL_IDS = ['kling-2-6-motion-control', 'kling-3-0-motion-control'];

const MIN_SECONDS = 3;
const MAX_SECONDS = 30;

// Segundos facturables del primer vídeo. `measured` indica si salen de una medición.
export function motionSeconds(file) {
  const metadata = file ? inspectPricingMetadata(file) : null;
  if (!metadata || !metadata.ok || metadata.class !== 'video' || !Number.isFinite(metadata.duration) || metadata.duration <= 0) {
    return { seconds: MAX_SECONDS, measured: false };
  }
  return { seconds: Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, Math.ceil(phpRound(metadata.duration, 3)))), measured: true };
}

export function motionEstimate(model, params) {
  const e = model.estimate || {};
  const rate = Number((e.credits_per_second || {})[params[e.by_param]]);
  if (!Number.isFinite(rate) || rate <= 0) return { credits: null, approximate: true, note: 'estimacion no disponible' };
  const videos = Array.isArray(params.video_urls) ? params.video_urls : [params.video_urls];
  const { seconds, measured } = motionSeconds(videos[0]);
  const note = measured
    ? seconds + ' s medidos del vídeo · máximo reservado; el cargo final es el consumo confirmado, nunca más'
    : 'Vídeo sin medir: máximo de ' + seconds + ' s reservado; el cargo final es el consumo confirmado, nunca más';
  return { credits: Math.ceil(rate * seconds), approximate: !!e.approximate, note };
}
