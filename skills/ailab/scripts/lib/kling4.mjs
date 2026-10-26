// Kling 4.0 vía Kie (contrato oficial leído el 22/10/2026):
//   https://docs.kie.ai/market/kling/v4-reference-to-video
//   https://docs.kie.ai/market/kling/v4-keyframe-to-video
// Un único ID público (`kling-4-0`) con dos modalidades de AILAB: `ref` (Referencias, también solo
// texto) y `keyframe` (Fotogramas clave). `mode` elige el endpoint en el servidor y no viaja a Kie.
//
// El servidor (`gateway_kling4_input` y `gateway_kling4_subjects` en api/wallet/gateway.php) repite
// todas estas reglas, mide él mismo los vídeos de entrada y es siempre la autoridad. Este módulo solo
// avisa antes de subir nada y presupuesta al menos lo que el servidor va a reservar: si el máximo
// autorizado fuera menor, el servidor rechaza con 402 sin cobrar.
//
// Los sujetos de imagen (`elements`) y las voces (`voices`) son listas de objetos. La CLI solo maneja
// parámetros planos, así que se expresan en ranuras numeradas: `subject_N_name` + `subject_N_images`
// (+ `subject_N_tag`, `subject_N_description`) y `voice_N_name` + `voice_N_audio`. El orden de las
// ranuras es el orden de las listas.
import { inspectPricingMetadata } from './files.mjs';

export const KLING4_ID = 'kling-4-0';
export const KLING4_SUBJECT_SLOTS = 7;
export const KLING4_VOICE_SLOTS = 3;

const TEN_MB = 10 * 1024 * 1024;
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const SUBJECT_TAGS = ['character', 'animal', 'prop', 'costume', 'scene', 'effect', 'others'];
// Décimas de crédito Kie por segundo: 28,5 / 42,5 sin vídeo de entrada y 17 / 25,5 con él.
const TENTHS = { plain: { '720p': 285, '1080p': 425 }, video: { '720p': 170, '1080p': 255 } };

// round() de PHP: redondea el valor decimal tal como se escribe (1.005 -> 1.01), no el binario.
export function phpRound(value, places) {
  const factor = 10 ** places;
  return Math.round(Number((value * factor).toPrecision(15))) / factor;
}

function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

const lowerAscii = (text) => text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());

// Misma regla que gateway_kling4_mentions_error: cada @ del prompt debe corresponder a un material de
// la petición. Coincidencia más larga primero; si el nombre acaba en letra, dígito o guion bajo, el
// carácter siguiente no puede serlo. Devuelve el mensaje de error o null.
export function kling4MentionError(prompt, names) {
  const lowered = [...new Set(names.map(lowerAscii))].sort((a, b) => b.length - a.length);
  const text = lowerAscii(prompt);
  let offset = 0;
  for (;;) {
    const at = text.indexOf('@', offset);
    if (at < 0) return null;
    const rest = text.slice(at + 1);
    let matched = false;
    for (const name of lowered) {
      if (name === '' || !rest.startsWith(name)) continue;
      const after = rest.slice(name.length);
      if (after !== '' && /^[\p{L}\p{N}_]/u.test(after)) continue;
      matched = true;
      offset = at + 1 + name.length;
      break;
    }
    if (!matched) {
      const token = /^[\p{L}\p{N}_]*/u.exec(prompt.slice(at + 1))[0];
      const available = lowered.length
        ? ' Menciones disponibles: @' + lowered.slice(0, 6).join(', @') + (lowered.length > 6 ? ', …' : '') + '.'
        : '';
      return 'El prompt menciona @' + token + ', pero ese material no está en la petición. Quita la mención o adjunta el archivo; el carácter @ solo se usa para mencionar materiales adjuntos.' + available;
    }
  }
}

// Segundos facturables: sin vídeo de entrada, la salida; con él, salida x 2 si la entrada total no
// supera la salida, y entrada total + salida si la supera.
export function kling4BilledSeconds(output, inputSeconds) {
  if (inputSeconds <= 0) return output;
  return inputSeconds <= output ? 2 * output : inputSeconds + output;
}

