import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateCatalogShape, validateParams } from '../skills/ailab/scripts/lib/catalog.mjs';

process.env.AILAB_CONFIG_DIR = path.join(os.tmpdir(), 'ailab-h3-config-sin-uso');
const { priceParams } = await import('../skills/ailab/scripts/lib/price.mjs');

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

// Desde la 2.5.0 el coste de las referencias lo calcula AILAB (price.php). La CLI solo le manda lo que mide de cada
// archivo local: tipo, tamaño, dimensiones y duración, en el mismo orden y nunca la ruta.
test('H3 Max: price.php recibe las medidas de las referencias locales, sin rutas', () => {
  const image = path.join(temporary, 'reference.png');
  const video = path.join(temporary, 'reference.mp4');
  fs.writeFileSync(image, pngFixture(1920, 1080));
  fs.writeFileSync(video, mp4Fixture(5));
  const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json', 'utf8')));
  const model = catalog.models['minimax-h3-max'];
  assert.equal(model.estimate, undefined);
  assert.doesNotMatch(JSON.stringify(model), /\d\s?cr\b/);

  const validated = validateParams(model, {
    mode: 'ref', prompt: 'Referencias', duration: 5, resolution: '768P',
    reference_image_urls: [image], reference_video_urls: [video],
  });
  assert.equal(validated.ok, true, validated.errors.join('\n'));
  const sent = priceParams(validated.params, validated.fileParams);
  assert.equal(sent.duration, 5);
  assert.equal(sent.resolution, '768P');
  assert.deepEqual(sent.reference_image_urls, [{ ok: true, class: 'image', mime: 'image/png', size: 24, width: 1920, height: 1080, pixels: 1920 * 1080 }]);
  assert.equal(sent.reference_video_urls.length, 1);
  assert.equal(sent.reference_video_urls[0].class, 'video');
  assert.equal(sent.reference_video_urls[0].duration, 5);
  assert.doesNotMatch(JSON.stringify(sent), /reference\.(png|mp4)|ailab-h3-pricing/);
});
