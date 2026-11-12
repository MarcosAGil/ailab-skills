// Gemini Omni Flash 1.2 por Kie (generar, editar y extender) y los recursos de Gemini Omni (Character ID y Voice ID).
// Contrato en el servidor: api/wallet/omni-12.php (`omni12_contract_error`, `omni12_extend_contract_error`,
// `omni12_estimate`, `omni12_extend_list`), la medición del vídeo a editar en api/wallet/gateway.php y
// api/wallet/omni-resource.php. Detalle para el agente en references/gemini-omni-12.md.
//
// Modalidades de `gemini-omni-flash-1-2`, una por petición: texto (t2v), primer y último frame (frames), referencias
// (reference: hasta 6 imágenes y 2 Character IDs, que no cuentan en el límite) y edición de vídeo (edit: un vídeo de
// hasta 15 s y hasta 5 imágenes, sin duración). 1.2 no admite Voice IDs: la voz va dentro de un Character ID.
// `gemini-omni-flash-1-2-extend` añade de 3 a 10 s a un vídeo 1.2 de la cuenta (360p o 720p, 15 s o menos).
//
// Precio: tarifa de Kie x 1,02 por segundo (4,08 / 9,18 / 10,2 / 22,44 cr/s), ceil(round(tarifa x segundos, 6)). Es lo
// que se reserva; al terminar se cobra el consumo real de Kie x 1,02, nunca más. La edición se cobra por los segundos del
// vídeo de entrada (cada vídeo al segundo superior, como mide el servidor) y Extend solo por los segundos añadidos, a la
// resolución del vídeo de origen: esa cifra la da el servidor en el listado de vídeos extensibles.
//
// Este módulo no toca la red: catalog.mjs lo importa y su copia firmada debe seguir siendo autónoma.
import { inspectPricingMetadata } from './files.mjs';
import { phpRound } from './kling4.mjs';
import { items } from './seedance.mjs';

export const OMNI12_ID = 'gemini-omni-flash-1-2';
export const OMNI12_EXTEND_ID = 'gemini-omni-flash-1-2-extend';
export const OMNI_CHARACTER_ID = 'gemini-omni-character';
export const OMNI_AUDIO_ID = 'gemini-omni-audio';
export const OMNI_RESOURCE_IDS = [OMNI_CHARACTER_ID, OMNI_AUDIO_ID];
export const OMNI_RESOURCE_ENDPOINT = 'api/wallet/omni-resource.php';
export const OMNI12_VIDEOS_ENDPOINT = 'api/wallet/history.php';
// 20 vídeos por página en el servidor, del más reciente al más antiguo.
export const OMNI12_MAX_PAGES = 50;

const RATES = { '360p': 4.08, '720p': 9.18, '1080p': 10.2, '4k': 22.44 };
const MIN_SECONDS = 3;
const MAX_SECONDS = 15;
const MAX_SECONDS_LAST_FRAME = 10;
const EXTEND_MIN_SECONDS = 3;
const EXTEND_MAX_SECONDS = 10;
const MAX_IMAGES = 6;
const QUOTA = 7;
const PROMPT_MAX = 20000;
const ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const TWENTY_MB = 20 * 1024 * 1024;
// La cifra del listado vale mientras dure el manifiesto.
const QUOTE_TTL_MS = 15 * 60 * 1000;
const NOTHING_CHARGED = ' No se ha cobrado nada.';
const KIND = { generate: 'Generado', edit: 'Editado', extend: 'Extendido' };

const secondsText = (value) => String(value).replace('.', ',');

export function omni12Rate(resolution) {
  return Object.hasOwn(RATES, String(resolution)) ? RATES[String(resolution)] : null;
}

// `omni12_credits`: ceil(round(tarifa x segundos, 6)).
export function omni12Credits(resolution, seconds) {
  const rate = omni12Rate(resolution);
  return rate === null ? null : Math.ceil(phpRound(rate * seconds, 6));
}

// Modalidad que deduce el servidor de los materiales; si no coincide con --mode, rechaza con el mismo texto.
function inferredMode({ first, images, videos, characters }) {
  if (videos.length) return 'edit';
  if (first.length) return 'frames';
  return images.length || characters.length ? 'reference' : 't2v';
}

