// Ejecuta PHP real del repositorio canónico de AILAB (AILAB_CANONICAL_REPO) con metadatos simulados:
// sin red, sin base de datos y sin gasto. Los datos viajan por stdin para no chocar con el límite de argv.
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

export const CANONICAL = process.env.AILAB_CANONICAL_REPO || '';
export const hasPhp = () => spawnSync('php', ['-v'], { stdio: 'ignore' }).status === 0;
export const canRunParity = () => Boolean(CANONICAL) && hasPhp();

const STDIN = "$argv = array_merge(['-'], json_decode(stream_get_contents(STDIN), true) ?: []); ";

// `files` lista las bibliotecas del gateway que se cargan (por defecto solo gateway.php, en modo funciones).
export function php(code, args = [], { sume = false, higgsfield = false } = {}) {
  const wallet = path.join(CANONICAL, 'app/api/wallet');
  const prelude = STDIN
    + (higgsfield
      ? `define('AILAB_HIGGSFIELD_FUNCTIONS_ONLY', true); require ${JSON.stringify(path.join(wallet, 'higgsfield-gateway.php'))}; `
      : `define('AILAB_GATEWAY_FUNCTIONS_ONLY', true); require ${JSON.stringify(path.join(wallet, 'gateway.php'))}; `)
    + (sume ? `require_once ${JSON.stringify(path.join(wallet, 'sume-gateway.php'))}; ` : '');
  return JSON.parse(execFileSync('php', ['-r', prelude + code], {
    encoding: 'utf8', timeout: 30000, input: JSON.stringify(args), maxBuffer: 64 * 1024 * 1024,
  }));
}
