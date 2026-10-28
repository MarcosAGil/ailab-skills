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

// Kling 4.0 vía Kie (contrato leído el 22/10/2026). La CLI traduce un contrato de parámetros planos
// (ranuras de sujetos y voces) a la entrada exacta que normaliza el servidor, y presupuesta al menos lo
// que el servidor reserva. Con AILAB_CANONICAL_REPO las comparaciones se hacen contra el PHP real
// (gateway_kling4_input, gateway_estimate_credits) con metadatos simulados: sin red ni gasto.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-kling4-skill-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const { kling4Credits, kling4MentionError, phpRound } = await import('../skills/ailab/scripts/lib/kling4.mjs');
const { buildPayload } = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const model = { id: 'kling-4-0', ...catalog.models['kling-4-0'] };
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));

// Pasos de la CLI: validar, presupuestar y construir el cuerpo con las URLs de subida simuladas.
function plan(given) {
  const v = validateParams(model, given);
  if (!v.ok) return { ok: false, errors: v.errors };
  const estimate = estimateCredits(model, { ...v.params, ...v.fileParams });
  const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => media.url(file))]));
  const payload = buildPayload(model, v.params, uploaded);
  const meta = {};
  for (const files of Object.values(v.fileParams)) for (const file of files) meta[media.url(file)] = media.meta[file];
  return { ok: true, v, estimate, payload, meta };
}

const TENTHS = { plain: { '720p': 285, '1080p': 425 }, video: { '720p': 170, '1080p': 255 } };
// Referencia independiente de la fórmula de Kie (cr Kie x 1,02, redondeada al crédito superior).
const reference = (resolution, output, input) => {
  const billed = input <= 0 ? output : (input <= output ? 2 * output : input + output);
  return Math.ceil(Number((TENTHS[input > 0 ? 'video' : 'plain'][resolution] * billed * 1.02 / 10).toFixed(6)));
};

test('el contrato publicado exige la skill 2.3.13, no expone proveedor y las CLI anteriores lo ignoran', async () => {
  assert.equal(model.min_cli_version, '2.3.13');
  assert.equal(catalog.min_cli_version, '2.3.7', 'el resto del catálogo sigue disponible para las CLI 2.3.7 a 2.3.12');
  assert.equal(model.driver, 'jobs-v1');
  assert.equal(model.enabled, true);
  assert.deepEqual(model.modes, ['ref', 'keyframe']);
  assert.equal(model.params.prompt.max_len, 8000);
  assert.deepEqual([model.params.duration.min, model.params.duration.max, model.params.duration.default], [3, 30, 5]);
  assert.deepEqual(model.params.resolution.values, ['720p', '1080p']);
  assert.deepEqual(model.params.aspect_ratio.values, ['auto', '16:9', '9:16', '1:1', '21:9']);
  assert.equal(model.params.image_urls.max, 10);
  assert.equal(model.params.video_urls.max, 5);
  assert.equal(model.params.keyframe_urls.max, 8);
  for (let n = 1; n <= 7; n += 1) {
    assert.equal(model.params[`subject_${n}_images`].min, 2);
    assert.equal(model.params[`subject_${n}_images`].max, 4);
    assert.equal(model.params[`subject_${n}_name`].max_len, 20);
    assert.equal(model.params[`subject_${n}_description`].max_len, 100);
  }
  assert.equal(model.params.subject_8_name, undefined);
  for (let n = 1; n <= 3; n += 1) assert.equal(model.params[`voice_${n}_audio`].accept, 'audio');
  assert.equal(model.params.voice_4_name, undefined);
  assert.equal(model.estimate.kind, 'per_second_table', 'la forma del estimate la conocen todas las CLI 2.3.x');
  assert.deepEqual(model.estimate.credits_per_second, { '720p': 29.07, '1080p': 43.35 });
  assert.deepEqual(model.estimate.credits_with_video, { '720p': 17.34, '1080p': 26.01 });
  const text = JSON.stringify(model);
  for (const forbidden of ['kling-4.0/', 'provider_contract', 'callBackUrl', 'KIE', 'api.kie']) assert.equal(text.includes(forbidden), false, forbidden);
  assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  assert.equal(modelUsable(model).ok, true);
  assert.equal(modelUsable({ ...model, min_cli_version: '2.3.15' }).ok, false);
  if (!CANONICAL) return;
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12']) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    assert.equal(old.modelUsable(parsed.models['kling-4-0']).ok, false, 'la CLI ' + version + ' no debe ofrecer un modelo que no sabe ejecutar');
  }
});