const MODE_NEEDS = {
  t2v: 'Texto a vídeo no admite referencias ni frames.',
  frames: 'Primer y último frame requiere el primer frame y nada más.',
  reference: 'Referencias a vídeo requiere al menos una imagen o un Character ID, sin frames ni vídeo.',
  edit: 'Editar vídeo requiere un vídeo.',
};

function checkImages(files, label, problems) {
  for (const file of files) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'image' || !IMAGE_MIMES.includes(metadata.mime)) {
      problems.push(label + ' debe ser JPG, PNG o WebP válida: ' + file + '.');
    } else if (metadata.size > TWENTY_MB) {
      problems.push(label + ' supera 20 MB: ' + file + '.');
    }
  }
}

// Valida lo que la CLI puede comprobar en local, con los textos del servidor, y mide el vídeo a editar.
// Devuelve { problems, editSeconds, exactSeconds }.
export function omni12Inspect(params, fileParams = {}) {
  const problems = [];
  const mode = String(params.mode ?? 't2v');
  const first = items(fileParams.first_frame_url);
  const last = items(fileParams.last_frame_url);
  const images = items(fileParams.image_urls);
  const videos = items(fileParams.video_url);
  const characters = items(params.character_ids).map((id) => String(id).trim()).filter(Boolean);
  const prompt = String(params.prompt ?? '');
  const result = { problems, editSeconds: 0, exactSeconds: 0 };

  if (!prompt.trim()) problems.push('El prompt es obligatorio.' + NOTHING_CHARGED);
  else if (Array.from(prompt).length > PROMPT_MAX) problems.push('El prompt de Gemini Omni Flash 1.2 no puede superar los 20.000 caracteres.' + NOTHING_CHARGED);
  if (characters.some((id) => id.length > 200 || !ID_PATTERN.test(id))) problems.push('Un Character ID contiene caracteres no válidos.' + NOTHING_CHARGED);
  if (images.length > MAX_IMAGES) problems.push('Gemini Omni Flash 1.2 admite como máximo 6 imágenes de referencia.' + NOTHING_CHARGED);
  if (last.length && !first.length) problems.push('El último frame requiere un primer frame.' + NOTHING_CHARGED);
  if (first.length && (images.length || videos.length || characters.length)) {
    problems.push('Primer y último frame no se puede mezclar con imágenes, vídeo ni Character IDs.' + NOTHING_CHARGED);
  }
  if (images.length + 2 * videos.length > QUOTA) {
    problems.push('Gemini Omni Flash 1.2 supera la cuota de referencias: cada imagen cuenta 1 y el vídeo 2, hasta 7. Con vídeo caben 5 imágenes.' + NOTHING_CHARGED);
  }
  const inferred = inferredMode({ first, images, videos, characters });
  if (Object.hasOwn(MODE_NEEDS, mode) && mode !== inferred) problems.push(MODE_NEEDS[mode] + NOTHING_CHARGED);
  if (!videos.length && last.length) {
    const duration = Number(params.duration);
    if (Number.isInteger(duration) && duration > MAX_SECONDS_LAST_FRAME) {
      problems.push('Con primer y último frame, la duración debe ser un entero de 3 a 10 segundos.' + NOTHING_CHARGED);
    }
  }

  checkImages([...first, ...last], 'Cada frame', problems);
  checkImages(images, 'Cada imagen de referencia', problems);
  for (const file of videos) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'video' || !['video/mp4', 'video/quicktime'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
      problems.push('El vídeo a editar debe ser un MP4 o MOV medible (la CLI no puede medir WebM): ' + file + '.');
      continue;
    }
    // Margen del servidor: rechaza por encima de 15,05 s y cobra cada vídeo al segundo superior, entre 1 y 15.
    if (metadata.duration > MAX_SECONDS + 0.05) {
      problems.push('El vídeo a editar dura ' + secondsText(phpRound(metadata.duration, 1)) + ' s y Gemini Omni Flash 1.2 edita vídeos de hasta 15 s.' + NOTHING_CHARGED);
      continue;
    }
    result.exactSeconds = metadata.duration;
    result.editSeconds = Math.max(1, Math.min(MAX_SECONDS, Math.ceil(phpRound(metadata.duration, 3))));
  }
  return result;
}

export function omni12Problems(params, fileParams = {}) {
  return omni12Inspect(params, fileParams).problems;
}

