// De qué carpeta es el proyecto activo: la actual o una de encima, como mucho hasta la raíz de
// su repositorio. Fuera de un repositorio, solo la carpeta exacta.
import fs from 'node:fs';
import path from 'node:path';

export function currentFolder() {
  return fs.realpathSync.native(process.cwd());
}

/** La raíz del repositorio que contiene la carpeta, sin ejecutar git. */
export function repositoryRoot(folder) {
  for (let dir = folder; ; dir = path.dirname(dir)) {
    try {
      fs.lstatSync(path.join(dir, '.git'));
      return dir;
    } catch (error) {
      // Sin poder mirar no se hereda nada de más arriba.
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') return folder;
    }
    if (path.dirname(dir) === dir) return null;
  }
}

/** Carpetas en las que se busca el activo, de la más cercana a la más lejana. */
export function searchFolders(folder) {
  const root = repositoryRoot(folder);
  if (!root) return [folder];
  const folders = [];
  for (let dir = folder; ; dir = path.dirname(dir)) {
    folders.push(dir);
    if (dir === root || path.dirname(dir) === dir) return folders;
  }
}