test('sin vídeos de entrada, 2 resoluciones y 28 duraciones dan el precio por segundo exacto', () => {
  let checked = 0;
  for (const resolution of ['720p', '1080p']) for (let duration = 3; duration <= 30; duration += 1) {
    const result = plan({ prompt: 'Plano cenital de una taza', duration, resolution });
    assert.equal(result.ok, true, result.errors?.join('\n'));
    assert.equal(result.estimate.credits, reference(resolution, duration, 0), `${resolution} ${duration}`);
    assert.equal(result.estimate.credits, kling4Credits(resolution, duration, 0));
    assert.equal(result.estimate.approximate, false);
    checked += 1;
  }
  assert.equal(checked, 56);
  assert.equal(plan({ prompt: 'x', duration: 5 }).estimate.credits, 146, 'ejemplo del informe: 5 s a 720p');
  assert.equal(plan({ prompt: 'x', duration: 30, resolution: '1080p' }).estimate.credits, 1301);
});

test('con vídeos de entrada se factura 2 x salida o entrada + salida, cada vídeo al segundo superior', () => {
  const clip = (name, seconds, brand) => media.video(name, seconds, brand);
  // Entrada <= salida: se facturan 2 x salida a la tarifa con vídeo.
  const small = plan({ prompt: 'Mira @video_1', duration: 10, video_urls: [clip('v7_5.mp4', 7.5)] });
  assert.equal(small.ok, true, small.errors?.join('\n'));
  assert.equal(small.estimate.credits, reference('720p', 10, 8));
  assert.equal(small.estimate.credits, 347);
  assert.equal(small.estimate.approximate, true);
  assert.match(small.estimate.note, /10 s de salida \+ 8 s de vídeo de entrada: se factura 20 s/);
  // Entrada > salida: entrada + salida.
  const large = plan({ prompt: 'Mira @video_1 y @video_2', duration: 10, resolution: '1080p', video_urls: [clip('v6.mp4', 6), clip('v5_2.mov', 5.2, 'qt')] });
  assert.equal(large.estimate.credits, reference('1080p', 10, 12));
  assert.equal(large.estimate.credits, 573);
  // Los sujetos, las voces y las imágenes no suman segundos: tarifa sin vídeo.
  const people = plan({ prompt: '@ana habla con @voz', duration: 5, subject_1_name: 'ana', subject_1_images: [media.image('a1.png', 800, 800), media.image('a2.png', 800, 1000)],
    voice_1_name: 'voz', voice_1_audio: media.wavAudio('voz.wav', 4) });
  assert.equal(people.estimate.credits, 146);
  assert.equal(people.estimate.approximate, false);
  assert.equal(plan({ prompt: 'x', duration: 5, mode: 'keyframe', first_frame_url: media.image('k1.png') }).estimate.credits, 146);
});

