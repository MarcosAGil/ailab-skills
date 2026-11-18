// Datos de la cuenta y proyectos (contrato «precio-opaco-historial-2026-11-18», secciones 3 y 9).
// `me.pricing` solo trae la etiqueta de la cuenta (`miembro` o `cliente`), si exige proyecto y la versión mínima del
// cliente. El precio no se calcula aquí: lo da siempre el servidor (`price.php`, ver price.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_DIR } from './config.mjs';

export const MEMBER_ACCOUNT = Object.freeze({ label: 'miembro', require_project: false, min_client: null });
export const PROJECT_RE = /^[A-Za-z0-9._-]{1,64}$/;
export const GENERAL_PROJECT = 'sin_proyecto';

// Lectura de `me.pricing`. Sin campo (servidor anterior) la cuenta es de miembro. Cualquier otro dato que mande
// el servidor se ignora: la CLI no guarda nada de precio.
// Devuelve { ok, account } o { ok: false, error } si el servidor manda algo incoherente.
export function accountInfo(me) {
  const raw = me && typeof me === 'object' ? me.pricing : undefined;
  if (raw === undefined || raw === null) return { ok: true, account: { ...MEMBER_ACCOUNT } };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'AILAB ha devuelto unos datos de cuenta no válidos. No se ha enviado nada; avisa a AILAB.' };
  return {
    ok: true,
    account: {
      label: typeof raw.label === 'string' && raw.label ? raw.label : MEMBER_ACCOUNT.label,
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
  const checked = checkProject(value);
  return checked.ok ? { ok: true, project: checked.project, rest } : { ok: false, error: checked.error, rest };
}

// Formato de un proyecto (el mismo que la cabecera X-AILAB-Proyecto). `general: false` rechaza además «sin_proyecto»,
// que es el uso general y no un proyecto (por ejemplo en `flow open`).
export function checkProject(value, { general = true } = {}) {
  if (Array.isArray(value)) return { ok: false, error: '--proyecto solo puede aparecer una vez.' };
  if (value === true) return { ok: false, error: '--proyecto necesita un identificador (por ejemplo 06 o 06_super-cremita).' };
  const project = String(value).trim();
  if (!PROJECT_RE.test(project)) return { ok: false, error: '--proyecto admite de 1 a 64 caracteres: letras sin tilde, números, punto, guion y guion bajo (por ejemplo 06 o 06_super-cremita). No se ha enviado nada.' };
  if (!general && project === GENERAL_PROJECT) return { ok: false, error: '«' + GENERAL_PROJECT + '» es el uso general, no un proyecto. Indica el proyecto del vídeo (por ejemplo 06_super-cremita). No se ha enviado nada.' };
  return { ok: true, project };
}

export const PROJECT_REQUIRED_TEXT = 'Esta cuenta exige --proyecto en cada generación. No se ha cobrado nada.';
export const PRICE_CHANGED_TEXT = 'El precio de tu cuenta ha cambiado desde la cotización. Prepara de nuevo. No se ha cobrado nada.';

// Falla en local antes de subir nada si la cuenta exige proyecto.
export function projectProblem(account, project) {
  return account && account.require_project && !project ? PROJECT_REQUIRED_TEXT : null;
}

// La 2.4.0 guardaba en `account-pricing.json` el último precio de cuenta. Desde la 2.5.0 no existe: se borra en
// silencio al arrancar para que no quede ningún dato de precio en la instalación.
export function removeLegacyAccountCache() {
  try { fs.rmSync(path.join(CONFIG_DIR, 'account-pricing.json'), { force: true }); } catch { /* nada que borrar */ }
}