// ceil(cr Kie x 1,02) sobre el total, con enteros para evitar ruido de coma flotante (igual que
// gateway_kling4_credits). Devuelve null si la combinación no existe.
export function kling4Credits(resolution, output, inputSeconds) {
  const tenths = TENTHS[inputSeconds > 0 ? 'video' : 'plain'][resolution];
  if (!tenths || !Number.isInteger(output) || output < 3 || output > 30) return null;
  return Math.floor((tenths * kling4BilledSeconds(output, inputSeconds) * 102 + 999) / 1000);
}

function slotNumbers(prefix, count) {
  return Array.from({ length: count }, (_, index) => index + 1).map((n) => ({ n, prefix: prefix + '_' + n }));
}

// Sujetos y voces tal como los envía la CLI, en el orden de las ranuras. `uploaded` (opcional)
// aporta las URLs subidas por parámetro; sin ellas se usan las rutas locales (solo para validar).
export function kling4Subjects(params, files = {}) {
  const elements = [];
  const voices = [];
  for (const { n, prefix } of slotNumbers('subject', KLING4_SUBJECT_SLOTS)) {
    const name = params[prefix + '_name'];
    const images = items(files[prefix + '_images']);
    if (name === undefined && !images.length && params[prefix + '_tag'] === undefined && params[prefix + '_description'] === undefined) continue;
    elements.push({ slot: n, name: name === undefined ? '' : String(name).trim(), images,
      tag: params[prefix + '_tag'], description: params[prefix + '_description'] });
  }
  for (const { n, prefix } of slotNumbers('voice', KLING4_VOICE_SLOTS)) {
    const name = params[prefix + '_name'];
    const audio = items(files[prefix + '_audio']);
    if (name === undefined && !audio.length) continue;
    voices.push({ slot: n, name: name === undefined ? '' : String(name).trim(), audio: audio[0] });
  }
  return { elements, voices };
}

function checkImage(file, label, dimensions, problems) {
  const metadata = inspectPricingMetadata(file);
  if (!metadata.ok || metadata.class !== 'image' || !IMAGE_MIMES.includes(metadata.mime)) {
    problems.push(label + ' debe ser una imagen JPG, PNG o WebP válida: ' + file + '.');
    return;
  }
  if (metadata.size > TEN_MB) { problems.push(label + ' supera 10 MB: ' + file + '.'); return; }
  if (!dimensions) return;
  const { width, height } = metadata;
  const ratio = height > 0 ? width / height : 0;
  if (width < 300 || height < 300 || width > 65536 || height > 65536 || ratio < 0.4 || ratio > 2.5) {
    problems.push(label + ' debe medir al menos 300 px por lado (hasta 65.536) y tener una proporción entre 0,4 y 2,5: ' + file + ' (' + width + ' × ' + height + ' px).');
  }
}

