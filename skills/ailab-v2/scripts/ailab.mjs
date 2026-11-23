#!/usr/bin/env node
// CLI de AILAB V2 (plugin 3.x). Solo se actualiza con el marketplace: no descarga ni ejecuta código.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as auth from './lib/auth.mjs';
import * as catalog from './lib/catalog.mjs';
import { VERSION } from './lib/config.mjs';
import * as generate from './lib/generate.mjs';
import { guide } from './lib/guide.mjs';
import { ApiError, NoResponseError } from './lib/http.mjs';
import * as projects from './lib/projects.mjs';
import { UserError, clean, print } from './lib/text.mjs';

const HELP = `AILAB V2 (plugin ${VERSION})

Cuenta
  login [--nombre "Mi portátil"]        Conecta con un código que apruebas en la web
  logout [--local]                      Revoca y desconecta
  doctor | balance

Crear
  models [--tipo imagen|video|audio] [--buscar texto]
  info <modelo>
  prepare <modelo> --campo valor... [--entrada archivo.json]
          [--proyecto <clave> [--crear-proyecto [--color c]] | --sin-proyecto]
  submit <preparación> --confirmado <créditos>
  status <generación> [--wait segundos] [--output carpeta]
  pendientes | drafts | historial [--proyecto <clave> | --sin-proyecto]

Proyectos
  proyectos [--estado abiertos|cerrados|todos] [--buscar texto]
  proyecto <clave>
  proyecto-crear "Nombre" [--color c]
  proyecto-usar <clave> | proyecto-salir
  proyecto-anadir <generación> <clave...> | proyecto-quitar <generación> <clave...>
  cerrar-proyecto <clave> [--segundos n] [--nota "texto"]

guide [uso|proyectos|recuperacion] | version | self-test`;

const MISSING = {
  assistants: 'Los asistentes no están', assistant: 'Los asistentes no están',
  voices: 'La biblioteca de voces no está', voice: 'La biblioteca de voces no está',
  flow: 'Los flujos no están',
};
const UPDATE = { update: true, rollback: true };

const COMMANDS = {
  login: auth.login,
  logout: auth.logout,
  doctor: auth.doctor,
  balance: auth.balance,
  models: catalog.models,
  info: catalog.info,
  prepare: generate.prepare,
  submit: generate.submit,
  status: generate.status,
  historial: generate.history,
  history: generate.history,
  drafts: generate.drafts,
  pendientes: generate.unfinished,
  proyectos: projects.list,
  proyecto: projects.show,
  'proyecto-crear': projects.create,
  'proyecto-usar': projects.use,
  'proyecto-salir': projects.leave,
  'proyecto-anadir': projects.add,
  'proyecto-quitar': projects.take,
  'cerrar-proyecto': projects.close,
  guide,
};

const ADVICE = {
  unauthenticated: 'La conexión ha caducado o se ha revocado. Ejecuta login.',
  legal_acceptance_required: 'Hay textos legales por aceptar: los acepta la persona en https://ailab.ailendra.com con su sesión.',
  insufficient_credits: 'No hay créditos disponibles suficientes.',
  forbidden: 'Tu cuenta o este dispositivo no tiene permiso para esto.',
  rate_limited: 'Espera un momento. Un envío no se repite solo.',
};

export function explain(error) {
  const api = error instanceof ApiError ? error : error?.cause instanceof ApiError ? error.cause : null;
  const network = error instanceof NoResponseError || error?.cause instanceof NoResponseError;
  if (error instanceof UserError) {
    const lines = error.message.split('\n').map((line) => clean(line, 2000));
    if (api) {
      lines.push(...api.details.map((detail) => '  ' + detail));
      if (ADVICE[api.code]) lines.push(ADVICE[api.code]);
    }
    if (network) lines.push('Si estás en un entorno aislado (sandbox), hay que permitir la red: guide recuperacion.');
    return lines;
  }
  if (['EPERM', 'EACCES', 'EROFS'].includes(error?.code)) {
    return ['No hay permiso para usar ' + clean(error.path ?? 'la carpeta de AILAB', 2000) + '. Si estás en un sandbox, mira guide recuperacion.'];
  }
  return ['Error inesperado de AILAB: ' + clean(error?.message ?? error, 300)];
}

export async function main(argv) {
  const [name = 'help', ...args] = argv;
  if (name === 'help' || name === '--help') return print(HELP);
  if (name === 'version' || name === '--version') return print(VERSION);
  if (name === 'self-test') return print('SELF_TEST_OK ' + VERSION);
  if (Object.hasOwn(MISSING, name)) throw new UserError(MISSING[name] + ' en el plugin AILAB V2.');
  if (Object.hasOwn(UPDATE, name)) throw new UserError('AILAB V2 no se actualiza sola: se actualiza desde el marketplace ailendra-labs (claude plugin update ailab-v2@ailendra-labs).');
  if (!Object.hasOwn(COMMANDS, name)) throw new UserError('No existe el comando ' + clean(name, 60) + '. Mira help.');
  return COMMANDS[name](args);
}

function invokedDirectly() {
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(explain(error).join('\n') + '\n');
    process.exitCode = 1;
  });
}
