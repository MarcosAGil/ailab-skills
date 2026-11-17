// Precio por cuenta y proyectos (contrato «precio-por-cuenta-y-proyectos-2026-11-17», sección 6).
// El servidor da en `me.pricing` la etiqueta y el factor de la cuenta: `miembro` (×1,0) o `cliente`.
// Las tarifas del catálogo son siempre precio de miembro; el precio de la cuenta es
// ceil(round(base × factor, 6)), el mismo redondeo que el servidor. Con factor 1,0 nada cambia.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_DIR, ensureConfigDir } from './config.mjs';

export const MEMBER_PRICING = Object.freeze({ label: 'miembro', factor: 1, rounding: 'ceil', require_project: false, min_client: null });
export const PROJECT_RE = /^[A-Za-z0-9._-]{1,64}$/;
// Factor máximo que la CLI acepta del servidor: un valor fuera de rango es un error, nunca un precio.
const MAX_FACTOR = 10;

function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

// Factor válido o null. Por debajo de 1,0 no existe ninguna etiqueta: se rechaza en vez de abaratar en local.
export function validFactor(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= MAX_FACTOR ? round6(n) : null;
}

// Precio final de la cuenta para un precio base de miembro. Con factor 1,0 devuelve la base sin tocar.
export function priced(base, factor = 1) {
  if (base === null || base === undefined) return base;
  const n = Number(base);
  if (!Number.isFinite(n)) return base;
  const f = validFactor(factor);
  if (f === null) throw new Error('Factor de precio no válido.');
  if (f === 1) return base;
  return Math.ceil(round6(n * f));
}

// Lectura de `me.pricing`. Sin campo (servidor anterior) la cuenta es de miembro.
// Devuelve { ok, pricing } o { ok: false, error } si el servidor manda algo incoherente.
export function accountPricing(me) {
  const raw = me && typeof me === 'object' ? me.pricing : undefined;
  if (raw === undefined || raw === null) return { ok: true, pricing: { ...MEMBER_PRICING } };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'AILAB ha devuelto un precio de cuenta no válido. No se ha enviado nada; avisa a AILAB.' };
  const factor = raw.factor === undefined ? 1 : validFactor(raw.factor);
  if (factor === null) return { ok: false, error: 'AILAB ha devuelto un factor de precio no válido para tu cuenta. No se ha enviado nada; avisa a AILAB.' };
  if (raw.rounding !== undefined && raw.rounding !== 'ceil') return { ok: false, error: 'AILAB usa un redondeo de precio que esta versión no conoce. Actualiza AILAB con `update --confirmed`; no se ha enviado nada.' };
  return {
    ok: true,
    pricing: {
      label: typeof raw.label === 'string' && raw.label ? raw.label : (factor === 1 ? 'miembro' : 'cliente'),
      factor,
      rounding: 'ceil',
      require_project: raw.require_project === true,
      min_client: typeof raw.min_client === 'string' ? raw.min_client : null,
    },
  };
}

// `--proyecto` es genérico: nunca llega a validateParams ni al cuerpo de un adaptador. Viaja en la cabecera
// X-AILAB-Proyecto. Devuelve { ok, project, rest } con las opciones sin `proyecto`.
export function takeProject(opts) {
  const rest = { ...(opts || {}) };
  const value = rest.proyecto;
  delete rest.proyecto;
  if (value === undefined) return { ok: true, project: null, rest };
  if (Array.isArray(value)) return { ok: false, error: '--proyecto solo puede aparecer una vez.', rest };
  if (value === true) return { ok: false, error: '--proyecto necesita un identificador (por ejemplo 06 o 06_super-cremita).', rest };
  const project = String(value).trim();
  if (!PROJECT_RE.test(project)) return { ok: false, error: '--proyecto admite de 1 a 64 caracteres: letras sin tilde, números, punto, guion y guion bajo (por ejemplo 06 o 06_super-cremita). No se ha enviado nada.', rest };
  return { ok: true, project, rest };
}

export const PROJECT_REQUIRED_TEXT = 'Esta cuenta exige --proyecto en cada generación. No se ha cobrado nada.';
export const PRICE_CHANGED_TEXT = 'El precio de tu cuenta cambió; vuelve a preparar. No se ha cobrado nada.';

// Falla en local antes de subir nada si la cuenta exige proyecto.
export function projectProblem(pricing, project) {
  return pricing && pricing.require_project && !project ? PROJECT_REQUIRED_TEXT : null;
}

// Factor congelado en un manifiesto o una petición. Sin campo (anterior a la 2.4.0) es 1,0.
export function frozenFactor(record) {
  if (!record || record.price_factor === undefined || record.price_factor === null) return 1;
  return validFactor(record.price_factor);
}

// Último precio de cuenta que dio `me`. Solo sirve para MOSTRAR precios sin red (info, models, validate,
// assistants); prepare y submit lo vuelven a pedir siempre. Se borra con logout y se rehace con login.
const cacheFile = () => path.join(CONFIG_DIR, 'account-pricing.json');

export function savePricingCache(pricing) {
  try {
    ensureConfigDir();
    const value = { label: pricing.label, factor: pricing.factor, require_project: !!pricing.require_project, saved_at: new Date().toISOString() };
    const tmp = cacheFile() + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
    fs.writeFileSync(tmp, JSON.stringify(value) + '\n', { mode: 0o600 });
    fs.renameSync(tmp, cacheFile());
  } catch { /* la caché es opcional */ }
}

export function loadPricingCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(cacheFile(), 'utf8'));
    const factor = validFactor(raw && raw.factor);
    if (factor === null) return null;
    return { ...MEMBER_PRICING, label: typeof raw.label === 'string' ? raw.label : MEMBER_PRICING.label, factor, require_project: raw.require_project === true };
  } catch { return null; }
}

export function clearPricingCache() {
  try { fs.rmSync(cacheFile(), { force: true }); } catch { /* nada que borrar */ }
}
