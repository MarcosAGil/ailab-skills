import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CANONICAL, canRunParity } from './helpers/php.mjs';
import { startPriceBank } from './helpers/price-bank.mjs';
import { auditAll } from './helpers/price-audit.mjs';
import { PriceFixtures, hasFfmpeg } from './helpers/price-fixtures.mjs';
import { priceCases, realVideoCases, sweepCases } from './helpers/price-cases.mjs';
import { loadWeb, webCredits } from './helpers/price-web.mjs';

// Auditoría de precios de TODOS los modelos que se pueden calcular sin red. Para cada combinación representativa (cada
// resolución, duración mínima, típica y máxima, con y sin audio, con y sin vídeo o referencias) compara:
//   1. la estimación de la CLI real (`prepare`),
//   2. lo que reserva el servidor PHP real de AILAB (`submit` con los proveedores sin conexión) y la estimación propia de su
//      gateway (máximo autorizado forzado a 1 cr: el 402 trae su cifra),
//   3. la tarifa que muestra la web (`app/ailab-pricing.js` sobre `app/playground-models-data.js`).
// Regla: la estimación de la CLI nunca puede ser menor que la reserva del servidor (daría 402) ni exagerada sin motivo.
// Necesita AILAB_CANONICAL_REPO y php; los barridos de duración se ejecutan siempre y los MP4 reales solo con ffmpeg.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = path.join(root, 'skills/ailab');
const catalog = JSON.parse(fs.readFileSync(path.join(skillRoot, 'catalog/catalog.json'), 'utf8'));
const FIXED_NOW = Date.parse('2026-10-27T12:00:00Z');
const skip = canRunParity() ? false : 'Necesita AILAB_CANONICAL_REPO y php (las pruebas de paridad se omiten sin ellos).';

// Modelos sin estimación propia en el servidor: Kie liquida el consumo real y el servidor reserva el máximo que autoriza la CLI.
const NO_SERVER_ESTIMATE = {
  'remove-background': 'Kie liquida el consumo real; el servidor reserva lo que autoriza la CLI y no estima.',
  'eleven-dialogue-v3': 'Kie liquida el consumo real; el servidor reserva lo que autoriza la CLI y no estima.',
  'eleven-speech-to-text': 'Kie liquida el consumo real; el servidor reserva lo que autoriza la CLI y no estima.',
  suno: 'Kie liquida el consumo real; el servidor reserva lo que autoriza la CLI y no estima.',
};
// Modelos cuyo coste cotiza el servidor con el proveedor: no hay tarifa local que comparar.
const SERVER_QUOTED = {
  'soul-2': 'Higgsfield cotiza en el servidor (/estimate del proveedor).',
  genjutsu: 'Higgsfield cotiza en el servidor (/estimate del proveedor).',
  'higgsfield-soul-cinema': 'Higgsfield cotiza en el servidor (/estimate del proveedor).',
  'higgsfield-marketing-studio-image': 'Higgsfield cotiza en el servidor (/estimate del proveedor).',
};
// Sobrecostes de la CLI sobre la reserva del servidor que tienen un motivo documentado (más allá del redondeo de 1 cr).
const OVER_ALLOWED = [
  { id: 'seedream-v5-pro', when: (a) => a.mode === 'layers', reason: 'Descomposición en capas: el número de capas lo decide el modelo. El servidor reserva 8 o 15 cr y la CLI autoriza hasta 300 cr como tope del cargo final.' },
  { id: 'grok-imagine-video-1-5', when: () => true, max: 3, reason: 'El proveedor cobra una tarifa de imagen que no desglosa antes de generar (lo dice la nota de la web): la CLI suma 2 cr por imagen y el servidor no la reserva.' },
];
// Diferencias entre la tarifa de la web y la de la CLI (más de 1 cr). La web publica una tabla genérica; la CLI y el servidor
// reservan según el modo y los archivos reales.
const WEB_DIFFERENCES = {
  'seedream-v5-pro': 'La web muestra la reserva de 15 cr; la CLI autoriza hasta 300 cr en capas.',
  'seedance-2': 'La web envía Fast al modelo rápido (11,93 y 25,3 cr/s); desde la terminal el servidor lo envía al Seedance 2.0 normal y lo reserva con la tarifa de Normal. Con vídeo, la web aplica además la tarifa con vídeo al Fast.',
  'seedance-2-5': 'La tabla genérica de la web no refleja la duración automática ni la edición (30 s reservados).',
  'seedance-2-5-lite': 'La tabla genérica de la web no suma los segundos del vídeo de referencia.',
  'grok-imagine-video-1-5': 'La CLI suma 2 cr por imagen (tarifa del proveedor no desglosada); la web solo lo menciona en su nota.',
  'kling-o3': 'La tabla genérica de la web no refleja la tarifa con vídeo de entrada, la de audio ni los 16 s reservados en Transformación.',
  'minimax-h3': 'La tabla genérica de la web no suma 15 s por vídeo de referencia ni las imágenes a partir de la sexta.',
  'kling-v3': 'La web es conservadora (redondea a 23 y 34 cr/s y Pro presupone audio); el servidor reserva 22,4 cr/s y 33,6 con audio.',
  'crystal-upscaler': 'El servidor reserva 61 cr aunque la salida sea menor; la web muestra el coste por megapíxel.',
  'seedvr2-image-upscaler': 'El servidor reserva 6 cr aunque la salida sea menor; la web muestra el coste por megapíxel.',
  'seed-audio': 'El servidor reserva siempre 100 cr (la duración la decide el modelo); la web muestra el coste de un audio medio.',
};

