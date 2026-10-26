// Seedance 2.5 Lite (ByteDance, servido por Sume). Contrato en el servidor: `sume_lite_contract` y
// `sume_route_lite` (api/wallet/sume-gateway.php), `gateway_seedance_25_lite_video_seconds` y
// `gateway_estimate_credits` (api/wallet/gateway.php).
//
// Modalidades: texto a vídeo (t2v), primer y último fotograma (i2v) y referencias (ref: imágenes, un
// vídeo y un audio). Lite no edita vídeo (eso sigue en Seedance 2.5 Normal), no combina fotogramas con
// referencias y no tiene duración automática.
//
// El precio es tarifa de Sume x 1,02 por segundo. Con un vídeo de referencia el servidor reserva
// (salida + segundos del vídeo, medidos por él) y cobra el coste real; aquí se presupuesta esa misma
// reserva para que el máximo autorizado nunca quede por debajo (si lo hiciera, el servidor rechaza con 402).
import { inspectPricingMetadata } from './files.mjs';
import { phpRound } from './kling4.mjs';

export const LITE_ID = 'seedance-2-5-lite';

function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

// Valida lo que la CLI puede comprobar en local y mide el vídeo de referencia. Devuelve
// { problems, inputSeconds, exactSeconds }.
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
  const result = { problems, inputSeconds: 0, exactSeconds: 0 };

  if (!prompt.trim()) problems.push('Seedance 2.5 Lite requiere un prompt.');
  else if (Array.from(prompt).length > 15000) problems.push('El prompt de Seedance 2.5 Lite supera los 15.000 caracteres (ahora ' + Array.from(prompt).length + ').');
  if (mode === 't2v' && (frames || references)) problems.push('Texto a vídeo (t2v) no admite imágenes ni referencias.');
  if (mode === 'i2v' && !first.length) problems.push('Imagen a vídeo (i2v) necesita --first_frame_url.');
  if (mode === 'i2v' && references) problems.push('Imagen a vídeo (i2v) no admite referencias; usa --mode ref.');
  if (mode === 'ref' && !references) problems.push('Referencias a vídeo (ref) necesita al menos una imagen, un vídeo o un audio de referencia.');
  if (mode === 'ref' && frames) problems.push('Seedance 2.5 Lite no combina fotogramas con referencias. Usa i2v o ref.');
  if (last.length && !first.length) problems.push('El último fotograma exige un primer fotograma.');
  if (images.length > 30) problems.push('Seedance 2.5 Lite admite hasta 30 imágenes de referencia.');
  if (videos.length > 1) problems.push('Seedance 2.5 Lite admite un único vídeo de referencia.');
  if (audios.length > 1) problems.push('Seedance 2.5 Lite admite un único audio de referencia.');

  for (const file of [...first, ...last, ...images]) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'image' || !['image/jpeg', 'image/png', 'image/webp'].includes(metadata.mime)) {
      problems.push('Una imagen debe ser JPG, PNG o WebP válida: ' + file + '.');
    }
  }
  for (const file of audios) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'audio') problems.push('El audio de referencia debe ser un audio válido y medible: ' + file + '.');
  }
  if (mode === 'ref') {
    for (const file of videos) {
      const metadata = inspectPricingMetadata(file);
      if (!metadata.ok || metadata.class !== 'video' || !['video/mp4', 'video/quicktime'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
        problems.push('El vídeo de referencia debe ser un MP4 o MOV medible (la CLI no puede medir WebM): ' + file + '.');
        continue;
      }
      // El servidor suma la duración sin redondear para el tope y cada vídeo al segundo superior para cobrar.
      result.exactSeconds += metadata.duration;
      result.inputSeconds += Math.ceil(phpRound(metadata.duration, 3));
    }
    if (result.exactSeconds > 30.2 + 1e-9) {
      problems.push('Los vídeos de referencia de Seedance 2.5 Lite no pueden sumar más de 30 segundos (ahora ' + phpRound(result.exactSeconds, 2) + ' s).');
    }
  }
  return result;
}

export function liteProblems(params, fileParams = {}) {
  return liteInspect(params, fileParams).problems;
}

// ceil(round(tarifa x (salida + entrada), 6)): la misma cuenta que gateway_estimate_credits.
export function liteEstimate(model, params, fileParams = {}) {
  const e = model.estimate || {};
  // `estimateCredits` recibe los parámetros y las rutas de archivo en un único objeto.
  const merged = { ...params, ...fileParams };
  const inspected = liteInspect(merged, merged);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  const output = Number(params.duration ?? 5);
  const rate = Number(e.credits_per_second && e.credits_per_second[String(params.resolution ?? '720p')]);
  if (!Number.isInteger(output) || output < 4 || output > 30 || !Number.isFinite(rate) || rate <= 0) {
    return { credits: null, approximate: false, note: 'tarifa de Seedance 2.5 Lite no disponible para esta combinación' };
  }
  const billed = output + inspected.inputSeconds;
  return {
    credits: Math.ceil(phpRound(rate * billed, 6)),
    approximate: inspected.inputSeconds > 0,
    note: inspected.inputSeconds > 0
      ? output + ' s de salida + ' + inspected.inputSeconds + ' s de vídeo de referencia = ' + billed + ' s · máximo reservado; se cobra el coste real del proveedor, nunca más'
      : output + ' s de salida · precio exacto',
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
