// Precio vigente que ve el agente (`info`). Una promoción caducada nunca se muestra como si siguiera en vigor:
// se resuelve a la fecha de hoy y solo queda visible mientras esté activa, con su fecha de fin. El importe que se da
// al usuario sale siempre de la estimación de la CLI (`prepare` o la que calcula `info`), nunca de leer tablas a mano.
import { estimateCredits, requiresServerQuote } from './catalog.mjs';
import { LIGHT_ID, lightCredits } from './genjutsu-light.mjs';
import { DRAFT_UPGRADE_ID } from './seedance-draft.mjs';

const PRICE_PARAMS = ['by_param', 'row_param', 'column_param', 'rate_param', 'mode_param', 'quality_param', 'audio_param'];

function expiry(promo) {
  const ends = promo && promo.until ? Date.parse(String(promo.until)) : NaN;
  return Number.isFinite(ends) ? ends : null;
}

const clone = (value) => JSON.parse(JSON.stringify(value));

// Une una tabla de tarifas anteriores sobre la vigente (o la ordinaria): cada fila conserva el resto de sus valores.
function overlay(target, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (value && typeof value === 'object') {
      target[key] = overlay(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

// Estimación tal como rige en `now`. Promoción caducada: las tarifas ordinarias pasan a ser las tarifas y desaparece
// `promo`. Promoción activa: las tarifas vigentes son las promocionales y `promo_activa` indica hasta cuándo.
export function currentEstimate(estimate, now = Date.now()) {
  const copy = clone(estimate || {});
  const promo = copy.promo;
  if (!promo) return { estimate: copy, promo: null };
  delete copy.promo;
  const ends = expiry(promo);
  const active = ends !== null && now < ends;
  if (active) {
    // Las tablas por segundo ya contienen la tarifa promocional; las demás la superponen la promoción.
    if (promo.credits_by_value) {
      overlay(copy.credits_by_value = copy.credits_by_value || {}, promo.credits_by_value);
      if (copy.credits_with_files) overlay(copy.credits_with_files, promo.credits_by_value);
    }
    if (promo.credits_per_1000_by_value) overlay(copy.credits_per_1000_by_value = copy.credits_per_1000_by_value || {}, promo.credits_per_1000_by_value);
    return { estimate: copy, promo: { label: String(promo.label || 'Oferta temporal'), until: String(promo.until) } };
  }
  if (promo.previous_credits_per_second) overlay(copy.credits_per_second = copy.credits_per_second || {}, promo.previous_credits_per_second);
  if (promo.previous_credits_with_video) overlay(copy.credits_with_video = copy.credits_with_video || {}, promo.previous_credits_with_video);
  if (promo.previous_credits_matrix) overlay(copy.credits_matrix = copy.credits_matrix || {}, promo.previous_credits_matrix);
  if (promo.previous_credits_with_video_matrix) overlay(copy.credits_with_video_matrix = copy.credits_with_video_matrix || {}, promo.previous_credits_with_video_matrix);
  return { estimate: copy, promo: null };
}

const rate = (value) => String(value).replace('.', ',');
const day = (ms) => new Date(ms).toISOString().slice(0, 10);

function tableText(table, unit) {
  return Object.entries(table || {}).map(([key, value]) => key + ' ' + rate(value) + unit).join(' · ');
}

function humanTariff(estimate) {
  switch (estimate.kind) {
    case 'per_second_table': {
      const lines = [];
      if (estimate.credits_per_second) lines.push('Por segundo: ' + tableText(estimate.credits_per_second, ' cr/s'));
      if (estimate.credits_with_audio) lines.push('Por segundo con audio: ' + tableText(estimate.credits_with_audio, ' cr/s'));
      if (estimate.credits_with_video) lines.push('Por segundo con vídeo de entrada: ' + tableText(estimate.credits_with_video, ' cr/s'));
      return lines;
    }
    case 'per_second_matrix':
      return Object.entries(estimate.credits_matrix || {}).map(([row, columns]) => 'Por segundo · ' + row + ': ' + tableText(columns, ' cr/s'));
    case 'param_table':
      return ['Por generación: ' + tableText(estimate.credits_by_value, ' cr')];
    case 'per_1000_chars':
      return estimate.credits_per_1000_by_value
        ? ['Por 1.000 caracteres: ' + tableText(estimate.credits_per_1000_by_value, ' cr')]
        : ['Por 1.000 caracteres: ' + rate(estimate.credits_per_1000) + ' cr'];
    case 'flat_credits':
      return ['Tarifa fija: ' + estimate.credits + ' cr'];
    case 'unit_credits':
      return ['Por ' + (estimate.unit_name || 'unidad') + ': ' + rate(estimate.credits_per_unit ?? '') + ' ' + (estimate.unit_label || 'cr')];
    default:
      return [];
  }
}

function baseParams(model) {
  const params = {};
  for (const [name, spec] of Object.entries(model.params || {})) {
    if (spec.internal || spec.type === 'file' || spec.type === 'file[]' || spec.type === 'string' || spec.type === 'string[]') continue;
    if (spec.default !== undefined) params[name] = spec.default;
    else if (spec.type === 'enum') params[name] = spec.values[0];
    else if ((spec.type === 'int' || spec.type === 'number') && spec.min !== undefined) params[name] = spec.min;
  }
  return params;
}

// Estimaciones ya calculadas con la regla de la CLI: valores por defecto y cada valor de los parámetros que fijan el precio.
const EXAMPLE_KINDS = new Set(['per_second_table', 'per_second_matrix', 'param_table', 'matrix_table', 'mixed_mode', 'hybrid_seedream']);

export function priceExamples(model, now = Date.now()) {
  const base = baseParams(model);
  const estimate = model.estimate || {};
  if (!EXAMPLE_KINDS.has(estimate.kind)) return [];
  const asText = (params) => {
    try {
      const result = estimateCredits(model, params, now);
      return Number.isFinite(result.credits) && result.credits > 0 ? result.credits : null;
    } catch { return null; }
  };
  const lines = [];
  const baseline = asText(base);
  const factors = [];
  for (const key of PRICE_PARAMS) {
    const name = estimate[key];
    const spec = name && model.params && model.params[name];
    if (spec && spec.type === 'enum' && spec.values.length > 1 && spec.values.length <= 10 && !factors.includes(name)) factors.push(name);
  }
  const fixed = Object.entries(base).filter(([name]) => !factors.includes(name) && [estimate.seconds_param, estimate.duration_param].includes(name));
  const context = fixed.map(([name, value]) => name + '=' + value).join(' ');
  for (const name of factors) {
    const entries = model.params[name].values.map((value) => [value, asText({ ...base, [name]: value })]).filter(([, credits]) => credits !== null);
    if (entries.length) lines.push('Estimado por ' + name + (context ? ' (' + context + ')' : '') + ': ' + entries.map(([value, credits]) => value + ' ' + credits + ' cr').join(' · '));
  }
  if (baseline !== null && !lines.length) lines.push('Estimado con los valores por defecto' + (context ? ' (' + context + ')' : '') + ': ' + baseline + ' cr');
  return lines;
}

// Texto de precio de `info`. Nunca imprime la tabla caducada de una promoción terminada.
export function pricingLines(model, now = Date.now()) {
  const lines = [];
  if (model.id === LIGHT_ID) {
    // Light: el servidor cotiza, y la tarifa por segundo de vídeo (salida + vídeo de entrada) es la misma en local.
    const rates = (model.estimate && model.estimate.credits_per_second) || {};
    lines.push('Precio: lo cotiza el servidor al ejecutar `prepare`; da al usuario esa cotización.');
    lines.push('  Referencia por segundo de vídeo (salida + vídeo de entrada, 2 x ceil(duración), máximo 15 s): '
      + Object.entries(rates).map(([resolution, credits]) => resolution + ' ' + String(credits).replace('.', ',') + ' cr').join(' · '));
    const examples = Object.keys(rates).map((resolution) => [resolution, lightCredits(model.estimate, resolution, 10)]).filter(([, credits]) => credits !== null);
    if (examples.length) lines.push('  Ejemplo con 10 s de vídeo: ' + examples.map(([resolution, credits]) => resolution + ' ' + credits + ' cr').join(' · '));
    return lines;
  }
  if (model.id === DRAFT_UPGRADE_ID) {
    lines.push('Precio: lo cotiza el servidor para cada draft. `drafts` lo muestra y `prepare` autoriza esa cifra exacta; da al usuario esa cifra.');
    return lines;
  }
  if (requiresServerQuote(model, {}) || model.estimate?.kind === 'higgsfield_quote') {
    lines.push('Precio: lo cotiza el servidor al ejecutar `prepare` (no hay tarifa local). Da al usuario esa cotización.');
    return lines;
  }
  const { estimate, promo } = currentEstimate(model.estimate, now);
  const view = { ...model, estimate };
  lines.push('Precio vigente a ' + day(now) + ' (UTC)' + (promo ? ' · PROMOCIÓN ACTIVA hasta ' + promo.until + ' (' + promo.label + '); después rige la tarifa ordinaria' : ' · tarifa ordinaria') + ':');
  for (const line of humanTariff(estimate)) lines.push('  ' + line);
  if (model.id === 'eleven-tts') lines.push('  V4: el servidor cotiza por voz en `prepare`.');
  for (const line of priceExamples(view, now)) lines.push('  ' + line);
  // La nota de un modelo que tuvo promoción suele hablar de ella (y de su fecha): se omite para no resucitar una oferta terminada.
  const { note, ...rule } = estimate;
  lines.push('  Regla de cálculo vigente: ' + JSON.stringify(rule));
  if (note && !(model.estimate && model.estimate.promo)) lines.push('  Nota: ' + note);
  lines.push('  Para dar un precio al usuario usa el presupuesto de la CLI (`prepare`) o estas estimaciones; no leas ni calcules con tablas a mano.');
  return lines;
}
