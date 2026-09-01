import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { estimateCredits, validateCatalogShape } from '../skills/ailab/scripts/lib/catalog.mjs';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-h3-pricing-'));
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));

function box(type, payload) {
  const output = Buffer.alloc(8 + payload.length);
  output.writeUInt32BE(output.length, 0);
  output.write(type, 4, 4, 'ascii');
  payload.copy(output, 8);
  return output;
}

function pngFixture(width, height) {
  const output = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(output, 0);
  output.writeUInt32BE(13, 8);
  output.write('IHDR', 12, 4, 'ascii');
  output.writeUInt32BE(width, 16);
  output.writeUInt32BE(height, 20);
  return output;
}

function mp4Fixture(durationSeconds) {
  const ftyp = box('ftyp', Buffer.concat([Buffer.from('isom'), Buffer.alloc(4), Buffer.from('isom')]));
  const mvhdPayload = Buffer.alloc(20);
  mvhdPayload.writeUInt32BE(1000, 12);
  mvhdPayload.writeUInt32BE(durationSeconds * 1000, 16);
  return Buffer.concat([ftyp, box('moov', box('mvhd', mvhdPayload))]);
}

test('H3 Max autoriza el coste exacto de salida y referencias locales', () => {
  const image = path.join(temporary, 'reference.png');
  const video = path.join(temporary, 'reference.mp4');
  fs.writeFileSync(image, pngFixture(1920, 1080));
  fs.writeFileSync(video, mp4Fixture(5));
  const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
  const model = catalog.models['minimax-h3-max'];

  assert.deepEqual(estimateCredits(model, {
    mode: 't2v', duration: 5, resolution: '480P'
  }), {
    credits: 51,
    approximate: false,
    note: 'Salida exacta según duración y resolución.'
  });

  const estimate = estimateCredits(model, {
    mode: 'ref', duration: 5, resolution: '768P',
    reference_image_urls: [image], reference_video_urls: [video]
  });
  const tokens = 1920 * 1080 / 1024 + 5 * 7459.2;
  const expected = Math.ceil(16.32 * 5 + Math.max(0, tokens - 4096) / 1000 * 4.08);
  assert.equal(estimate.credits, expected);
  assert.equal(estimate.approximate, false);
  assert.match(estimate.note, /tokens de referencia/);
});
