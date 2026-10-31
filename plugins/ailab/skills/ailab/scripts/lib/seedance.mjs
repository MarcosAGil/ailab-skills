// Seedance 2.5 Normal, 2.0 (Normal y Fast) y 2.0 Mini, más la medición que comparten con Seedance 2.5 Lite.
// Contrato en el servidor: `gateway_seedance_*`, `gateway_validate_video_contract` y `gateway_estimate_credits`
// (api/wallet/gateway.php). Las cifras están en docs/operations/seedance-25-draft-precios-2026-10-31.md de AILAB.
//
// Sin vídeo se factura la salida. Con vídeo de referencia, (salida + entrada) x tarifa con vídeo, donde la entrada es
// la suma de los vídeos, cada uno al segundo superior. Editar vídeo (solo Normal) son 2 x segundos del clip. El cálculo
// vive aquí y no en el catálogo porque las CLI anteriores rechazan el catálogo entero ante una clave de `estimate` que
// no conocen. El máximo autorizado nunca puede quedar por debajo de la reserva del servidor (daría 402), así que un
// vídeo que la CLI no puede medir se rechaza en local en lugar de presupuestarlo a ciegas.
import { inspectPricingMetadata } from './files.mjs';
import { phpRound } from './kling4.mjs';

export const SEEDANCE_25_ID = 'seedance-2-5';

// `audioSeconds` solo existe donde el servidor mide los audios: Seedance 2.0 y Mini no suman sus audios.
const MODELS = {
  [SEEDANCE_25_ID]: { label: 'Seedance 2.5', videoSeconds: 30, audioSeconds: 30 },
  'seedance-2': { label: 'Seedance 2.0', videoSeconds: 15 },
  'seedance-2-mini': { label: 'Seedance 2.0 Mini', videoSeconds: 15 },
};
export const SEEDANCE_IDS = Object.keys(MODELS);

const EDIT_MIN_SECONDS = 4;
const EDIT_MAX_SECONDS = 30;
const TOLERANCE = 1e-9;

export function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

const secondsText = (value) => String(value).replace('.', ',');

// ceil(round(tarifa x segundos, 6)): `gateway_seedance_credits`.
export function seedanceCredits(rate, seconds) {
  return Math.ceil(phpRound(rate * seconds, 6));
}

// Mide los vídeos de referencia igual que el servidor: la suma exacta para el tope y cada vídeo al segundo superior
// para cobrar. Devuelve { problems, inputSeconds, durations }.
export function measureVideos(files, maxSeconds, label) {
  const problems = [];
  const durations = [];
  let inputSeconds = 0;
  for (const file of files) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'video' || !['video/mp4', 'video/quicktime'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
      problems.push('El vídeo de referencia debe ser un MP4 o MOV medible (la CLI no puede medir WebM): ' + file + '.');
      continue;
    }
    durations.push(metadata.duration);
    inputSeconds += Math.ceil(phpRound(metadata.duration, 3));
  }
  if (durations.reduce((total, seconds) => total + seconds, 0) > maxSeconds + TOLERANCE) {
    problems.push('Los vídeos de referencia de ' + label + ' no pueden sumar más de ' + secondsText(maxSeconds) + ' segundos.');
  }
  return { problems, inputSeconds, durations };
}

// El audio no cambia el precio: `gateway_seedance_25_audio_check` limita la suma de lo que puede medir y deja al
// proveedor un formato que no sabe medir. La CLI hace lo mismo con el suyo.
export function measureAudios(files, maxSeconds, label) {
  const problems = [];
  let exact = 0;
  for (const file of files) {
    const metadata = inspectPricingMetadata(file);
    if (metadata.ok && metadata.class !== 'audio') problems.push('Un audio de referencia no es un archivo de audio válido. Vuelve a adjuntarlo.');
    else if (metadata.ok && Number.isFinite(metadata.duration)) exact += metadata.duration;
  }
  if (exact > maxSeconds + TOLERANCE) {
    problems.push('Los audios de referencia de ' + label + ' no pueden sumar más de ' + secondsText(maxSeconds) + ' segundos.');
  }
  return problems;
}

