#!/usr/bin/env node
// Bootstrap estable de AILAB. Selecciona un runtime firmado y conserva el runtime
// empaquetado como fallback. Nunca modifica credenciales ni el proyecto del usuario.
import { checkAndMaybeUpdate, rollbackRuntime, activeRuntime, bundledEntryUrl, runtimeEntryUrl, BOOTSTRAP_VERSION } from './lib/updater.mjs';
import { SKILL_ROOT } from './lib/config.mjs';
import { describeEnvironmentError, isCodexSandbox, isNetworkFailure, networkAdvice } from './lib/environment.mjs';

// El runtime firmado lee estas dos variables para avisar de un arranque antiguo o de
// una doble instalacion (un arranque 1.0.0 no las define: el runtime lo deduce de argv).
process.env.AILAB_BOOTSTRAP_VERSION = BOOTSTRAP_VERSION;
process.env.AILAB_BOOTSTRAP_DIR = SKILL_ROOT;

const args = process.argv.slice(2);
const command = args[0] || 'help';
const confirmed = args.includes('--confirmed');
const skip = process.env.AILAB_SKIP_UPDATE === '1';

if (command === 'rollback') {
  if (!confirmed) {
    process.stderr.write('Rollback cambia el runtime activo. Repite con --confirmed.\n');
    process.exit(1);
  }
  let result;
  try { result = rollbackRuntime(); } catch (error) { result = { ok: false, message: describeEnvironmentError(error) || error.message }; }
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
  let result;
  try {
    result = await checkAndMaybeUpdate({ force, apply });
  } catch (error) {
    // Carpeta de estado sin permisos (p. ej. sandbox de Codex): no bloquea help,
    // guide ni el runtime ya instalado; el comando que necesite escribir explicara el ajuste.
    let runtime = null;
    try { runtime = activeRuntime(); } catch { /* sin runtime legible */ }
    const advice = describeEnvironmentError(error);
    result = { ok: false, runtime, message: advice || (error && error.message ? error.message : String(error)), environment: advice !== null };
  }
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
  else if (!result.ok) {
    process.stderr.write('Aviso: no se pudo comprobar la actualizacion firmada. Se usara el ultimo runtime valido.\n');
    // Una linea basta aqui: el ajuste completo lo muestra el comando que de verdad necesite red o escritura.
    if (result.environment) process.stderr.write('AILAB no puede escribir en su carpeta de estado' + (isCodexSandbox() ? ' (sandbox de Codex)' : '') + '. Ejecuta `doctor` para ver el ajuste exacto.\n');
    else if (isCodexSandbox() && isNetworkFailure(new Error(result.message || ''))) process.stderr.write(networkAdvice() + '\n');
  }
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
