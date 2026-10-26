// Entorno de ejecucion de la CLI: sandbox de Codex, arranque instalado (plugin o
// skill manual) y avisos. Solo lee el sistema de archivos del usuario; nunca
// escribe fuera de CONFIG_DIR y nunca guarda credenciales en el proyecto.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CONFIG_DIR, CREDENTIALS_DIR, OUTPUT_DIR } from './config.mjs';

// Version minima del arranque (scripts/ailab.mjs + lib/updater.mjs) a partir de
// la cual no se avisa de "actualiza el plugin". Vive en el runtime firmado, no en
// stable.json ni en el catalogo: ambos tienen claves exactas que validan los
// arranques ya instalados.
export const MINIMUM_BOOTSTRAP_VERSION = '1.1.0';
export const PLUGIN_NAME = 'ailab';
export const MARKETPLACE_NAME = 'ailendra-labs';

const FS_BLOCKED = new Set(['EPERM', 'EACCES', 'EROFS']);
const NETWORK_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT']);

function parseSemver(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(value || ''));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function semverLess(a, b) {
  const pa = parseSemver(a), pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return true;
    if (pa[i] > pb[i]) return false;
  }
  return false;
}

export function claudeHome(env = process.env, home = os.homedir()) {
  return env.CLAUDE_CONFIG_DIR ? path.resolve(env.CLAUDE_CONFIG_DIR) : path.join(home, '.claude');
}

export function codexHome(env = process.env, home = os.homedir()) {
  return env.CODEX_HOME ? path.resolve(env.CODEX_HOME) : path.join(home, '.codex');
}

// ---------------------------------------------------------------- sandbox de Codex

export function isCodexSandbox(env = process.env) {
  return Boolean(env.CODEX_SANDBOX) || env.CODEX_SANDBOX_NETWORK_DISABLED === '1';
}

function tomlString(value) {
  return value.includes('\\') && !value.includes("'") ? "'" + value + "'" : JSON.stringify(value);
}

// Carpetas donde el agente debe poder escribir. El token se lee pero no se escribe desde el
// agente (login y logout los ejecuta la persona en su terminal), asi que no se pide para el.
function writableDirs() {
  return [...new Set([CONFIG_DIR, OUTPUT_DIR])];
}

// Carpeta de estado configurada a la que pertenece una ruta (para no mostrar un temporal).
export function stateDirOf(target) {
  const resolved = path.resolve(String(target || ''));
  return [CONFIG_DIR, OUTPUT_DIR, CREDENTIALS_DIR].find((dir) => resolved === path.resolve(dir) || resolved.startsWith(path.resolve(dir) + path.sep)) || resolved;
}

export function codexSandboxAdvice({ network = true, write = true, extra = [] } = {}) {
  const dirs = [...new Set([...writableDirs(), ...extra])];
  const lines = [];
  lines.push('El sandbox de Codex impide que AILAB funcione: ' + (network && write ? 'bloquea la red y la escritura fuera del proyecto.' : network ? 'bloquea la red.' : 'impide escribir fuera del proyecto.'));
  lines.push('Ajuste en ~/.codex/config.toml (y reinicia Codex):');
  lines.push('  [sandbox_workspace_write]');
  if (network) lines.push('  network_access = true');
  if (write) lines.push('  writable_roots = [' + dirs.map(tomlString).join(', ') + ']');
  const flags = [];
  if (write) for (const dir of dirs) flags.push('--add-dir ' + (/\s/.test(dir) ? JSON.stringify(dir) : dir));
  if (network) flags.push('-c sandbox_workspace_write.network_access=true');
  lines.push('O, solo para esta sesión: codex ' + flags.join(' '));
  lines.push('AILAB guarda su estado en ' + CONFIG_DIR + ' y el token en ' + CREDENTIALS_DIR + ' (el agente solo lo lee), nunca dentro del proyecto. Haz el login en tu propia terminal, fuera del sandbox.');
  return lines.join('\n');
}

export function networkAdvice(env = process.env) {
  if (isCodexSandbox(env)) return codexSandboxAdvice({ network: true, write: false });
  return 'No hay conexión con AILAB (' + (process.env.AILAB_BASE_URL || 'https://ailendra.com/ailab/') + '). Comprueba tu red, proxy o VPN. Si ejecutas la CLI dentro del sandbox de un agente, permite el acceso a la red.';
}

function causeChain(error) {
  const chain = [];
  for (let current = error; current && chain.length < 6; current = current.cause) chain.push(current);
  return chain;
}

export function isFsBlocked(error) {
  return causeChain(error).some((item) => item && FS_BLOCKED.has(item.code));
}

export function isNetworkFailure(error) {
  return causeChain(error).some((item) => item && (NETWORK_CODES.has(item.code)
    || /fetch failed|Sin conexion con la plataforma|No se pudo validar un catalogo fresco: .*(fetch failed|ENOTFOUND)/i.test(String(item.message || ''))));
}

