// Ejecuta PHP real del repositorio canónico de AILAB (AILAB_CANONICAL_REPO) con metadatos simulados:
// sin red, sin base de datos y sin gasto. Los datos viajan por stdin para no chocar con el límite de argv.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CANONICAL = process.env.AILAB_CANONICAL_REPO || '';
export const hasPhp = () => spawnSync('php', ['-v'], { stdio: 'ignore' }).status === 0;
export const canRunParity = () => Boolean(CANONICAL) && hasPhp();

const STDIN = "$argv = array_merge(['-'], json_decode(stream_get_contents(STDIN), true) ?: []); ";

// api/skill/higgsfield.php ejecuta su enrutador al cargarse. Para probar sus funciones de validacion con el PHP real
// se carga una copia temporal sin el bloque final `try { ... }`; el resto del archivo no se modifica.
let skillEndpointCopy = null;
function skillHiggsfieldFunctions() {
  if (skillEndpointCopy && fs.existsSync(skillEndpointCopy)) return skillEndpointCopy;
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/skill/higgsfield.php'), 'utf8');
  const router = source.indexOf('\ntry {\n    wallet_require_secrets();');
  if (router < 0) throw new Error('api/skill/higgsfield.php ya no tiene el enrutador esperado: actualiza tests/helpers/php.mjs');
  const wallet = path.join(CANONICAL, 'app/api/wallet', 'lib.php');
  const body = source.slice(0, router).replace("__DIR__ . '/../wallet/lib.php'", JSON.stringify(wallet));
  skillEndpointCopy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-skill-endpoint-')), 'higgsfield-functions.php');
  fs.writeFileSync(skillEndpointCopy, body);
  process.on('exit', () => { try { fs.rmSync(path.dirname(skillEndpointCopy), { recursive: true, force: true }); } catch { /* limpieza */ } });
  return skillEndpointCopy;
}

// `higgsfield` carga el gateway web de Higgsfield; `skillHiggsfield` las funciones del endpoint de la skill.
export function php(code, args = [], { sume = false, higgsfield = false, skillHiggsfield = false } = {}) {
  const wallet = path.join(CANONICAL, 'app/api/wallet');
  const prelude = STDIN
    + (skillHiggsfield ? `require ${JSON.stringify(skillHiggsfieldFunctions())}; ` : '')
    + (higgsfield
      ? `define('AILAB_HIGGSFIELD_FUNCTIONS_ONLY', true); require ${JSON.stringify(path.join(wallet, 'higgsfield-gateway.php'))}; `
      : skillHiggsfield ? '' : `define('AILAB_GATEWAY_FUNCTIONS_ONLY', true); require ${JSON.stringify(path.join(wallet, 'gateway.php'))}; `)
    + (sume ? `require_once ${JSON.stringify(path.join(wallet, 'sume-gateway.php'))}; ` : '');
  return JSON.parse(execFileSync('php', ['-r', prelude + code], {
    encoding: 'utf8', timeout: 30000, input: JSON.stringify(args), maxBuffer: 64 * 1024 * 1024,
  }));
}
