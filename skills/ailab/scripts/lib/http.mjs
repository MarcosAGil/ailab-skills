// Capa HTTP normalizada (plan v2.1 §12): HTTP 200 JAMAS implica exito por si solo.
// Todas las respuestas de la plataforma pasan por normalize() y devuelven
// { ok, kind, httpStatus, businessCode, message, data, raw }.
import { GENERATION_BASE_URL, CUENTA_URL, ASSISTANT_ENDPOINT, TASK_ENDPOINT } from './config.mjs';
import { readCookie, readToken } from './auth.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

const REQUEST_TIMEOUT_MS = Number(process.env.AILAB_HTTP_TIMEOUT_MS || 120000);
const MAX_JSON_BYTES = Number(process.env.AILAB_MAX_JSON_BYTES || 5 * 1024 * 1024);

const KINDS = {
  401: 'session_expired',
  402: 'insufficient_balance',
  403: 'forbidden',
  409: 'ambiguous_submit',
  429: 'rate_limited',
};
let tokenHeaderMode = String(process.env.PG_TOKEN_HEADER || '').toLowerCase() === 'x-ailendra-token' ? 'custom' : 'authorization';

function kindFor(httpStatus, businessCode) {
  const code = businessCode ?? httpStatus;
  if (KINDS[code]) return KINDS[code];
  if (code >= 500) return 'server_error';
  if (code >= 400) return 'bad_request';
  return 'ok';
}

export function normalize(httpStatus, body, contentType) {
  if (body === null || typeof body !== 'object') {
    return { ok: false, kind: 'invalid_response', httpStatus, businessCode: null, message: 'Respuesta no valida del servidor (' + (contentType || 'sin content-type') + ').', data: null, raw: body };
  }
  // api.php: {ok, error, ...} · gateways: {code, msg, data}
  if (typeof body.ok === 'boolean') {
    const ok = body.ok && httpStatus < 400;
    return { ok, kind: ok ? 'ok' : kindFor(httpStatus, null), httpStatus, businessCode: null, message: body.error || '', data: body, raw: body };
  }
  if (typeof body.code === 'number') {
    const ok = body.code === 200 && httpStatus >= 200 && httpStatus < 400;
    const failureCode = httpStatus >= 400 ? httpStatus : body.code;
    return { ok, kind: ok ? 'ok' : kindFor(httpStatus, failureCode), httpStatus, businessCode: body.code, message: body.msg || '', data: body.data ?? null, raw: body };
  }
  const ok = httpStatus >= 200 && httpStatus < 300;
  return {
    ok,
    kind: ok ? 'ok' : kindFor(httpStatus, null),
    httpStatus,
    businessCode: null,
    message: typeof body.error === 'string' ? body.error : (typeof body.message === 'string' ? body.message : ''),
    data: body,
    raw: body,
  };
}

async function doFetch(url, init) {
  let res;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const { _bodyFactory, ...fetchInit } = init || {};
    res = await fetch(url, {
      ...fetchInit,
      ...(_bodyFactory ? { body: _bodyFactory() } : {}),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    const timedOut = e && e.name === 'AbortError';
    return { ok: false, kind: timedOut ? 'timeout' : 'network', httpStatus: 0, businessCode: null, message: timedOut ? 'La plataforma no respondio dentro del tiempo permitido.' : 'Sin conexion con la plataforma: ' + (e && e.message ? e.message : e), data: null, raw: null };
  }
  const contentType = res.headers.get('content-type') || '';
  let body = null;
  const declaredLength = Number(res.headers.get('content-length') || 0);
  if (declaredLength > MAX_JSON_BYTES) {
    try { await res.body?.cancel(); } catch {}
    clearTimeout(timeout);
    return { ok: false, kind: 'invalid_response', httpStatus: res.status, businessCode: null, message: 'La respuesta JSON supera el limite permitido.', data: null, raw: null };
  }
  const reader = res.body && typeof res.body.getReader === 'function' ? res.body.getReader() : null;
  let text = '';
  try {
    if (reader) {
      const decoder = new TextDecoder();
      let bytes = 0;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_JSON_BYTES) {
          try { await reader.cancel(); } catch {}
          clearTimeout(timeout);
          return { ok: false, kind: 'invalid_response', httpStatus: res.status, businessCode: null, message: 'La respuesta JSON supera el limite permitido.', data: null, raw: null };
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } else {
      text = await res.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_JSON_BYTES) {
        clearTimeout(timeout);
        return { ok: false, kind: 'invalid_response', httpStatus: res.status, businessCode: null, message: 'La respuesta JSON supera el limite permitido.', data: null, raw: null };
      }
    }
  } catch (e) {
    clearTimeout(timeout);
    const timedOut = e && e.name === 'AbortError';
    return { ok: false, kind: timedOut ? 'timeout' : 'network', httpStatus: res.status, businessCode: null, message: timedOut ? 'La plataforma no respondio dentro del tiempo permitido.' : 'Se interrumpio la respuesta de la plataforma.', data: null, raw: null };
  }
  clearTimeout(timeout);
  try { body = JSON.parse(text); } catch { body = null; }
  if (body === null) {
    return { ok: false, kind: 'invalid_response', httpStatus: res.status, businessCode: null, message: 'El servidor no devolvio JSON valido (HTTP ' + res.status + ').', data: null, raw: text.slice(0, 300) };
  }
  const normalized = normalize(res.status, body, contentType);
  if (normalized.kind === 'session_expired' && init && init.headers && init.headers.Authorization) {
    const retryHeaders = { ...init.headers, 'X-Ailendra-Token': String(init.headers.Authorization).replace(/^Bearer\s+/i, '') };
    delete retryHeaders.Authorization;
    const retried = await doFetch(url, { ...init, headers: retryHeaders, _tokenFallbackTried: true });
    if (retried.ok) tokenHeaderMode = 'custom';
    return retried;
  }
  return normalized;
}

