import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { estimateCredits } from '../skills/ailab/scripts/lib/catalog.mjs';
import { inspectFile, inspectPricingMetadata } from '../skills/ailab/scripts/lib/files.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills/ailab/catalog/catalog.json'), 'utf8'));
const model = catalog.models['resemble-audio-enhancement'];

test('la skill publica Audio Enhancement con su driver opaco y tres tratamientos', () => {
  assert.ok(model);
  assert.equal(model.driver, 'resemble-v1');
  assert.deepEqual(model.modes, ['enhance']);
  assert.equal(model.params.remove_noise.default, true);
  assert.equal(model.params.normalize.default, true);
  assert.equal(model.params.studio_sound.default, true);
  assert.equal(model.params.duration_seconds.internal, true);
  assert.equal(estimateCredits(model, { duration_seconds: 60 }).credits, 19);
  assert.equal(estimateCredits(model, { duration_seconds: 600 }).credits, 184);
});

test('reconoce OGG, AAC y M4A/MP4 y mide su duración antes de autorizar', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-resemble-skill-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const ogg = Buffer.alloc(96);
  ogg.write('OggS', 0); ogg.write('OpusHead', 28); ogg.writeUInt16LE(312, 38);
  ogg.write('OggS', 64); ogg.writeBigUInt64LE(480312n, 70);
  const oggPath = path.join(dir, 'sample.ogg'); fs.writeFileSync(oggPath, ogg);

  const aacHeader = Buffer.from([0xff, 0xf1, 0x50, 0x80, 0x00, 0xe0, 0xfc]);
  const aacPath = path.join(dir, 'sample.aac'); fs.writeFileSync(aacPath, Buffer.concat(Array.from({ length: 100 }, () => aacHeader)));

  const atom = (type, payload) => {
    const out = Buffer.alloc(8 + payload.length);
    out.writeUInt32BE(out.length, 0); out.write(type, 4); payload.copy(out, 8);
    return out;
  };
  const mvhd = Buffer.alloc(20); mvhd.writeUInt32BE(1000, 12); mvhd.writeUInt32BE(12500, 16);
  const m4aPath = path.join(dir, 'sample.m4a');
  fs.writeFileSync(m4aPath, Buffer.concat([atom('ftyp', Buffer.from('M4A isom')), atom('moov', atom('mvhd', mvhd))]));

  assert.equal(inspectFile(oggPath, model.params.audio_url.accept).mime, 'audio/ogg');
  assert.equal(inspectFile(aacPath, model.params.audio_url.accept).mime, 'audio/aac');
  assert.ok(Math.abs(inspectPricingMetadata(oggPath).duration - 10) < 0.001);
  assert.ok(Math.abs(inspectPricingMetadata(aacPath).duration - (102400 / 44100)) < 0.001);
  assert.ok(Math.abs(inspectPricingMetadata(m4aPath).duration - 12.5) < 0.001);
});

test('el adapter usa únicamente el gateway AILAB y recupera el WAV', () => {
  const adapter = fs.readFileSync(path.join(ROOT, 'skills/ailab/scripts/adapters/resemble-v1.mjs'), 'utf8');
  assert.match(adapter, /api\/wallet\/resemble-gateway\.php\?action=submit/);
  assert.match(adapter, /api\/wallet\/resemble-gateway\.php\?action=status/);
  assert.match(adapter, /data\.audio/);
  assert.doesNotMatch(adapter, /app\.resemble\.ai|RESEMBLE_API_KEY|Bearer/);
});