test('límites de la CLI: modalidades, materiales, sujetos, voces y menciones', () => {
  const ok = { prompt: 'Mira @image_1', image_urls: [media.image('base.png')] };
  assert.equal(plan(ok).ok, true);
  const two = [media.image('s1.png', 600, 600), media.image('s2.png', 600, 800)];
  const cases = [
    ['prompt vacío', { prompt: '   ' }, /prompt no puede estar vacío/],
    ['prompt de 8.001 caracteres', { prompt: 'a'.repeat(8001) }, /entre 1 y 8\.000 caracteres/],
    ['duración 2', { prompt: 'x', duration: 2 }, /minimo 3/],
    ['duración 31', { prompt: 'x', duration: 31 }, /maximo 30/],
    ['proporción inválida', { prompt: 'x', aspect_ratio: '4:3' }, /debe ser uno de/],
    ['imagen pequeña', { prompt: 'Mira @image_1', image_urls: [media.image('chica.png', 299, 400)] }, /al menos 300 px por lado/],
    ['imagen muy apaisada', { prompt: 'Mira @image_1', image_urls: [media.image('ancha.png', 1200, 400)] }, /proporción entre 0,4 y 2,5/],
    ['más de 10 imágenes', { prompt: 'x', image_urls: Array.from({ length: 11 }, (_, i) => media.image(`m${i}.png`)) }, /como mucho 10/],
    ['vídeo de 1,9 s', { prompt: 'Mira @video_1', video_urls: [media.video('c19.mp4', 1.9)] }, /entre 2 y 30 segundos/],
    ['vídeo de 31 s', { prompt: 'Mira @video_1', video_urls: [media.video('c31.mp4', 31)] }, /entre 2 y 30 segundos/],
    ['vídeos que suman 30,5 s', { prompt: 'Mira @video_1', video_urls: [media.video('d15.mp4', 15), media.video('d15b.mp4', 15.5)] }, /sumar más de 30 segundos/],
    ['más de 5 vídeos', { prompt: 'x', video_urls: Array.from({ length: 6 }, (_, i) => media.video(`n${i}.mp4`, 3)) }, /como mucho 5/],
    ['WebM', { prompt: 'Mira @video_1', video_urls: [media.put('clip.webm', Buffer.concat([Buffer.from('1a45dfa3', 'hex'), Buffer.alloc(64)]), { mime: 'video/webm', duration: 5 })] }, /MP4 o MOV medible/],
    ['sonido original sin vídeos', { prompt: 'x', keep_original_sound: 'true' }, /solo tiene efecto con vídeos/],
    ['mención huérfana', { prompt: 'Mira @image_9' }, /menciona @image_9/],
    ['mención de vídeo sin vídeo', { prompt: 'Mira @video_1' }, /menciona @video_1/],
    ['mención de un prefijo', { ...ok, prompt: 'Mira @image_10' }, /menciona @image_10/],
    ['sujeto sin imágenes', { prompt: 'x', subject_1_name: 'ana' }, /Falta --subject_1_images/],
    ['sujeto sin nombre', { prompt: 'x', subject_1_images: two }, /Falta --subject_1_name/],
    ['sujeto con una imagen', { prompt: '@ana', subject_1_name: 'ana', subject_1_images: [two[0]] }, /necesitas? al menos 2|necesita entre 2 y 4/],
    ['sujeto con 5 imágenes', { prompt: '@ana', subject_1_name: 'ana', subject_1_images: Array.from({ length: 5 }, (_, i) => media.image(`q${i}.png`)) }, /como mucho 4/],
    ['nombre con tilde', { prompt: 'x', subject_1_name: 'María', subject_1_images: two }, /sin tildes/],
    ['nombre reservado', { prompt: '@image_3', subject_1_name: 'image_3', subject_1_images: two }, /nombre reservado/],
    ['nombre duplicado entre sujeto y voz', { prompt: '@ana', subject_1_name: 'ana', subject_1_images: two, voice_1_name: 'ANA', voice_1_audio: media.wavAudio('v2.wav', 3) }, /Ya hay un sujeto o una voz llamado @ANA/],
    ['voz de 61 s', { prompt: '@v', voice_1_name: 'v', voice_1_audio: media.wavAudio('largo.wav', 61) }, /entre 1 y 60 segundos/],
    ['voz de 0,5 s', { prompt: '@v', voice_1_name: 'v', voice_1_audio: media.wavAudio('corto.wav', 0.5) }, /entre 1 y 60 segundos/],
    ['voz sin audio', { prompt: 'x', voice_1_name: 'v' }, /Falta --voice_1_audio/],
    ['descripción de 101 caracteres', { prompt: '@ana', subject_1_name: 'ana', subject_1_images: two, subject_1_description: 'd'.repeat(101) }, /supera 100|hasta 100 caracteres/],
    ['categoría inválida', { prompt: '@ana', subject_1_name: 'ana', subject_1_images: two, subject_1_tag: 'persona' }, /debe ser uno de/],
    ['más de 15 materiales', {
      prompt: 'x',
      image_urls: Array.from({ length: 10 }, (_, i) => media.image(`r${i}.png`)),
      video_urls: Array.from({ length: 3 }, (_, i) => media.video(`s${i}.mp4`, 3)),
      subject_1_name: 'ana', subject_1_images: two, subject_2_name: 'luis', subject_2_images: two, subject_3_name: 'eva', subject_3_images: two,
    }, /hasta 15 materiales/],
    ['fotogramas en ref', { prompt: 'x', first_frame_url: media.image('ff.png') }, /solo existen en --mode keyframe/],
    ['keyframe sin primer fotograma', { mode: 'keyframe', prompt: 'x' }, /first_frame_url/],
    ['keyframe con imágenes', { mode: 'keyframe', prompt: 'x', first_frame_url: media.image('k.png'), image_urls: [media.image('k2.png')] }, /no admite imágenes, vídeos/],
    ['keyframe con proporción', { mode: 'keyframe', prompt: 'x', first_frame_url: media.image('k3.png'), aspect_ratio: '16:9' }, /lo marca el primer fotograma/],
    ['keyframe con sonido original', { mode: 'keyframe', prompt: 'x', first_frame_url: media.image('k4.png'), keep_original_sound: 'false' }, /no admite imágenes, vídeos/],
    ['keyframe con demasiados fotogramas', { mode: 'keyframe', prompt: 'x', duration: 3, first_frame_url: media.image('k5.png'),
      keyframe_urls: [media.image('k6.png'), media.image('k7.png'), media.image('k8.png')], last_frame_url: media.image('k9.png') }, /caben como máximo 4 fotogramas/],
    ['keyframe con mención de ref', { mode: 'keyframe', prompt: 've a @image_1', first_frame_url: media.image('k10.png') }, /menciona @image_1/],
  ];
  for (const [name, given, message] of cases) {
    const result = plan(given);
    assert.equal(result.ok, false, name);
    assert.match(result.errors.join('\n'), message, name);
  }
  // Valores que el servidor acepta en el límite.
  assert.equal(plan({ prompt: 'x', duration: 3 }).ok, true);
  assert.equal(plan({ prompt: 'a'.repeat(8000) }).ok, true);
  assert.equal(plan({ prompt: '😀'.repeat(8000) }).ok, true, 'los caracteres se cuentan como puntos de código, igual que el servidor');
  assert.equal(plan({ prompt: 'x', video_urls: [media.video('e2.mp4', 2)] }).ok, true);
  assert.equal(plan({ prompt: 'x', video_urls: [media.video('e15a.mp4', 15), media.video('e15b.mp4', 15)] }).ok, true);
  assert.equal(plan({ mode: 'keyframe', prompt: 'x', duration: 9, first_frame_url: media.image('kk1.png'),
    keyframe_urls: Array.from({ length: 8 }, (_, i) => media.image(`kk${i + 2}.png`)), last_frame_url: media.image('kk10.png') }).ok, true, '10 fotogramas desde 9 s');
});