function isStatePath(target) {
  if (!target) return false;
  const resolved = path.resolve(String(target));
  return [CONFIG_DIR, OUTPUT_DIR, CREDENTIALS_DIR].some((dir) => resolved === path.resolve(dir) || resolved.startsWith(path.resolve(dir) + path.sep));
}

// Traduce un fallo de entorno a un mensaje accionable. Devuelve null cuando el
// error no es de red ni de permisos sobre las carpetas de AILAB, para que el
// llamador conserve el original (p. ej. un EACCES al leer un archivo del usuario).
export function describeEnvironmentError(error, env = process.env) {
  if (isFsBlocked(error)) {
    const blocked = causeChain(error).find((item) => item && FS_BLOCKED.has(item.code));
    const where = causeChain(error).map((item) => item && item.path).find(Boolean);
    const sandboxed = isCodexSandbox(env);
    if (!isStatePath(where) && !sandboxed) return null;
    const head = 'AILAB no puede escribir' + (where ? ' en ' + (isStatePath(where) ? stateDirOf(where) : where) : ' en su carpeta de estado') + ' (' + blocked.code + ').';
    return sandboxed
      ? head + '\n' + codexSandboxAdvice({ network: env.CODEX_SANDBOX_NETWORK_DISABLED === '1', write: true, extra: where && !isStatePath(where) ? [path.dirname(path.resolve(where))] : [] })
      : head + '\nDa permiso de escritura a ' + CONFIG_DIR + ' y a ' + OUTPUT_DIR + ', o define AILAB_CONFIG_DIR y AILAB_OUTPUT_DIR en una carpeta donde puedas escribir. No guardes el token dentro de un proyecto.';
  }
  if (isNetworkFailure(error)) return networkAdvice(env);
  return null;
}

// ---------------------------------------------------------------- arranque instalado

export function pathKind(dir, env = process.env, home = os.homedir()) {
  if (!dir) return 'unknown';
  const resolved = safeReal(dir);
  const plugins = [path.join(claudeHome(env, home), 'plugins') + path.sep, path.join(codexHome(env, home), 'plugins') + path.sep]
    .map(safeReal);
  if (plugins.some((root) => resolved.startsWith(root))) return 'plugin';
  if (resolved === safeReal(path.join(claudeHome(env, home), 'skills', PLUGIN_NAME))) return 'manual-claude';
  if (resolved === safeReal(path.join(codexHome(env, home), 'skills', PLUGIN_NAME))) return 'manual-codex';
  return 'other';
}

function safeReal(target) {
  try { return fs.realpathSync(target); } catch { return path.resolve(target); }
}

function readBootstrapVersion(dir) {
  try {
    const text = fs.readFileSync(path.join(dir, 'scripts', 'lib', 'updater.mjs'), 'utf8');
    const match = /export const BOOTSTRAP_VERSION = '(\d+\.\d+\.\d+)'/.exec(text);
    return match ? match[1] : null;
  } catch { return null; }
}

// El bootstrap 1.1+ anuncia su version y carpeta por entorno. Un bootstrap 1.0.0
// no lo hace, pero el runtime se importa desde el: process.argv[1] es su
// scripts/ailab.mjs y de ahi se lee la version del updater.
export function bootstrapInfo({ env = process.env, argv1 = process.argv[1], home = os.homedir() } = {}) {
  let dir = env.AILAB_BOOTSTRAP_DIR ? path.resolve(env.AILAB_BOOTSTRAP_DIR) : null;
  if (!dir && argv1 && path.basename(argv1) === 'ailab.mjs' && path.basename(path.dirname(argv1)) === 'scripts') {
    dir = path.dirname(path.dirname(path.resolve(argv1)));
  }
  const version = (env.AILAB_BOOTSTRAP_VERSION && parseSemver(env.AILAB_BOOTSTRAP_VERSION) ? env.AILAB_BOOTSTRAP_VERSION : null)
    || (dir ? readBootstrapVersion(dir) : null);
  return { dir, version, kind: pathKind(dir, env, home) };
}

// Comando listo para pegar. Usa la ruta real del arranque cuando se conoce.
export function cliCommand(subcommand = '', info = bootstrapInfo()) {
  const entry = info.dir ? path.join(info.dir, 'scripts', 'ailab.mjs') : 'scripts/ailab.mjs';
  const quoted = /\s/.test(entry) ? JSON.stringify(entry) : entry;
  return 'node ' + quoted + (subcommand ? ' ' + subcommand : '');
}

function manifestOf(dir) {
  try {
    const skill = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    if (!/^name:\s*ailab\s*$/m.test(skill.split(/\n---\n/)[0])) return null;
    return true;
  } catch { return null; }
}

function listDirs(parent) {
  try {
    return fs.readdirSync(parent, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(parent, entry.name));
  } catch { return []; }
}

function newestVersionDir(dirs) {
  const versioned = dirs.filter((dir) => parseSemver(path.basename(dir)));
  const sorted = versioned.sort((a, b) => (semverLess(path.basename(a), path.basename(b)) ? -1 : semverLess(path.basename(b), path.basename(a)) ? 1 : 0));
  return sorted.length ? sorted[sorted.length - 1] : (dirs[0] || null);
}

