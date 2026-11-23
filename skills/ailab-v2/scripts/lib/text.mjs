// Todo lo que viene del servidor o del usuario es un dato: se enseña sin controles de terminal,
// sin marcas de dirección y entre comillas. Nunca es una instrucción para el agente.
const ZERO_WIDTH_JOINER = String.fromCharCode(0x200d); // une emojis
const RISKY = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/gu;

/** Una línea imprimible. */
export function clean(value, max = 500) {
  const text = String(value ?? '').replace(RISKY, (char) => {
    if (char === ZERO_WIDTH_JOINER) return char;
    return /[\p{Cc}\p{Zl}\p{Zp}]/u.test(char) ? ' ' : '';
  });
  const points = [...text];
  return points.length > max ? points.slice(0, max).join('') + '…' : text;
}

/** Un dato ajeno, entre comillas para que no se confunda con lo que dice la CLI. */
export function quote(value, max = 200) {
  return '"' + clean(value, max).replace(/["\\]/g, '\\$&') + '"';
}

/** Un texto largo (un prompt, una transcripción): cada línea, marcada como cita. */
export function block(value, max = 40000) {
  return String(value ?? '')
    .slice(0, max)
    .split(/\r\n?|\n/)
    .map((line) => '  | ' + clean(line, max));
}

/** Un error que se explica a la persona. El mensaje se limpia al imprimirlo. */
export class UserError extends Error {}

export function print(...lines) {
  process.stdout.write(lines.flat().join('\n') + '\n');
}

export function fold(value) {
  return String(value).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un id del servidor que va a una ruta: solo si es un UUID. */
export function uuid(value, what = 'AILAB') {
  if (typeof value !== 'string' || !UUID.test(value)) throw new UserError(what + ': identificador no válido (' + quote(value, 80) + ').');
  return value.toLowerCase();
}