test('las menciones se resuelven igual que en el servidor', () => {
  const names = ['image_1', 'image_2', 'video_1', 'lucia', 'voz_lucia'];
  const ok = ['Hola @image_1', '@Lucia saluda y dice con @voz_lucia: hola', 'Correo a@image_1.com', 'Sin menciones', '@IMAGE_2, @Video_1.', 'Fin @lucia'];
  for (const prompt of ok) assert.equal(kling4MentionError(prompt, names), null, prompt);
  const bad = ['@image_10', '@luciaX', '@voz', '@', 'Mira @nadie y @image_1', '@image_1x'];
  for (const prompt of bad) assert.match(kling4MentionError(prompt, names), /ese material no está en la petición/, prompt);
  assert.match(kling4MentionError('@x', ['a', 'b']), /Menciones disponibles: @a, @b\./);
  assert.match(kling4MentionError('@x', ['a', 'b', 'c', 'd', 'e', 'f', 'g']), /@a, @b, @c, @d, @e, @f, …\./);
  assert.equal(phpRound(1.005, 2), 1.01);
  assert.equal(phpRound(1.995, 2), 2);
  assert.equal(phpRound(5.004, 2), 5);
});

test('el payload es exactamente la entrada que normaliza el servidor, por modalidad', () => {
  const a = [media.image('pa1.png', 800, 800), media.image('pa2.png', 800, 1000)];
  const text = plan({ prompt: '  Un zorro  ', duration: 6 });
  assert.deepEqual(text.payload, { model: 'kling-4-0', input: { mode: 'ref', prompt: 'Un zorro', duration: 6, resolution: '720p' } });
  const refs = plan({ prompt: 'La @image_1 con @ana y @voz', duration: 8, resolution: '1080p', aspect_ratio: '9:16',
    image_urls: [media.image('pi1.png')], subject_1_name: 'ana', subject_1_images: a, subject_1_tag: 'character', subject_1_description: ' Chaqueta roja ',
    voice_1_name: 'voz', voice_1_audio: media.mp3Audio('pv.mp3', 5) });
  assert.equal(refs.ok, true, refs.errors?.join('\n'));
  assert.deepEqual(refs.payload.input, {
    mode: 'ref', prompt: 'La @image_1 con @ana y @voz', duration: 8, resolution: '1080p', aspect_ratio: '9:16',
    image_urls: [media.url(media.image('pi1.png'))],
    elements: [{ name: 'ana', image_urls: a.map((file) => media.url(file)), tag: 'character', description: 'Chaqueta roja' }],
    voices: [{ name: 'voz', audio_url: media.url(media.mp3Audio('pv.mp3', 5)) }],
  });
  // Con vídeos viaja keep_original_sound; sin vídeos nunca. Con "auto" y sin materiales no hay proporción.
  const withVideo = plan({ prompt: 'x', video_urls: [media.video('pvv.mp4', 4)], keep_original_sound: 'true' });
  assert.equal(withVideo.payload.input.keep_original_sound, true);
  assert.equal(withVideo.payload.input.aspect_ratio, 'auto');
  assert.equal('keep_original_sound' in plan({ prompt: 'x', image_urls: [media.image('pnv.png')] }).payload.input, false);
  assert.equal('aspect_ratio' in text.payload.input, false);
  // Sujetos en el orden de las ranuras, no de la línea de comandos.
  const ordered = plan({ prompt: '@b y @a', subject_3_name: 'a', subject_3_images: a, subject_1_name: 'b', subject_1_images: a });
  assert.deepEqual(ordered.payload.input.elements.map((element) => element.name), ['b', 'a']);
  // Fotogramas clave: sin proporción ni sonido, aunque la CLI rellene sus valores por defecto.
  const frames = plan({ mode: 'keyframe', prompt: 'De @first_frame a @keyframe_1 y @last_frame', duration: 6,
    first_frame_url: media.image('pf1.png'), keyframe_urls: [media.image('pf2.png')], last_frame_url: media.image('pf3.png', 300, 300) });
  assert.equal(frames.ok, true, frames.errors?.join('\n'));
  assert.deepEqual(frames.payload.input, {
    mode: 'keyframe', prompt: 'De @first_frame a @keyframe_1 y @last_frame', duration: 6, resolution: '720p',
    first_frame_url: media.url(media.image('pf1.png')), keyframe_urls: [media.url(media.image('pf2.png'))], last_frame_url: media.url(media.image('pf3.png', 300, 300)),
  });
  assert.equal('aspect_ratio' in frames.v.params, false);
  assert.equal('keep_original_sound' in frames.v.params, false);
  for (const key of ['callBackUrl', 'nsfw_checker', '_billing_input_seconds', 'billing_duration', 'seed']) assert.equal(JSON.stringify(refs.payload).includes(key), false, key);
});

