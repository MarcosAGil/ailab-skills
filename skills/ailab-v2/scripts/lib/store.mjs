// Estado privado: carpetas 0700, archivos 0600, sin seguir enlaces, con escrituras atómicas y
// fuera de git aunque la carpeta de usuario sea un repositorio (dotfiles).
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { stateDir } from './config.mjs';
import { UserError } from './text.mjs';

const POSIX = process.platform !== 'win32';
const NAME = /^[a-z0-9][a-z0-9._-]{0,120}$/;

function checkOwned(file, stat, kind) {
  const valid = kind === 'dir' ? stat.isDirectory() : stat.isFile();
  if (stat.isSymbolicLink() || !valid) throw new UserError(file + ' no es una carpeta o un archivo propio de AILAB (¿un enlace?). No se usa.');
  if (!POSIX) return;
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) throw new UserError(file + ' es de otro usuario del equipo. No se usa.');
  if (stat.mode & 0o077) throw new UserError(file + ' lo pueden abrir otros usuarios del equipo. No se usa: deja sus permisos en ' + (kind === 'dir' ? '700' : '600') + '.');
}

function privateDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  checkOwned(dir, fs.lstatSync(dir), 'dir');
  return dir;
}

function location(parts, create) {
  for (const part of parts) if (!NAME.test(part) || part.includes('..')) throw new UserError('Nombre de estado no válido.');
  let dir = stateDir();
  const folders = parts.slice(0, -1);
  for (const part of [null, ...folders]) {
    if (part) dir = path.join(dir, part);
    if (create) privateDir(dir);
    else {
      try {
        checkOwned(dir, fs.lstatSync(dir), 'dir');
      } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    }
  }
  if (create) ignoreInGit(stateDir());
  return path.join(dir, parts[parts.length - 1]);
}

function ignoreInGit(root) {
  try {
    fs.writeFileSync(path.join(root, '.gitignore'), '*\n', { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

function syncDir(dir) {
  if (!POSIX) return;
  const handle = fs.openSync(dir, 'r');
  try {
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
}

/** `null` si no existe. Uno ilegible se dice: no se da por vacío. */
export function read(...parts) {
  const file = location(parts, false);
  if (!file) return null;
  let handle;
  try {
    const before = fs.lstatSync(file);
    checkOwned(file, before, 'file');
    handle = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
    return JSON.parse(fs.readFileSync(handle, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    if (error instanceof SyntaxError) throw new UserError('No se puede leer ' + file + '. No lo borres si puede ser un envío sin respuesta.');
    throw error;
  } finally {
    if (handle !== undefined) fs.closeSync(handle);
  }
}

/** Queda en disco antes de volver: de esto depende no pagar dos veces. */
export function write(parts, value) {
  const file = location(parts, true);
  const temporary = file + '.' + randomBytes(6).toString('hex') + '.tmp';
  const handle = fs.openSync(temporary, 'wx', 0o600);
  try {
    fs.writeFileSync(handle, JSON.stringify(value, null, 2) + '\n');
    fs.fsyncSync(handle);
  } catch (error) {
    fs.closeSync(handle);
    fs.rmSync(temporary, { force: true });
    throw error;
  }
  fs.closeSync(handle);
  fs.renameSync(temporary, file);
  syncDir(path.dirname(file));
}

export function remove(...parts) {
  const file = location(parts, false);
  if (file) fs.rmSync(file, { force: true });
}

export function list(folder) {
  const marker = location([folder, 'x'], false);
  if (!marker) return [];
  return fs.readdirSync(path.dirname(marker))
    .filter((name) => name.endsWith('.json') && NAME.test(name))
    .sort();
}

function alive(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

/** Un solo proceso a la vez. Si el dueño murió, se recoge; si no se sabe, no se quita. */
export async function exclusive(name, work) {
  const file = location(['locks', name + '.lock'], true);
  for (let attempt = 0; ; attempt += 1) {
    try {
      fs.writeFileSync(file, String(process.pid), { flag: 'wx', mode: 0o600 });
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let owner = null;
      try {
        owner = Number(fs.readFileSync(file, 'utf8') || NaN);
      } catch (readError) {
        if (readError.code !== 'ENOENT') throw readError;
      }
      if (attempt > 2 || (owner !== null && alive(owner))) {
        throw new UserError('Ya hay otra orden de AILAB trabajando en esto. Espera a que termine y repite la misma orden. Si se cortó el equipo, el bloqueo está en ' + file + '.');
      }
      if (owner !== null) fs.rmSync(file, { force: true });
    }
  }
  try {
    return await work();
  } finally {
    fs.rmSync(file, { force: true });
  }
}