function authHeaders() {
  const token = readToken();
  if (token) return tokenHeaderMode === 'custom' ? { 'X-Ailendra-Token': token } : { Authorization: 'Bearer ' + token };
  const cookie = readCookie();
  return cookie ? { Cookie: cookie } : {};
}

export async function apiPost(body) {
  return doFetch(GENERATION_BASE_URL + 'api/wallet/api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

export async function gatewayPost(pathWithQuery, body) {
  return doFetch(GENERATION_BASE_URL + 'api/wallet/gateway.php?path=' + encodeURIComponent(pathWithQuery), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

export async function gatewayGet(pathWithQuery) {
  return doFetch(GENERATION_BASE_URL + 'api/wallet/gateway.php?path=' + encodeURIComponent(pathWithQuery), {
    method: 'GET',
    headers: { ...authHeaders() },
  });
}

export async function servicePost(relativePath, body) {
  return doFetch(GENERATION_BASE_URL + relativePath.replace(/^\/+/, ''), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

export async function assistantPost(body) {
  return doFetch(ASSISTANT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

export async function taskLookup(taskId) {
  return doFetch(TASK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ task_id: taskId }),
  });
}

export async function uploadFile(buffer, filename, mime) {
  const fd = new FormData();
  fd.append('file', new Blob([buffer], { type: mime }), filename);
  const path = readToken() ? 'api/skill/upload.php' : 'api/upload.php';
  return doFetch(GENERATION_BASE_URL + path, { method: 'POST', body: fd, headers: { ...authHeaders() } });
}

// Multipart en streaming para no cargar videos de hasta 200MB enteros en RAM.
// El hash se vuelve a calcular durante la subida: si el archivo cambia entre
// prepare y upload, la URL temporal se descarta y no se envia una generacion.
export async function uploadPath(filePath, filename, mime, expectedSha256) {
  const safeFilename = String(filename || 'input.bin').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'input.bin';
  let stat;
  try { stat = fs.statSync(filePath); } catch { return { ok: false, kind: 'file', message: 'No se pudo abrir el archivo para subirlo.' }; }
  if (!stat.isFile() || stat.size < 1) return { ok: false, kind: 'file', message: 'El archivo de subida no es valido.' };
  const boundary = '----AILAB-' + crypto.randomBytes(18).toString('hex');
  const head = Buffer.from(
    '--' + boundary + '\r\n'
    + 'Content-Disposition: form-data; name="file"; filename="' + safeFilename + '"\r\n'
    + 'Content-Type: ' + mime + '\r\n\r\n'
  );
  const tail = Buffer.from('\r\n--' + boundary + '--\r\n');
  let digest = null;
  function multipartBody() {
    const hash = crypto.createHash('sha256');
    async function* multipart() {
      yield head;
      for await (const part of fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 })) {
        hash.update(part);
        yield part;
      }
      digest = hash.digest('hex');
      yield tail;
    }
    return Readable.from(multipart());
  }
  const endpoint = readToken() ? 'api/skill/upload.php' : 'api/upload.php';
  const result = await doFetch(GENERATION_BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': String(head.length + stat.size + tail.length),
    },
    _bodyFactory: multipartBody,
    duplex: 'half',
  });
  if (result.ok && expectedSha256 && digest !== expectedSha256) {
    return { ok: false, kind: 'file_changed', httpStatus: 0, message: 'El archivo cambio durante la subida. Prepara la operacion de nuevo.', data: null, raw: null };
  }
  return result;
}

// Mensaje accionable estandar por tipo de error (es-ES, sin tecnicismos).
export function explain(n) {
  switch (n.kind) {
    case 'session_expired': return 'Tu sesion ha caducado. Ejecuta: node scripts/ailab.mjs login';
    case 'insufficient_balance': return (n.message || 'Saldo insuficiente.') + ' Recarga en: ' + CUENTA_URL;
    case 'forbidden': return n.message || 'Tu cuenta no puede usar este modelo.';
    case 'rate_limited': return 'Demasiadas peticiones seguidas. Espera un momento y reintenta.';
    case 'ambiguous_submit': return (n.message || 'El estado del envio es ambiguo.') + ' No se reintentara con otra UUID. Revisa el historial o usa AILAB doctor.';
    case 'network': return n.message;
    case 'timeout': return n.message;
    case 'invalid_response': return n.message;
    default: return n.message || 'Error inesperado del servidor.';
  }
}
