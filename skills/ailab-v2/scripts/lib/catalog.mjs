// La CLI no sabe de modelos ni de precios: los campos salen del catálogo del servidor y el
// precio, de su presupuesto. Aquí solo se caza pronto el error de quien escribe la orden.
import { account } from './auth.mjs';
import { command, one } from './args.mjs';
import { UserError, clean, fold, print, quote } from './text.mjs';

const MODEL_ID = /^[a-z0-9][a-z0-9._-]{0,120}$/;
const KINDS = { imagen: 'image', image: 'image', video: 'video', audio: 'audio' };

export async function catalogItems(api) {
  const body = await api('GET', '/catalog');
  if (!Array.isArray(body?.items)) throw new UserError('AILAB no ha devuelto el catálogo.');
  return body.items;
}

export function findModel(items, id) {
  const model = items.find((item) => item.id === id);
  if (model) return model;
  const wanted = fold(id);
  const near = items
    .filter((item) => MODEL_ID.test(item.id) && (item.id.includes(wanted) || fold(item.name).includes(wanted)))
    .slice(0, 8);
  throw new UserError('El modelo ' + quote(id, 80) + ' no está en el catálogo de tu cuenta.' + (near.length ? ' Parecidos: ' + near.map((item) => item.id).join(', ') + '.' : ' Mira models.'));
}

export function mediaKind(schema) {
  return schema?.['x-ailab-media'] ?? schema?.items?.['x-ailab-media'];
}

/** Un campo que el esquema prohíbe. */
const closed = (schema) => Boolean(schema?.not && Object.keys(schema.not).length === 0);

function kindOf(schema) {
  if (schema.anyOf) return schema.anyOf.map(kindOf).join(' | ');
  if ('const' in schema) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => clean(value, 80)).join(' | ');
  const media = mediaKind(schema);
  if (schema.type === 'array') {
    const item = media ? 'archivo de ' + media : schema.items ? kindOf(schema.items) : 'valor';
    const limits = [schema.minItems && 'mín. ' + schema.minItems, schema.maxItems && 'máx. ' + schema.maxItems].filter(Boolean);
    return 'lista de ' + item + (limits.length ? ' (' + limits.join(', ') + ')' : '') + '; repite la opción';
  }
  if (media) return 'archivo de ' + media;
  if (schema.type === 'object') {
    const fields = Object.entries(schema.properties || {})
      .filter(([, field]) => !closed(field))
      .map(([name, field]) => clean(name, 60) + ((schema.required || []).includes(name) ? '*' : '') + ': ' + kindOf(field));
    return 'JSON {' + fields.join('; ') + '}';
  }
  let text = [].concat(schema.type || 'texto').join(' o ');
  if (schema.minimum !== undefined || schema.maximum !== undefined) text += ' de ' + (schema.minimum ?? '…') + ' a ' + (schema.maximum ?? '…');
  if (schema.maxLength !== undefined) text += ', hasta ' + schema.maxLength + ' caracteres';
  return text;
}

export async function models(argv) {
  const { options } = command(argv, { options: ['tipo', 'buscar'] });
  let items = await catalogItems(account().api);
  const type = one(options, 'tipo');
  if (type !== undefined) items = items.filter((item) => item.modality === (KINDS[fold(type)] ?? fold(type)));
  const search = one(options, 'buscar');
  if (search !== undefined) items = items.filter((item) => fold(item.id + ' ' + item.name).includes(fold(search)));
  print(
    items.filter((item) => MODEL_ID.test(item.id)).map((item) => item.id + ' · ' + clean(item.modality, 30) + ' · ' + quote(item.name, 100)),
    items.length + ' modelos en el catálogo de tu cuenta. Campos: info <modelo>. Precio: prepare.',
  );
}

export async function info(argv) {
  const { positional } = command(argv, { min: 1 });
  const model = findModel(await catalogItems(account().api), positional[0]);
  const schema = model.inputSchema || {};
  const lines = [clean(model.id, 120) + ' · ' + clean(model.modality, 30) + ' · ' + quote(model.name, 100)];
  if (model.presentation?.description) lines.push('Descripción: ' + quote(model.presentation.description, 300));
  lines.push('Campos (* obligatorio):');
  for (const [name, field] of Object.entries(schema.properties || {})) {
    if (closed(field)) continue;
    const notes = [];
    if (field.default !== undefined) notes.push('por defecto ' + JSON.stringify(field.default));
    if (field['x-ailab-when']) notes.push('con ' + JSON.stringify(field['x-ailab-when']));
    if (field['x-ailab-options']) notes.push('opciones ' + JSON.stringify(field['x-ailab-options']).slice(0, 600));
    if (field['x-ailab-parent']) notes.push('id de una generación tuya');
    lines.push(clean(
      '  --' + name + ((schema.required || []).includes(name) ? '*' : '') + ': ' + kindOf(field) + (notes.length ? ' · ' + notes.join(' · ') : ''),
      4000,
    ));
  }
  lines.push('Los archivos son rutas locales, ids de subida o generacion:<id>:<posición>. El precio lo da prepare.');
  print(lines);
}

