import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execute = promisify(execFile);
const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
const helper = path.join(root, 'skills/ugc-ailab/scripts/extract-audio.mjs');
const available = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version']).status === 0);
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

test('UGC completo con AILAB simulado: referencias ordenadas, dos ramas, costes y recuperación sin repetir', { skip: !available }, async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-ugc-flow-'));
  const credentials = path.join(temp, 'credentials');
  fs.mkdirSync(credentials);
  fs.writeFileSync(path.join(credentials, 'token'), 'ailp_' + 'T'.repeat(48), { mode: 0o600 });
  const fixture = (name, args) => {
    const file = path.join(temp, name);
    const run = spawnSync('ffmpeg', ['-v', 'error', ...args, file], { encoding: 'utf8', timeout: 30000 });
    assert.equal(run.status, 0, run.stderr);
    return file;
  };
  const video = fixture('source.mp4', ['-f', 'lavfi', '-i', 'color=c=blue:s=32x32:r=25:d=4',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4', '-c:v', 'mpeg4', '-c:a', 'aac']);
  const originals = ['black', 'white'].map((color, index) => fixture(`ref-${index}.png`,
    ['-f', 'lavfi', '-i', `color=c=${color}:s=32x32`, '-frames:v', '1', '-threads', '1']));
  const audioFiles = {};
  for (const [index, kind] of ['target', 'residual', 'isolated', 'voice'].entries()) {
    audioFiles[kind] = fixture(`${kind}.wav`, ['-f', 'lavfi', '-i',
      `sine=frequency=${500 + index * 200}:sample_rate=48000:duration=${kind === 'isolated' ? 10 : 4}`, '-c:a', 'pcm_s16le']);
  }
  const assets = { 'video.mp4': video, ...Object.fromEntries(Object.entries(audioFiles).map(([name, file]) => [name + '.wav', file])) };
  const uploads = [];
  const submissions = [];
  const assistantCalls = [];
  let uploadAttempts = 0;
  let base;
  const json = (res, body, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body));
  };
  const gateway = (res, data) => json(res, { code: 200, data });
  const assistantCatalog = {
    schema_version: 2, catalog_version: '2.0.0', min_cli_version: '2.2.0',
    billing: { type: 'actual_usage', max_authorized_credits: 160 },
    default_model: 'gemini-3-5-flash-lite-priority',
    assistants: { 'video-prompter': { label: 'Video Prompter', description: 'Vídeo.', prompt_version: 'test',
      prompt_sha256: 'a'.repeat(64), estimated_credits: 9, max_authorized_credits: 48 } },
    models: { 'gemini-3-5-flash-lite-priority': { label: 'Gemini 3.5 Flash Lite', vendor: 'OpenRouter · Priority',
      accepts_images: true, accepts_audio: true, accepts_video: true } },
  };
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base);
      if (url.pathname.startsWith('/assets/')) {
        const name = url.pathname.slice('/assets/'.length);
        if (!assets[name]) return json(res, { error: 'Unknown asset' }, 404);
        res.writeHead(200, { 'Content-Type': name.endsWith('.mp4') ? 'video/mp4' : 'audio/wav' });
        return res.end(fs.readFileSync(assets[name]));
      }
      if (url.pathname.endsWith('/assistants.json')) return json(res, assistantCatalog);
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks);
      if (url.pathname === '/api/skill/upload.php') {
        uploadAttempts += 1;
        // La segunda imagen falla antes de llamar al asistente. Reanudar debe
        // conservar la primera y completar la segunda, no omitirla.
        if (uploadAttempts === 2) return json(res, { ok: false, error: 'Upload interrupted in test' }, 503);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        const start = raw.indexOf('\r\n\r\n') + 4;
        const end = raw.lastIndexOf(Buffer.from('\r\n--' + boundary));
        assert.ok(start >= 4 && end > start);
        const bytes = raw.subarray(start, end);
        const remote = base + 'uploads/' + sha(bytes);
        uploads.push({ url: remote, sha256: sha(bytes) });
        return json(res, { ok: true, url: remote });
      }
      const body = raw.length ? JSON.parse(raw) : {};
      if (url.pathname.endsWith('/api.php')) return json(res, {
        ok: true, user: { email: 'ugc@example.test', tier: 'hub' }, balance: 1000,
        costs: { 'mock-video': 65, 'fal:mock-sam': 11 },
      });
      if (url.pathname.endsWith('/assistant.php')) {
        assistantCalls.push(body);
        return json(res, { ok: true, assistant_id: body.assistant_id, model_id: body.model_id,
          message: { role: 'assistant', content: 'Static camera. She says: "Hola". Use @image1 and @image2.' },
          charged_credits: 9, balance: 991, request_id: body.client_request_id });
      }
      if (url.pathname.endsWith('/task.php')) return json(res, { ok: true, task: {
        model_id: 'sam-audio', state: 'success', charged_credits: 11,
        result_urls: [base + 'assets/target.wav', base + 'assets/residual.wav'],
      } });
      if (url.pathname.endsWith('/gateway.php')) {
        if (req.method === 'POST') {
          submissions.push(body);
          return gateway(res, { taskId: 'mock-video' });
        }
        return gateway(res, { state: 'success', resultJson: { resultUrls: [base + 'assets/video.mp4'] } });
      }
      if (url.pathname.endsWith('/fal-gateway.php')) {
        if (body.action === 'submit') {
          submissions.push(body);
          return gateway(res, { request_id: 'mock-sam' });
        }
        return gateway(res, { status: 'COMPLETED', target: base + 'assets/target.wav', residual: base + 'assets/residual.wav' });
      }
      if (url.pathname.endsWith('/elevenlabs-gateway.php')) {
        submissions.push(body);
        const isolate = body.model === 'eleven-audio-isolation';
        if (!isolate) {
          assert.equal(body.input.duration_seconds, 10, 'La CLI debe medir la voz aislada, no copiar la duracion del video.');
          assert.equal(body.max_credits_authorized, 5, '10 segundos cuestan 5 cr aunque sean WAV sin comprimir.');
        }
        return gateway(res, { taskId: isolate ? 'mock-isolator' : 'mock-changer',
          audio: base + (isolate ? 'assets/isolated.wav' : 'assets/voice.wav'), credits: isolate ? 1 : 5 });
      }
      json(res, { error: 'Unexpected request: ' + req.url }, 404);
    } catch (error) { json(res, { error: error.message }, 500); }
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_BASE_URL: base, AILAB_GENERATION_BASE_URL: base,
    AILAB_ASSISTANTS_URL: base + 'api/v1/skill/assistants.json', AILAB_ASSISTANT_ENDPOINT: base + 'api/v1/skill/assistant.php',
    AILAB_TASK_ENDPOINT: base + 'api/v1/skill/task.php', AILAB_CATALOG_PATH: path.join(root, 'skills/ailab/catalog/catalog.json'),
    AILAB_CONFIG_DIR: path.join(temp, 'config'), AILAB_CREDENTIALS_DIR: credentials };
  const run = async (...args) => (await execute(process.execPath, [cli, ...args], { env, timeout: 30000 })).stdout;
  assert.match(await run('self-test'), /SELF_TEST_OK 2\.3\.1/);
  const filesFrom = output => [...output.matchAll(/(?:Guardado|Recuperado del servidor): (.+) \(/g)].map(match => match[1]);
  const brief = path.join(temp, 'brief.txt');
  fs.writeFileSync(brief, 'Testimonial, diálogo literal "Hola", cámara estática, 4 segundos, 9:16, 1080p.');
  const plan = await run('assistant-prepare', 'video-prompter', '--message-file', brief,
    ...originals.flatMap(file => ['--image', file]));
  const requestId = /Peticion: ([0-9a-f-]{36})/.exec(plan)?.[1];
  assert.ok(requestId);
  await assert.rejects(run('assistant-submit', requestId, '--confirmed'), /Fallo la subida/);
  assert.equal(assistantCalls.length, 0, 'Una subida fallida no debe enviar el mensaje de pago.');
  const answer = await run('assistant-submit', requestId, '--confirmed');
  assert.match(answer, /Coste: 9 cr/);
  assert.equal(assistantCalls[0].assistant_id, 'video-prompter');
  assert.equal(assistantCalls[0].model_id, 'gemini-3-5-flash-lite-priority');
  const expectedPrompt = 'Static camera. She says: "Hola". Use @image1 and @image2.';
  assert.ok(answer.includes(expectedPrompt));

  const generate = async (model, parameters, folder) => {
    const plan = await run('prepare', model, ...parameters);
    const manifest = /Manifiesto: ([0-9a-f-]{36})/.exec(plan)?.[1];
    assert.ok(manifest, plan);
    const output = await run('submit', manifest, '--confirmed', '--output', path.join(temp, folder));
    const files = filesFrom(output);
    assert.ok(files.length > 0, output);
    files.forEach(file => assert.ok(fs.statSync(file).size > 0));
    return { plan, manifest, output, files };
  };
  const generated = await generate('gemini-omni-flash-1-1', ['--mode', 'reference', '--aspect_ratio', '9:16',
    '--resolution', '1080p', '--duration', '4', '--prompt', expectedPrompt,
    ...originals.flatMap(file => ['--image_urls', file])], 'video');
  const originalAudio = path.join(temp, 'original.wav');
  const extracted = await execute(process.execPath, [helper, '--input', generated.files[0], '--output', originalAudio]);
  assert.ok(Math.abs(JSON.parse(extracted.stdout).duration_seconds - 4) < 0.1);
  const sam = await generate('sam-audio', ['--audio_url', originalAudio, '--prompt', 'Isolate all human speech.'], 'sam');
  assert.equal(sam.files.length, 2);
  assert.equal(sha(fs.readFileSync(sam.files[0])), sha(fs.readFileSync(audioFiles.target)));
  assert.equal(sha(fs.readFileSync(sam.files[1])), sha(fs.readFileSync(audioFiles.residual)));
  const isolated = await generate('eleven-audio-isolation', ['--audio_url', originalAudio], 'isolator');
  assert.match(isolated.plan, /duration_seconds: 4/);
  assert.match(isolated.output, /Coste real: 1 cr/);
  const changed = await generate('eleven-voice-changer', ['--audio_url', isolated.files[0], '--voice_id', 'dNjJKg63Fr5AXwIdkATa',
    '--remove_background_noise', 'false'], 'voice');
  assert.match(changed.plan, /duration_seconds: 10/);
  assert.match(changed.output, /Coste real: 5 cr/);
  assert.equal(submissions.length, 4);
  assert.deepEqual(submissions[0].input.image_urls, originals.map(file => base + 'uploads/' + sha(fs.readFileSync(file))));
  const attached = assistantCalls[0].attachments;
  assert.deepEqual(attached, submissions[0].input.image_urls);
  assert.deepEqual(uploads.slice(0, 2).map(item => item.url), attached);
  assert.equal(submissions[0].input.prompt, expectedPrompt);
  assert.equal(submissions[1].input.audio_url, submissions[2].input.audio_url);
  assert.notEqual(submissions[2].input.audio_url, submissions[3].input.audio_url);
  assert.equal(submissions[3].input.audio_url, base + 'uploads/' + sha(fs.readFileSync(isolated.files[0])));
  assert.equal(submissions[3].input.remove_background_noise, false);
  assert.deepEqual(submissions.map(item => item.max_credits_authorized), [65, 11, 1, 5]);
  assert.equal(new Set(submissions.map(item => item.client_request_id)).size, 4);
  await assert.rejects(run('submit', generated.manifest, '--confirmed'), /ya se ejecuto/);
  const recovered = await execute(process.execPath, [cli, 'status', 'fal:mock-sam', '--output', path.join(temp, 'recovered')], {
    env: { ...env, AILAB_CONFIG_DIR: path.join(temp, 'fresh-session') }, timeout: 30000,
  });
  assert.equal(filesFrom(recovered.stdout).length, 2);
  assert.match(recovered.stdout, /Coste real: 11 cr/);
  assert.equal(submissions.length, 4, 'Recuperar no debe crear otra generación.');
});
