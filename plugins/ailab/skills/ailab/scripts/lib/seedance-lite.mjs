// Seedance 2.5 Lite (ByteDance, servido por Sume). Contrato en el servidor: `sume_lite_contract` y
// `sume_route_lite` (api/wallet/sume-gateway.php), `gateway_seedance_25_media_seconds`,
// `gateway_seedance_25_lite_billed_seconds` y `gateway_estimate_credits` (api/wallet/gateway.php).
//
// Modalidades: texto a vídeo (t2v), primer y último fotograma (i2v) y referencias (ref: imágenes, hasta
// 10 vídeos y 10 audios). Lite no edita vídeo (eso sigue en Seedance 2.5 Normal), no combina fotogramas
// con referencias y no tiene duración automática.
//
// El precio es tarifa de Sume x 1,02 por segundo. Con vídeo de referencia el servidor reserva el mayor de
// (salida + entrada) y ceil(salida x 5 / 3) a la tarifa con vídeo, y cobra el coste real; aquí se presupuesta
// esa misma reserva para que el máximo autorizado nunca quede por debajo (si lo hiciera, el servidor rechaza
// con 402).
import { inspectPricingMetadata } from './files.mjs';
import { items, measureAudios, measureVideos, seedanceCredits } from './seedance.mjs';

export const LITE_ID = 'seedance-2-5-lite';

const LABEL = 'Seedance 2.5 Lite';
const REFERENCE_SECONDS = 30.2;
const MAX_REFERENCES = 10;

// Mayor de (salida + entrada) y ceil(salida x 5 / 3), con enteros: `gateway_seedance_25_lite_billed_seconds`.
export function liteBilledSeconds(output, inputSeconds) {
  return Math.max(output + inputSeconds, Math.floor((output * 5 + 2) / 3));
}

// Valida lo que la CLI puede comprobar en local y mide los materiales de referencia. Devuelve
// { problems, inputSeconds }.
export function liteInspect(params, fileParams = {}) {
  const problems = [];
  const mode = String(params.mode ?? 't2v');
  const first = items(fileParams.first_frame_url);
  const last = items(fileParams.last_frame_url);
  const images = items(fileParams.reference_image_urls);
  const videos = items(fileParams.reference_video_urls);
  const audios = items(fileParams.reference_audio_urls);
  const frames = first.length + last.length;
  const references = images.length + videos.length + audios.length;
  const prompt = String(params.prompt ?? '');
  const result = { problems, inputSeconds: 0 };

  if (!prompt.trim()) problems.push('Seedance 2.5 Lite requiere un prompt.');
  else if (Array.from(prompt).length > 15000) problems.push('El prompt de Seedance 2.5 Lite supera los 15.000 caracteres (ahora ' + Array.from(prompt).length + ').');
  if (mode === 't2v' && (frames || references)) problems.push('Texto a vídeo (t2v) no admite imágenes ni referencias.');
  if (mode === 'i2v' && !first.length) problems.push('Imagen a vídeo (i2v) necesita --first_frame_url.');
  if (mode === 'i2v' && references) problems.push('Imagen a vídeo (i2v) no admite referencias; usa --mode ref.');
  if (mode === 'ref' && !references) problems.push('Referencias a vídeo (ref) necesita al menos una imagen, un vídeo o un audio de referencia.');
  if (mode === 'ref' && frames) problems.push('Seedance 2.5 Lite no combina fotogramas con referencias. Usa i2v o ref.');
  if (last.length && !first.length) problems.push('El último fotograma exige un primer fotograma.');
  if (images.length > 30) problems.push('Seedance 2.5 Lite admite hasta 30 imágenes de referencia.');
  if (videos.length > MAX_REFERENCES) problems.push('Se ha superado el máximo de vídeos de referencia de Seedance 2.5 Lite.');
  if (audios.length > MAX_REFERENCES) problems.push('Se ha superado el máximo de audios de referencia de Seedance 2.5 Lite.');

  for (const file of [...first, ...last, ...images]) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'image' || !['image/jpeg', 'image/png', 'image/webp'].includes(metadata.mime)) {
      problems.push('Una imagen debe ser JPG, PNG o WebP válida: ' + file + '.');
    }
  }
  problems.push(...measureAudios(audios, REFERENCE_SECONDS, LABEL));
  if (mode === 'ref') {
    const measured = measureVideos(videos, REFERENCE_SECONDS, LABEL);
    problems.push(...measured.problems);
    result.inputSeconds = measured.inputSeconds;
  }
  return result;
}

export function liteProblems(params, fileParams = {}) {
  return liteInspect(params, fileParams).problems;
}

// La misma cuenta que gateway_estimate_credits: sin vídeo, la salida; con vídeo, la tarifa con vídeo y los
// segundos de `liteBilledSeconds`.
export function liteEstimate(model, params, fileParams = {}) {
  const e = model.estimate || {};
  // `estimateCredits` recibe los parámetros y las rutas de archivo en un único objeto.
  const merged = { ...params, ...fileParams };
  const inspected = liteInspect(merged, merged);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  const output = Number(params.duration ?? 5);
  const hasVideo = items(merged.reference_video_urls).length > 0;
  const table = hasVideo ? e.credits_with_video : e.credits_per_second;
  const rate = Number(table && table[String(params.resolution ?? '720p')]);
  if (!Number.isInteger(output) || output < 4 || output > 30 || !Number.isFinite(rate) || rate <= 0) {
    return { credits: null, approximate: false, note: 'tarifa de Seedance 2.5 Lite no disponible para esta combinación' };
  }
  if (!hasVideo) return { credits: seedanceCredits(rate, output), approximate: false, note: output + ' s de salida · precio exacto' };
  const sum = output + inspected.inputSeconds;
  const billed = liteBilledSeconds(output, inspected.inputSeconds);
  return {
    credits: seedanceCredits(rate, billed),
    approximate: true,
    note: output + ' s de salida + ' + inspected.inputSeconds + ' s de vídeo de referencia = ' + sum + ' s'
      + (billed > sum ? ' (Lite con vídeo factura al menos ' + billed + ' s)' : '')
      + ' · máximo reservado; se cobra el coste real del proveedor, nunca más',
  };
}

// Entrada tal como la espera el servidor. `aspect_ratio` y `generate_audio` son obligatorios en el
// contrato; con primer fotograma el servidor fuerza `adaptive`, y aquí se envía ya así.
export function liteInput(params, uploaded = {}) {
  const mode = String(params.mode ?? 't2v');
  const input = {
    mode,
    prompt: String(params.prompt).trim(),
    resolution: String(params.resolution ?? '720p'),
    duration: Number(params.duration ?? 5),
    aspect_ratio: mode === 'i2v' ? 'adaptive' : String(params.aspect_ratio ?? 'adaptive'),
    generate_audio: params.generate_audio !== false,
  };
  if (params.draft === true) input.draft = true;
  if (mode === 'i2v') {
    const first = items(uploaded.first_frame_url);
    const last = items(uploaded.last_frame_url);
    if (first.length) input.first_frame_url = first[0];
    if (last.length) input.last_frame_url = last[0];
  } else if (mode === 'ref') {
    for (const key of ['reference_image_urls', 'reference_video_urls', 'reference_audio_urls']) {
      const list = items(uploaded[key]);
      if (list.length) input[key] = list;
    }
  }
  return input;
}
