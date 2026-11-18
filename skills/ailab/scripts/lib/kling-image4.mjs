// Kling Image 4.0 vía Kie (contrato oficial leído el 18/11/2026):
//   https://docs.kie.ai/market/kling-4-0/image.md
// Un único ID público (`kling-image-4-0`) con dos modalidades de AILAB: `t2i` (texto a imagen) e `i2i`
// (imagen a imagen, con referencias o personajes). `mode` no viaja a Kie; `output_mode` (default: de 1 a 9
// imágenes sueltas; series: de 2 a 10 coherentes) pasa a ser el `mode` de Kie en el servidor.
//
// El servidor (`gateway_kling_image4_input` en api/wallet/gateway.php) repite todas estas reglas y es
// siempre la autoridad. Este módulo avisa antes de subir nada. Desde la 2.5.0 el precio lo da price.php.
//
// Los personajes (`elements`) son una lista de objetos. La CLI solo maneja parámetros planos, así que se
// expresan en ranuras numeradas como en Kling 4.0: `subject_N_name` + `subject_N_images` (+ `subject_N_tag`,
// `subject_N_description`). El orden de las ranuras es el orden de la lista.
import { inspectPricingMetadata } from './files.mjs';
import { kling4MentionError } from './kling4.mjs';

export const KLING_IMAGE4_ID = 'kling-image-4-0';
export const KLING_IMAGE4_SUBJECT_SLOTS = 10;

const TWENTY_MB = 20 * 1024 * 1024;
// Kie solo admite JPG y PNG en este modelo (la web convierte las WebP a PNG; la CLI pide convertirlas).
const IMAGE_MIMES = ['image/jpeg', 'image/png'];
const SUBJECT_TAGS = ['character', 'animal', 'prop', 'costume', 'scene', 'effect', 'others'];
const COUNTS = { default: { min: 1, max: 9, fallback: 1 }, series: { min: 2, max: 10, fallback: 2 } };

function items(value) {
  if (Array.isArray(value)) return value.slice();
  return value === undefined || value === null || value === '' ? [] : [value];
}

const lowerAscii = (text) => text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());

// Número de imágenes pedido: sin --count, 1 en sueltas y 2 en serie (lo mismo que hace el servidor).
export function klingImage4Count(params) {
  const counts = COUNTS[String(params.output_mode ?? 'default')] || COUNTS.default;
  return params.count === undefined || params.count === null || params.count === '' ? counts.fallback : Number(params.count);
}

// Personajes tal como los envía la CLI, en el orden de las ranuras. `files` (opcional) aporta las URLs
// subidas por parámetro; sin ellas se usan las rutas locales (solo para validar).
export function klingImage4Subjects(params, files = {}) {
  const elements = [];
  for (let n = 1; n <= KLING_IMAGE4_SUBJECT_SLOTS; n += 1) {
    const prefix = 'subject_' + n;
    const name = params[prefix + '_name'];
    const images = items(files[prefix + '_images']);
    if (name === undefined && !images.length && params[prefix + '_tag'] === undefined && params[prefix + '_description'] === undefined) continue;
    elements.push({ slot: n, name: name === undefined ? '' : String(name).trim(), images,
      tag: params[prefix + '_tag'], description: params[prefix + '_description'] });
  }
  return elements;
}

function checkImage(file, label, problems) {
  const metadata = inspectPricingMetadata(file);
  if (!metadata.ok || metadata.class !== 'image' || !IMAGE_MIMES.includes(metadata.mime)) {
    problems.push(label + ' debe ser una imagen JPG o PNG válida (convierte las WebP a PNG): ' + file + '.');
    return;
  }
  if (metadata.size > TWENTY_MB) problems.push(label + ' supera 20 MB: ' + file + '.');
}

