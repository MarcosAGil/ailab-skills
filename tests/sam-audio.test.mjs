import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { estimateCredits, validateCatalogShape } from '../skills/ailab/scripts/lib/catalog.mjs';
import { inspectPricingMetadata } from '../skills/ailab/scripts/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'skills/ailab/catalog/catalog.json');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(CATALOG, 'utf8')));
const model = catalog.models['sam-audio'];

function wavFixture(directory, seconds) {
  const sampleRate = 8000;
  const bytes = sampleRate * seconds * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(bytes, 40);
  const output = path.join(directory, 'sam-' + seconds + 's.wav');
  fs.writeFileSync(output, wav);
  return output;
}

test('el catálogo público expone SAM Audio text-guided con runtime 2.1.12', () => {
  assert.ok(model);
  assert.deepEqual(model.modes, ['text-guided']);
  assert.equal(model.min_cli_version, '2.1.12');
  assert.equal(model.params.duration_seconds.internal, true);
  assert.equal(model.estimate.kind, 'duration_blocks');
});

test('la skill mide el audio local y calcula los bloques exactos', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-sam-skill-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const audio = wavFixture(dir, 31);
  const metadata = inspectPricingMetadata(audio);
  assert.equal(metadata.ok, true);
  assert.equal(metadata.duration, 31);
  assert.equal(estimateCredits(model, { duration_seconds: metadata.duration }).credits, 21);

  const run = spawnSync(process.execPath, [
    'skills/ailab/scripts/ailab.mjs', 'validate', 'sam-audio',
    '--audio_url', audio,
    '--prompt', 'Isolate the main human speaking voice.'
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_CATALOG_PATH: CATALOG }
  });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /estimacion ~21 cr/);
});

test('el adapter recupera target y residual y la subida admite FLAC', () => {
  const adapter = fs.readFileSync(path.join(ROOT, 'skills/ailab/scripts/adapters/labs-queue-v1.mjs'), 'utf8');
  const runtime = fs.readFileSync(path.join(ROOT, 'skills/ailab/scripts/pg.mjs'), 'utf8');
  assert.match(adapter, /\[d\.target, d\.residual, d\.image, d\.audio\]/);
  assert.match(runtime, /'audio\/flac': 'flac'/);
});
