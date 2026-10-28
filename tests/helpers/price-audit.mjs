// Ejecuta un caso de la auditoría de precios contra el banco: estimación de la CLI (prepare), reserva real del servidor y
// estimación propia del servidor (máximo autorizado forzado a 1 cr).

export const toArgv = (args) => Object.entries(args).flatMap(([name, value]) => (Array.isArray(value) ? value : [value]).flatMap((item) => ['--' + name, String(item)]));

const FLAKY = /Fallo la subida|limitado temporalmente|El servidor no pudo completar/;
const MANIFEST = /Manifiesto: ([0-9a-f-]{36})/;
const clean = (text) => text.trim().split('\n').filter((line) => line && !/^(Subiendo|Enviando)/.test(line)).slice(0, 2).join(' | ').slice(0, 240);

// prepare + submit, repetidos si el servidor local de PHP (SQLite) rechaza una subida por concurrencia.
async function attempt(cli, id, argv) {
  let last = null;
  for (let turn = 0; turn < 5; turn += 1) {
    const prepared = await cli('prepare', id, ...argv);
    const preparedText = prepared.stdout + '\n' + prepared.stderr;
    if (FLAKY.test(preparedText)) { last = { prepared, text: preparedText }; continue; }
    const manifest = MANIFEST.exec(prepared.stdout)?.[1];
    if (!manifest) return { prepared, manifest: null, text: preparedText };
    const submitted = await cli('submit', manifest, '--confirmed');
    const text = submitted.stdout + '\n' + submitted.stderr;
    if (FLAKY.test(text)) { last = { prepared, manifest, submitted, text }; continue; }
    return { prepared, manifest, submitted, text };
  }
  return { ...last, flaky: true };
}

const money = (text, pattern) => { const m = pattern.exec(text); return m ? Number(m[1].replace(',', '.')) : null; };

export async function auditCase(bank, testCase, fixtures) {
  const { id, args, label } = testCase;
  const argv = toArgv(args);
  const record = { id, label, args: fixtures.describe(args), cli: null, outcome: null, hold: null, serverEstimate: null, gate: null, note: '' };

  const normal = await attempt(bank.cli, id, argv);
  record.cli = money(normal.prepared.stdout, /Estimacion(?: local de la skill)?: ~?([0-9.,]+) cr/);
  record.quote = money(normal.prepared.stdout, /coste cotizado ([0-9.,]+) cr/);
  if (!normal.manifest) {
    record.outcome = 'cli-rechaza';
    record.note = clean(normal.prepared.stderr || normal.prepared.stdout);
    return record;
  }
  const refusal = /La estimacion de ([0-9]+) creditos supera el maximo autorizado de ([0-9]+)/.exec(normal.text);
  if (refusal) { record.outcome = '402'; record.serverEstimate = Number(refusal[1]); return record; }
  record.hold = bank.reservationFor(normal.manifest);
  if (record.hold !== null) record.outcome = 'reserva';
  else { record.outcome = 'sin-reserva'; record.note = clean(normal.text); }

  const forced = await attempt(bank.cliForced, id, argv);
  if (forced.manifest) {
    const forcedText = forced.text;
    const estimate = /La estimacion de ([0-9]+) creditos supera el maximo autorizado de 1\b/.exec(forcedText);
    if (estimate) record.serverEstimate = Number(estimate[1]);
    else if (/El coste ha cambiado/.test(forcedText)) record.gate = 'exacto';
    else if (/Seed Audio reserva ([0-9]+) cr/.exec(forcedText)) record.serverEstimate = Number(/Seed Audio reserva ([0-9]+) cr/.exec(forcedText)[1]);
    else record.note = (record.note ? record.note + ' · ' : '') + 'sin estimación propia: ' + clean(forcedText);
  }
  return record;
}

// Ejecuta los casos con una concurrencia limitada y conserva el orden.
export async function auditAll(bank, cases, fixtures, concurrency = 3) {
  const results = new Array(cases.length);
  let next = 0;
  const worker = async () => {
    while (next < cases.length) {
      const index = next++;
      results[index] = await auditCase(bank, cases[index], fixtures);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
