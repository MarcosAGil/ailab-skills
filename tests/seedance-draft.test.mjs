import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { CANONICAL, canRunParity, php } from './helpers/php.mjs';
import { startPriceBank } from './helpers/price-bank.mjs';

// Modo draft de Seedance 2.5 en la skill 2.3.16. Contrato: docs/operations/seedance-25-draft-precios-2026-10-31.md en AILAB,
// sección 5. Con AILAB_CANONICAL_REPO se usa el PHP real con proveedores apagados: sin red, sin claves y sin gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-seedance-draft-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable, requiresServerQuote } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const { pricingLines } = await import('../skills/ailab/scripts/lib/pricing.mjs');
const { DRAFT_UPGRADE_ID, draftLines, draftQuote, decodeDraftCursor, encodeDraftCursor } = await import('../skills/ailab/scripts/lib/seedance-draft.mjs');
const { guideText } = await import('../skills/ailab/scripts/lib/guide.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));
const parity = { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' };

const NORMAL = 'seedance-2-5';
const LITE = 'seedance-2-5-lite';
const UPGRADE = DRAFT_UPGRADE_ID;
const OLD_RUNTIMES = ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12', '2.3.13', '2.3.14', '2.3.15'];
const CHARGED = ' No se ha cobrado nada.';
const NO_EDIT = 'El modo draft de Seedance 2.5 no admite Editar vídeo.' + CHARGED;
const ONLY_480 = 'El modo draft de Seedance 2.5 solo admite 480p.' + CHARGED;
const FIXED = 'El modo draft de Seedance 2.5 necesita una duración fija de 4 a 30 segundos.' + CHARGED;
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const clips = new Map();
const clip = (seconds) => {
  if (!clips.has(seconds)) clips.set(seconds, media.video(`draft-${seconds}.mp4`, seconds));
  return clips.get(seconds);
};
// Vídeos que facturan exactamente `seconds`. Por encima de 30 s hacen falta varios: cada uno sube al segundo superior.
function videosBilling(seconds) {
  if (seconds <= 30) return [clip(seconds)];
  const count = Math.min(10, seconds - 29);
  const base = Math.floor(seconds / count);
  return range(1, count).map((index) => clip(Number((base + (index <= seconds % count ? 1 : 0) - 1 + 0.01).toFixed(2))));
}

function plan(id, given) {
  const model = { id, ...catalog.models[id] };
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, id, params: v.params, estimate: estimateCredits(model, { ...v.params, ...v.fileParams }), payload: buildPayload(model, v.params, uploaded), files: Object.values(v.fileParams).flat() };
}

// El camino del gateway para un draft: puerta, normalización, contrato, medición en el servidor y estimación. Solo se simula
// la consulta de metadatos de la subida.
const PHP_DRAFT = `
  $cfg = wallet_config(); $cases = json_decode($argv[1], true); $meta = json_decode($argv[2], true); $out = [];
  $inspect = static function ($url, $kind) use ($meta) { return $meta[$url] ?? null; };
  foreach ($cases as $case) {
    $model = $case['model']; $body = ['model' => $model, 'input' => $case['input']]; $error = null; $seconds = 0;
    try {
      $body['input'] = gateway_normalize_video_input($model, $case['input']);
      $error = gateway_seedance_25_draft_error($body, true, '/jobs/createTask')['msg'] ?? null;
      if ($error === null) { $error = gateway_validate_video_contract($model, $body['input'], 0); }
      if ($error === null && $model === 'seedance-2-5-lite') { $error = sume_lite_contract($body['input'], $cfg); }
      if ($error === null) {
        $seconds = $model === 'seedance-2-5'
          ? gateway_seedance_25_media_seconds($body['input'], 1, GATEWAY_SEEDANCE_25_REFERENCE_SECONDS, 'Seedance 2.5', $inspect)
          : gateway_seedance_25_media_seconds($body['input'], 1, GATEWAY_SEEDANCE_25_LITE_REFERENCE_SECONDS, 'Seedance 2.5 Lite', $inspect);
      }
    } catch (InvalidArgumentException $e) { $error = $e->getMessage(); }
    if ($error !== null) { $out[] = ['ok' => false, 'error' => $error]; continue; }
    $route = $cfg['SKILL_MODEL_ROUTES'][$model];
    $forward = array_merge($body['input'], $route['fixed_input'] ?? []);
    foreach ($route['strip_input'] ?? [] as $key) { unset($forward[$key]); }
    $billing = ['_billing_input_seconds' => $seconds];
    if ($model === 'seedance-2-5') { $billing['_billing_edit'] = false; }
    $out[] = ['ok' => true, 'seconds' => $seconds, 'credits' => gateway_estimate_credits($route['gateway_model'], array_merge($forward, $billing)), 'forward' => $forward];
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;

const askServer = (cases) => {
  const meta = {};
  for (const c of cases) for (const file of c.files || []) meta[media.url(file)] = media.meta[file];
  return php(PHP_DRAFT, [JSON.stringify(cases.map((c) => ({ model: c.id, input: c.payload.input }))), JSON.stringify(meta)], { sume: true });
};

test('catálogo: draft sin valor por defecto, una adición que entienden los parsers antiguos, y el modelo de 1080p', () => {
  for (const id of [NORMAL, LITE]) {
    const spec = catalog.models[id].params.draft;
    assert.deepEqual(Object.keys(spec).sort(), ['help', 'type'], id + ': con `default` todas las CLI enviarían draft: false y el servidor lo rechaza');
    assert.equal(spec.type, 'bool');
    assert.match(spec.help, /480p/);
    assert.deepEqual(catalog.models[id].params.resolution.values, ['480p', '720p', '1080p'], 'la web tiene 480p-draft; la skill usa --draft');
    assert.equal(catalog.models[id].params.resolution.default, '720p', 'el valor por defecto de una generación normal no cambia');
  }
  assert.equal(catalog.models[NORMAL].min_cli_version, '2.3.15', 'la 2.3.15 envía draft tal cual: funciona o falla sin cobro');
  assert.equal(catalog.models[LITE].min_cli_version, '2.3.16', 'la 2.3.15 descartaría draft y cobraría un vídeo normal');
  assert.equal(catalog.min_cli_version, '2.3.7');
  const model = catalog.models[UPGRADE];
  assert.equal(model.id, UPGRADE);
  assert.equal(model.min_cli_version, '2.3.16');
  assert.equal(model.driver, 'jobs-v1');
  assert.equal(model.output, 'video');
  assert.equal(model.enabled, true);
  assert.equal(model.status, 'active');
  assert.equal(model.expensive, true);
  assert.deepEqual(Object.keys(model.params), ['draft_task_id']);
  assert.equal(model.params.draft_task_id.required, true);
  assert.deepEqual(Object.keys(model.estimate).sort(), ['approximate', 'credits', 'kind', 'note']);
  assert.equal(model.estimate.kind, 'flat_credits');
  assert.equal(model.estimate.credits, 6687);
  assert.equal(modelUsable(model).ok, true);
  const text = JSON.stringify([catalog.models[NORMAL].params.draft, catalog.models[LITE].params.draft, model]);
  for (const forbidden of ['bytedance/', 'provider_contract', 'callBackUrl', 'SUME_API_KEY', 'borrador', String.fromCharCode(0x2014)]) assert.equal(text.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden);
});

test('sin --draft el cuerpo no cambia: ni draft ni 480p, y --draft false equivale a no pedirlo', () => {
  for (const id of [NORMAL, LITE]) {
    const plain = plan(id, { prompt: 'x' });
    assert.equal('draft' in plain.payload.input, false, id);
    assert.equal(plain.payload.input.resolution, '720p', id);
    const off = plan(id, { prompt: 'x', draft: 'false' });
    assert.deepEqual(off.payload, plain.payload, id);
    assert.equal(off.estimate.credits, plain.estimate.credits, id);
  }
});

test('draft: 480p, cuerpo exacto y el mismo precio que 480p, con y sin vídeo', () => {
  const image = media.image('marco.png', 1024, 768);
  for (const id of [NORMAL, LITE]) {
    const combos = [
      { duration: 5 },
      { duration: 30, aspect_ratio: '9:16' },
      { mode: 'i2v', duration: 6, first_frame_url: image },
      { mode: 'ref', duration: 8, reference_image_urls: [image] },
      { mode: 'ref', duration: 8, reference_video_urls: [clip(3.2), clip(4.1)] },
    ];
    for (const given of combos) {
      const draft = plan(id, { prompt: 'x', draft: 'true', ...given });
      assert.equal(draft.ok, true, draft.errors?.join(' '));
      const same = plan(id, { prompt: 'x', resolution: '480p', ...given });
      assert.equal(draft.params.resolution, '480p', 'sin --resolution, draft es 480p');
      assert.equal(draft.payload.input.draft, true);
      assert.equal(draft.payload.input.resolution, '480p');
      assert.equal(draft.estimate.credits, same.estimate.credits, id + ' ' + JSON.stringify(given));
      assert.equal(draft.estimate.approximate, same.estimate.approximate);
      assert.deepEqual({ ...draft.payload.input, draft: undefined }, { ...same.payload.input, draft: undefined });
    }
    assert.equal(plan(id, { prompt: 'x', draft: 'true', resolution: '480p' }).ok, true, 'también con --resolution 480p explícito');
  }
  // El argumento suelto `--draft` llega como true.
  assert.equal(plan(NORMAL, { prompt: 'x', draft: true }).payload.input.draft, true);
  assert.equal(plan(NORMAL, { prompt: 'x', draft: true, duration: 5 }).estimate.credits, 143, 'ceil(28,56 x 5)');
  assert.equal(plan(LITE, { prompt: 'x', draft: true, duration: 6 }).estimate.credits, 126, 'ceil(20,9712 x 6)');
  // La CLI revalida lo congelado en el manifiesto al enviar: mismo resultado.
  const frozen = plan(LITE, { prompt: 'x', draft: true, duration: 6 }).params;
  const again = validateParams({ id: LITE, ...catalog.models[LITE] }, { ...frozen });
  assert.deepEqual(again.params, frozen);
});

test('combinaciones inválidas: la CLI las rechaza sin red', () => {
  const cases = [
    ['720p', NORMAL, { draft: 'true', resolution: '720p' }, ONLY_480],
    ['1080p', NORMAL, { draft: 'true', resolution: '1080p' }, ONLY_480],
    ['720p en Lite', LITE, { draft: 'true', resolution: '720p' }, ONLY_480],
    ['1080p en Lite', LITE, { draft: 'true', resolution: '1080p' }, ONLY_480],
    ['duración automática', NORMAL, { draft: 'true', auto_duration: 'true' }, FIXED],
    ['edición', NORMAL, { draft: 'true', mode: 'edit', reference_video_urls: [clip(5)] }, NO_EDIT],
  ];
  for (const [name, id, given, message] of cases) {
    const result = plan(id, { prompt: 'x', ...given });
    assert.equal(result.ok, false, name);
    assert.ok(result.errors.includes(message), name + ': ' + result.errors.join(' | '));
  }
  assert.match(plan(NORMAL, { prompt: 'x', draft: 'true', duration: 3 }).errors.join(' '), /--duration minimo 4/);
  assert.match(plan(LITE, { prompt: 'x', draft: 'true', duration: 31 }).errors.join(' '), /--duration maximo 30/);
  assert.match(plan(LITE, { prompt: 'x', draft: 'true', auto_duration: 'true' }).errors.join(' '), /Parametro desconocido: --auto_duration/);
  assert.match(plan(LITE, { prompt: 'x', draft: 'true', mode: 'edit' }).errors.join(' '), /debe ser uno de/);
  assert.match(plan(NORMAL, { prompt: 'x', draft: 'quizás' }).errors.join(' '), /--draft debe ser/);
  assert.match(plan(UPGRADE, {}).errors.join(' '), /Falta el parametro obligatorio --draft_task_id/);
  assert.match(plan(UPGRADE, { draft_task_id: '   ' }).errors.join(' '), /no puede estar vacío/);
  assert.match(plan(UPGRADE, { draft_task_id: 'x'.repeat(256) }).errors.join(' '), /supera 255/);
  assert.match(plan(UPGRADE, { draft_task_id: 't', resolution: '1080p' }).errors.join(' '), /Parametro desconocido: --resolution/);
  assert.match(plan(UPGRADE, { draft_task_id: 't', prompt: 'x' }).errors.join(' '), /Parametro desconocido: --prompt/);
});

test('el precio de 1080p no sale de la CLI', () => {
  const model = { id: UPGRADE, ...catalog.models[UPGRADE] };
  assert.equal(requiresServerQuote(model, {}), true);
  const estimate = estimateCredits(model, { draft_task_id: 'tarea' });
  assert.equal(estimate.credits, null);
  assert.equal(estimate.server_quote, true);
  const info = pricingLines(model).join('\n');
  assert.match(info, /lo cotiza el servidor para cada draft/);
  assert.doesNotMatch(info, /6687/);
  assert.deepEqual(plan(UPGRADE, { draft_task_id: ' tarea-1 ' }).payload, { model: UPGRADE, input: { draft_task_id: 'tarea-1' } });
});

test('regla de oro con el PHP real: draft reserva lo mismo que estima la CLI en cada duración y entrada, Kie y Sume', parity, () => {
  const cases = [];
  const add = (id, given) => {
    const planned = plan(id, { prompt: 'Una escena', draft: 'true', ...given });
    assert.equal(planned.ok, true, id + ' ' + planned.errors?.join(' '));
    cases.push({ ...planned, label: id + ' ' + JSON.stringify(given) });
  };
  for (const duration of range(4, 30)) {
    for (const input of range(0, 39)) add(NORMAL, { duration, ...(input ? { mode: 'ref', reference_video_urls: videosBilling(input) } : {}) });
    for (const input of range(0, 40)) add(LITE, { duration, ...(input ? { mode: 'ref', reference_video_urls: videosBilling(input) } : {}) });
  }
  const results = askServer(cases);
  assert.equal(results.length, cases.length);
  cases.forEach((c, index) => {
    const server = results[index];
    assert.equal(server.ok, true, `${c.label}: ${server.error}`);
    assert.equal(c.estimate.credits, server.credits, c.label);
    assert.equal(server.forward.draft, true, c.label);
  });
  assert.equal(cases.length, 2187);
});

test('paridad con el PHP real: lo que la CLI rechaza el servidor lo rechaza con el mismo texto, y al revés lo acepta', parity, () => {
  const image = media.image('paridad.png', 1024, 768);
  const base = { prompt: 'x', mode: 't2v', resolution: '480p', duration: 5, aspect_ratio: 'adaptive', generate_audio: true, draft: true };
  const raw = (id, patch, files = []) => ({ id, payload: { input: { ...base, ...patch } }, files });
  const refused = [
    ['720p', NORMAL, { resolution: '720p' }, raw(NORMAL, { resolution: '720p' }), ONLY_480],
    ['1080p', NORMAL, { resolution: '1080p' }, raw(NORMAL, { resolution: '1080p' }), ONLY_480],
    ['720p en Lite', LITE, { resolution: '720p' }, raw(LITE, { resolution: '720p' }), ONLY_480],
    ['duración automática', NORMAL, { auto_duration: 'true' }, raw(NORMAL, { auto_duration: true }), FIXED],
    ['edición', NORMAL, { mode: 'edit', reference_video_urls: [clip(5)] }, raw(NORMAL, { mode: ' edit ', reference_video_urls: [media.url(clip(5))] }, [clip(5)]), NO_EDIT],
  ];
  const results = askServer(refused.map((row) => row[3]));
  refused.forEach(([name, id, given, , message], index) => {
    assert.equal(results[index].ok, false, name);
    assert.equal(results[index].error, message, name);
    const local = plan(id, { prompt: 'x', draft: 'true', ...given });
    assert.equal(local.ok, false, name);
    assert.ok(local.errors.includes(results[index].error), name);
  });
  // `draft: false` y `draft` fuera de input los rechaza el servidor: por eso la CLI nunca los envía.
  const [off] = askServer([raw(NORMAL, { draft: false })]);
  assert.equal(off.ok, false);
  assert.match(off.error, /se activa con draft: true/);
  const accepted = [
    [NORMAL, { mode: 'i2v', first_frame_url: image, last_frame_url: image }],
    [NORMAL, { mode: 'ref', reference_image_urls: [image], reference_video_urls: [clip(3)] }],
    [LITE, { mode: 'i2v', first_frame_url: image }],
    [LITE, { mode: 'ref', reference_image_urls: [image], reference_video_urls: [clip(3)] }],
  ].map(([id, given]) => plan(id, { prompt: 'x', draft: 'true', duration: 6, ...given }));
  const answers = askServer(accepted);
  accepted.forEach((c, index) => {
    assert.equal(answers[index].ok, true, answers[index].error);
    assert.equal(answers[index].credits, c.estimate.credits);
    for (const key of ['prompt', 'resolution', 'draft', 'first_frame_url', 'last_frame_url', 'reference_image_urls', 'reference_video_urls']) assert.deepEqual(answers[index].forward[key], c.payload.input[key], key);
    assert.equal('auto_duration' in answers[index].forward, false, 'la duración automática no viaja');
  });
});

test('paso a 1080p con el PHP real: la puerta acepta el cuerpo de la CLI, y listado, reserva y cota del catálogo cuadran', parity, () => {
  const payload = plan(UPGRADE, { draft_task_id: 'tarea-1' }).payload;
  const body = { ...payload, client_request_id: '11111111-1111-4111-8111-111111111111', max_credits_authorized: 806 };
  const [open, extraBody, extraInput, closed, noMax] = php(`$body = json_decode($argv[1], true); echo json_encode([
    gateway_seedance_25_draft_error($body, true, '/jobs/createTask'),
    gateway_seedance_25_draft_error($body + ['duration' => 5], true, '/jobs/createTask'),
    gateway_seedance_25_draft_error(array_replace($body, ['input' => $body['input'] + ['resolution' => '1080p']]), true, '/jobs/createTask'),
    gateway_seedance_25_draft_error($body, false, '/jobs/createTask'),
    gateway_seedance_25_draft_error(array_diff_key($body, ['max_credits_authorized' => 1]), true, '/jobs/createTask'),
  ]);`, [JSON.stringify(body)]);
  assert.equal(open, null);
  assert.equal(extraBody.code, 400);
  assert.equal(extraInput.code, 400);
  assert.equal(closed.code, 403);
  assert.equal(noMax.code, 400);
  const maximum = php(`$max = 0; $rows = 0;
    foreach (['kie', 'sume'] as $provider) foreach ([false, true] as $video) for ($output = 4; $output <= 30; $output++) for ($input = 0; $input <= ($video ? 40 : 0); $input++) {
      $row = ['provider' => $provider, 'output_seconds' => $output, 'input_seconds' => $input, 'with_video' => $video];
      $slug = $provider === 'sume' ? SEEDANCE_25_SUME_UPGRADE_SLUG : SEEDANCE_25_KIE_UPGRADE_SLUG;
      $listed = seedance_draft_upgrade_cost($row)['credits'];
      if ($listed !== gateway_estimate_credits($slug, ['_billing_draft' => $row])) { throw new RuntimeException('el listado y la reserva difieren'); }
      if ($provider === 'kie' && $input > 39) { continue; }
      $max = max($max, $listed); $rows++;
    } echo json_encode(['max' => $max, 'rows' => $rows]);`);
  assert.equal(maximum.max, catalog.models[UPGRADE].estimate.credits, 'la cota del catálogo es el máximo real: ninguna reserva la supera');
  assert.equal(maximum.rows, 2 * 27 + 27 * 40 + 27 * 41);
});

test('draftQuote: solo un draft ready con un coste válido, y la cifra es la del servidor', () => {
  const draft = { task_id: 't1', version: 'normal', output_seconds: 5, status: 'ready', credits: 806, approximate: false };
  const answer = draftQuote(draft, Date.parse('2026-10-31T10:00:00Z'));
  assert.equal(answer.ok, true);
  assert.equal(answer.quote.estimated_credits, 806);
  assert.equal(answer.quote.max_credits_authorized, 806);
  assert.equal(answer.quote.expires_at, '2026-10-31T10:15:00.000Z');
  assert.match(draftQuote({ ...draft, version: 'lite', approximate: true }).quote.note, /Lite.*máximo reservado/);
  assert.match(draftQuote({ ...draft, status: 'expired' }).normalized.message, /ha caducado.*No se ha cobrado nada/);
  for (const status of ['upgrading', 'upgraded', 'review']) assert.match(draftQuote({ ...draft, status }).normalized.message, /ya tiene una generación a 1080p/);
  for (const credits of [0, -1, 1.5, '', null, undefined]) assert.equal(draftQuote({ ...draft, credits }).ok, false, String(credits));
});

test('el cursor del listado viaja como texto opaco y uno inválido se rechaza', () => {
  const cursor = { created_at: '2026-10-31 10:00:00', task_id: 'sume_job_000001' };
  assert.deepEqual(decodeDraftCursor(encodeDraftCursor(cursor)), cursor);
  for (const bad of ['', 'no-es-json', encodeDraftCursor({ created_at: 1 }), encodeDraftCursor(['x'])]) assert.equal(decodeDraftCursor(bad), null, bad);
});

const fakeDraft = (index, patch = {}) => ({ task_id: 'draft-' + index, version: 'normal', provider: 'kie', video_url: 'https://cdn.example.test/draft-' + index + '.mp4', aspect_ratio: '16:9', output_seconds: 5,
  input_seconds: 0, with_video: false, created_at: '2026-10-31 10:00:00', expires_at: '2026-11-07 09:00:00', status: 'ready', upgrade_task_id: null, upgrade_video_url: null, credits: 806, approximate: false, ...patch });

async function fakePlatform(t, drafts) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-draft-cli-'));
  const credentials = path.join(temp, 'credentials');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'S'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = new URL(req.url, base);
    const body = /json/.test(req.headers['content-type'] || '') ? JSON.parse(Buffer.concat(chunks).toString() || '{}') : {};
    requests.push({ path: url.pathname, query: url.searchParams.get('path'), body });
    if (url.pathname === '/result.mp4') { res.writeHead(200, { 'content-type': 'video/mp4' }); return res.end(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)])); }
    let response = { ok: true, user: { email: 'test@example.invalid', tier: 'hub' }, balance: 500000 };
    if (body.action === 'task_costs') response = { ok: true, costs: { 'tarea-1080p': 700 } };
    if (url.pathname.endsWith('/history.php')) {
      const start = body.cursor ? drafts.findIndex((draft) => draft.task_id === body.cursor.task_id) + 1 : 0;
      const page = drafts.slice(start, start + 20);
      const more = start + 20 < drafts.length;
      response = { ok: true, drafts: page, has_more: more, next_cursor: more ? { created_at: page.at(-1).created_at, task_id: page.at(-1).task_id } : null };
    }
    if (url.pathname.endsWith('/task.php')) {
      response = { ok: true, task: { task_id: body.task_id, model_id: UPGRADE, state: 'success', result_url: base + 'result.mp4', result_urls: [base + 'result.mp4'], charged_credits: 700, created_at: '2026-10-31' } };
    }
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = { code: 200, data: { taskId: 'tarea-1080p' } };
      else response = { code: 200, data: { taskId: 'tarea-1080p', state: 'success', resultJson: JSON.stringify({ resultUrls: [base + 'result.mp4'] }) } };
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath, AILAB_TASK_ENDPOINT: base + 'api/v1/skill/task.php',
    AILAB_CONFIG_DIR: path.join(temp, 'config'), AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out') };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = async (...args) => {
    try { return { code: 0, ...await execute(process.execPath, [cli, ...args], { env, timeout: 30000 }) }; }
    catch (error) { return { code: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' }; }
  };
  return { exec, requests, sends: () => requests.filter((request) => request.query === '/jobs/createTask'), temp };
}

const manifestOf = (stdout) => /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];

test('comando drafts: muestra cada dato, pagina con --cursor y no gasta', async (t) => {
  const drafts = range(1, 25).map((index) => fakeDraft(index));
  drafts[1] = fakeDraft(2, { version: 'lite', provider: 'sume', aspect_ratio: '9:16', output_seconds: 6, input_seconds: 5, with_video: true, credits: 764, approximate: true, status: 'upgrading', upgrade_task_id: 'hija-2' });
  drafts[2] = fakeDraft(3, { status: 'upgraded', upgrade_task_id: 'hija-3', upgrade_video_url: 'https://cdn.example.test/hija-3.mp4' });
  const p = await fakePlatform(t, drafts);
  const first = await p.exec('drafts');
  assert.equal(first.code, 0, first.stderr);
  assert.match(first.stdout, /Drafts de Seedance 2\.5 \(20, hay más\):/);
  assert.match(first.stdout, /task_id: draft-1\n {2}Versión: Normal · duración: 5 s · formato: 16:9\n {2}Estado: ready \(se puede generar a 1080p\) · fecha límite: 2026-11-07 09:00:00 UTC\n {2}Coste de 1080p: 806 cr\n {2}URL: https:\/\/cdn\.example\.test\/draft-1\.mp4/);
  assert.match(first.stdout, /Versión: Lite · duración: 6 s \+ 5 s de vídeo de referencia · formato: 9:16\n {2}Estado: upgrading[^\n]*\n {2}Coste de 1080p: 764 cr como máximo \(se cobra el coste real\)/);
  assert.match(first.stdout, /Tarea a 1080p: hija-2/);
  assert.match(first.stdout, /URL a 1080p: https:\/\/cdn\.example\.test\/hija-3\.mp4/);
  const next = /drafts --cursor (\S+)/.exec(first.stdout)?.[1];
  assert.ok(next, first.stdout);
  const second = await p.exec('drafts', '--cursor', next);
  assert.equal(second.code, 0, second.stderr);
  assert.match(second.stdout, /Drafts de Seedance 2\.5 \(5\):/);
  assert.match(second.stdout, /task_id: draft-25/);
  assert.doesNotMatch(second.stdout, /--cursor/);
  assert.deepEqual(p.requests.filter((r) => r.path.endsWith('/history.php')).map((r) => r.body), [{ action: 'seedance_drafts', cursor: null }, { action: 'seedance_drafts', cursor: { created_at: '2026-10-31 10:00:00', task_id: 'draft-20' } }]);
  const before = p.requests.length;
  for (const args of [['--cursor', 'roto'], ['--cursor'], ['--cursor', next, '--cursor', next]]) assert.notEqual((await p.exec('drafts', ...args)).code, 0, args.join(' '));
  assert.equal(p.requests.length, before, 'un cursor inválido no llega al servidor');
  assert.equal(p.sends().length, 0);
  const empty = await fakePlatform(t, []);
  assert.match((await empty.exec('drafts')).stdout, /No hay drafts de Seedance 2\.5/);
});

test('draftLines no pierde datos del listado', () => {
  const text = draftLines(fakeDraft(9)).join('\n');
  for (const value of ['draft-9', 'Normal', '5 s', '16:9', 'ready', '2026-11-07 09:00:00', '806 cr', 'https://cdn.example.test/draft-9.mp4']) assert.ok(text.includes(value), value);
});

test('generar un draft: prepare con presupuesto, sin --confirmed no se envía y el cuerpo lleva draft', async (t) => {
  const p = await fakePlatform(t, []);
  for (const [id, seconds, credits, keys] of [
    [NORMAL, '5', 143, ['aspect_ratio', 'auto_duration', 'draft', 'duration', 'generate_audio', 'mode', 'prompt', 'resolution']],
    [LITE, '6', 126, ['aspect_ratio', 'draft', 'duration', 'generate_audio', 'mode', 'prompt', 'resolution']],
  ]) {
    const prepared = await p.exec('prepare', id, '--draft', 'true', '--prompt', 'Una taza', '--duration', seconds);
    assert.equal(prepared.code, 0, prepared.stderr);
    assert.match(prepared.stdout, new RegExp('Estimacion: ~' + credits + ' cr'));
    assert.match(prepared.stdout, /draft: true/);
    assert.match(prepared.stdout, /resolution: "480p"/);
    const before = p.sends().length;
    const refused = await p.exec('submit', manifestOf(prepared.stdout));
    assert.notEqual(refused.code, 0);
    assert.match(refused.stderr, /Falta la confirmacion/);
    assert.equal(p.sends().length, before, 'sin confirmación humana no sale nada');
    assert.equal((await p.exec('submit', manifestOf(prepared.stdout), '--confirmed')).code, 0);
    const sent = p.sends().at(-1).body;
    assert.equal(sent.model, id);
    assert.equal(sent.max_credits_authorized, credits);
    assert.equal(sent.input.draft, true);
    assert.equal(sent.input.resolution, '480p');
    assert.deepEqual(Object.keys(sent.input).sort(), keys);
  }
  const rejected = await p.exec('prepare', NORMAL, '--draft', 'true', '--resolution', '720p', '--prompt', 'x');
  assert.notEqual(rejected.code, 0);
  assert.match(rejected.stderr, /solo admite 480p/);
});

test('generar a 1080p: el coste sale del listado, se autoriza esa cifra exacta y exige confirmación', async (t) => {
  const drafts = range(1, 24).map((index) => fakeDraft(index, { credits: 800 + index }));
  drafts.push(fakeDraft(25, { version: 'lite', provider: 'sume', credits: 764, approximate: true, with_video: true, input_seconds: 5, output_seconds: 6 }));
  drafts.push(fakeDraft(26, { status: 'expired' }), fakeDraft(27, { status: 'upgrading' }), fakeDraft(28, { status: 'upgraded' }), fakeDraft(29, { status: 'review' }));
  const p = await fakePlatform(t, drafts);

  // Está en la segunda página: la CLI recorre el listado y no calcula nada.
  const prepared = await p.exec('prepare', UPGRADE, '--draft_task_id', 'draft-23');
  assert.equal(prepared.code, 0, prepared.stderr);
  assert.match(prepared.stdout, /coste cotizado 823 cr \(importe que se aprueba\)/);
  assert.match(prepared.stdout, /Draft Normal de 5 s/);
  assert.equal(p.requests.filter((r) => r.path.endsWith('/history.php')).length, 2);
  assert.equal(p.sends().length, 0, 'prepare no envía nada');

  const lite = await p.exec('prepare', UPGRADE, '--draft_task_id', 'draft-25');
  assert.match(lite.stdout, /coste cotizado 764 cr/);
  assert.match(lite.stdout, /máximo reservado: se cobra el coste real/);

  const low = await p.exec('prepare', UPGRADE, '--draft_task_id', 'draft-23', '--max-credits', '822');
  assert.notEqual(low.code, 0);
  assert.match(low.stderr, /supera el maximo que autorizaste/);
  assert.equal((await p.exec('prepare', UPGRADE, '--draft_task_id', 'draft-23', '--max-credits', '823')).code, 0);

  const unconfirmed = await p.exec('submit', manifestOf(prepared.stdout));
  assert.notEqual(unconfirmed.code, 0);
  assert.match(unconfirmed.stderr, /Falta la confirmacion/);
  assert.equal(p.sends().length, 0);

  const submitted = await p.exec('submit', manifestOf(prepared.stdout), '--confirmed');
  assert.equal(submitted.code, 0, submitted.stderr + submitted.stdout);
  const sent = p.sends();
  assert.equal(sent.length, 1);
  assert.deepEqual(Object.keys(sent[0].body).sort(), ['client_request_id', 'input', 'max_credits_authorized', 'model']);
  assert.equal(sent[0].body.model, UPGRADE);
  assert.deepEqual(sent[0].body.input, { draft_task_id: 'draft-23' });
  assert.equal(sent[0].body.max_credits_authorized, 823);
  assert.match(submitted.stdout, /Tarea encolada: tarea-1080p/);
  assert.match(submitted.stdout, /Coste real: 700 cr/);
  assert.match(submitted.stdout, /Guardado: /);
  // El manifiesto no se reutiliza: una segunda ejecución remite a `status`.
  const repeated = await p.exec('submit', manifestOf(prepared.stdout), '--confirmed');
  assert.notEqual(repeated.code, 0);
  assert.match(repeated.stderr, /ya se ejecutó/);
  assert.equal(p.sends().length, 1);

  // Sin recibo local ni archivos: `status` recupera por el modelo lógico que devuelve el servidor.
  fs.rmSync(path.join(p.temp, 'config', 'tasks'), { recursive: true, force: true });
  fs.rmSync(path.join(p.temp, 'out'), { recursive: true, force: true });
  const recovered = await p.exec('status', 'tarea-1080p');
  assert.equal(recovered.code, 0, recovered.stderr + recovered.stdout);
  assert.match(recovered.stdout, /Tarea recuperada|Recuperado del servidor/);
  assert.ok(fs.readdirSync(path.join(p.temp, 'out')).length > 0);
  assert.equal(p.sends().length, 1, 'recuperar no vuelve a enviar');

  for (const [id, message] of [['draft-26', /ha caducado/], ['draft-27', /ya tiene una generación/], ['draft-28', /ya tiene una generación/], ['draft-29', /ya tiene una generación/], ['no-existe', /no aparece en tu cuenta/]]) {
    const refused = await p.exec('prepare', UPGRADE, '--draft_task_id', id);
    assert.notEqual(refused.code, 0, id);
    assert.match(refused.stderr, message, id);
    assert.match(refused.stderr, /No se ha cobrado nada/, id);
  }
  assert.equal(p.sends().length, 1);
});

test('compatibilidad: los parsers 2.3.7 a 2.3.15 aceptan el catálogo; solo la 2.3.15 ofrece Normal, y ninguna Lite ni 1080p', parity, async () => {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  for (const version of OLD_RUNTIMES) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(raw));
    assert.equal(Object.keys(parsed.models).length, Object.keys(catalog.models).length, version);
    assert.equal(old.catalogCompatible(parsed).ok, true, version);
    for (const id of [LITE, UPGRADE]) {
      const usable = old.modelUsable(parsed.models[id]);
      assert.equal(usable.ok, false, `la CLI ${version} no debe ofrecer ${id}`);
      assert.match(usable.reason, /Actualiza la skill.*2\.3\.16/, `${version} ${id}`);
    }
    assert.equal(old.modelUsable(parsed.models[NORMAL]).ok, version === '2.3.15', `${version} ${NORMAL}`);
    // Sin --draft nada cambia para esa CLI: `draft` no tiene valor por defecto y no aparece en sus parámetros.
    const model = { id: NORMAL, ...parsed.models[NORMAL] };
    const v = old.validateParams(model, { prompt: 'x' });
    assert.equal(v.ok, true, version);
    assert.equal('draft' in v.params, false, version);
  }
});

test('por qué Lite sube a 2.3.16: el `liteInput` de la 2.3.15 descartaría draft y por qué Normal no lo necesita', parity, () => {
  const bundle = fs.readFileSync(path.join(CANONICAL, 'app/api/v1/skill/releases/2.3.15/scripts/pg.mjs'), 'utf8');
  const lite = /function liteInput\([\s\S]*?\n}\n/.exec(bundle);
  assert.ok(lite, 'el bundle firmado 2.3.15 contiene liteInput');
  assert.equal(lite[0].includes('draft'), false, 'la entrada de Lite se construye campo a campo y omite draft');
  // Normal copia todos los parámetros validados al cuerpo: el servidor recibe draft y decide.
  assert.match(bundle, /for \(const \[k, v\] of Object\.entries\(params\)\) input\[k\] = v;/);
});

test('extremo a extremo con el PHP real: token, listado, autorización igual a la reserva y 402 por debajo, en Kie y en Sume', parity, async (t) => {
  const skillRoot = path.join(root, 'skills/ailab');
  const bank = await startPriceBank({ canonical: CANONICAL, skillRoot, workers: 2, balance: 100000 });
  t.after(() => bank.stop());
  // Drafts ya terminados: los proveedores están apagados en el banco. Es el estado que deja una generación real.
  const seed = (taskId, version, output, input) => bank.php(`
    $dir = dirname((new ReflectionFunction('wallet_db'))->getFileName());
    require_once $dir . '/seedance-drafts.php'; require_once $dir . '/sume-gateway.php';
    $db = wallet_db(); seedance_draft_schema($db); sume_schema($db);
    $taskId = ${JSON.stringify(taskId)}; $version = ${JSON.stringify(version)}; $now = wallet_now();
    $db->prepare("INSERT INTO submission_intents(user_id,client_request_id,payload_hash,state,task_id,model,driver,max_credits_authorized,created_at,updated_at) VALUES(2,?,?,'submitted',?,?,'jobs-v1',100,?,?)")
       ->execute([bin2hex(random_bytes(16)), str_repeat('a', 64), $taskId, $version === 'lite' ? 'seedance-2-5-lite' : 'seedance-2-5', $now, $now]);
    $intent = (int)$db->lastInsertId();
    wallet_task_create($taskId, 2, $version === 'lite' ? 'bytedance/seedance-2-5-lite' : 'bytedance/seedance-2-5', '/jobs/createTask', 100, null, $version === 'lite' ? 'sume' : null);
    $db->prepare("UPDATE tasks SET state='success', result_url=? WHERE task_id=?")->execute(['https://cdn.example.test/' . $taskId . '.mp4', $taskId]);
    seedance_draft_create($db, $intent, 2, $version, ${output}, ${input}, ${input > 0 ? 'true' : 'false'}, '16:9');
    seedance_draft_link($db, $intent, $taskId);
    if ($version === 'lite') { $db->prepare("INSERT INTO ailab_provider_tasks(task_id,intent_id,user_id,provider,remote_id,state,created_at) VALUES(?,?,2,'sume',?,'completed',?)")->execute([$taskId, $intent, 'job_' . $taskId, time()]); }`);
  const rows = [['kie-sin-video', 'normal', 5, 0, 806, false], ['kie-con-video', 'normal', 5, 3, 776, false], ['sume_sin-video', 'lite', 6, 0, 696, false], ['sume_con-video', 'lite', 6, 5, 764, true]];
  for (const [id, version, output, input] of rows) seed(id, version, output, input);

  const listed = await bank.cli('drafts');
  assert.equal(listed.code, 0, listed.stderr);
  for (const [id, , , , credits, approximate] of rows) {
    assert.match(listed.stdout, new RegExp('task_id: ' + id + '\\n[^]*?Coste de 1080p: ' + credits + ' cr' + (approximate ? ' como máximo' : '\\n')), id);
  }
  // Un máximo por debajo de la reserva: 402 con la cifra del servidor, sin reserva ni llamada al proveedor.
  for (const [id, , , , credits] of rows) {
    const prepared = await bank.cliForced('prepare', UPGRADE, '--draft_task_id', id);
    assert.equal(prepared.code, 0, prepared.stderr);
    assert.match(prepared.stdout, new RegExp('coste cotizado ' + credits + ' cr'), id);
    const refused = await bank.cliForced('submit', manifestOf(prepared.stdout), '--confirmed');
    assert.notEqual(refused.code, 0, id);
    assert.match(refused.stderr + refused.stdout, new RegExp('La estimacion de ' + credits + ' creditos supera el maximo autorizado de 1'), id);
    assert.equal(bank.reservationFor(manifestOf(prepared.stdout)), null, id);
  }
  // La cifra autorizada es exactamente la que reserva el servidor. Kie está apagado: el envío queda ambiguo y la reserva retenida.
  const prepared = await bank.cli('prepare', UPGRADE, '--draft_task_id', 'kie-sin-video');
  await bank.cli('submit', manifestOf(prepared.stdout), '--confirmed');
  assert.equal(bank.reservationFor(manifestOf(prepared.stdout)), 806);
  // Ese draft queda ocupado: otro prepare lo dice sin enviar nada.
  const busy = await bank.cli('prepare', UPGRADE, '--draft_task_id', 'kie-sin-video');
  assert.notEqual(busy.code, 0);
  assert.match(busy.stderr, /ya tiene una generación a 1080p/);
  // Generar un draft por token: la misma reserva que estima la CLI.
  const draft = await bank.cli('prepare', NORMAL, '--draft', 'true', '--prompt', 'Una taza', '--duration', '5');
  assert.match(draft.stdout, /Estimacion: ~143 cr/);
  await bank.cli('submit', manifestOf(draft.stdout), '--confirmed');
  assert.equal(bank.reservationFor(manifestOf(draft.stdout)), 143);
  const invalid = await bank.cliForced('prepare', LITE, '--draft', 'true', '--prompt', 'Una taza', '--duration', '6');
  const server = await bank.cliForced('submit', manifestOf(invalid.stdout), '--confirmed');
  assert.match(server.stderr + server.stdout, /La estimacion de 126 creditos supera el maximo autorizado de 1/);
});

test('guide, referencia y SKILL.md explican el flujo, dentro del contrato de vocabulario', () => {
  const guide = guideText({ version: '2.3.16', run: (sub) => sub });
  for (const text of ['--draft true', '`drafts', UPGRADE, '--draft_task_id']) assert.ok(guide.includes(text), text);
  const reference = fs.readFileSync(path.join(root, 'skills/ailab/references/seedance-draft.md'), 'utf8');
  const skill = fs.readFileSync(path.join(root, 'skills/ailab/SKILL.md'), 'utf8');
  assert.match(skill, /references\/seedance-draft\.md/);
  assert.ok(reference.split('\n').length < 70, 'referencia breve');
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8')).skills.find((entry) => entry.id === 'ailab');
  assert.equal(registry.guide_references.includes('references/seedance-draft.md'), false, 'el detalle queda fuera del presupuesto de la guía');
  for (const text of [guide, reference, skill]) assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  // «borrador» solo aparece para prohibirlo.
  for (const text of [guide, reference]) assert.doesNotMatch(text.replace(/nunca «borrador»/g, ''), /borrador/i);
  assert.doesNotMatch(skill, /borrador/i);
});