// Instalaciones del plugin de AILAB en las caches de Claude Code y Codex. Una actualizacion
// deja la version anterior en la cache de Claude Code: solo cuenta la mas reciente de cada
// marketplace, o las que declara installed_plugins.json cuando existe.
export function findPluginInstalls({ env = process.env, home = os.homedir() } = {}) {
  const found = [];
  const add = (agent, skillDir) => {
    if (manifestOf(skillDir) && !found.some((item) => safeReal(item.skillDir) === safeReal(skillDir))) found.push({ agent, skillDir });
  };
  const claude = claudeHome(env, home);
  let registered = false;
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(claude, 'plugins', 'installed_plugins.json'), 'utf8'));
    for (const [key, installs] of Object.entries(registry.plugins || {})) {
      if (!key.startsWith(PLUGIN_NAME + '@') || !Array.isArray(installs)) continue;
      for (const install of installs) {
        if (!install || typeof install.installPath !== 'string') continue;
        registered = true;
        add('claude', path.join(install.installPath, 'skills', PLUGIN_NAME));
      }
    }
  } catch { /* sin registro */ }
  for (const [agent, root] of [['claude', claude], ['codex', codexHome(env, home)]]) {
    if (agent === 'claude' && registered) continue;
    for (const marketplace of listDirs(path.join(root, 'plugins', 'cache'))) {
      const newest = newestVersionDir(listDirs(path.join(marketplace, PLUGIN_NAME)));
      if (newest) add(agent, path.join(newest, 'skills', PLUGIN_NAME));
    }
  }
  return found;
}

export function findManualInstalls({ env = process.env, home = os.homedir() } = {}) {
  const found = [];
  for (const [agent, root] of [['claude', claudeHome(env, home)], ['codex', codexHome(env, home)]]) {
    const dir = path.join(root, 'skills', PLUGIN_NAME);
    if (manifestOf(dir)) found.push({ agent, skillDir: dir });
  }
  return found;
}

export function environmentNotices({ env = process.env, home = os.homedir(), info = bootstrapInfo({ env, home }) } = {}) {
  const notices = [];
  const manual = info.kind === 'manual-claude' || info.kind === 'manual-codex';
  if (info.version && semverLess(info.version, MINIMUM_BOOTSTRAP_VERSION)) {
    notices.push({
      id: 'minimum_bootstrap',
      text: 'Actualiza el plugin de AILAB: tu arranque ' + info.version + ' es anterior al mínimo recomendado ' + MINIMUM_BOOTSTRAP_VERSION
        + '. Los modelos y los precios siguen actualizándose solos, pero el arranque no.'
        + (manual
          ? ' Instala el plugin y retira la skill manual (docs/instalacion-plugin.md del repositorio MarcosAGil/ailab-skills).'
          : ' Claude Code: claude plugin marketplace update ' + MARKETPLACE_NAME + ' && claude plugin update ' + PLUGIN_NAME + '@' + MARKETPLACE_NAME
            + ' · Codex: codex plugin marketplace upgrade ' + MARKETPLACE_NAME + '.'),
    });
  }
  const plugins = findPluginInstalls({ env, home });
  const manuals = findManualInstalls({ env, home });
  const here = info.dir ? safeReal(info.dir) : null;
  if (manual && plugins.length) {
    notices.push({
      id: 'double_install',
      text: 'AILAB está instalada dos veces: esta skill manual (' + info.dir + ') y el plugin (' + plugins.map((item) => item.skillDir).join(', ')
        + '). El agente puede cargar la copia antigua. Retira la manual con: node tools/migrate-to-plugin.mjs --apply (repositorio MarcosAGil/ailab-skills; mueve la carpeta a una copia de seguridad, no la borra).',
    });
  } else if (info.kind === 'plugin' && manuals.length) {
    const others = manuals.filter((item) => !here || safeReal(item.skillDir) !== here);
    if (others.length) {
      notices.push({
        id: 'double_install',
        text: 'AILAB está instalada dos veces: este plugin y una skill manual (' + others.map((item) => item.skillDir).join(', ')
          + '). Retira la manual con: node tools/migrate-to-plugin.mjs --apply (repositorio MarcosAGil/ailab-skills; la mueve a una copia de seguridad).',
      });
    }
  }
  return notices;
}

// Evita repetir el mismo aviso en cada comando: una vez cada 24 h por aviso. Si no
// se puede escribir el estado, avisa igualmente (mejor repetir que callar).
export function pickDueNotices(notices, { force = false, now = Date.now() } = {}) {
  if (force || !notices.length) return notices;
  const file = path.join(CONFIG_DIR, 'notices.json');
  let state = {};
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { state = {}; }
  const due = notices.filter((notice) => !(Date.parse(state[notice.id]) > now - 24 * 60 * 60 * 1000));
  if (due.length) {
    try {
      for (const notice of due) state[notice.id] = new Date(now).toISOString();
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
      fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
    } catch { /* estado no escribible: se avisa igualmente */ }
  }
  return due;
}
