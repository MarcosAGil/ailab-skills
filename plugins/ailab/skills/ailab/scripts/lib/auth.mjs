// Autenticacion publica por token de dispositivo, con cookie temporal mantenida
// solo para compatibilidad de desarrollo. Se guarda en CONFIG_DIR con 0600.
// NUNCA se guardan email ni contrasena. La entrada de la
// contrasena es oculta en el terminal (jamas por el chat de Claude).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { BASE_URL, CONFIG_DIR, CREDENTIALS_DIR, ensureConfigDir, warnWindowsPerms } from './config.mjs';

const COOKIE_FILE = () => path.join(CONFIG_DIR, 'cookie.json');
const TOKEN_FILE = () => path.join(CREDENTIALS_DIR, 'token');
export const cookieAuthEnabled = () => process.env.AILAB_ALLOW_COOKIE_AUTH === '1';

export function readToken() {
  try {
    const token = fs.readFileSync(TOKEN_FILE(), 'utf8').trim();
    return /^ailp_[A-Za-z0-9_-]{40,80}$/.test(token) ? token : null;
  } catch { return null; }
}

export function saveToken(token) {
  const clean = String(token || '').trim();
  if (!/^ailp_[A-Za-z0-9_-]{40,80}$/.test(clean)) throw new Error('El token no tiene un formato valido.');
  ensureConfigDir();
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(CREDENTIALS_DIR, 0o700); } catch { /* Windows */ }
  fs.writeFileSync(TOKEN_FILE(), clean + '\n', { mode: 0o600 });
  try { fs.chmodSync(TOKEN_FILE(), 0o600); } catch { /* Windows */ }
  warnWindowsPerms();
}

export function clearToken() {
  try { fs.unlinkSync(TOKEN_FILE()); } catch { /* no existia */ }
}

export function openDevicePage() {
  const url = BASE_URL + 'api/wallet/cuenta.html#dispositivos';
  if (process.env.PG_NO_OPEN === '1') return url;
  try {
    if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch { /* el usuario puede abrir la URL manualmente */ }
  return url;
}

export function readCookie() {
  if (!cookieAuthEnabled()) return null;
  try {
    const j = JSON.parse(fs.readFileSync(COOKIE_FILE(), 'utf8'));
    return j && j.cookie ? j.cookie : null;
  } catch { return null; }
}

export function saveCookie(cookie) {
  ensureConfigDir();
  fs.writeFileSync(COOKIE_FILE(), JSON.stringify({ cookie, saved_at: new Date().toISOString() }) + '\n', { mode: 0o600 });
  try { fs.chmodSync(COOKIE_FILE(), 0o600); } catch { /* Windows */ }
  warnWindowsPerms();
}

export function clearCookie() {
  try { fs.unlinkSync(COOKIE_FILE()); } catch { /* no existia */ }
}

export function promptVisible(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
}

// Prompt con eco oculto: lectura manual de stdin en modo raw (tecnica estandar de
// las CLI). La contrasena no se pinta, no queda en logs ni en el historial del shell.
// Funciona igual en terminal real (TTY) y con stdin canalizado (tests).
export function promptHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    const isTTY = !!stdin.isTTY;
    if (isTTY) stdin.setRawMode(true);
    stdin.resume();
    let buf = '';
    const done = (value) => {
      stdin.removeListener('data', onData);
      if (isTTY) stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(value);
    };
    const onData = (chunk) => {
      const s = chunk.toString('utf8');
      for (const c of s) {
        if (c === '\n' || c === '\r' || c === '\u0004') { done(buf); return; } // Enter o Ctrl+D
        if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }  // Ctrl+C
        if (c === '\u007f' || c === '\b') { buf = buf.slice(0, -1); continue; } // Borrar
        buf += c;
      }
    };
    stdin.on('data', onData);
  });
}

function extractCookie(setCookies) {
  for (const sc of setCookies) {
    const m = /^([A-Za-z0-9_]+=[^;]+)/.exec(sc);
    if (m && sc.toLowerCase().startsWith('ail_')) return m[1];
  }
  // respaldo: primera cookie recibida
  const m = setCookies.length ? /^([A-Za-z0-9_]+=[^;]+)/.exec(setCookies[0]) : null;
  return m ? m[1] : null;
}

// Login directo contra api.php capturando el Set-Cookie (fetch nativo no gestiona jar).
export async function login(email, password) {
  if (!cookieAuthEnabled()) {
    return { ok: false, message: 'El login por contraseña está desactivado. Usa un token de dispositivo con el comando login.' };
  }
  let res;
  try {
    res = await fetch(BASE_URL + 'api/wallet/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    });
  } catch (e) {
    return { ok: false, message: 'Sin conexion: ' + (e && e.message ? e.message : e) };
  }
  let body = null;
  try { body = await res.json(); } catch { /* abajo */ }
  if (!body || body.ok !== true) {
    return { ok: false, message: (body && body.error) ? body.error : 'Login rechazado (HTTP ' + res.status + ').' };
  }
  const setCookies = (typeof res.headers.getSetCookie === 'function')
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  const cookie = extractCookie(setCookies);
  if (!cookie) return { ok: false, message: 'El servidor no devolvio la cookie de sesion.' };
  saveCookie(cookie);
  return { ok: true, user: body.user || null, balance: body.balance ?? null };
}