// Casos válidos para el PHP real. Cada uno lleva su propia entrada de CLI.
function validCases() {
  const img = (name, w = 1024, h = 768) => media.image(name, w, h);
  const people = (prefix) => [img(prefix + '1.png', 900, 900), img(prefix + '2.png', 700, 1000)];
  const list = [
    ['texto 5 s', { prompt: 'Un zorro cruza el bosque' }],
    ['texto 30 s a 1080p', { prompt: 'Larga', duration: 30, resolution: '1080p' }],
    ['texto con proporción', { prompt: 'Vertical', aspect_ratio: '9:16', duration: 7 }],
    ['una imagen', { prompt: 'Mira @image_1', image_urls: [img('v1.png')] }],
    ['diez imágenes', { prompt: 'Todas: @image_1 @image_10', image_urls: Array.from({ length: 10 }, (_, i) => img(`vi${i}.png`)) }],
    ['imagen mínima', { prompt: 'Mira @image_1', image_urls: [img('vmin.png', 300, 300)] }],
    ['imagen en el límite de proporción', { prompt: 'Mira @image_1', image_urls: [img('vr1.png', 1000, 400), img('vr2.png', 400, 1000)] }],
    ['un vídeo 7,5 s', { prompt: 'Mira @video_1', duration: 10, video_urls: [media.video('vv75.mp4', 7.5)] }],
    ['un vídeo 2 s', { prompt: 'Mira @video_1', video_urls: [media.video('vv2.mp4', 2)] }],
    ['vídeo con milésimas 5,004 s', { prompt: 'Mira @video_1', video_urls: [media.video('vv5004.mp4', 5.004)] }],
    ['vídeo 1,995 s (redondea a 2)', { prompt: 'Mira @video_1', video_urls: [media.video('vv1995.mp4', 1.995)] }],
    ['vídeo 4,995 s', { prompt: 'Mira @video_1', video_urls: [media.video('vv4995.mp4', 4.995)] }],
    ['dos vídeos mov y mp4', { prompt: '@video_1 @video_2', duration: 12, resolution: '1080p', video_urls: [media.video('vvq.mov', 6.2, 'qt'), media.video('vvm.mp4', 3.3)] }],
    ['vídeos que suman 30 s', { prompt: '@video_1 @video_2', duration: 20, video_urls: [media.video('vv15a.mp4', 15), media.video('vv15b.mp4', 15)] }],
    ['cinco vídeos', { prompt: '@video_5', duration: 15, video_urls: Array.from({ length: 5 }, (_, i) => media.video(`vm${i}.mp4`, 2 + i)) }],
    ['sonido original', { prompt: 'Mira @video_1', video_urls: [media.video('vvs.mp4', 4)], keep_original_sound: 'true' }],
    ['un sujeto con etiqueta y descripción', { prompt: '@Lucia camina', subject_1_name: 'Lucia', subject_1_images: people('vs'), subject_1_tag: 'character', subject_1_description: 'Chaqueta roja' }],
    ['sujeto de cuatro imágenes', { prompt: '@x', subject_1_name: 'x', subject_1_images: Array.from({ length: 4 }, (_, i) => img(`vs4${i}.png`, 500, 500)) }],
    ['sujeto con nombre chino', { prompt: '@小猫 corre', subject_1_name: '小猫', subject_1_images: people('vc') }],
    ['siete sujetos', { prompt: '@s1 @s2 @s3 @s4 @s5 @s6 @s7', ...Object.fromEntries(Array.from({ length: 7 }, (_, i) => [[`subject_${i + 1}_name`, `s${i + 1}`], [`subject_${i + 1}_images`, people(`v7${i}`)]]).flat()) }],
    ['tres voces mp3 y wav', { prompt: '@a @b @c', voice_1_name: 'a', voice_1_audio: media.mp3Audio('vva.mp3', 3), voice_2_name: 'b', voice_2_audio: media.wavAudio('vvb.wav', 60), voice_3_name: 'c', voice_3_audio: media.wavAudio('vvc.wav', 1) }],
    ['sujeto y voz', { prompt: '@ana dice con @voz_ana: hola', subject_1_name: 'ana', subject_1_images: people('vsv'), voice_1_name: 'voz_ana', voice_1_audio: media.wavAudio('vsv.wav', 5) }],
    ['quince materiales', {
      prompt: 'x',
      image_urls: Array.from({ length: 5 }, (_, i) => img(`v15i${i}.png`)),
      video_urls: Array.from({ length: 3 }, (_, i) => media.video(`v15v${i}.mp4`, 4)),
      subject_1_name: 'a1', subject_1_images: people('v15a'), subject_2_name: 'a2', subject_2_images: people('v15b'), subject_3_name: 'a3', subject_3_images: people('v15c'), subject_4_name: 'a4', subject_4_images: people('v15d'),
      voice_1_name: 'b1', voice_1_audio: media.wavAudio('v15e.wav', 2), voice_2_name: 'b2', voice_2_audio: media.wavAudio('v15f.wav', 2),
    }],
    ['keyframe solo primer fotograma', { mode: 'keyframe', prompt: 'Empieza en @first_frame', first_frame_url: img('vk1.png') }],
    ['keyframe completo', { mode: 'keyframe', prompt: '@first_frame, @keyframe_1, @keyframe_2, @last_frame', duration: 6, resolution: '1080p',
      first_frame_url: img('vk2.png'), keyframe_urls: [img('vk3.png', 200, 200), img('vk4.png')], last_frame_url: img('vk5.png') }],
    ['keyframe en el tope de 3 s', { mode: 'keyframe', prompt: 'x', duration: 3, first_frame_url: img('vk6.png'), keyframe_urls: [img('vk7.png'), img('vk8.png')] }],
    ['keyframe diez fotogramas', { mode: 'keyframe', prompt: 'x', duration: 12, first_frame_url: img('vk9.png'), keyframe_urls: Array.from({ length: 8 }, (_, i) => img(`vka${i}.png`)), last_frame_url: img('vkb.png') }],
  ];
  return list;
}

