// Capa HTTP normalizada (plan v2.1 §12): HTTP 200 JAMAS implica exito por si solo.
// Todas las respuestas de la plataforma pasan por normalize() y devuelven
// { ok, kind, httpStatus, businessCode, message, data, raw }.
import { GENERATION_BASE_URL, CUENTA_URL, ASSISTANT_ENDPOINT, TASK_ENDPOINT, PRICE_ENDPOINT, CLI_VERSION } from './config.mjs';
import { readCookie, readToken } from './auth.mjs';
import { cliCommand, networkAdvice } from './environment.mjs';
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
  // El sobre doble del servidor ({ok, code, msg, data}) tambien llega aqui: se
  // respeta la forma antigua (data = cuerpo plano, para api.php y uploads) y
  // cuando data es un objeto se entrega ESE objeto, que es donde los adapters
  // buscan sus campos. El cuerpo completo sigue en raw para el codigo que ya
  // leia response.raw (saldo, costes, error_code, retry_same_request).
  if (typeof body.ok === 'boolean') {
    const ok = body.ok && httpStatus < 400;
    const nested = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : null;
    // Los endpoints de la skill (api/skill/*.php) devuelven el motivo de un rechazo en `msg`, no en `error`.
    return { ok, kind: ok ? 'ok' : kindFor(httpStatus, null), httpStatus, businessCode: null, message: body.error || body.message || body.msg || '', data: nested || body, raw: body };
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
    if (res.status === 429) {
      const headerValue = Number(res.headers.get('retry-after') || 0);
      return {
        ok: false,
        kind: 'rate_limited',
        httpStatus: res.status,
        businessCode: null,
        message: 'El servidor ha limitado temporalmente las peticiones.',
        retryAfterSeconds: Number.isFinite(headerValue) && headerValue > 0 ? Math.ceil(headerValue) : 60,
        data: null,
        raw: text.slice(0, 300),
      };
    }
    return { ok: false, kind: 'invalid_response', httpStatus: res.status, businessCode: null, message: 'El servidor no devolvio JSON valido (HTTP ' + res.status + ').', data: null, raw: text.slice(0, 300) };
  }
  const normalized = accountRejection(normalize(res.status, body, contentType));
  if (normalized.kind === 'rate_limited') {
    const headerValue = Number(res.headers.get('retry-after') || 0);
    const bodyValue = Number(body.retry_after || body.retry_after_seconds || 0);
    normalized.retryAfterSeconds = Number.isFinite(headerValue) && headerValue > 0
      ? Math.ceil(headerValue)
      : (Number.isFinite(bodyValue) && bodyValue > 0 ? Math.ceil(bodyValue) : 60);
  }
  if (normalized.kind === 'session_expired' && init && init.headers && init.headers.Authorization) {
    const retryHeaders = { ...init.headers, 'X-Ailendra-Token': String(init.headers.Authorization).replace(/^Bearer\s+/i, '') };
    delete retryHeaders.Authorization;
    const retried = await doFetch(url, { ...init, headers: retryHeaders, _tokenFallbackTried: true });
    if (retried.ok) tokenHeaderMode = 'custom';
    return retried;
  }
  return normalized;
}

// Versión del cliente en TODAS las peticiones a AILAB: el servidor exige a las cuentas de cliente la versión mínima
// de `me.pricing.min_client` (HTTP 426). El proyecto del comando en curso viaja en su propia cabecera,
// así llega a cotizaciones, subidas y envíos de cualquier adaptador sin tocar sus cuerpos.
export const CLIENT_HEADER = 'ailab-cli/' + CLI_VERSION;
let requestProject = null;

export function setRequestProject(project) {
  requestProject = project ? String(project) : null;
}

export function clientHeaders() {
  return { 'X-AILAB-Client': CLIENT_HEADER, ...(requestProject ? { 'X-AILAB-Proyecto': requestProject } : {}) };
}

function authHeaders() {
  const token = readToken();
  if (token) return { ...clientHeaders(), ...(tokenHeaderMode === 'custom' ? { 'X-Ailendra-Token': token } : { Authorization: 'Bearer ' + token }) };
  const cookie = readCookie();
  return { ...clientHeaders(), ...(cookie ? { Cookie: cookie } : {}) };
}

// Rechazos de cuenta del contrato de precio por cuenta: se reconocen por su código (o por el 426) y nunca se
// confunden con un envío ambiguo (409) ni con una petición mal formada. Ninguno reserva ni cobra.
const ACCOUNT_CODES = ['client_update_required', 'project_required', 'invalid_project', 'price_changed'];

