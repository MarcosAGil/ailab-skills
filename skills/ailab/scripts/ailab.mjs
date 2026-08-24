#!/usr/bin/env node
// Bootstrap estable de AILAB. Selecciona un runtime firmado y conserva el runtime
// empaquetado como fallback. Nunca modifica credenciales ni el proyecto del usuario.
import { checkAndMaybeUpdate, rollbackRuntime, activeRuntime, bundledEntryUrl, runtimeEntryUrl } from './lib/updater.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'help';
const confirmed = args.includes('--confirmed');
const skip = process.env.AILAB_SKIP_UPDATE === '1';

if (command === 'rollback') {
  if (!confirmed) {
    process.stderr.write('Rollback cambia el runtime activo. Repite con --confirmed.\n');
    process.exit(1);
  }
  const result = rollbackRuntime();
  if (!result.ok) { process.stderr.write(result.message + '\n'); process.exit(1); }
  process.stdout.write('Runtime restaurado a AILAB ' + result.version + '.\n');
  process.exit(0);
}

let selected = null;
if (!skip) {
  const force = command === 'update' || command === 'update-check';
  const autoEnabled = process.env.AILAB_AUTO_UPDATE !== '0';
  const apply = command === 'update' ? confirmed : (command !== 'update-check' && autoEnabled);
  if (command === 'update' && !confirmed) {
    process.stderr.write('La actualizacion manual requiere --confirmed.\n');
    process.exit(1);
  }
  const result = await checkAndMaybeUpdate({ force, apply });
  selected = result.runtime;
  if (command === 'update-check') {
    if (!result.ok) { process.stderr.write('No se pudo comprobar la actualizacion: ' + result.message + '\n'); process.exit(1); }
    process.stdout.write(result.update
      ? 'Actualizacion disponible: ' + result.current + ' -> ' + result.update + (result.required ? ' (obligatoria)' : '') + '\n'
      : 'AILAB esta actualizado: ' + result.current + '.\n');
    process.exit(0);
  }
  if (command === 'update') {
    if (!result.ok) { process.stderr.write('No se pudo actualizar: ' + result.message + '\n'); process.exit(1); }
    process.stdout.write(result.updated ? 'AILAB actualizado a ' + result.current + '.\n' : 'AILAB ya estaba actualizado: ' + result.current + '.\n');
    process.exit(0);
  }
  if (!result.ok && result.required) {
    process.stderr.write('AILAB necesita una actualizacion de seguridad obligatoria y no ha podido instalarla: ' + result.message + '\n');
    process.exit(1);
  }
  if (result.updated) process.stderr.write('AILAB se ha actualizado automaticamente a ' + result.current + '.\n');
  else if (!result.ok) process.stderr.write('Aviso: no se pudo comprobar la actualizacion firmada. Se usara el ultimo runtime valido.\n');
}

try {
  await import(selected ? runtimeEntryUrl(selected) : bundledEntryUrl());
} catch (error) {
  if (!selected) throw error;
  const rolledBack = rollbackRuntime();
  const previous = rolledBack.ok ? activeRuntime() : null;
  process.stderr.write('La version activa de AILAB no pudo arrancar. Se usara '
    + (previous ? 'la version verificada ' + previous.version : 'el runtime incluido en la skill') + '.\n');
  await import(previous ? runtimeEntryUrl(previous) : bundledEntryUrl());
}
