// Wan 3.0 Video y Wan 3.0 Video Prime (Alibaba, vía Kie). Contrato oficial leído el 23/10/2026:
//   https://docs.kie.ai/market/wan/3-0-video.md
//   https://docs.kie.ai/market/wan/3-0-video-prime.md
// Kie factura en AMBAS versiones (segundos de vídeos de entrada + segundos de salida) x tarifa por
// segundo. La CLI mide los vídeos locales para presupuestar; el servidor vuelve a medir la subida
// y es siempre la autoridad: si el servidor calcula más que lo autorizado, rechaza sin cobrar.
import { inspectPricingMetadata } from './files.mjs';

export const WAN3_ID = 'wan-3-video';

const MB = 1024 * 1024;
// Los medidores de navegador y servidor difieren unas centésimas en clips de "15 s".
const TOLERANCE = 0.05;
const DOCUMENT_EXTENSIONS = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'pdf', 'txt', 'key', 'pages', 'numbers', 'md'];

function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

function seconds(value) {
  return (Math.round(value * 10) / 10).toLocaleString('es-ES');
}

// Valida lo que la CLI puede comprobar en local y mide los segundos de vídeo de entrada.
// Devuelve { problems, inputSeconds, exactSeconds }. Cada vídeo se redondea al alza, igual que
// el servidor; los audios, las imágenes, el enlace y el documento no suman segundos facturables.
export function wan3Inspect(params, fileParams = {}) {
  const value = { ...params, ...fileParams };
  const problems = [];
  const mode = String(value.mode ?? 't2v');
  const first = items(value.first_frame_url);
  const last = items(value.last_frame_url);
  const images = items(value.reference_image_urls);
  const videos = items(value.reference_video_urls);
  const audios = items(value.reference_audio_urls);
  const links = items(value.reference_link_urls);
  const documents = items(value.reference_file_urls);
  const frames = first.length + last.length;
  const references = images.length + videos.length + audios.length + links.length + documents.length;
  const output = Number(value.duration ?? 5);

  if (Number(value.duration) === -1) {
    problems.push('La duración inteligente (-1) no está disponible en AILAB: Kie factura la duración que elige el modelo y su coste no se puede acotar antes de enviar. Elige entre 2 y 30 segundos.');
  }
  if (mode === 't2v' && (frames || references)) problems.push('Texto a vídeo (t2v) no admite archivos de entrada.');
  if (mode === 'i2v' && !first.length) problems.push('Imagen a vídeo (i2v) necesita --first_frame_url.');
  if (mode === 'i2v' && references) problems.push('Imagen a vídeo (i2v) no admite referencias; usa --mode ref.');
  if (mode === 'ref' && !references) problems.push('Referencias a vídeo (ref) necesita al menos una imagen, un vídeo, un audio, un enlace o un documento.');
  if (mode === 'ref' && frames) problems.push('Wan 3.0 no permite mezclar fotogramas con referencias multimodales.');
  if (last.length && !first.length) problems.push('El último fotograma exige un primer fotograma.');
  if (links.length && documents.length) problems.push('Wan 3.0 no permite combinar un enlace y un documento de referencia.');

  const checkImage = (file, label) => {
    const metadata = inspectPricingMetadata(file);
    if (!metadata.ok || metadata.class !== 'image' || !['image/jpeg', 'image/png', 'image/webp'].includes(metadata.mime)) {
      problems.push(label + ' debe ser una imagen JPG, PNG (sin transparencia) o WebP válida: ' + file + '.');
    } else if (metadata.size > 20 * MB) {
      problems.push(label + ' supera 20 MB: ' + file + '.');
    } else if (metadata.width < 240 || metadata.height < 240 || metadata.width > 8000 || metadata.height > 8000
      || Math.max(metadata.width, metadata.height) / Math.min(metadata.width, metadata.height) > 8) {
      problems.push(label + ' debe medir entre 240 y 8.000 px por lado, con proporción máxima 8:1: ' + file + ' (' + metadata.width + ' × ' + metadata.height + ' px).');
    }
  };
  first.forEach((file) => checkImage(file, 'El primer fotograma'));
  last.forEach((file) => checkImage(file, 'El último fotograma'));
  images.forEach((file) => checkImage(file, 'Una imagen de referencia'));

  const result = { problems, inputSeconds: 0, exactSeconds: 0 };
  if (mode === 'ref') {
    for (const file of videos) {
      const metadata = inspectPricingMetadata(file);
      if (!metadata.ok || metadata.class !== 'video' || !['video/mp4', 'video/quicktime'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
        problems.push('Un vídeo de referencia debe ser un MP4 o MOV medible: ' + file + '.');
        continue;
      }
      if (metadata.size > 100 * MB) { problems.push('Un vídeo de referencia supera 100 MB: ' + file + '.'); continue; }
      const clip = Math.round(metadata.duration * 100) / 100;
      if (clip < 1 - TOLERANCE || clip > 15 + TOLERANCE) {
        problems.push('Cada vídeo de referencia debe durar entre 1 y 15 segundos: ' + file + ' dura ' + seconds(clip) + ' s.');
        continue;
      }
      result.exactSeconds += clip;
      result.inputSeconds += Math.ceil(Math.round(metadata.duration * 1000) / 1000);
    }
    if (result.exactSeconds > 15 + TOLERANCE) {
      problems.push('Los vídeos de referencia no pueden sumar más de 15 segundos en total (ahora ' + seconds(result.exactSeconds) + ' s).');
    }
    if (videos.length && Number.isFinite(output) && result.exactSeconds + output > 30 + TOLERANCE) {
      problems.push('Los vídeos de referencia (' + seconds(result.exactSeconds) + ' s) más la salida (' + output + ' s) no pueden superar 30 segundos. Reduce la duración a '
        + Math.max(2, Math.floor(30 + TOLERANCE - result.exactSeconds)) + ' s o menos, o usa vídeos más cortos.');
    }
    let audioTotal = 0;
    for (const file of audios) {
      const metadata = inspectPricingMetadata(file);
      if (!metadata.ok || metadata.class !== 'audio' || !['audio/mpeg', 'audio/wav'].includes(metadata.mime) || !Number.isFinite(metadata.duration)) {
        problems.push('Un audio de referencia debe ser un MP3 o WAV medible: ' + file + '.');
        continue;
      }
      if (metadata.size > 15 * MB) { problems.push('Un audio de referencia supera 15 MB: ' + file + '.'); continue; }
      if (metadata.duration < 1 - TOLERANCE || metadata.duration > 15 + TOLERANCE) {
        problems.push('Cada audio de referencia debe durar entre 1 y 15 segundos: ' + file + ' dura ' + seconds(metadata.duration) + ' s.');
        continue;
      }
      audioTotal += metadata.duration;
    }
    if (audioTotal > 15 + TOLERANCE) problems.push('Los audios de referencia no pueden sumar más de 15 segundos en total (ahora ' + seconds(audioTotal) + ' s).');
  }

  for (const [label, entries] of [['La página web de referencia', links], ['El documento de referencia', documents]]) {
    for (const entry of entries) {
      let parsed = null;
      try { parsed = new URL(String(entry)); } catch { /* abajo */ }
      if (!parsed || !['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || String(entry).length > 2048) {
        problems.push(label + ' necesita una dirección web válida de hasta 2.048 caracteres.');
        continue;
      }
      const extension = /\.([A-Za-z0-9]+)$/.exec(parsed.pathname);
      if (label.startsWith('El documento') && extension && !DOCUMENT_EXTENSIONS.includes(extension[1].toLowerCase())) {
        problems.push('El documento de referencia debe ser PDF, Word, Excel, PowerPoint, Keynote, Pages, Numbers, TXT o MD.');
      }
    }
  }
  return result;
}

export function wan3Problems(params, fileParams = {}) {
  return wan3Inspect(params, fileParams).problems;
}

// ceil(cr Kie x 1,02) sobre el total, en milésimas de crédito para no arrastrar ruido de coma flotante.
// `credits_matrix` ya publica la tarifa AILAB por segundo (8,16 / 16,32 / 32,64 y 12,444 / 25,704 / 51,408).
export function wan3Estimate(model, params, fileParams = {}) {
  const e = model.estimate || {};
  const version = String(params.version ?? 'normal');
  const resolution = String(params.resolution ?? '720P');
  const output = Number(params.duration ?? 5);
  const rate = Number(e.credits_matrix && e.credits_matrix[version] && e.credits_matrix[version][resolution]);
  const inspected = wan3Inspect(params, fileParams);
  if (inspected.problems.length) return { credits: null, approximate: false, note: inspected.problems[0] };
  if (!Number.isInteger(output) || output < 2 || output > 30 || !Number.isFinite(rate) || rate <= 0) {
    return { credits: null, approximate: false, note: 'tarifa de Wan 3.0 no disponible para esta combinación' };
  }
  const billed = output + inspected.inputSeconds;
  const credits = Math.floor((Math.round(rate * 1000) * billed + 999) / 1000);
  return {
    credits,
    approximate: inspected.inputSeconds > 0,
    note: inspected.inputSeconds > 0
      ? output + ' s de salida + ' + inspected.inputSeconds + ' s de vídeo de entrada = ' + billed + ' s · máximo reservado; el cargo final es el consumo confirmado'
      : output + ' s de salida · precio exacto',
  };
}