const SLUG = "$mode === 'keyframe' ? 'kling-4.0/keyframe-to-video' : 'kling-4.0/reference-to-video'";
const PHP_BACKEND = `
  $cases = json_decode($argv[1], true); $out = [];
  foreach ($cases as $case) {
    $meta = $case['meta'] ?? [];
    $inspect = static fn($url, $kind) => $meta[$url] ?? null;
    try {
      $r = gateway_kling4_input($case['input'], 1, $inspect);
      $n = $r['input']; $mode = $n['mode']; unset($n['mode']);
      $n['_billing_input_seconds'] = $r['billing_input_seconds'];
      $out[] = ['ok' => true, 'input' => $r['input'], 'seconds' => $r['billing_input_seconds'],
        'credits' => gateway_estimate_credits(${SLUG}, $n)];
    } catch (Throwable $e) { $out[] = ['ok' => false, 'error' => $e->getMessage()]; }
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);`;

test('paridad con el PHP real: el servidor acepta lo que envía la CLI, lo devuelve idéntico y reserva lo mismo', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const cases = validCases().map(([name, given]) => ({ name, ...plan(given) }));
  for (const c of cases) assert.equal(c.ok, true, `${c.name}: ${c.errors?.join(' ')}`);
  const results = php(PHP_BACKEND, [JSON.stringify(cases.map((c) => ({ input: c.payload.input, meta: c.meta })))]);
  assert.equal(results.length, cases.length);
  cases.forEach((c, index) => {
    const server = results[index];
    assert.equal(server.ok, true, `${c.name}: ${server.error}`);
    assert.deepEqual(server.input, c.payload.input, `${c.name}: la entrada normalizada del servidor debe ser la de la CLI`);
    // El máximo autorizado por la CLI nunca puede ser menor que la reserva del servidor, y aquí son iguales.
    assert.ok(c.estimate.credits >= server.credits, `${c.name}: la CLI autoriza ${c.estimate.credits} y el servidor reserva ${server.credits}`);
    assert.equal(c.estimate.credits, server.credits, c.name);
  });
  assert.ok(cases.length >= 27);
});