// La misma cuenta que `omni12_estimate`: la duración elegida o, al editar, los segundos medidos del vídeo.
export function omni12Estimate(model, params, fileParams = {}) {
  const merged = { ...params, ...fileParams };
  const inspected = omni12Inspect(merged, merged);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  const resolution = String(params.resolution ?? '720p');
  const tail = ' · tarifa de Kie por segundo con el 2% de servicio AILAB; máximo reservado, se cobra el consumo real y nunca más';
  if (String(params.mode) === 'edit') {
    const credits = omni12Credits(resolution, inspected.editSeconds);
    if (!credits) return { credits: null, approximate: false, note: 'tarifa de Gemini Omni Flash 1.2 no disponible para esta combinación' };
    return { credits, approximate: true, note: resolution + ' · vídeo a editar de ' + inspected.editSeconds + ' s (se cobra su duración)' + tail };
  }
  const duration = Number(params.duration ?? 8);
  const credits = Number.isInteger(duration) && duration >= MIN_SECONDS && duration <= MAX_SECONDS ? omni12Credits(resolution, duration) : null;
  if (!credits) return { credits: null, approximate: false, note: 'tarifa de Gemini Omni Flash 1.2 no disponible para esta combinación' };
  return { credits, approximate: true, note: resolution + ' · ' + duration + ' s' + tail };
}

// Entrada tal como la espera el servidor (que la traduce a Kie): sin duración al editar y la semilla como `seeds`.
export function omni12Input(params, uploaded = {}) {
  const mode = String(params.mode ?? 't2v');
  const input = {
    mode,
    prompt: String(params.prompt),
    aspect_ratio: String(params.aspect_ratio ?? '16:9'),
    resolution: String(params.resolution ?? '720p'),
  };
  if (mode !== 'edit') input.duration = Number(params.duration ?? 8);
  if (params.seed !== undefined) input.seeds = Number(params.seed);
  if (mode === 'frames') {
    const first = items(uploaded.first_frame_url);
    const last = items(uploaded.last_frame_url);
    if (first.length) input.first_frame_url = first[0];
    if (last.length) input.last_frame_url = last[0];
    return input;
  }
  const images = items(uploaded.image_urls);
  const characters = items(params.character_ids).map((id) => String(id).trim()).filter(Boolean);
  const videos = items(uploaded.video_url);
  if (images.length) input.image_urls = images;
  if (characters.length) input.character_ids = characters;
  if (mode === 'edit' && videos.length) input.video_list = [videos[0]];
  return input;
}

// ---- Extend ----

export function omni12ExtendProblems(params, fileParams = {}) {
  const problems = [];
  if (!String(params.task_id ?? '').trim()) problems.push('Extend necesita el task_id del vídeo que quieres alargar.' + NOTHING_CHARGED);
  if (!String(params.prompt ?? '').trim()) problems.push('El prompt es obligatorio.' + NOTHING_CHARGED);
  checkImages(items(fileParams.image_urls), 'Cada imagen de referencia', problems);
  return problems;
}

export function omni12ExtendInput(params, uploaded = {}) {
  const input = { mode: 'extend', task_id: String(params.task_id).trim(), prompt: String(params.prompt), duration: Number(params.duration ?? 8) };
  const images = items(uploaded.image_urls);
  if (images.length) input.image_urls = images;
  return input;
}

export function omni12VideosRequest(cursor = null) {
  return { action: 'omni12_extendable', cursor };
}

export function omni12VideoNotFound() {
  return { ok: false, normalized: { kind: 'bad_request', message: 'Ese vídeo no aparece entre los que puedes extender (Gemini Omni Flash 1.2 de tu cuenta, terminado, a 360p o 720p y de 15 s o menos). Consúltalo con el comando omni12-videos.' + NOTHING_CHARGED } };
}