function valueFromText(schema, text, name) {
  const wrong = () => new UserError('--' + clean(name, 60) + ': ' + quote(text, 80) + ' no vale. Se espera ' + clean(kindOf(schema), 500) + '.');
  if (schema.anyOf) {
    for (const option of schema.anyOf) {
      try {
        const value = valueFromText(option, text, name);
        if (!problem(option, value)) return value;
      } catch (error) {
        if (!(error instanceof UserError)) throw error;
      }
    }
    throw wrong();
  }
  const types = [].concat(schema.type ?? ('const' in schema ? typeof schema.const : []));
  if (types.includes('string')) return text;
  if (types.includes('number') || types.includes('integer')) {
    const value = Number(text);
    if (!text.trim() || !Number.isFinite(value)) throw wrong();
    return value;
  }
  if (types.includes('boolean')) {
    if (text === 'true' || text === 'false') return text === 'true';
    throw wrong();
  }
  if (types.includes('object') || types.includes('array')) {
    try {
      return JSON.parse(text);
    } catch {
      throw wrong();
    }
  }
  return text;
}

/** Una lista escrita entera como JSON. `[susurro]` no lo es: es un texto. */
function wholeList(values) {
  if (values.length !== 1 || !values[0].trim().startsWith('[')) return null;
  try {
    return JSON.parse(values[0]);
  } catch {
    return null;
  }
}

/** La entrada del modelo: un archivo JSON y, por encima, las opciones sueltas. */
export function buildInput(schema, fromFile, options) {
  const input = { ...fromFile };
  for (const [name, values] of options) {
    if (!Object.hasOwn(schema.properties || {}, name)) throw new UserError('Este modelo no tiene --' + clean(name, 60) + '. Mira info <modelo>.');
    const field = schema.properties[name];
    if (field.type === 'array') {
      input[name] = wholeList(values) ?? values.map((text) => valueFromText(field.items || {}, text, name));
    } else {
      if (values.length > 1) throw new UserError('--' + clean(name, 60) + ' solo puede ir una vez.');
      input[name] = valueFromText(field, values[0], name);
    }
  }
  const error = problem(schema, input);
  if (error) throw new UserError(clean(error) + ' Mira info <modelo>. No se ha gastado nada.');
  return input;
}

function problem(schema, value, where = '') {
  const at = where || 'la entrada';
  const wrong = (text) => at + ': ' + text + '.';
  if (closed(schema)) return wrong('no se admite');
  if (schema.anyOf) return schema.anyOf.some((option) => !problem(option, value, where)) ? null : wrong('se espera ' + kindOf(schema));
  if ('const' in schema && value !== schema.const) return wrong('se espera ' + JSON.stringify(schema.const));
  if (schema.enum && !schema.enum.includes(value)) return wrong('se espera ' + kindOf(schema));
  const types = [].concat(schema.type || []);
  if (types.length) {
    const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    if (!types.includes(actual) && !(types.includes('integer') && Number.isInteger(value))) return wrong('se espera ' + types.join(' o '));
  }
  if (typeof value === 'number') {
    if (value < schema.minimum) return wrong('mínimo ' + schema.minimum);
    if (value > schema.maximum) return wrong('máximo ' + schema.maximum);
  }
  if (typeof value === 'string' && schema.maxLength !== undefined && [...value].length > schema.maxLength) return wrong('máximo ' + schema.maxLength + ' caracteres');
  if (Array.isArray(value)) {
    if (value.length < schema.minItems) return wrong('mínimo ' + schema.minItems);
    if (value.length > schema.maxItems) return wrong('máximo ' + schema.maxItems);
    for (let index = 0; index < value.length; index += 1) {
      const error = schema.items && problem(schema.items, value[index], at + '[' + index + ']');
      if (error) return error;
    }
  } else if (value && typeof value === 'object' && schema.properties) {
    const prefix = where ? where + '.' : '';
    for (const name of schema.required || []) {
      if (!Object.hasOwn(value, name)) return prefix + name + ': es obligatorio.';
    }
    for (const [name, child] of Object.entries(value)) {
      if (!Object.hasOwn(schema.properties, name)) {
        if (schema.additionalProperties === false) return prefix + name + ': ese campo no existe.';
        continue;
      }
      const error = problem(schema.properties[name], child, prefix + name);
      if (error) return error;
    }
  }
  return null;
}