// Valida lo que la CLI puede comprobar en local y mide los segundos de vídeo de entrada. Devuelve
// { problems, inputSeconds, exactSeconds }. `given` son los parámetros tal como los escribió el usuario
// (sin defaults) y sirve para detectar combinaciones que el servidor rechaza.
export function kling4Inspect(params, fileParams = {}, given = {}) {
  const problems = [];
  const mode = String(params.mode ?? 'ref');
  const output = Number(params.duration ?? 5);
  const prompt = String(params.prompt ?? '').trim();
  const first = items(fileParams.first_frame_url);
  const middle = items(fileParams.keyframe_urls);
  const last = items(fileParams.last_frame_url);
  const images = items(fileParams.image_urls);
  const videos = items(fileParams.video_urls);
  const { elements, voices } = kling4Subjects(params, fileParams);
  const result = { problems, inputSeconds: 0, exactSeconds: 0 };

  if (!prompt) problems.push('El prompt no puede estar vacío.');
  else if (Array.from(prompt).length > 8000) problems.push('Escribe un prompt de entre 1 y 8.000 caracteres (ahora ' + Array.from(prompt).length + ').');

  if (mode === 'keyframe') {
    if (images.length || videos.length || elements.length || voices.length || given.keep_original_sound !== undefined) {
      problems.push('Fotogramas clave no admite imágenes, vídeos, sujetos, voces ni sonido original: usa --mode ref para eso.');
    }
    if (given.aspect_ratio !== undefined) problems.push('En Fotogramas clave el formato lo marca el primer fotograma: no uses --aspect_ratio.');
    const frames = first.length + middle.length + last.length;
    const cap = output >= 9 ? 10 : output + 1;
    if (Number.isInteger(output) && frames > cap) {
      problems.push('Con ' + output + ' s caben como máximo ' + cap + ' fotogramas (primero, intermedios y último). Alarga la duración o quita fotogramas.');
    }
    [...first, ...middle, ...last].forEach((file) => checkImage(file, 'Un fotograma', false, problems));
    const names = ['first_frame', ...middle.map((_, index) => 'keyframe_' + (index + 1)), ...(last.length ? ['last_frame'] : [])];
    const mention = prompt ? kling4MentionError(prompt, names) : null;
    if (mention) problems.push(mention);
    return result;
  }

  if (first.length || middle.length || last.length) {
    problems.push('Los fotogramas (--first_frame_url, --keyframe_urls, --last_frame_url) solo existen en --mode keyframe.');
  }
  if (params.keep_original_sound === true && !videos.length) {
    problems.push('Conservar el sonido original solo tiene efecto con vídeos de referencia.');
  }

  // Sujetos y voces: mismas reglas que gateway_kling4_subjects.
  const seen = new Set();
  const checkName = (raw, what) => {
    const name = String(raw ?? '').trim();
    if (!/^[一-龥A-Za-z0-9_]{1,20}$/.test(name)) {
      problems.push('El nombre de ' + what + ' debe tener de 1 a 20 letras sin tildes, números o guion bajo (sin espacios).');
      return null;
    }
    if (/^(?:(?:image|video|keyframe|object|audio)_\d+|first_frame|last_frame)$/i.test(name)) {
      problems.push('@' + name + ' es un nombre reservado. Elige otro nombre para ' + what + '.');
      return null;
    }
    const key = lowerAscii(name);
    if (seen.has(key)) { problems.push('Ya hay un sujeto o una voz llamado @' + name + '. Usa nombres distintos.'); return null; }
    seen.add(key);
    return name;
  };
  const named = [];
  for (const element of elements) {
    const label = 'el sujeto ' + element.slot;
    if (!element.name) { problems.push('Falta --subject_' + element.slot + '_name para ' + label + '.'); continue; }
    const name = checkName(element.name, label);
    if (!element.images.length) { problems.push('Falta --subject_' + element.slot + '_images para ' + label + '.'); continue; }
    if (element.images.length < 2 || element.images.length > 4) problems.push('El sujeto @' + (name || element.name) + ' necesita entre 2 y 4 imágenes.');
    if (element.tag !== undefined && !SUBJECT_TAGS.includes(element.tag)) problems.push('Elige una categoría válida para @' + (name || element.name) + '.');
    if (element.description !== undefined) {
      const description = String(element.description).trim();
      if (!description || Array.from(description).length > 100) problems.push('La descripción de @' + (name || element.name) + ' admite hasta 100 caracteres.');
    }
    element.images.forEach((file) => checkImage(file, 'Una imagen de @' + (name || element.name), true, problems));
    if (name) named.push(name);
  }
  for (const voice of voices) {
    const label = 'la voz ' + voice.slot;
    if (!voice.name) { problems.push('Falta --voice_' + voice.slot + '_name para ' + label + '.'); continue; }
    const name = checkName(voice.name, label);
    if (!voice.audio) { problems.push('Falta --voice_' + voice.slot + '_audio para ' + label + '.'); continue; }
    const metadata = inspectPricingMetadata(voice.audio);
    if (!metadata.ok || metadata.class !== 'audio' || !['audio/mpeg', 'audio/wav'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
      problems.push('El audio de @' + (name || voice.name) + ' debe ser un MP3 o WAV medible: ' + voice.audio + '.');
    } else if (metadata.size > TEN_MB) {
      problems.push('El audio de @' + (name || voice.name) + ' supera 10 MB.');
    } else if (metadata.duration < 1 || metadata.duration > 60) {
      problems.push('El audio de @' + (name || voice.name) + ' debe durar entre 1 y 60 segundos.');
    }
    if (name) named.push(name);
  }
  if (images.length + videos.length + elements.length + voices.length > 15) {
    problems.push('Kling 4.0 admite hasta 15 materiales en total entre imágenes, vídeos, sujetos y voces.');
  }

  images.forEach((file) => checkImage(file, 'Una imagen de referencia', true, problems));
  for (const file of videos) {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'video' || !['video/mp4', 'video/quicktime'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
      problems.push('Un vídeo de referencia debe ser un MP4 o MOV medible (la CLI no puede medir WebM): ' + file + '.');
      continue;
    }
    if (metadata.size > TEN_MB) { problems.push('Un vídeo de referencia supera 10 MB: ' + file + '.'); continue; }
    const clip = phpRound(metadata.duration, 2);
    if (clip < 2 || clip > 30) { problems.push('Cada vídeo de referencia debe durar entre 2 y 30 segundos: ' + file + ' dura ' + clip + ' s.'); continue; }
    result.exactSeconds += clip;
    result.inputSeconds += Math.ceil(phpRound(clip, 3));
  }
  if (result.exactSeconds > 30 + 1e-9) problems.push('Los vídeos de referencia no pueden sumar más de 30 segundos en total (ahora ' + phpRound(result.exactSeconds, 2) + ' s).');

  const names = [
    ...images.map((_, index) => 'image_' + (index + 1)),
    ...videos.map((_, index) => 'video_' + (index + 1)),
    ...named,
  ];
  const mention = prompt ? kling4MentionError(prompt, names) : null;
  if (mention) problems.push(mention);
  return result;
}

export function kling4Problems(params, fileParams = {}, given = {}) {
  return kling4Inspect(params, fileParams, given).problems;
}

// Presupuesto: nunca por debajo de la reserva del servidor. Con vídeos de entrada es un máximo y el
// cargo final es el consumo confirmado.
export function kling4Estimate(model, params, fileParams = {}, given = {}) {
  // `estimateCredits` recibe los parámetros y las rutas de archivo en un único objeto.
  const merged = { ...params, ...fileParams };
  const inspected = kling4Inspect(merged, merged, given);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  const output = Number(params.duration ?? 5);
  const resolution = String(params.resolution ?? '720p');
  const credits = kling4Credits(resolution, output, inspected.inputSeconds);
  if (credits === null) return { credits: null, approximate: false, note: 'tarifa de Kling 4.0 no disponible para esta combinación' };
  const billed = kling4BilledSeconds(output, inspected.inputSeconds);
  return {
    credits,
    approximate: inspected.inputSeconds > 0,
    note: inspected.inputSeconds > 0
      ? output + ' s de salida + ' + inspected.inputSeconds + ' s de vídeo de entrada: se factura ' + billed + ' s · máximo reservado; el cargo final es el consumo confirmado'
      : output + ' s de salida · precio exacto',
  };
}

// Entrada exacta que normaliza el servidor (`gateway_kling4_input`): nada de campos extra, y
// aspect_ratio / keep_original_sound solo cuando el servidor los conserva.
export function kling4Input(params, uploaded = {}) {
  const mode = String(params.mode ?? 'ref');
  const input = {
    mode,
    prompt: String(params.prompt).trim(),
    duration: Number(params.duration ?? 5),
    resolution: String(params.resolution ?? '720p'),
  };
  if (mode === 'keyframe') {
    const first = items(uploaded.first_frame_url);
    const middle = items(uploaded.keyframe_urls);
    const last = items(uploaded.last_frame_url);
    if (first.length) input.first_frame_url = first[0];
    if (middle.length) input.keyframe_urls = middle;
    if (last.length) input.last_frame_url = last[0];
    return input;
  }
  const images = items(uploaded.image_urls);
  const videos = items(uploaded.video_urls);
  const { elements, voices } = kling4Subjects(params, uploaded);
  const outElements = elements.map((element) => {
    const item = { name: element.name, image_urls: element.images };
    if (element.tag !== undefined && element.tag !== '') item.tag = element.tag;
    if (element.description !== undefined && String(element.description).trim() !== '') item.description = String(element.description).trim();
    return item;
  });
  const outVoices = voices.map((voice) => ({ name: voice.name, audio_url: voice.audio }));
  const ratio = String(params.aspect_ratio ?? 'auto');
  if (ratio !== 'auto' || images.length || videos.length || outElements.length || outVoices.length) input.aspect_ratio = ratio;
  if (images.length) input.image_urls = images;
  if (videos.length) { input.video_urls = videos; input.keep_original_sound = params.keep_original_sound === true; }
  if (outElements.length) input.elements = outElements;
  if (outVoices.length) input.voices = outVoices;
  return input;
}