export function errorCode(n) {
  const raw = n && n.raw && typeof n.raw === 'object' ? n.raw : {};
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  for (const value of [raw.code, raw.error_code, data.code, data.error_code]) {
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

// Texto de un rechazo de cuenta: `message` del cuerpo (gateways), luego `error` y por último el del sobre.
function rejectionMessage(n) {
  const raw = n && n.raw && typeof n.raw === 'object' ? n.raw : {};
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  for (const value of [raw.message, raw.error, data.message, data.error, n.message]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function accountRejection(n) {
  if (n.ok) return n;
  const code = errorCode(n);
  if (ACCOUNT_CODES.includes(code)) return { ...n, kind: code };
  if (n.httpStatus === 426) return { ...n, kind: 'client_update_required' };
  return n;
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

export async function privateVoiceMultipart(action, body, file) {
  if (!['create','upload'].includes(action)) throw new Error('Operación multipart no válida.');
  if (!Number.isSafeInteger(file.size) || file.size < 1 || file.size > 20971520) throw new Error('Archivo fuera del límite de 20 MB.');
  const bytes=fs.readFileSync(file.path);
  if (bytes.length !== file.size || crypto.createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('El archivo ha cambiado. Vuelve a preparar.');
  const form=new FormData();
  if (action === 'create') form.append('payload',JSON.stringify(body));
  else form.append('kind','evidence');
  form.append(action === 'create'?'audio':'file',new Blob([bytes],{type:file.mime}),file.mime==='audio/mpeg'?'grabacion.mp3':file.mime==='audio/wav'?'grabacion.wav':file.mime==='application/pdf'?'autorizacion.pdf':'autorizacion.txt');
  return doFetch(GENERATION_BASE_URL+'api/wallet/private-voices.php?action='+action,{method:'POST',headers:authHeaders(),body:form});
}

export async function privateVoiceSample(sampleId) {
  if (!/^[0-9a-f]{32}$/.test(sampleId)) throw new Error('Referencia de muestra no válida.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try {
    const r=await fetch(GENERATION_BASE_URL+'api/wallet/private-voices.php?action=media&sample_id='+sampleId,{headers:authHeaders(),redirect:'error',signal:controller.signal});
    if (!r.ok || (r.headers.get('content-type')||'').split(';')[0] !== 'audio/mpeg') throw new Error('Muestra no disponible. Consulta voice-status; no generes otro lote para recuperarla.');
    const reader=r.body.getReader();let size=0;const chunks=[];
    for (;;) { const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      if(size>4194304){await reader.cancel();throw new Error('La muestra supera 4 MB.');}chunks.push(Buffer.from(part.value)); }
    const bytes=Buffer.concat(chunks);
    if(bytes.length<4 || !(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224))) throw new Error('La muestra no contiene un MP3 válido.');
    return bytes;
  } finally { clearTimeout(timer); }
}

// GET del contrato de la skill (api/skill/*.php): algunos endpoints exigen el
// estado por query string y no por POST. La query se codifica aqui para que
// ningun adapter componga URLs a mano.
export async function serviceGet(relativePath, query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const suffix = params.toString();
  const path = relativePath.replace(/^\/+/, '');
  if (!suffix) return doFetch(GENERATION_BASE_URL + path, { method: 'GET', headers: { ...authHeaders() } });
  return doFetch(GENERATION_BASE_URL + path + (path.includes('?') ? '&' : '?') + suffix, {
    method: 'GET',
    headers: { ...authHeaders() },
  });
}

// API de flujos de las cuentas de cliente (api/v1/flows/). Misma autenticación por token.
export const FLOWS_ENDPOINT = 'api/v1/flows/index.php';

export async function flowsPost(body) {
  return doFetch(GENERATION_BASE_URL + FLOWS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

// Descarga de un archivo de flujos por su identificador opaco. Devuelve la respuesta sin leer:
// el llamante la guarda en streaming. Sin redirecciones: el archivo lo sirve AILAB.
export async function flowsFile(fileId, signal) {
  if (!/^[a-f0-9]{32}$/.test(String(fileId))) throw new Error('Identificador de archivo no válido.');
  return fetch(GENERATION_BASE_URL + FLOWS_ENDPOINT + '?action=file&id=' + fileId, { headers: authHeaders(), redirect: 'error', signal });
}

// Una cuenta de cliente solo puede usar sus flujos: el resto de AILAB responde 403 con este motivo.
export function isFlowsOnly(response) {
  return Boolean(response && !response.ok && response.httpStatus === 403 && /solo puede usar sus flujos/i.test(String(response.message || '')));
}

export async function assistantPost(body) {
  return doFetch(ASSISTANT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
}

// Motor de precios del servidor (price.php): autenticado como task.php.
export async function pricePost(body) {
  return doFetch(PRICE_ENDPOINT, {
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
    case 'session_expired': return 'Tu sesion ha caducado. Pide al usuario que ejecute en su terminal: ' + cliCommand('login');
    case 'insufficient_balance': return (n.message || 'Saldo insuficiente.') + ' Recarga en: ' + CUENTA_URL;
    case 'forbidden': return n.message || 'Tu cuenta no puede usar este modelo.';
    case 'rate_limited': {
      const seconds = Number.isFinite(n.retryAfterSeconds) ? Math.max(1, Math.ceil(n.retryAfterSeconds)) : 60;
      return 'AILAB ha limitado temporalmente las peticiones. Espera ' + seconds + ' s y haz un unico reintento; no inicies un bucle.';
    }
    // El 402 por precio trae su propio mensaje del servidor; la CLI no compara precios. En los gateways el sobre es
    // { code: 402, msg, error_code: 'price_changed', message, credits }: manda `message`.
    case 'price_changed': return rejectionMessage(n) || 'El precio de tu cuenta ha cambiado desde la cotización. Prepara de nuevo. No se ha cobrado nada.';
    case 'client_update_required': return n.message || ('Esta cuenta necesita una versión más reciente de AILAB. Ejecuta ' + cliCommand('update --confirmed') + '. No se ha cobrado nada.');
    case 'project_required': return n.message || 'Esta cuenta exige --proyecto en cada generación. No se ha cobrado nada.';
    case 'invalid_project': return n.message || '--proyecto no es válido: de 1 a 64 caracteres entre letras sin tilde, números, punto, guion y guion bajo. No se ha cobrado nada.';
    case 'ambiguous_submit': return (n.message || 'El estado del envio es ambiguo.') + ' No se reintentara con otra UUID. Revisa el historial o usa AILAB doctor.';
    case 'network': return n.message + (/^Sin conexion/.test(n.message) ? '\n' + networkAdvice() : '');
    case 'timeout': return n.message;
    case 'invalid_response': return n.message;
    default: return n.message || 'Error inesperado del servidor.';
  }
}
