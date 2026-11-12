import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { CANONICAL, canRunParity } from './helpers/php.mjs';
import { startPriceBank } from './helpers/price-bank.mjs';
import { PriceFixtures } from './helpers/price-fixtures.mjs';

// Gemini Omni Flash 1.2 por Kie en la skill 2.3.19: generar, editar, Extend y los recursos gratuitos (Character ID y
// Voice ID). Contrato en AILAB: app/api/wallet/omni-12.php, omni-resource.php y la medición de gateway.php. Con
// AILAB_CANONICAL_REPO se usa el PHP real con un Kie simulado en local: sin red, sin claves y sin gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-omni12-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable, requiresServerQuote } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const omni = await import('../skills/ailab/scripts/lib/omni12.mjs');
const { guideText } = await import('../skills/ailab/scripts/lib/guide.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const media = new Media(path.join(temporary, 'files'));
// MP4 con pista y dimensiones, que el servidor mide igual que la CLI (el de Media solo lo mide la CLI).
const fixtures = new PriceFixtures(path.join(temporary, 'fixtures'));
const parity = { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' };

const GEN = 'gemini-omni-flash-1-2';
const EXTEND = 'gemini-omni-flash-1-2-extend';
const CHARACTER = 'gemini-omni-character';
const AUDIO = 'gemini-omni-audio';
const NEW_MODELS = [GEN, EXTEND, CHARACTER, AUDIO];
const OLD_RUNTIMES = ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12', '2.3.13', '2.3.14', '2.3.15', '2.3.16', '2.3.17', '2.3.18'];
const RATES = { '360p': 4.08, '720p': 9.18, '1080p': 10.2, '4k': 22.44 };
const P = 'Una taza de café humeante sobre una mesa de madera';
const manifestOf = (stdout) => /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];

const model = (id) => ({ id, ...catalog.models[id] });
const image = (name = 'ref.png') => media.image(name);
const clip = (seconds) => fixtures.video(seconds);

function plan(id, given) {
  const m = model(id);
  const v = validateParams(m, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  return { ok: true, params: v.params, estimate: estimateCredits(m, { ...v.params, ...v.fileParams }), payload: buildPayload(m, v.params, uploaded) };
}

test('catálogo: 1.2 por Kie con cuatro modalidades, Extend y los recursos, todos exigen la skill 2.3.19', () => {
  const gen = catalog.models[GEN];
  assert.deepEqual(gen.modes, ['t2v', 'frames', 'reference', 'edit']);
  assert.deepEqual(gen.params.mode.values, gen.modes);
  assert.deepEqual(gen.params.aspect_ratio.values, ['16:9', '9:16', 'auto']);
  assert.deepEqual([gen.params.seed.min, gen.params.seed.max], [10000, 99999]);
  assert.deepEqual([gen.params.image_urls.max, gen.params.character_ids.max], [6, 2]);
  assert.equal(gen.params.audio_ids, undefined, '1.2 no admite Voice IDs sueltos');
  assert.equal(gen.vendor, 'Google · KIE');
  for (const id of NEW_MODELS) {
    assert.equal(catalog.models[id].min_cli_version, '2.3.19', id);
    assert.equal(catalog.models[id].driver, 'jobs-v1', id + ': un driver nuevo haría que las CLI antiguas rechazaran el catálogo entero');
    assert.equal(modelUsable(catalog.models[id]).ok, true, id);
  }
  for (const id of [CHARACTER, AUDIO]) assert.deepEqual([catalog.models[id].output, catalog.models[id].estimate.credits, catalog.models[id].expensive], ['text', 0, false], id);
  // La tabla es la tarifa de Kie x 1,02 por segundo: ceil(round(tarifa x segundos, 6)).
  for (const [resolution, rate] of Object.entries(RATES)) {
    for (let seconds = 3; seconds <= 15; seconds++) {
      const expected = Math.ceil(Number((rate * seconds).toFixed(6)));
      assert.equal(gen.estimate.credits_matrix[resolution][String(seconds)], expected, resolution + ' ' + seconds);
      assert.equal(omni.omni12Credits(resolution, seconds), expected);
      assert.equal(plan(GEN, { prompt: P, resolution, duration: String(seconds) }).estimate.credits, expected);
    }
    assert.equal(gen.estimate.credits_with_video[resolution], omni.omni12Credits(resolution, 15));
  }
  assert.deepEqual([omni.omni12Credits('720p', 8), omni.omni12Credits('360p', 3), omni.omni12Credits('4k', 15)], [74, 13, 337]);
  assert.equal(catalog.models[EXTEND].estimate.credits, 92, 'cota para parsers: 10 s a 720p');
  assert.equal(requiresServerQuote(catalog.models[EXTEND]), true);
  assert.equal(requiresServerQuote(catalog.models[GEN]), false);
});

test('cada modalidad envía solo sus campos, con los nombres que espera el servidor', () => {
  const t2v = plan(GEN, { prompt: P, resolution: '360p', duration: '3', aspect_ratio: '9:16' });
  assert.deepEqual(t2v.payload, { model: GEN, input: { mode: 't2v', prompt: P, aspect_ratio: '9:16', resolution: '360p', duration: 3 } });
  const first = image('primero.png');
  const last = image('ultimo.png');
  const frames = plan(GEN, { mode: 'frames', prompt: P, first_frame_url: first, last_frame_url: last, duration: '10' });
  assert.deepEqual(frames.payload.input, { mode: 'frames', prompt: P, aspect_ratio: '16:9', resolution: '720p', duration: 10, first_frame_url: media.url(first), last_frame_url: media.url(last) });
  const ref = plan(GEN, { mode: 'reference', prompt: P, image_urls: [image('a.png'), image('b.png')], character_ids: ['char_1', 'char_2'], seed: '54321', aspect_ratio: 'auto' });
  assert.deepEqual(ref.payload.input, { mode: 'reference', prompt: P, aspect_ratio: 'auto', resolution: '720p', duration: 8, seeds: 54321, image_urls: [media.url(image('a.png')), media.url(image('b.png'))], character_ids: ['char_1', 'char_2'] });
  assert.equal(ref.estimate.credits, 74);
  // Editar: sin duración (la salida dura lo que el vídeo) y se cobran los segundos medidos, cada vídeo al segundo superior.
  const video = clip(4.2);
  const edit = plan(GEN, { mode: 'edit', prompt: P, video_url: video, image_urls: [image()], resolution: '720p' });
  assert.deepEqual(edit.payload.input, { mode: 'edit', prompt: P, aspect_ratio: '16:9', resolution: '720p', image_urls: [media.url(image())], video_list: [media.url(video)] });
  assert.equal('duration' in edit.params, false);
  assert.equal(edit.estimate.credits, 46, '5 s x 9,18');
  assert.match(edit.estimate.note, /vídeo a editar de 5 s/);
  assert.equal(plan(GEN, { mode: 'edit', prompt: P, video_url: clip(15), resolution: '4k' }).estimate.credits, 337);
  assert.equal(plan(GEN, { mode: 'edit', prompt: P, video_url: clip(0.6), resolution: '360p' }).estimate.credits, 5, 'mínimo 1 s');
  // Extend y recursos.
  const extend = plan(EXTEND, { task_id: '  kie-123 ', prompt: P, duration: '3', image_urls: [image()] });
  assert.deepEqual(extend.payload, { model: EXTEND, input: { mode: 'extend', task_id: 'kie-123', prompt: P, duration: 3, image_urls: [media.url(image())] } });
  assert.equal(extend.estimate.server_quote, true);
  const audio = plan(AUDIO, { name: 'Voz Clara', voice_description: 'Cálida', example_dialogue: 'Hola' });
  assert.deepEqual(audio.payload.input, { audio_id: 'Puck', name: 'Voz Clara', voice_description: 'Cálida', example_dialogue: 'Hola' });
  assert.equal(audio.estimate.credits, 0);
  const portrait = image('retrato.png');
  const body = image('cuerpo.png');
  const character = plan(CHARACTER, { portrait_url: portrait, body_url: body, descriptions: 'Clara, 30 años', character_name: 'Clara', audio_ids: ['voice_1'] });
  assert.deepEqual(character.payload.input, { image_urls: [media.url(portrait), media.url(body)], descriptions: 'Clara, 30 años', character_name: 'Clara', audio_ids: ['voice_1'] });
});

test('la CLI rechaza en local, con el texto del servidor, lo que el servidor rechazaría', () => {
  const errors = (id, given) => { const p = plan(id, given); assert.equal(p.ok, false, JSON.stringify(given)); return p.errors.join('\n'); };
  assert.match(errors(GEN, { prompt: P, image_urls: [image()] }), /Texto a vídeo no admite referencias ni frames\. No se ha cobrado nada\./);
  assert.match(errors(GEN, { mode: 'reference', prompt: P }), /Referencias a vídeo requiere al menos una imagen o un Character ID/);
  assert.match(errors(GEN, { mode: 'frames', prompt: P, first_frame_url: image(), image_urls: [image()] }), /no se puede mezclar con imágenes, vídeo ni Character IDs/);
  assert.match(errors(GEN, { mode: 'frames', prompt: P, last_frame_url: image() }), /Falta el parametro --first_frame_url/);
  assert.match(errors(GEN, { mode: 'frames', prompt: P, first_frame_url: image(), last_frame_url: image(), duration: '12' }), /Con primer y último frame, la duración debe ser un entero de 3 a 10 segundos/);
  assert.equal(plan(GEN, { mode: 'frames', prompt: P, first_frame_url: image(), duration: '15' }).ok, true, 'solo primer frame: hasta 15 s');
  assert.match(errors(GEN, { mode: 'reference', prompt: P, image_urls: Array.from({ length: 7 }, () => image()) }), /--image_urls admite como mucho 6/);
  assert.match(errors(GEN, { mode: 'edit', prompt: P, video_url: clip(8), image_urls: Array.from({ length: 6 }, () => image()) }), /cuota de referencias: cada imagen cuenta 1 y el vídeo 2, hasta 7/);
  assert.match(errors(GEN, { mode: 'edit', prompt: P, video_url: clip(8), duration: '5' }), /Al editar no se elige la duración/);
  assert.match(errors(GEN, { mode: 'edit', prompt: P, video_url: clip(16) }), /El vídeo a editar dura 16 s y Gemini Omni Flash 1\.2 edita vídeos de hasta 15 s\. No se ha cobrado nada\./);
  assert.equal(plan(GEN, { mode: 'edit', prompt: P, video_url: clip(15.04) }).ok, true, 'margen de 0,05 s del servidor');
  assert.match(errors(GEN, { mode: 'edit', prompt: P }), /Falta el parametro --video_url/);
  assert.match(errors(GEN, { mode: 'reference', prompt: P, character_ids: ['con espacio'] }), /Un Character ID contiene caracteres no válidos/);
  assert.match(errors(GEN, { mode: 'reference', prompt: P, character_ids: ['a', 'b', 'c'] }), /--character_ids admite como mucho 2/);
  assert.match(errors(GEN, { prompt: P, seed: '9999' }), /--seed/);
  assert.match(errors(GEN, { prompt: '   ' }), /El prompt es obligatorio/);
  assert.match(errors(GEN, { prompt: P, audio_ids: ['voice_1'] }), /Parametro desconocido: --audio_ids/);
  assert.match(errors(EXTEND, { task_id: '   ', prompt: P }), /Extend necesita el task_id/);
  assert.match(errors(EXTEND, { task_id: 'x', prompt: P, duration: '11' }), /--duration/);
  assert.match(errors(EXTEND, { task_id: 'x', prompt: P, image_urls: Array.from({ length: 4 }, () => image()) }), /--image_urls admite como mucho 3/);
  assert.match(errors(CHARACTER, { descriptions: 'x' }), /Falta el parametro obligatorio --portrait_url/);
  assert.match(errors(CHARACTER, { portrait_url: image(), descriptions: 'x', audio_ids: ['a', 'b'] }), /--audio_ids admite como mucho 1/);
  assert.match(errors(AUDIO, { name: 'x', audio_id: 'Inventada' }), /--audio_id debe ser uno de/);
  assert.match(errors(AUDIO, { name: '   ' }), /Nombre es obligatorio/);
});

test('Extend: la cotización es la cifra del listado del servidor para esa duración', () => {
  const video = { task_id: 'kie-1', kind: 'generate', resolution: '360p', output_seconds: 11, aspect_ratio: '9:16', rate: 4.08, credits_by_duration: { 3: 13, 10: 41 } };
  const quoted = omni.omni12ExtendQuote(video, 10, Date.parse('2026-11-12T10:00:00Z'));
  assert.equal(quoted.ok, true);
  assert.deepEqual([quoted.quote.estimated_credits, quoted.quote.max_credits_authorized, quoted.quote.expires_at], [41, 41, '2026-11-12T10:15:00.000Z']);
  assert.doesNotMatch(quoted.quote.note, /AVISO/);
  assert.match(omni.omni12ExtendQuote({ ...video, credits_by_duration: { 10: 50 } }, 10).quote.note, /AVISO: la tarifa local da 41 cr; manda la del servidor/);
  assert.equal(omni.omni12ExtendQuote(video, 5).ok, false, 'sin cifra del servidor no se autoriza nada');
  assert.equal(omni.omni12ExtendQuote(video, 11).ok, false);
  const lines = omni.omni12VideoLines(video).join('\n');
  for (const text of ['task_id: kie-1', 'Generado · 360p · 11 s · formato: 9:16', '+3 s 13 cr · +10 s 41 cr']) assert.ok(lines.includes(text), text);
});

test('compatibilidad: los parsers 2.3.7 a 2.3.18 aceptan el catálogo y no ofrecen los modelos nuevos', parity, async () => {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  for (const version of OLD_RUNTIMES) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(raw));
    assert.equal(Object.keys(parsed.models).length, Object.keys(catalog.models).length, version);
    assert.equal(old.catalogCompatible(parsed).ok, true, version);
    for (const id of NEW_MODELS) {
      const usable = old.modelUsable(parsed.models[id]);
      assert.equal(usable.ok, false, `la CLI ${version} no debe ofrecer ${id}`);
      assert.ok(usable.reason.includes('Actualiza la skill') && usable.reason.includes('2.3.19'), `${version} ${id}: ${usable.reason}`);
    }
  }
});