// Cotización local de `prepare`: congela en el manifiesto la cifra que el servidor reservará para alargar ese vídeo.
export function omni12ExtendQuote(video, duration, now = Date.now()) {
  const refuse = (message) => ({ ok: false, normalized: { kind: 'bad_request', message } });
  const seconds = Number(duration);
  if (!Number.isInteger(seconds) || seconds < EXTEND_MIN_SECONDS || seconds > EXTEND_MAX_SECONDS) {
    return refuse('Extend añade de 3 a 10 segundos: la duración debe ser un entero en ese rango.' + NOTHING_CHARGED);
  }
  const listed = Number(video.credits_by_duration && video.credits_by_duration[String(seconds)]);
  const local = omni12Credits(video.resolution, seconds);
  if (!Number.isSafeInteger(listed) || listed <= 0 || local === null) return refuse('El servidor no devolvió un coste válido para alargar ese vídeo.' + NOTHING_CHARGED);
  return {
    ok: true,
    quote: {
      quote_id: 'omni12-extend:' + video.task_id + ':' + seconds,
      estimated_credits: listed,
      max_credits_authorized: listed,
      expires_at: new Date(now + QUOTE_TTL_MS).toISOString(),
      verified_duration_seconds: seconds,
      note: 'Extend de un vídeo ' + video.resolution + (video.output_seconds ? ' de ' + video.output_seconds + ' s' : '') + ': +' + seconds
        + ' s a ' + secondsText(video.rate ?? omni12Rate(video.resolution)) + ' cr/s. Es el máximo reservado: se cobra el consumo real y nunca más.'
        + (local !== listed ? ' AVISO: la tarifa local da ' + local + ' cr; manda la del servidor.' : ''),
    },
  };
}

// Cada vídeo en la salida de `omni12-videos`, con lo que el usuario necesita para elegir.
export function omni12VideoLines(video) {
  const prices = Object.entries(video.credits_by_duration || {}).map(([seconds, credits]) => '+' + seconds + ' s ' + credits + ' cr').join(' · ');
  const lines = [
    'task_id: ' + video.task_id,
    '  ' + (KIND[video.kind] || video.kind) + ' · ' + video.resolution + (video.output_seconds ? ' · ' + video.output_seconds + ' s' : ' · duración sin medir') + ' · formato: ' + (video.aspect_ratio || '16:9') + ' · ' + video.created_at + ' UTC',
    '  Precio de Extend: ' + prices,
    '  URL: ' + video.video_url,
  ];
  if (video.source_task_id) lines.splice(2, 0, '  Alarga: ' + video.source_task_id);
  return lines;
}

// ---- Recursos (Character ID y Voice ID): gratis, síncronos y de la cuenta ----

export function omniResourceProblems(model, params, fileParams = {}) {
  const problems = [];
  if (model.id === OMNI_CHARACTER_ID) {
    if (!String(params.descriptions ?? '').trim()) problems.push('Descripción del personaje es obligatorio.');
    checkImages([...items(fileParams.portrait_url), ...items(fileParams.body_url)], 'Cada imagen del personaje', problems);
    const voices = items(params.audio_ids).map((id) => String(id).trim());
    if (voices.some((id) => !id || id.length > 200 || !ID_PATTERN.test(id))) problems.push('Voice ID contiene un identificador no válido.');
  }
  if (model.id === OMNI_AUDIO_ID && !String(params.name ?? '').trim()) problems.push('Nombre es obligatorio.');
  return problems;
}

export function omniResourceAction(model) {
  return model.id === OMNI_AUDIO_ID ? 'audio' : 'character';
}

export function omniResourceInput(model, params, uploaded = {}) {
  if (model.id === OMNI_AUDIO_ID) {
    const input = { audio_id: String(params.audio_id ?? 'Puck'), name: String(params.name).trim() };
    if (params.voice_description !== undefined) input.voice_description = String(params.voice_description);
    if (params.example_dialogue !== undefined) input.example_dialogue = String(params.example_dialogue);
    return input;
  }
  const input = {
    image_urls: [...items(uploaded.portrait_url), ...items(uploaded.body_url)],
    descriptions: String(params.descriptions),
  };
  if (params.character_name !== undefined) input.character_name = String(params.character_name);
  const voices = items(params.audio_ids).map((id) => String(id).trim()).filter(Boolean);
  if (voices.length) input.audio_ids = voices;
  return input;
}

// Texto que se guarda como resultado: el ID es lo que el usuario necesita para usarlo después.
export function omniResourceText(resource) {
  const voice = resource.kind === 'gemini-omni-audio';
  const lines = [
    (voice ? 'Voice ID: ' : 'Character ID: ') + resource.resource_id,
    'Nombre: ' + (resource.name || ''),
  ];
  if (voice && resource.base_voice) lines.push('Voz base: ' + resource.base_voice);
  lines.push(voice
    ? 'Úsalo como --audio_ids al crear un personaje con gemini-omni-character o en Gemini Omni Flash 1.1.'
    : 'Úsalo como --character_ids en gemini-omni-flash-1-2 (modo reference o edit) o en Gemini Omni Flash 1.1.');
  return lines.join('\n') + '\n';
}