// Valida lo que la CLI puede comprobar sin el servidor, con sus mismos mensajes, y mide los vídeos y los audios.
// Devuelve { problems, inputSeconds }.
export function seedanceInspect(model, params, fileParams = {}) {
  const { label, videoSeconds, audioSeconds } = MODELS[model.id];
  const first = items(fileParams.first_frame_url);
  const last = items(fileParams.last_frame_url);
  const images = items(fileParams.reference_image_urls);
  const videos = items(fileParams.reference_video_urls);
  const audios = items(fileParams.reference_audio_urls);
  const edit = model.id === SEEDANCE_25_ID && params.mode === 'edit';
  const problems = [];

  if (edit) {
    if (first.length || last.length) problems.push('Editar vídeo no admite frames.');
    if (images.length || audios.length) problems.push('Editar vídeo no admite imágenes ni audio de referencia.');
    if (videos.length !== 1) problems.push('Editar vídeo requiere exactamente un vídeo original.');
  }
  if (last.length && !first.length) problems.push('El Last Frame exige un First Frame.');
  if ((first.length || last.length) && (images.length || videos.length || audios.length)) {
    problems.push('No se pueden mezclar frames con referencias multimodales.');
  }
  const measured = measureVideos(videos, videoSeconds, label);
  problems.push(...measured.problems);
  if (edit && measured.durations.some((seconds) => seconds < EDIT_MIN_SECONDS - TOLERANCE || seconds > EDIT_MAX_SECONDS + TOLERANCE)) {
    problems.push('El vídeo de edición debe durar entre 4 y 30 segundos.');
  }
  if (audioSeconds !== undefined) problems.push(...measureAudios(audios, audioSeconds, label));
  return { problems, inputSeconds: measured.inputSeconds };
}

export function seedanceProblems(model, params, fileParams = {}) {
  const { problems } = seedanceInspect(model, params, fileParams);
  if (model.id === SEEDANCE_25_ID && params.mode === 'edit' && !String(params.prompt ?? '').trim()) problems.push('Editar vídeo requiere un prompt.');
  return problems;
}

// `rateFor(hasVideo)` lo aporta catalog.mjs, que resuelve la tarifa vigente del catálogo.
export function seedanceEstimate(model, params, rateFor) {
  const e = model.estimate || {};
  const inspected = seedanceInspect(model, params, params);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  const hasVideo = items(params.reference_video_urls).length > 0;
  const edit = model.id === SEEDANCE_25_ID && params.mode === 'edit';
  const auto = !edit && e.auto_duration_param && params[e.auto_duration_param];
  const spec = (model.params || {}).duration || {};
  const output = auto ? Number(e.auto_duration_seconds) : Number(params.duration ?? spec.default);
  const rate = Number(rateFor(hasVideo));
  const validOutput = edit || (Number.isInteger(output) && output >= spec.min && output <= spec.max);
  if (!validOutput || !Number.isFinite(rate) || rate <= 0) {
    return { credits: null, approximate: false, note: 'tarifa de ' + MODELS[model.id].label + ' no disponible para esta combinación' };
  }
  const billed = edit ? 2 * inspected.inputSeconds : output + inspected.inputSeconds;
  let note = e.note || '';
  if (edit) note = '2 x ' + inspected.inputSeconds + ' s del clip = ' + billed + ' s · máximo reservado; el cargo final es el consumo confirmado, nunca más';
  else if (hasVideo) note = output + ' s de salida + ' + inspected.inputSeconds + ' s de vídeo de referencia = ' + billed + ' s · máximo reservado; el cargo final es el consumo confirmado, nunca más';
  return { credits: seedanceCredits(rate, billed), approximate: !!e.approximate, note };
}