// Kie simulado: crea recursos de Omni y recibe createTask, pero corta la conexión al crear tareas, como una caída de red:
// el servidor deja la intención ambigua con la reserva retenida, que es lo que se compara con la autorización de la CLI.
async function startKie() {
  const tasks = [];
  const resources = [];
  let count = 0;
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : null;
      if (req.url === '/api/v1/jobs/createTask') { tasks.push(body); req.socket.destroy(); return; }
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/v1/omni/audio/create') {
        resources.push({ kind: 'audio', body });
        res.end(JSON.stringify({ code: 200, data: { kieAudioId: 'voice_mock_' + (++count), name: body.name } }));
      } else if (req.url === '/api/v1/omni/character/create') {
        resources.push({ kind: 'character', body });
        res.end(JSON.stringify({ code: 200, data: { characterId: 'char_mock_' + (++count), characterName: body.character_name, imageUrl: body.image_urls[0] } }));
      } else { res.statusCode = 404; res.end(JSON.stringify({ code: 404, msg: 'no' })); }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { base: 'http://127.0.0.1:' + server.address().port, tasks, resources, stop: () => server.close() };
}

test('extremo a extremo con el PHP real: reservas iguales a la autorización, Extend, recursos gratis y propiedad de los IDs', parity, async (t) => {
  const kie = await startKie();
  t.after(() => kie.stop());
  const skillRoot = path.join(root, 'skills/ailab');
  const bank = await startPriceBank({ canonical: CANONICAL, skillRoot, workers: 2, balance: 100000, settings: { KIE_BASE: kie.base, OMNI_12_PROVIDER: 'kie' } });
  t.after(() => bank.stop());
  const lastTask = () => kie.tasks.at(-1);
  const send = async (...args) => {
    const prepared = await bank.cli('prepare', ...args);
    assert.equal(prepared.code, 0, prepared.stderr + prepared.stdout);
    const before = kie.tasks.length;
    const submitted = await bank.cli('submit', manifestOf(prepared.stdout), '--confirmed');
    return { prepared, submitted, manifest: manifestOf(prepared.stdout), reached: kie.tasks.length > before };
  };

  // Texto a vídeo: la CLI autoriza 13 cr y el servidor reserva 13; a Kie no viaja `mode`.
  const t2v = await send(GEN, '--prompt', P, '--resolution', '360p', '--duration', '3', '--aspect_ratio', '9:16');
  assert.match(t2v.prepared.stdout, /Estimacion: ~13 cr/);
  assert.equal(bank.reservationFor(t2v.manifest), 13);
  assert.deepEqual(lastTask(), { model: 'google/gemini-omni-flash-1-2', input: { prompt: P, aspect_ratio: '9:16', resolution: '360p', duration: 3 } });

  // Editar: segundos medidos (4,2 s -> 5 s), lista de vídeos, semilla como `seeds` y sin duración.
  const edit = await send(GEN, '--mode', 'edit', '--prompt', P, '--video_url', clip(4.2), '--image_urls', image(), '--seed', '54321', '--resolution', '720p');
  assert.match(edit.prepared.stdout, /Estimacion: ~46 cr/);
  assert.equal(bank.reservationFor(edit.manifest), 46, edit.submitted.stderr + edit.submitted.stdout);
  const editInput = lastTask().input;
  assert.equal(editInput.video_list.length, 1);
  assert.equal(editInput.seeds, 54321);
  assert.equal('duration' in editInput, false);
  assert.equal('mode' in editInput, false);

  // Un máximo por debajo de la reserva: 402 con la cifra del servidor y sin llegar a Kie.
  const forced = await bank.cliForced('prepare', GEN, '--prompt', P, '--resolution', '4k', '--duration', '15');
  const refused = await bank.cliForced('submit', manifestOf(forced.stdout), '--confirmed');
  assert.notEqual(refused.code, 0);
  assert.match(refused.stderr + refused.stdout, /La estimacion de 337 creditos supera el maximo autorizado de 1/);

  // Voice ID y Character ID: gratis, sin reserva, con el ID guardado en un archivo de texto.
  const saved = (stdout) => fs.readFileSync(/Guardado: (.+) \(texto\)/.exec(stdout)[1], 'utf8');
  const voice = await send(AUDIO, '--name', 'Voz Clara', '--audio_id', 'Kore', '--voice_description', 'Cálida y pausada');
  assert.match(voice.prepared.stdout, /Estimacion: ~0 cr/);
  assert.equal(voice.submitted.code, 0, voice.submitted.stderr + voice.submitted.stdout);
  assert.match(saved(voice.submitted.stdout), /^Voice ID: voice_mock_1\nNombre: Voz Clara\nVoz base: Kore\n/);
  assert.equal(bank.reservationFor(voice.manifest), null);
  const portrait = image('retrato.png');
  const character = await send(CHARACTER, '--portrait_url', portrait, '--body_url', image('cuerpo.png'), '--descriptions', 'Clara, 30 años', '--character_name', 'Clara', '--audio_ids', 'voice_mock_1');
  assert.equal(character.submitted.code, 0, character.submitted.stderr + character.submitted.stdout);
  assert.match(saved(character.submitted.stdout), /^Character ID: char_mock_2\n/);
  assert.deepEqual(kie.resources.at(-1).body.audio_ids, ['voice_mock_1']);
  assert.equal(kie.resources.at(-1).body.image_urls.length, 2);
  const foreignVoice = await send(CHARACTER, '--portrait_url', portrait, '--descriptions', 'x', '--audio_ids', 'voice_ajena');
  assert.notEqual(foreignVoice.submitted.code, 0);
  assert.match(foreignVoice.submitted.stderr + foreignVoice.submitted.stdout, /no se creó con tu cuenta de AILAB/);

  // El Character ID propio vale en referencias; uno ajeno se rechaza antes de reservar.
  const ref = await send(GEN, '--mode', 'reference', '--prompt', P, '--character_ids', 'char_mock_2', '--aspect_ratio', 'auto');
  assert.equal(bank.reservationFor(ref.manifest), 74);
  assert.deepEqual(lastTask().input.character_ids, ['char_mock_2']);
  assert.equal(lastTask().input.aspect_ratio, 'auto');
  const foreign = await send(GEN, '--mode', 'reference', '--prompt', P, '--character_ids', 'char_ajeno');
  assert.equal(foreign.reached, false);
  assert.match(foreign.submitted.stderr + foreign.submitted.stdout, /El Character ID char_ajeno no se creó con tu cuenta de AILAB/);
  assert.equal(bank.reservationFor(foreign.manifest), null);

  // Extend: vídeos 1.2 terminados de la cuenta. Solo se listan los de 360p o 720p y de 15 s o menos.
  const seed = (taskId, resolution, seconds) => bank.php(`
    require_once dirname((new ReflectionFunction('wallet_db'))->getFileName()) . '/omni-12.php';
    $db = wallet_db(); omni12_schema($db); $now = wallet_now(); $taskId = ${JSON.stringify(taskId)};
    $db->prepare("INSERT INTO submission_intents(user_id,client_request_id,payload_hash,state,task_id,model,driver,max_credits_authorized,created_at,updated_at) VALUES(2,?,?,'submitted',?,'gemini-omni-flash-1-2','jobs-v1',100,?,?)")
       ->execute([bin2hex(random_bytes(16)), str_repeat('a', 64), $taskId, $now, $now]);
    $intent = (int)$db->lastInsertId();
    wallet_task_create($taskId, 2, 'google/gemini-omni-flash-1-2', '/jobs/createTask', 100, null);
    $db->prepare("UPDATE tasks SET state='success', result_url=? WHERE task_id=?")->execute(['https://cdn.example.test/' . $taskId . '.mp4', $taskId]);
    omni12_record($db, $intent, 2, 'generate', ${JSON.stringify(resolution)}, ${seconds}, '16:9', null);
    omni12_link($db, $intent, $taskId);`);
  seed('omni-720', '720p', 8);
  seed('omni-360', '360p', 11);
  seed('omni-1080', '1080p', 5);
  seed('omni-16', '720p', 16);
  const listed = await bank.cli('omni12-videos');
  assert.equal(listed.code, 0, listed.stderr);
  assert.match(listed.stdout, /task_id: omni-720\n {2}Generado · 720p · 8 s · formato: 16:9[^\n]*\n {2}Precio de Extend: \+3 s 28 cr[^\n]*\+10 s 92 cr/);
  assert.match(listed.stdout, /task_id: omni-360\n[^\n]*\n {2}Precio de Extend: \+3 s 13 cr[^\n]*\+10 s 41 cr/);
  assert.doesNotMatch(listed.stdout, /omni-1080|omni-16/);

  const extended = await send(EXTEND, '--task_id', 'omni-720', '--prompt', 'La cámara sigue avanzando', '--duration', '3');
  assert.match(extended.prepared.stdout, /coste cotizado 28 cr/);
  assert.equal(bank.reservationFor(extended.manifest), 28);
  assert.deepEqual(lastTask(), { model: 'google/gemini-omni-flash-1-2-extend', input: { task_id: 'omni-720', prompt: 'La cámara sigue avanzando', duration: 3 } });
  const extendForced = await bank.cliForced('prepare', EXTEND, '--task_id', 'omni-360', '--prompt', P, '--duration', '10');
  assert.match(extendForced.stdout, /coste cotizado 41 cr/);
  const extendRefused = await bank.cliForced('submit', manifestOf(extendForced.stdout), '--confirmed');
  assert.match(extendRefused.stderr + extendRefused.stdout, /La estimacion de 41 creditos supera el maximo autorizado de 1/);
  for (const id of ['omni-1080', 'omni-16', 'no-existe']) {
    const missing = await bank.cli('prepare', EXTEND, '--task_id', id, '--prompt', P, '--duration', '3');
    assert.notEqual(missing.code, 0, id);
    assert.match(missing.stderr, /no aparece entre los que puedes extender[^]*No se ha cobrado nada/, id);
  }
});

test('guide, referencia y SKILL.md explican el flujo, sin guion largo', () => {
  const guide = guideText({ version: '2.3.19', run: (sub) => sub });
  for (const text of ['gemini-omni-flash-1-2', 'omni12-videos', EXTEND, CHARACTER, AUDIO, '--character_ids']) assert.ok(guide.includes(text), text);
  const reference = fs.readFileSync(path.join(root, 'skills/ailab/references/gemini-omni-12.md'), 'utf8');
  const skill = fs.readFileSync(path.join(root, 'skills/ailab/SKILL.md'), 'utf8');
  assert.match(skill, /references\/gemini-omni-12\.md/);
  assert.ok(reference.split('\n').length < 80, 'referencia breve');
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf8')).skills.find((entry) => entry.id === 'ailab');
  assert.equal(registry.guide_references.includes('references/gemini-omni-12.md'), false, 'el detalle queda fuera del presupuesto de la guía');
  for (const text of [guide, reference, skill, fs.readFileSync(path.join(root, 'skills/ailab/scripts/lib/omni12.mjs'), 'utf8')]) assert.equal(text.includes(String.fromCharCode(0x2014)), false);
});