let results = [];
let dir;
let fixtures;
const withFfmpeg = hasFfmpeg();

test.before(async () => {
  if (skip) return;
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-price-files-'));
  fixtures = new PriceFixtures(dir);
  const cases = [...priceCases(fixtures), ...sweepCases(fixtures), ...(withFfmpeg ? realVideoCases(fixtures) : [])];
  const bank = await startPriceBank({ canonical: CANONICAL, skillRoot });
  try { results = await auditAll(bank, cases, fixtures, 3); } finally { bank.stop(); }
  const web = loadWeb(CANONICAL);
  for (const record of results) record.web = webCredits(web, record.id, catalog.models[record.id], record.args, FIXED_NOW);
  if (process.env.AILAB_PRICE_REPORT) fs.writeFileSync(process.env.AILAB_PRICE_REPORT, JSON.stringify(results, null, 1));
});
test.after(() => { if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

// Krea 3 no tiene tarifa local: lo que aprueba la CLI es la cotización del servidor.
const cliOf = (record) => (record.cli !== null ? record.cli : record.quote ?? null);
const reference = (record) => (record.serverEstimate !== null ? record.serverEstimate : (record.gate === 'exacto' ? record.cli : null));
const describe = (record) => record.id + ' ' + JSON.stringify(record.args).slice(0, 220) + (record.label ? ' [' + record.label + ']' : '');

test('el catálogo no depende del día: sin promociones, y los gateways del servidor ya no tienen ninguna activa', { skip }, () => {
  for (const [id, model] of Object.entries(catalog.models)) assert.equal(model.estimate.promo, undefined, id);
  // Las tarifas del servidor que cambiaron por fecha ya cambiaron todas: la prueba usa la fecha fija de la auditoría y
  // exige que hoy sea posterior al último fin de promoción conocido (17/09/2026 el más tardío del servidor).
  assert.ok(FIXED_NOW > Date.parse('2026-10-11T00:00:00Z'));
  assert.ok(Date.now() > Date.parse('2026-10-11T00:00:00Z'));
});

test('ninguna petición válida de la CLI recibe un 402 por estimar menos que la reserva del servidor', { skip }, () => {
  const refused = results.filter((r) => r.outcome === '402');
  assert.deepEqual(refused.map(describe), []);
  const rejected = results.filter((r) => ['cli-rechaza', 'sin-reserva'].includes(r.outcome));
  assert.deepEqual(rejected.map((r) => describe(r) + ' -> ' + r.note), [], 'todos los casos de la auditoría son combinaciones válidas');
});

test('la estimación de la CLI nunca es menor que la estimación del servidor', { skip }, () => {
  const under = results.filter((r) => reference(r) !== null && (cliOf(r) === null || cliOf(r) < reference(r)));
  assert.deepEqual(under.map((r) => describe(r) + ' cli=' + cliOf(r) + ' servidor=' + reference(r)), []);
});

test('la estimación de la CLI no se exagera sin motivo: iguales, 1 cr de redondeo del servidor o un sobrecoste documentado', { skip }, () => {
  const excessive = [];
  for (const r of results) {
    const server = reference(r);
    if (server === null || cliOf(r) === null || cliOf(r) === server) continue;
    const over = cliOf(r) - server;
    const allowance = OVER_ALLOWED.find((rule) => rule.id === r.id && rule.when(r.args));
    if (allowance) {
      if (allowance.max !== undefined && over > allowance.max) excessive.push(describe(r) + ' cli=' + r.cli + ' servidor=' + server + ' (máximo documentado ' + allowance.max + ')');
      continue;
    }
    // Redondeo decimal del servidor: se tolera 1 cr (o el 1 %) sobre la reserva y nada más.
    if (over > Math.max(1, Math.ceil(server * 0.01))) excessive.push(describe(r) + ' cli=' + r.cli + ' servidor=' + server);
  }
  assert.deepEqual(excessive, []);
  // Cada excepción documentada se usa de verdad: si deja de hacer falta, hay que borrarla.
  for (const rule of OVER_ALLOWED) assert.ok(results.some((r) => r.id === rule.id && rule.when(r.args) && r.cli > reference(r)), 'excepción sin uso: ' + rule.id);
});

test('los gateways de Topaz y Resemble exigen que reserva y estimación coincidan, y lo cumplen', { skip }, () => {
  const exact = results.filter((r) => r.gate === 'exacto');
  assert.ok(exact.length >= 8, 'hay casos de Topaz imagen, Topaz vídeo y Resemble');
  for (const r of exact) { assert.equal(r.outcome, 'reserva', describe(r)); assert.equal(r.hold, r.cli, describe(r)); }
});

test('Krea 3 cotiza el servidor y su cotización coincide con la tarifa de la web', { skip }, () => {
  const krea = results.filter((r) => r.id === 'krea-3');
  assert.ok(krea.length >= 2);
  for (const r of krea) {
    assert.ok(r.quote > 0, describe(r));
    assert.equal(r.hold, r.quote, 'la reserva es la cotización: ' + describe(r));
    assert.equal(r.web.credits, r.quote, 'la web muestra la misma cotización: ' + describe(r));
  }
});

test('la tarifa de la web coincide con la de la CLI salvo las diferencias documentadas', { skip }, () => {
  const differing = results.filter((r) => r.cli !== null && r.web && Number.isFinite(r.web.credits) && Math.abs(r.web.credits - r.cli) > 1);
  const unexplained = differing.filter((r) => !WEB_DIFFERENCES[r.id]);
  assert.deepEqual(unexplained.map((r) => describe(r) + ' cli=' + r.cli + ' web=' + r.web.credits), []);
  for (const id of Object.keys(WEB_DIFFERENCES)) assert.ok(differing.some((r) => r.id === id), 'diferencia documentada sin uso: ' + id);
  // Los modelos de precio sencillo (sin archivos que midan) deben coincidir EXACTAMENTE con la web.
  for (const id of ['nano-banana-pro', 'nano-banana-2', 'gpt-image-2', 'flux-2-pro', 'seedance-2-mini', 'seedance-1-5-pro', 'kling-3-0', 'happyhorse-1-0', 'eleven-music', 'depth-anything-video', 'recraft-v41', 'ideogram-v45', 'flux-3']) {
    const rows = results.filter((r) => r.id === id && r.web && Number.isFinite(r.web.credits));
    assert.ok(rows.length > 0, id);
    for (const r of rows) assert.equal(r.web.credits, r.cli, describe(r));
  }
});

test('cada modelo del catálogo está auditado, cotiza el servidor o tiene un motivo documentado', { skip }, () => {
  const ids = Object.keys(catalog.models);
  assert.equal(ids.length, 69);
  const compared = new Set(results.filter((r) => reference(r) !== null && r.cli !== null).map((r) => r.id));
  const withoutFfmpeg = withFfmpeg ? [] : ['topaz-astra-precise-2-6', 'topaz-astra-creative-2', 'seedvr-video-upscaler'];
  const missing = ids.filter((id) => !compared.has(id) && !NO_SERVER_ESTIMATE[id] && !SERVER_QUOTED[id] && id !== 'krea-3' && !withoutFfmpeg.includes(id));
  // eleven-tts v4 lo cotiza el servidor por voz; sus versiones flash, multi y v3 sí se comparan.
  assert.deepEqual(missing, []);
  assert.ok(compared.has('eleven-tts'));
  for (const id of Object.keys(NO_SERVER_ESTIMATE)) assert.ok(results.some((r) => r.id === id && r.outcome === 'reserva'), id);
  // Sin estimación propia del servidor: al menos coincide con la web (cuando la web lo publica con el mismo contrato).
  for (const id of ['remove-background', 'eleven-speech-to-text', 'suno']) for (const r of results.filter((x) => x.id === id)) assert.equal(r.web.credits, r.cli, describe(r));
});

test('la skill lista los 69 modelos activos: solo un interruptor de servidor documentado puede cerrarlos', { skip }, () => {
  for (const [id, model] of Object.entries(catalog.models)) {
    assert.equal(model.enabled, true, id);
    assert.equal(model.status, 'active', id);
  }
  // Interruptores del servidor que cierran modelos con el valor del repositorio. Se leen de config.php, no se suponen.
  const GATES = {
    TOPAZ_ENABLED: ['topaz-bloom-2', 'topaz-wonder-3-5', 'topaz-astra-precise-2-6', 'topaz-astra-creative-2'],
    RESEMBLE_ENABLED: ['resemble-audio-enhancement'],
    SEEDANCE_25_PROVIDER: ['seedance-2-5-lite'],
    HIGGSFIELD_FEATURE_FLAGS: ['higgsfield-marketing-studio-image'],
  };
  const config = JSON.parse(execFileSync('php', ['-r', `$c=include ${JSON.stringify(path.join(CANONICAL, 'app/api/wallet/config.php'))}; echo json_encode(array_intersect_key($c, array_flip(${JSON.stringify(Object.keys(GATES))})));`], { encoding: 'utf8' }));
  for (const [flag, models] of Object.entries(GATES)) {
    assert.ok(flag in config, flag + ' existe en config.php');
    for (const id of models) assert.ok(catalog.models[id], id);
  }
  assert.equal(config.TOPAZ_ENABLED, false, 'valor del repositorio: Topaz cerrado hasta que Marcos lo abra');
  assert.equal(config.RESEMBLE_ENABLED, false);
  assert.equal(config.SEEDANCE_25_PROVIDER, 'kie');
  assert.equal(config.HIGGSFIELD_FEATURE_FLAGS['higgsfield-marketing-studio-image'], false);
});

test('informe: tabla de la auditoría', { skip }, () => {
  const rows = results.length;
  assert.ok(rows >= 600, 'la auditoría ejecutó ' + rows + ' casos');
  if (process.env.AILAB_PRICE_REPORT) assert.ok(fs.existsSync(process.env.AILAB_PRICE_REPORT));
});
