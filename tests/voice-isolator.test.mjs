import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildPayload } from '../skills/ailab/scripts/adapters/eleven-v1.mjs';
import { estimateCredits, validateCatalogShape } from '../skills/ailab/scripts/lib/catalog.mjs';
import { inspectPricingMetadata } from '../skills/ailab/scripts/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/ailab/catalog/catalog.json'), 'utf8')));
const model = catalog.models['eleven-audio-isolation'];

function isoBmffFixture(directory, extension, brand, seconds) {
  const atom = (type, payload) => {
    const output = Buffer.alloc(8 + payload.length);
    output.writeUInt32BE(output.length, 0);
    output.write(type, 4);
    payload.copy(output, 8);
    return output;
  };
  const mvhd = Buffer.alloc(20);
  mvhd.writeUInt32BE(1000, 12);
  mvhd.writeUInt32BE(seconds * 1000, 16);
  const output = path.join(directory, 'voice.' + extension);
  fs.writeFileSync(output, Buffer.concat([atom('ftyp', Buffer.from(brand + 'isom')), atom('moov', atom('mvhd', mvhd))]));
  return output;
}

test('Voice Isolator publica el contrato directo y el precio exacto', () => {
  assert.ok(model);
  assert.equal(model.driver, 'eleven-v1');
  assert.equal(model.min_cli_version, '2.2.1');
  assert.equal(model.output, 'audio');
  assert.deepEqual(model.params.audio_url.accept, ['audio', 'video']);
  assert.equal(estimateCredits(model, { duration_seconds: 30 }).credits, 6);
  assert.equal(estimateCredits(model, { duration_seconds: 60 }).credits, 11);
  assert.equal(estimateCredits(model, { duration_seconds: 600 }).credits, 102);
});

test('la skill mide MP4 y MOV antes de autorizar el aislamiento', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-isolator-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const mp4 = isoBmffFixture(directory, 'mp4', 'isom', 75);
  const mov = isoBmffFixture(directory, 'mov', 'qt  ', 90);
  const mp4Metadata = inspectPricingMetadata(mp4);
  const movMetadata = inspectPricingMetadata(mov);
  assert.equal(mp4Metadata.ok, true);
  assert.equal(mp4Metadata.duration, 75);
  assert.equal(movMetadata.ok, true);
  assert.equal(movMetadata.mime, 'video/quicktime');
  assert.equal(movMetadata.duration, 90);
});

test('el adaptador manda una sola URL al gateway síncrono', () => {
  const payload = buildPayload(model, { duration_seconds: 12 }, { audio_url: ['https://ailab.example/input.mp4'] });
  assert.deepEqual(payload, {
    model: 'eleven-audio-isolation',
    input: { duration_seconds: 12, audio_url: 'https://ailab.example/input.mp4' },
  });
});

test('validate deriva la duración real de MP4/MOV, ignora una duración manual falsa y rechaza más de una hora', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-isolator-cli-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const env = {
    ...process.env, AILAB_SKIP_UPDATE: '1',
    AILAB_CATALOG_PATH: path.join(ROOT, 'skills/ailab/catalog/catalog.json'),
    AILAB_CONFIG_DIR: path.join(directory, 'config'),
    AILAB_CREDENTIALS_DIR: path.join(directory, 'credentials'),
  };
  const run = (file, ...extra) => spawnSync(process.execPath, [
    path.join(ROOT, 'skills/ailab/scripts/ailab.mjs'), 'validate', 'eleven-audio-isolation',
    '--audio_url', file, ...extra,
  ], { env, encoding: 'utf8', timeout: 30000 });
  for (const [extension, brand, duration, cost] of [['mp4', 'isom', 75, 13], ['mov', 'qt  ', 90, 16]]) {
    const file = isoBmffFixture(directory, extension, brand, duration);
    const result = run(file, '--duration_seconds', '1');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, new RegExp('estimacion ~' + cost + ' cr'));
  }
  const tooLong = isoBmffFixture(directory, 'mov', 'qt  ', 3601);
  assert.match(run(tooLong).stderr, /hasta 60 minutos/);
  const missing = run(path.join(directory, 'missing.wav'));
  assert.notEqual(missing.status, 0);
  const invalid = path.join(directory, 'invalid.wav');
  fs.writeFileSync(invalid, 'not an audio file');
  assert.notEqual(run(invalid).status, 0);
});
