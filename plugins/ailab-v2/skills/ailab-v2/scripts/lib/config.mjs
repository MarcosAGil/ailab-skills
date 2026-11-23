// La 3.0 es independiente de la 2.x: otra carpeta, otra credencial y otro servidor. No lee
// ~/.config/ailab, ~/.config/ailendra, un runtime descargado ni las variables de la 2.x.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { repositoryRoot } from './folder.mjs';
import { UserError, clean } from './text.mjs';

export const VERSION = '3.0.0';
export const PRODUCTION_ORIGIN = 'https://ailab.ailendra.com';
export const API_PREFIX = '/api/v1';
export const APPROVAL_PATH = '/cuenta/dispositivo';

/** Solo para aislar pruebas e instalaciones de ensayo. No elige servidor ni proyecto. */
export const HOME_VARIABLE = 'AILAB_V2_HOME';

export function stateDir() {
  const custom = process.env[HOME_VARIABLE];
  if (custom) {
    if (!path.isAbsolute(custom)) throw new UserError(HOME_VARIABLE + ' tiene que ser una ruta absoluta.');
    const dir = path.resolve(custom);
    let real = dir;
    try {
      real = fs.realpathSync.native(dir);
    } catch {
      // Aún no existe: se mira por dónde iría.
    }
    // La credencial no puede acabar en un commit.
    if (repositoryRoot(real)) throw new UserError(HOME_VARIABLE + ' no puede estar dentro de un repositorio.');
    return dir;
  }
  return path.join(os.homedir(), '.config', 'ailab-v2');
}

export function downloadsDir() {
  return path.join(os.homedir(), 'Downloads', 'AILAB');
}

export function isLoopback(url) {
  return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
}

/**
 * Con qué servidores se habla: la AILAB de producción o una de este mismo equipo. Ninguno más,
 * para que un token no pueda acabar en otro sitio por una opción o un archivo modificado.
 */
export function checkOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new UserError('Origen no válido: ' + clean(value, 100) + '.');
  }
  const bare = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  const allowed = url.origin === PRODUCTION_ORIGIN || (url.protocol === 'http:' && isLoopback(url));
  if (!bare || !allowed) {
    throw new UserError('AILAB solo se conecta a ' + PRODUCTION_ORIGIN + ' o, para pruebas, a http://127.0.0.1:<puerto>.');
  }
  return url.origin;
}
