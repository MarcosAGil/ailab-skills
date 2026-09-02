// Configuracion de rutas y entorno de la CLI publica de AILAB.
// Sin secretos: aqui solo viven rutas y defaults. Overrides por variables de entorno.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CLI_VERSION = '2.1.12';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// En la instalación completa este módulo vive en scripts/lib/. En las releases
// compactas esbuild lo integra en scripts/pg.mjs. Ambas formas deben resolver la
// misma raíz que contiene catalog/.
export const SKILL_ROOT = path.basename(HERE) === 'lib'
  ? path.resolve(HERE, '..', '..')
  : path.resolve(HERE, '..');

// Base de la plataforma. PG_BASE_URL sigue aceptado para los bancos de pruebas y
// para no romper automatizaciones de la skill anterior.
const legacyBaseOverride = process.env.PG_BASE_URL || '';
const baseOverride = process.env.AILAB_BASE_URL || legacyBaseOverride;
export const BASE_URL = (baseOverride || 'https://ailendra.com/ailab/').replace(/\/+$/, '') + '/';
// Hasta que todos los gateways especializados se hayan migrado y verificado en
// AILAB, las generaciones siguen entrando por el backend probado de The Hub. La
// wallet compartida hace que cuenta, saldo y ledger sigan siendo los mismos.
export const GENERATION_BASE_URL = (process.env.AILAB_GENERATION_BASE_URL || legacyBaseOverride
  || 'https://ailendra.com/thehub/playground/').replace(/\/+$/, '') + '/';

// El token se comparte con la skill anterior. El resto del estado usa un namespace
// propio para que ambas instalaciones puedan convivir sin mezclar manifiestos.
export const LEGACY_CONFIG_DIR = path.join(os.homedir(), '.config', 'ailendra');
export const CONFIG_DIR = process.env.AILAB_CONFIG_DIR || process.env.PG_CONFIG_DIR || path.join(os.homedir(), '.config', 'ailab');
export const CREDENTIALS_DIR = process.env.AILAB_CREDENTIALS_DIR || process.env.PG_CONFIG_DIR || LEGACY_CONFIG_DIR;

// Salida por defecto FUERA de cualquier repositorio (decision del plan v2.1 §11).
export const OUTPUT_DIR = process.env.AILAB_OUTPUT_DIR || process.env.PG_OUTPUT_DIR || path.join(os.homedir(), 'Downloads', 'AILAB');

export const CATALOG_PATH = process.env.AILAB_CATALOG_PATH || process.env.PG_CATALOG_PATH || path.join(SKILL_ROOT, 'catalog', 'catalog.json');
// AILAB publica una copia generada del registro canónico. Las generaciones aún
// entran por The Hub durante la convivencia, pero el catálogo 2.x no comparte URL
// con la skill legacy y por tanto no puede romper instalaciones antiguas.
export const CATALOG_URL = process.env.AILAB_CATALOG_URL || process.env.PG_CATALOG_URL
  || BASE_URL + 'api/v1/skill/catalog.json';
export const SERVER_CONTRACT_VERSION = '2';

export const CUENTA_URL = BASE_URL + 'api/wallet/cuenta.html';
export const ASSISTANTS_URL = process.env.AILAB_ASSISTANTS_URL || BASE_URL + 'api/v1/skill/assistants.json';
export const ASSISTANT_ENDPOINT = process.env.AILAB_ASSISTANT_ENDPOINT || BASE_URL + 'api/v1/skill/assistant.php';
export const TASK_ENDPOINT = process.env.AILAB_TASK_ENDPOINT || BASE_URL + 'api/v1/skill/task.php';
export const RELEASE_MANIFEST_URL = process.env.AILAB_RELEASE_MANIFEST_URL || BASE_URL + 'api/v1/skill/releases/stable.json';
export const UPDATE_CHANNEL = process.env.AILAB_UPDATE_CHANNEL || 'stable';

export function ensureConfigDir() {
  fs.mkdirSync(path.join(CONFIG_DIR, 'manifests'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(CONFIG_DIR, 'runtime'), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(CONFIG_DIR, 'sessions'), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(CONFIG_DIR, 0o700); } catch { /* Windows: sin equivalente */ }
  return CONFIG_DIR;
}

export function warnWindowsPerms() {
  if (process.platform === 'win32') {
    console.error('Aviso: en Windows los permisos 0600 no existen como en macOS/Linux; protege tu carpeta de usuario.');
  }
}