// Valida lo que la CLI puede comprobar en local. Devuelve { problems, materials }: `materials` son las
// referencias más cada vista de cada personaje, que es lo que se factura.
export function klingImage4Inspect(params, fileParams = {}) {
  const problems = [];
  const mode = String(params.mode ?? 't2i');
  const prompt = String(params.prompt ?? '').trim();
  const outputMode = String(params.output_mode ?? 'default');
  const images = items(fileParams.image_urls);
  const elements = klingImage4Subjects(params, fileParams);
  const result = { problems, materials: 0 };

  if (!prompt) problems.push('El prompt no puede estar vacío.');
  else if (Array.from(prompt).length > 20000) problems.push('Escribe un prompt de entre 1 y 20.000 caracteres (ahora ' + Array.from(prompt).length + ').');

  const counts = COUNTS[outputMode];
  const count = klingImage4Count(params);
  if (counts && (!Number.isInteger(count) || count < counts.min || count > counts.max)) {
    problems.push(outputMode === 'series' ? 'Una serie tiene de 2 a 10 imágenes.' : 'Puedes generar de 1 a 9 imágenes sueltas.');
  }

  if (mode === 't2i') {
    if (images.length || elements.length) problems.push('Texto a imagen no admite referencias ni personajes. Usa --mode i2i.');
    // Sin materiales, cualquier @ del prompt es una mención huérfana: el servidor también la rechaza.
    const mention = prompt && !images.length && !elements.length ? kling4MentionError(prompt, []) : null;
    if (mention) problems.push(mention);
    return result;
  }
  if (!images.length && !elements.length) problems.push('Imagen a imagen necesita al menos una referencia (--image_urls) o un personaje (--subject_1_name y --subject_1_images).');
  if (images.length + elements.length > 10) problems.push('Kling Image 4.0 admite hasta 10 materiales en total entre referencias y personajes.');

  // Personajes: mismas reglas que gateway_kling_image4_elements.
  const seen = new Set();
  const named = [];
  for (const element of elements) {
    const label = 'el personaje ' + element.slot;
    if (!element.name) { problems.push('Falta --subject_' + element.slot + '_name para ' + label + '.'); continue; }
    let name = element.name;
    if (!/^[一-龥A-Za-z0-9_]{1,20}$/.test(name)) {
      problems.push('El nombre de un personaje debe tener de 1 a 20 letras sin tildes, números o guion bajo (sin espacios).');
      name = null;
    } else if (/^(?:image|object)_\d+$/i.test(name)) {
      problems.push('@' + name + ' es un nombre reservado. Elige otro nombre para el personaje.');
      name = null;
    } else if (seen.has(lowerAscii(name))) {
      problems.push('Ya hay un personaje llamado @' + name + '. Usa nombres distintos.');
      name = null;
    } else seen.add(lowerAscii(name));
    if (!element.images.length) { problems.push('Falta --subject_' + element.slot + '_images para ' + label + '.'); continue; }
    if (element.images.length < 2 || element.images.length > 4) problems.push('El personaje @' + (name || element.name) + ' necesita entre 2 y 4 imágenes.');
    if (element.tag !== undefined && !SUBJECT_TAGS.includes(element.tag)) problems.push('Elige una categoría válida para @' + (name || element.name) + '.');
    if (element.description !== undefined) {
      const description = String(element.description).trim();
      if (!description || Array.from(description).length > 100) problems.push('La descripción de @' + (name || element.name) + ' admite hasta 100 caracteres.');
    }
    element.images.forEach((file) => checkImage(file, 'Una imagen de @' + (name || element.name), problems));
    result.materials += element.images.length;
    if (name) named.push(name);
  }
  images.forEach((file) => checkImage(file, 'Una imagen de referencia', problems));
  result.materials += images.length;

  const names = [...images.map((_, index) => 'image_' + (index + 1)), ...named];
  const mention = prompt ? kling4MentionError(prompt, names) : null;
  if (mention) problems.push(mention);
  return result;
}

export function klingImage4Problems(params, fileParams = {}) {
  return klingImage4Inspect(params, fileParams).problems;
}

// Entrada exacta que valida el servidor (`gateway_kling_image4_input`): nada de campos extra.
export function klingImage4Input(params, uploaded = {}) {
  const mode = String(params.mode ?? 't2i');
  const input = {
    mode,
    prompt: String(params.prompt).trim(),
    output_mode: String(params.output_mode ?? 'default'),
    count: klingImage4Count(params),
    resolution: String(params.resolution ?? '2K').toUpperCase(),
    aspect_ratio: String(params.aspect_ratio ?? 'auto'),
  };
  if (mode !== 'i2i') return input;
  const images = items(uploaded.image_urls);
  const elements = klingImage4Subjects(params, uploaded).map((element) => {
    const item = { name: element.name, image_urls: element.images };
    if (element.tag !== undefined && element.tag !== '') item.tag = element.tag;
    if (element.description !== undefined && String(element.description).trim() !== '') item.description = String(element.description).trim();
    return item;
  });
  if (images.length) input.image_urls = images;
  if (elements.length) input.elements = elements;
  return input;
}