test('paridad con el PHP real: lo que la CLI rechaza en local el servidor también lo rechaza, con el mismo texto en las menciones', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  // Se construye la entrada tal como la formaría una CLI sin validación local y se comprueba el servidor.
  const img = (name, w = 1024, h = 768) => media.image(name, w, h);
  const url = (file) => media.url(file);
  const two = [img('i1.png', 600, 600), img('i2.png', 600, 800)];
  const raw = (input, files = []) => ({ input: { mode: 'ref', prompt: 'x', duration: 5, resolution: '720p', ...input }, meta: Object.fromEntries(files.map((file) => [url(file), media.meta[file]])) });
  const small = img('pq1.png', 299, 400);
  const wide = img('pq2.png', 1200, 400);
  const short = media.video('pq3.mp4', 1.9);
  const long = media.video('pq4.mp4', 31);
  const a15 = media.video('pq5.mp4', 15);
  const b155 = media.video('pq6.mp4', 15.5);
  const voiceLong = media.wavAudio('pq7.wav', 61);
  const voiceShort = media.wavAudio('pq8.wav', 0.5);
  const rejected = [
    ['prompt vacío', raw({ prompt: '' })],
    ['prompt largo', raw({ prompt: 'a'.repeat(8001) })],
    ['duración 31', raw({ duration: 31 })],
    ['imagen pequeña', raw({ prompt: '@image_1', image_urls: [url(small)] }, [small])],
    ['imagen apaisada', raw({ prompt: '@image_1', image_urls: [url(wide)] }, [wide])],
    ['vídeo 1,9 s', raw({ prompt: '@video_1', video_urls: [url(short)], keep_original_sound: false }, [short])],
    ['vídeo 31 s', raw({ prompt: '@video_1', video_urls: [url(long)], keep_original_sound: false }, [long])],
    ['vídeos 30,5 s', raw({ prompt: '@video_1', video_urls: [url(a15), url(b155)], keep_original_sound: false }, [a15, b155])],
    ['sonido sin vídeos', raw({ keep_original_sound: true })],
    ['mención huérfana', raw({ prompt: 'Mira @image_9' })],
    ['sujeto con una imagen', raw({ prompt: '@ana', elements: [{ name: 'ana', image_urls: [url(two[0])] }] }, two)],
    ['nombre reservado', raw({ prompt: '@image_3', elements: [{ name: 'image_3', image_urls: two.map(url) }] }, two)],
    ['nombre con tilde', raw({ prompt: 'x', elements: [{ name: 'María', image_urls: two.map(url) }] }, two)],
    ['duplicado', raw({ prompt: '@ana', elements: [{ name: 'ana', image_urls: two.map(url) }], voices: [{ name: 'ANA', audio_url: url(media.wavAudio('pq9.wav', 3)) }] }, [...two, media.wavAudio('pq9.wav', 3)])],
    ['voz de 61 s', raw({ prompt: '@v', voices: [{ name: 'v', audio_url: url(voiceLong) }] }, [voiceLong])],
    ['voz de 0,5 s', raw({ prompt: '@v', voices: [{ name: 'v', audio_url: url(voiceShort) }] }, [voiceShort])],
    ['keyframe con proporción', raw({ mode: 'keyframe', first_frame_url: url(two[0]), aspect_ratio: '16:9' }, [two[0]])],
    ['keyframe sin fotograma', raw({ mode: 'keyframe' })],
    ['keyframe con sujetos', raw({ mode: 'keyframe', first_frame_url: url(two[0]), elements: [] }, [two[0]])],
    ['demasiados fotogramas', raw({ mode: 'keyframe', duration: 3, first_frame_url: url(two[0]), keyframe_urls: [url(two[1]), url(two[1]), url(two[1])], last_frame_url: url(two[1]) }, two)],
  ];
  const results = php(PHP_BACKEND, [JSON.stringify(rejected.map(([, c]) => c))]);
  rejected.forEach(([name], index) => assert.equal(results[index].ok, false, `${name}: el servidor debía rechazarlo`));
  // Menciones: el texto de la CLI y el del servidor son el mismo.
  const prompts = ['Mira @image_9', '@image_10', '@luciaX', '@', 'Hola @nadie y @image_1', '@image_1x', '@image_1, @IMAGE_2'];
  const names = ['image_1', 'image_2'];
  const files = [img('pm1.png'), img('pm2.png')];
  const mentionCases = prompts.map((prompt) => raw({ prompt, image_urls: files.map(url) }, files));
  const mentionResults = php(PHP_BACKEND, [JSON.stringify(mentionCases)]);
  prompts.forEach((prompt, index) => {
    const local = kling4MentionError(prompt, names);
    if (local === null) assert.equal(mentionResults[index].ok, true, prompt);
    else assert.equal(mentionResults[index].error, local, prompt);
  });
});

test('paridad con el PHP real: ruta del servidor, acceso por token y apertura de sujetos', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const route = php("$c = wallet_config(); echo json_encode($c['SKILL_MODEL_ROUTES']['kling-4-0']);");
  assert.equal(route.driver, 'jobs-v1');
  assert.equal(route.variant_param, 'mode');
  assert.deepEqual(route.variants, { ref: 'kling-4.0/reference-to-video', keyframe: 'kling-4.0/keyframe-to-video' });
  // El valor por defecto del repositorio abre el modelo y los sujetos; config.local.php puede cerrarlos (rollback).
  const flags = php("$c = wallet_config(); echo json_encode([$c['KLING_4_0_ENABLED'], $c['KLING_4_0_SUBJECTS_ENABLED']]);");
  assert.deepEqual(flags, [true, true]);
  // El gateway pide el scope 'generate', que concede un token de dispositivo; los gates de Kling solo
  // exigen cookie de administrador cuando el interruptor correspondiente es false.
  const source = fs.readFileSync(path.join(CANONICAL, 'app/api/wallet/gateway.php'), 'utf8');
  assert.match(source, /wallet_require_scope\('generate'\)/);
  assert.match(source, /'kling-4-0' && empty\(\$cfg\['KLING_4_0_ENABLED'\]\)/);
  assert.match(source, /'kling-4-0' && empty\(\$cfg\['KLING_4_0_SUBJECTS_ENABLED'\]\)/);
});

