import { API_PREFIX, VERSION, checkOrigin } from './config.mjs';
import { UserError, clean } from './text.mjs';

const MAX_RESPONSE = 8 * 1024 * 1024;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** La API ha contestado con un error, o alguien ha contestado por ella. */
export class ApiError extends UserError {
  constructor({ status, code, message, replayed, uniform, details }) {
    super(message);
    this.status = status;
    this.code = code;
    this.replayed = replayed;
    /** Es el error uniforme de AILAB y no, por ejemplo, la página de un proxy. */
    this.uniform = uniform;
    this.details = details;
  }
}

/** No ha habido respuesta entera: no se sabe si la petición llegó. */
export class NoResponseError extends UserError {
  constructor(origin, cause) {
    super('AILAB no ha contestado (' + origin + '). Comprueba la red.', { cause });
  }
}

export async function readLimited(response, max, tooBig) {
  const chunks = [];
  let size = 0;
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      throw new UserError(tooBig);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function failure(response, body) {
  const error = body?.error;
  const uniform = Boolean(error && typeof error.code === 'string' && typeof error.message === 'string' && typeof error.requestId === 'string');
  const details = uniform && Array.isArray(error.details)
    ? error.details.slice(0, 10).map((item) => clean(item?.path, 100) + ': ' + clean(item?.message, 300))
    : [];
  return new ApiError({
    status: response.status,
    code: uniform ? error.code : null,
    message: uniform ? clean(error.message) : 'AILAB ha respondido ' + response.status + ' sin el formato esperado.',
    replayed: response.headers.get('idempotent-replayed') === 'true',
    uniform,
    details,
  });
}

/**
 * `origin` y `token` van siempre juntos: salen de la misma credencial. Nunca sigue una
 * redirección ni manda cookies.
 */
export async function request({ origin, token }, method, path, { body, key, timeout = 30000 } = {}) {
  const base = checkOrigin(origin);
  const url = new URL(base + API_PREFIX + path);
  if (url.origin !== base || !url.pathname.startsWith(API_PREFIX + '/')) throw new UserError('Ruta de API no válida.');
  const headers = { accept: 'application/json', 'user-agent': 'ailab-plugin/' + VERSION };
  if (token) headers.authorization = 'Bearer ' + token;
  if (key) headers['idempotency-key'] = key;
  if (body !== undefined) headers['content-type'] = 'application/json';
  for (let attempt = 0; ; attempt += 1) {
    let response;
    let text;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(timeout),
      });
      text = (await readLimited(response, MAX_RESPONSE, 'La respuesta de AILAB es demasiado grande.')).toString('utf8');
    } catch (error) {
      throw new NoResponseError(base, error);
    }
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = undefined;
    }
    if (response.ok) {
      if (parsed === undefined) throw new NoResponseError(base);
      return parsed;
    }
    const wait = Number(response.headers.get('retry-after'));
    // Un solo reintento, y solo al leer: un envío nunca se repite solo por un 429.
    if (response.status === 429 && method === 'GET' && attempt === 0 && wait > 0 && wait <= 30) {
      await sleep(wait * 1000);
      continue;
    }
    throw failure(response, parsed);
  }
}
