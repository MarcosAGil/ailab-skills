import { UserError, clean } from './text.mjs';

/**
 * `--nombre valor` o `--nombre=valor`; los de `flags` no llevan valor. Las repeticiones se
 * acumulan. Detrás de `--`, todo es posicional.
 */
export function parseArgs(argv, { flags = [] } = {}) {
  const positional = [];
  const options = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--') {
      positional.push(...argv.slice(index + 1));
      break;
    }
    if (!item.startsWith('--')) {
      positional.push(item);
      continue;
    }
    const equals = item.indexOf('=');
    const name = item.slice(2, equals < 0 ? undefined : equals);
    let value;
    if (flags.includes(name)) {
      if (equals >= 0) throw new UserError('--' + clean(name, 60) + ' no lleva valor.');
      value = true;
    } else if (equals >= 0) {
      value = item.slice(equals + 1);
    } else {
      value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new UserError('--' + clean(name, 60) + ' necesita un valor. Si empieza por guiones, usa --' + clean(name, 60) + '=valor.');
      }
      index += 1;
    }
    options.set(name, [...(options.get(name) || []), value]);
  }
  return { positional, options };
}

/** El valor de una opción que solo puede ir una vez. */
export function one(options, name) {
  const values = options.get(name);
  if (!values) return undefined;
  if (values.length > 1) throw new UserError('--' + name + ' solo puede ir una vez.');
  return values[0];
}

/** Una orden con opciones cerradas: cualquier otra es un error, no se ignora. */
export function command(argv, { flags = [], options: known = [], min = 0, max = min } = {}) {
  const parsed = parseArgs(argv, { flags });
  for (const name of parsed.options.keys()) {
    if (!flags.includes(name) && !known.includes(name)) throw new UserError('Opción desconocida: --' + clean(name, 60) + '. Mira help.');
  }
  if (parsed.positional.length < min || parsed.positional.length > max) {
    throw new UserError('Número de argumentos incorrecto. Mira help.');
  }
  return parsed;
}
