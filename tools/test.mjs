#!/usr/bin/env node
// Node 18.17 puede dejar abiertos los workers del test runner cuando varios
// archivos usan servidores HTTP y hooks globales a la vez. Ejecutarlos de
// forma secuencial mantiene la misma cobertura y hace el CI determinista en
// todas las versiones de Node que soporta la skill.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTS = path.join(ROOT, 'tests');
const files = fs.readdirSync(TESTS)
  .filter((name) => name.endsWith('.test.mjs'))
  .sort();

if (!files.length) {
  process.stderr.write('No se encontraron pruebas.\n');
  process.exit(1);
}

for (const name of files) {
  const result = spawnSync(process.execPath, ['--test', path.join(TESTS, name)], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.error) {
    process.stderr.write(`No se pudo ejecutar ${name}: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
