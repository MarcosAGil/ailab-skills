import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { command } from './args.mjs';
import { UserError, print } from './text.mjs';

const TOPICS = {
  uso: 'generar, archivos y resultados',
  proyectos: 'proyecto activo y etiquetas',
  recuperacion: 'errores, envíos sin respuesta y permisos',
};

export async function guide(argv) {
  const { positional } = command(argv, { max: 1 });
  if (!positional.length) {
    print('Guías de AILAB:', Object.entries(TOPICS).map(([name, text]) => '  guide ' + name + ': ' + text));
    return;
  }
  if (!Object.hasOwn(TOPICS, positional[0])) throw new UserError('No existe esa guía. Mira guide.');
  const file = fileURLToPath(new URL('../../references/' + positional[0] + '.md', import.meta.url));
  print(fs.readFileSync(file, 'utf8').trimEnd());
}
