import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'skills/ugc-ailab/scripts/extract-audio.mjs');
const available = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version']).status === 0);

function exec(command, args) {
  return spawnSync(command, args, { encoding: 'utf8', timeout: 30000 });
}

test('UGC se instala y empaqueta con sus recursos sin acceso a cuenta', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ugc-install-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const install = exec(process.execPath, [path.join(root, 'tools/install.mjs'), 'ugc-ailab', '--dir', temp]);
  assert.equal(install.status, 0, install.stderr);
  const help = exec(process.execPath, [path.join(temp, 'ugc-ailab/scripts/extract-audio.mjs'), '--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.ok(fs.existsSync(path.join(temp, 'ugc-ailab/references/cli-flow.md')));
  const pack = spawnSync(process.execPath, [path.join(root, 'tools/package.mjs'), 'ugc-ailab'], {
    encoding: 'utf8', env: { ...process.env, AILAB_DIST_DIR: temp }, timeout: 30000,
  });
  assert.equal(pack.status, 0, pack.stderr);
  const listing = exec('unzip', ['-Z1', path.join(temp, 'ugc-ailab-skill-v1.0.1-beta.zip')]);
  assert.equal(listing.status, 0, listing.stderr);
  assert.ok(listing.stdout.trim().split('\n').every(name => name.startsWith('ugc-ailab/')));
});

test('extracción preserva canales, duración y desfase; no sobrescribe ni acepta vídeo mudo', { skip: !available }, t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ugc-audio-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const input = path.join(temp, 'vídeo con espacios.mov');
  const output = path.join(temp, 'audio original.wav');
  const source = exec('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=25:d=2',
    '-itsoffset', '0.25', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=1.5',
    '-map', '0:v', '-map', '1:a', '-c:v', 'mpeg4', '-c:a', 'pcm_s16le', '-ac', '2', input]);
  assert.equal(source.status, 0, source.stderr);
  const extracted = exec(process.execPath, [script, '--input', input, '--output', output]);
  assert.equal(extracted.status, 0, extracted.stderr);
  const metadata = JSON.parse(extracted.stdout);
  assert.equal(metadata.channels, 2);
  assert.equal(metadata.sample_rate, 48000);
  assert.equal(metadata.codec, 'pcm_s16le');
  assert.ok(Math.abs(metadata.duration_seconds - 1.5) < 0.03);
  assert.ok(Math.abs(metadata.audio_offset_from_video_seconds - 0.25) < 0.03);
  const before = fs.readFileSync(output);
  const repeated = exec(process.execPath, [script, '--input', input, '--output', output]);
  assert.notEqual(repeated.status, 0);
  assert.deepEqual(fs.readFileSync(output), before);
  const silent = path.join(temp, 'silent.mov');
  const mute = exec('ffmpeg', ['-v', 'error', '-i', input, '-an', '-c:v', 'copy', silent]);
  assert.equal(mute.status, 0, mute.stderr);
  const rejectedOutput = path.join(temp, 'missing.wav');
  const rejected = exec(process.execPath, [script, '--input', silent, '--output', rejectedOutput]);
  assert.notEqual(rejected.status, 0);
  assert.equal(fs.existsSync(rejectedOutput), false);
});
