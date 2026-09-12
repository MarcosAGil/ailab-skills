import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { estimateCredits, validateCatalogShape } from '../skills/ailab/scripts/lib/catalog.mjs';

const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
const model = catalog.models['lipsync-veed-v2'];

test('VEED Lipsync publica un contrato remoto sin duración manual', () => {
  assert.equal(model.driver, 'labs-queue-v1');
  assert.equal(model.params.video_url.required, true);
  assert.equal(model.params.audio_url.required, true);
  assert.equal(model.params.duration_sec.internal, true);
  assert.equal(estimateCredits(model, { duration_sec: 1 }).credits, 14);
  assert.equal(estimateCredits(model, { duration_sec: 2.01 }).credits, 29);
});

test('la CLI mide el vídeo y calcula VEED antes de autorizar', (t) => {
  const available = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (available.status !== 0) return t.skip('ffmpeg no está disponible');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-veed-test-'));
  const video = path.join(temp, 'input.mp4');
  const audio = path.join(temp, 'voice.wav');
  try {
    const madeVideo = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=32x32:r=10:d=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
    const madeAudio = spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '2', audio]);
    assert.equal(madeVideo.status, 0, madeVideo.stderr && String(madeVideo.stderr));
    assert.equal(madeAudio.status, 0, madeAudio.stderr && String(madeAudio.stderr));
    const checked = spawnSync(process.execPath, [
      'skills/ailab/scripts/ailab.mjs', 'validate', 'lipsync-veed-v2',
      '--video_url', video, '--audio_url', audio,
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        AILAB_SKIP_UPDATE: '1',
        AILAB_CATALOG_PATH: path.join(process.cwd(), 'skills', 'ailab', 'catalog', 'catalog.json'),
      },
    });
    assert.equal(checked.status, 0, checked.stderr);
    assert.match(checked.stdout, /estimacion ~28 cr/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