test('CLI real: prepare mide, sube y autoriza el máximo; submit envía el cuerpo exacto y no repite', async (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-kling4-cli-'));
  const credentials = path.join(temp, 'credentials');
  const config = path.join(temp, 'config');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'K'.repeat(48), { mode: 0o600 });
  const requests = [];
  let base;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    const url = new URL(req.url, base);
    const isJson = /json/.test(req.headers['content-type'] || '');
    const body = isJson ? JSON.parse(raw.toString() || '{}') : {};
    requests.push({ path: url.pathname, query: url.searchParams.get('path'), body });
    if (url.pathname === '/result.mp4') { res.writeHead(200, { 'content-type': 'video/mp4' }); return res.end(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)])); }
    let response = { ok: true, user: { email: 'test@example.invalid', tier: 'hub' }, balance: 5000 };
    if (body.action === 'task_costs') response = { ok: true, costs: { 'kling-cli-job': 175 } };
    if (url.pathname.endsWith('/upload.php')) {
      const name = base + 'uploads/' + requests.length + '.bin';
      response = { ok: true, code: 200, url: name, data: { url: name }, expires_at: '2099-01-01 00:00:00' };
    }
    if (url.pathname.endsWith('/gateway.php')) {
      if (url.searchParams.get('path') === '/jobs/createTask') response = { code: 200, data: { taskId: 'kling-cli-job' } };
      else response = { code: 200, data: { taskId: 'kling-cli-job', state: 'success', resultJson: JSON.stringify({ resultUrls: [base + 'result.mp4'] }) } };
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(response));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  t.after(async () => { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); fs.rmSync(temp, { recursive: true, force: true }); });
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base, AILAB_CATALOG_PATH: catalogPath,
    AILAB_CONFIG_DIR: config, AILAB_CREDENTIALS_DIR: credentials, AILAB_OUTPUT_DIR: path.join(temp, 'out') };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  const clip = media.video('cli5.mp4', 5);
  const hero = [media.image('cli-h1.png', 800, 800), media.image('cli-h2.png', 800, 1000)];
  const voice = media.wavAudio('cli-voz.wav', 4);
  // Una combinación inválida se rechaza en local, sin tocar la red.
  await assert.rejects(exec('prepare', 'kling-4-0', '--prompt', 'Mira @image_1', '--duration', '5'), /menciona @image_1/);
  assert.equal(requests.length, 0);
  const args = ['kling-4-0', '--prompt', 'Mueve @video_1 con @ana y @voz', '--duration', '10', '--resolution', '1080p', '--aspect_ratio', '16:9',
    '--video_urls', clip, '--subject_1_name', 'ana', '--subject_1_images', hero[0], '--subject_1_images', hero[1], '--voice_1_name', 'voz', '--voice_1_audio', voice,
    '--keep_original_sound', 'true'];
  // 10 s de salida y 5 s de vídeo de entrada: 20 s facturables a 1080p con vídeo (25,5 x 1,02 cr/s).
  const expected = reference('1080p', 10, 5);
  const { stdout } = await exec('prepare', ...args, '--max-credits', String(expected));
  assert.match(stdout, new RegExp(`Estimacion: ~${expected} cr`));
  assert.match(stdout, /5 s de vídeo de entrada: se factura 20 s/);
  const id = /Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];
  assert.ok(id, stdout);
  assert.equal(JSON.parse(fs.readFileSync(path.join(config, 'manifests', id + '.json'), 'utf8')).max_credits_authorized, expected);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 0, 'prepare no envía nada');
  // Un tope del usuario por debajo del máximo se respeta antes de subir nada.
  await assert.rejects(exec('prepare', ...args, '--max-credits', String(expected - 1)), /supera el m[aá]ximo/i);
  const done = await exec('submit', id, '--confirmed');
  assert.match(done.stdout, /Coste real: 175 cr/);
  const sends = requests.filter((request) => request.query === '/jobs/createTask');
  assert.equal(sends.length, 1);
  const sent = sends[0].body;
  assert.equal(sent.model, 'kling-4-0');
  assert.equal(sent.max_credits_authorized, expected);
  assert.match(sent.client_request_id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(Object.keys(sent.input).sort(), ['aspect_ratio', 'duration', 'elements', 'keep_original_sound', 'mode', 'prompt', 'resolution', 'video_urls', 'voices']);
  assert.equal(sent.input.mode, 'ref');
  assert.equal(sent.input.keep_original_sound, true);
  assert.equal(sent.input.video_urls.length, 1);
  assert.equal(sent.input.elements[0].name, 'ana');
  assert.equal(sent.input.elements[0].image_urls.length, 2);
  assert.match(sent.input.voices[0].audio_url, /uploads\//);
  await assert.rejects(exec('submit', id, '--confirmed'), /ya se ejecutó/);
  assert.equal(requests.filter((request) => request.query === '/jobs/createTask').length, 1, 'no duplica un envío confirmado');
});
