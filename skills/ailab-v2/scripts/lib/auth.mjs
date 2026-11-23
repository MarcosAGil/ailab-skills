// Conexión por código (RFC 8628, opción B): el token nunca se enseña, se copia ni se pega.
import os from 'node:os';
import { APPROVAL_PATH, PRODUCTION_ORIGIN, VERSION, checkOrigin, isLoopback, stateDir } from './config.mjs';
import { command, one } from './args.mjs';
import { ApiError, NoResponseError, request } from './http.mjs';
import * as store from './store.mjs';
import { UserError, UUID, clean, print, quote } from './text.mjs';

const TOKEN = /^ailab_dt_[A-Za-z0-9_-]{43}$/;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const day = (iso) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(iso));

export function savedCredential() {
  const saved = store.read('credential.json');
  if (!saved) return null;
  if (!TOKEN.test(saved.token || '') || !UUID.test(saved.accountId || '')) {
    throw new UserError('La credencial guardada no es válida. Ejecuta logout --local y vuelve a hacer login.');
  }
  return { ...saved, origin: checkOrigin(saved.origin) };
}

/** La cuenta conectada, con `api` para llamar siempre a su origen con su token. */
export function account() {
  const saved = savedCredential();
  if (!saved) throw new UserError('No hay ninguna cuenta conectada. Ejecuta login: te dará un código para aprobar en la web. No se ha gastado nada.');
  return {
    origin: saved.origin,
    accountId: saved.accountId.toLowerCase(),
    api: (method, path, options) => request(saved, method, path, options),
  };
}

function approvalUrl(origin, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new UserError('AILAB ha devuelto una dirección de aprobación no válida.');
  }
  // En local la web y la API van en puertos distintos; en producción, en el mismo origen.
  const same = origin === PRODUCTION_ORIGIN ? url.origin === origin : url.protocol === 'http:' && isLoopback(url);
  if (!same || url.pathname !== APPROVAL_PATH || url.search || url.hash || url.username || url.password) {
    throw new UserError('AILAB ha devuelto una dirección de aprobación que no es suya. No se continúa.');
  }
  return url.origin + url.pathname;
}

export async function login(argv) {
  const { options } = command(argv, { options: ['nombre', 'origen'] });
  const origin = checkOrigin(one(options, 'origen') ?? PRODUCTION_ORIGIN);
  await store.exclusive('login', async () => {
    const saved = savedCredential();
    if (saved) {
      if (saved.origin !== origin) throw new UserError('Ya hay una cuenta conectada a ' + saved.origin + '. Ejecuta logout antes de conectar otra.');
      try {
        await request(saved, 'GET', '/me/device');
        print('Este equipo ya está conectado a ' + origin + '. Para cambiar de cuenta, ejecuta logout.');
        return;
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
        store.remove('credential.json');
      }
    }

    // Si la orden se cortó, se sigue con el mismo código.
    let pending = store.read('login.json');
    const reusable = pending && pending.origin === origin && pending.until > Date.now();
    if (!reusable) {
      const name = clean(one(options, 'nombre') ?? os.hostname(), 120).trim() || 'Equipo con el plugin';
      const started = await request({ origin }, 'POST', '/auth/devices/start', { body: { name } });
      if (typeof started?.deviceCode !== 'string' || !/^[A-Z]{4}-[A-Z]{4}$/.test(started?.userCode || '')) {
        throw new UserError('AILAB no ha devuelto un código válido.');
      }
      pending = {
        origin,
        deviceCode: started.deviceCode,
        userCode: started.userCode,
        url: approvalUrl(origin, started.verificationUrl),
        interval: Math.min(Math.max(Number(started.interval) || 5, 1), 30),
        // Un margen: quien dice que ha caducado es el servidor.
        until: Date.now() + (Number(started.expiresIn) || 600) * 1000 + 120000,
      };
      store.write(['login.json'], pending);
    }
    print(
      'Abre ' + pending.url + ' con tu sesión de AILAB y escribe este código:',
      '',
      '  ' + pending.userCode,
      '',
      'Aprueba solo un código que hayas pedido tú. Esperando la aprobación…',
    );
    while (Date.now() < pending.until) {
      let result;
      try {
        result = await request({ origin }, 'POST', '/auth/devices/token', { body: { deviceCode: pending.deviceCode } });
      } catch (error) {
        const passing = error instanceof NoResponseError || (error instanceof ApiError && (error.status >= 500 || error.status === 429));
        if (!passing) throw error;
        await sleep(pending.interval * 2000);
        continue;
      }
      if (result?.status === 'approved') {
        if (!TOKEN.test(result.token || '') || !UUID.test(result.accountId || '')) throw new UserError('AILAB no ha devuelto una credencial válida.');
        store.write(['credential.json'], { origin, accountId: result.accountId, token: result.token, expiresAt: result.expiresAt });
        store.remove('login.json');
        print('Conectado. Vale hasta el ' + day(result.expiresAt) + '. Se revoca en Ajustes > Sesiones.');
        return;
      }
      if (result?.status === 'denied' || result?.status === 'expired') {
        store.remove('login.json');
        throw new UserError(result.status === 'denied' ? 'Se ha rechazado la conexión desde la web.' : 'El código ha caducado. Ejecuta login para pedir otro.');
      }
      await sleep(pending.interval * 1000);
    }
    store.remove('login.json');
    throw new UserError('El código ha caducado. Ejecuta login para pedir otro.');
  });
}

export async function logout(argv) {
  const { options } = command(argv, { flags: ['local'] });
  if (options.has('local')) {
    store.remove('credential.json');
    store.remove('login.json');
    print('Credencial borrada de este equipo. Si seguía vigente, revócala en Ajustes > Sesiones de la web.');
    return;
  }
  const saved = savedCredential();
  if (saved) {
    try {
      await request(saved, 'DELETE', '/me/device');
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw new UserError('No se ha podido revocar el dispositivo: ' + error.message + ' Sigue conectado. Repite logout o usa logout --local y revócalo en la web.');
      }
    }
    store.remove('credential.json');
  }
  store.remove('login.json');
  print('Desconectado. Los envíos sin respuesta se conservan: se pueden repetir al volver a entrar con la misma cuenta.');
}

export async function doctor(argv) {
  command(argv);
  print('AILAB ' + VERSION + ' · Node ' + process.versions.node, 'Estado propio: ' + stateDir());
  const { origin, api } = account();
  print('Servidor: ' + origin);
  const device = await api('GET', '/me/device');
  print('Dispositivo: ' + quote(device.name) + ' · caduca el ' + day(device.expiresAt));
  const balance = await api('GET', '/me/balance');
  print('Saldo: ' + Number(balance.available) + ' créditos disponibles', 'Todo correcto. No se ha gastado nada.');
}

export async function balance(argv) {
  command(argv);
  const result = await account().api('GET', '/me/balance');
  print('Disponibles: ' + Number(result.available) + ' cr · retenidos: ' + Number(result.held) + ' cr · congelados: ' + Number(result.frozen) + ' cr');
}
