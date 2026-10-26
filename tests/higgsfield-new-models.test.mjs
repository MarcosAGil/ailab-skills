import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import { Media } from './helpers/media.mjs';
import { CANONICAL, canRunParity, php } from './helpers/php.mjs';

// SOUL Cinema y Marketing Studio Image (Higgsfield), más los alias de los ids del Playground para SOUL 2 y
// Genjutsu, que ya estaban en la skill con ids cortos. La skill habla con api/skill/higgsfield.php, que hoy
// solo admite SOUL 2 y Genjutsu: los otros dos modelos se entregan en el catálogo con `enabled: false`. Activarlos
// cambia el contrato de un modelo ya firmado, así que exige una release nueva (tools/validate-skill-release.mjs de
// AILAB lo impide en catalog-v2.json) además de desplegar el cambio de servidor.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-higgsfield-new-'));
process.env.AILAB_CONFIG_DIR = path.join(temporary, 'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(temporary, 'credentials');
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
const catalogPath = path.join(root, 'skills/ailab/catalog/catalog.json');
const { validateCatalogShape, validateParams, estimateCredits, modelUsable, resolveModel, requiresServerQuote } = await import('../skills/ailab/scripts/lib/catalog.mjs');
const higgsfield = await import('../skills/ailab/scripts/adapters/higgsfield-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
const execute = promisify(execFile);
const media = new Media(path.join(temporary, 'files'));
const cinema = { id: 'higgsfield-soul-cinema', ...catalog.models['higgsfield-soul-cinema'] };
const marketing = { id: 'higgsfield-marketing-studio-image', ...catalog.models['higgsfield-marketing-studio-image'] };

const sourceOf = (relative) => fs.readFileSync(path.join(CANONICAL, relative), 'utf8');

test('SOUL 2 y Genjutsu ya estaban en la skill: los ids del Playground resuelven al mismo modelo sin tocar su contrato', () => {
  assert.equal(resolveModel(catalog, 'higgsfield-soul-2').id, 'soul-2');
  assert.equal(resolveModel(catalog, 'higgsfield-genjutsu-motion-transfer').id, 'genjutsu');
  assert.equal(higgsfield.serverModelId(catalog.models['soul-2'] && { id: 'soul-2', ...catalog.models['soul-2'] }), 'higgsfield-soul-2');
  assert.equal(higgsfield.serverModelId({ id: 'genjutsu', ...catalog.models.genjutsu }), 'higgsfield-genjutsu-motion-transfer');
  for (const id of ['soul-2', 'genjutsu']) {
    assert.equal(catalog.models[id].aliases.some((alias) => alias.startsWith('higgsfield-')), false, 'los alias del catálogo publicado no cambian: el runtime resuelve los ids del Playground');
    assert.equal(catalog.models[id].enabled, true);
    assert.equal(catalog.models[id].min_cli_version, '2.3.0', 'la release 2.3.0 ya los ofrecía: no se toca su versión mínima');
  }
});

test('los dos modelos nuevos se entregan desactivados, con cotización del servidor y sin exponer rutas del proveedor', () => {
  for (const model of [cinema, marketing]) {
    assert.equal(model.driver, 'higgsfield-v1');
    assert.equal(model.enabled, false, 'el servidor de la skill todavía no los admite');
    assert.equal(model.status, 'active');
    assert.equal(model.min_cli_version, '2.3.13');
    assert.equal(model.estimate.kind, 'higgsfield_quote');
    assert.equal(requiresServerQuote(model), true);
    assert.equal(modelUsable(model).ok, false);
    assert.equal(estimateCredits(model, {}).server_quote, true, 'sin tarifa local inventada: la cotiza el servidor');
    assert.equal(higgsfield.serverModelId(model), model.id);
    assert.equal(higgsfield.hardCreditCap(model), 1000);
    const text = JSON.stringify(model);
    for (const forbidden of ['higgsfield-ai/', 'marketing-studio/image', 'provider_contract', 'api_key', 'HIGGSFIELD']) assert.equal(text.includes(forbidden), false, forbidden);
    assert.equal(text.includes(String.fromCharCode(0x2014)), false);
  }
  assert.equal(resolveModel(catalog, 'soul cinema').id, 'higgsfield-soul-cinema');
  assert.equal(resolveModel(catalog, 'marketing studio image').id, 'higgsfield-marketing-studio-image');
});

test('el catálogo solo activa un modelo Higgsfield cuando el servidor de la skill lo admite', { skip: !CANONICAL && 'sin AILAB_CANONICAL_REPO' }, () => {
  const source = sourceOf('app/api/skill/higgsfield.php');
  const specs = source.slice(source.indexOf('function ailab_skill_higgsfield_spec'), source.indexOf('function ailab_skill_higgsfield_feature_enabled'));
  const supported = [...specs.matchAll(/'(higgsfield-[a-z0-9-]+)' => \[/g)].map((match) => match[1]).sort();
  assert.deepEqual(supported, ['higgsfield-genjutsu-motion-transfer', 'higgsfield-soul-2'], 'si esto cambia, activa en el catálogo los modelos nuevos');
  for (const [id, model] of Object.entries(catalog.models)) {
    if (model.driver !== 'higgsfield-v1') continue;
    const server = higgsfield.serverModelId({ id, ...model });
    assert.equal(model.enabled, supported.includes(server), `${id} (${server}): enabled debe coincidir con la compatibilidad del servidor`);
  }
});

test('las CLI anteriores aceptan el catálogo con los dos modelos desactivados y no los ofrecen', { skip: !CANONICAL && 'sin AILAB_CANONICAL_REPO' }, async () => {
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12']) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    for (const id of ['higgsfield-soul-cinema', 'higgsfield-marketing-studio-image']) assert.equal(old.modelUsable(parsed.models[id]).ok, false, `${version} ${id}`);
  }
});

test('el payload de SOUL Cinema y Marketing Studio coincide con el contrato del gateway web', () => {
  const given = { prompt: 'Calle mojada al amanecer', aspect_ratio: '16:9', resolution: '1080p', batch_size: '4', seed: '12' };
  const v = validateParams(cinema, given);
  assert.equal(v.ok, true, v.errors?.join('\n'));
  assert.deepEqual(higgsfield.buildPayload(cinema, v.params, {}), {
    model: 'higgsfield-soul-cinema', mode: null,
    input: { prompt: 'Calle mojada al amanecer', aspect_ratio: '16:9', resolution: '1080p', batch_size: '4', enhance_prompt: true, seed: 12 },
  });
  const product = media.image('producto.png', 800, 800);
  const person = media.image('modelo.png', 800, 1000);
  const m = validateParams(marketing, { prompt: 'Anuncio de crema', image_urls: [product, person], enhance_prompt: 'true', preset_id: 'preset-12345678', quality: 'medium' });
  assert.equal(m.ok, true, m.errors?.join('\n'));
  assert.deepEqual(higgsfield.buildPayload(marketing, m.params, { image_urls: ['https://u.test/a.png', 'https://u.test/b.png'] }), {
    model: 'higgsfield-marketing-studio-image', mode: null,
    input: { prompt: 'Anuncio de crema', image_urls: ['https://u.test/a.png', 'https://u.test/b.png'], resolution: '2k', aspect_ratio: '1:1', quality: 'medium', moderation: 'auto', enhance_prompt: true, preset_id: 'preset-12345678' },
  });
  // Reglas locales equivalentes a las del servidor.
  assert.equal(validateParams(marketing, { prompt: 'x', enhance_prompt: 'true' }).ok, false, 'el modo mejorado exige preset_id');
  assert.equal(validateParams(cinema, { prompt: 'x', batch_size: '2' }).ok, false);
  assert.equal(validateParams(cinema, { prompt: 'x', style_id: 'abc' }).ok, false, 'SOUL Cinema no ofrece style_id');
  assert.equal(validateParams(cinema, { prompt: 'x', seed: '0' }).ok, false);
});

test('paridad con el PHP real: el validador del gateway Higgsfield acepta lo que construye la CLI y rechaza lo mismo', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const validate = (modelId, input) => php(`$spec = higgsfield_model_spec($argv[1]); echo json_encode(['input' => higgsfield_validate_input(json_decode($argv[2], true), $spec)], JSON_UNESCAPED_UNICODE);`,
    [modelId, JSON.stringify(input)], { higgsfield: true });
  const product = media.image('pp.png', 800, 800);
  const person = media.image('pm.png', 800, 1000);
  const accepted = [
    [cinema, { prompt: 'Calle mojada' }],
    [cinema, { prompt: 'Retrato', aspect_ratio: '9:16', resolution: '1080p', batch_size: '4', enhance_prompt: 'false', seed: '1000000' }],
    [marketing, { prompt: 'Anuncio' }],
    [marketing, { prompt: 'Anuncio', image_urls: [product], resolution: '4k', aspect_ratio: '21:9', quality: 'low', moderation: 'low' }],
    [marketing, { prompt: 'Mejorado', image_urls: [product, person], enhance_prompt: 'true', preset_id: 'abcdefgh1234' }],
    [marketing, { prompt: 'Auto', image_urls: Array.from({ length: 16 }, (_, i) => media.image(`pk${i}.png`, 500, 500)), aspect_ratio: 'auto' }],
  ];
  for (const [model, given] of accepted) {
    const v = validateParams(model, given);
    assert.equal(v.ok, true, `${model.id}: ${v.errors?.join(' ')}`);
    const uploaded = Object.fromEntries(Object.entries(v.fileParams).map(([param, files]) => [param, files.map((file) => 'https://uploads.example.test/' + path.basename(file))]));
    const payload = higgsfield.buildPayload(model, v.params, uploaded);
    const server = validate(model.id, payload.input);
    assert.ok(server.input, `${model.id}: el servidor debía aceptar ${JSON.stringify(payload.input)} y respondió ${JSON.stringify(server)}`);
    for (const [key, value] of Object.entries(payload.input)) {
      assert.deepEqual(server.input[key], key === 'batch_size' ? Number(value) : value, `${model.id}.${key}`);
    }
  }
  // Lo que la CLI rechaza en local (o que no puede expresarse) y el servidor también rechaza.
  const rejected = [
    [cinema.id, { prompt: 'x', batch_size: 2 }],
    [cinema.id, { prompt: 'x', aspect_ratio: '5:4' }],
    [cinema.id, { prompt: 'x', resolution: '4k' }],
    [cinema.id, { prompt: 'x', seed: 0 }],
    [cinema.id, { prompt: 'x', sorpresa: true }],
    [cinema.id, { prompt: '' }],
    [marketing.id, { prompt: 'x', resolution: '8k' }],
    [marketing.id, { prompt: 'x', quality: 'ultra' }],
    [marketing.id, { prompt: 'x', moderation: 'off' }],
    [marketing.id, { prompt: 'x', enhance_prompt: true }],
    [marketing.id, { prompt: 'x', image_urls: ['https://u.test/a.png'], enhance_prompt: true }],
    [marketing.id, { prompt: 'x', preset_id: 'abcdefgh1234' }],
    [marketing.id, { prompt: 'x', image_urls: Array.from({ length: 17 }, () => 'https://u.test/a.png') }],
  ];
  for (const [id, input] of rejected) {
    const server = validate(id, input);
    assert.ok(server.msg && !server.input, `${id}: el servidor debía rechazar ${JSON.stringify(input)}`);
  }
  assert.equal(validateParams(cinema, { prompt: 'x', batch_size: '2' }).ok, false);
  assert.equal(validateParams(cinema, { prompt: 'x', aspect_ratio: '5:4' }).ok, false);
  assert.equal(validateParams(cinema, { prompt: 'x', resolution: '4k' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', resolution: '8k' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', quality: 'ultra' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', image_urls: Array.from({ length: 17 }, (_, i) => media.image(`px${i}.png`, 400, 400)) }).ok, false);
});

test('paridad con el PHP real: configuración de acceso de Higgsfield (interruptores y tope) tal como figura en el repositorio', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const config = php("$c = wallet_config(); echo json_encode(['flags' => $c['HIGGSFIELD_FEATURE_FLAGS'], 'cap' => $c['HIGGSFIELD_MAX_CREDITS_PER_TASK'], 'genjutsu' => $c['HIGGSFIELD_GENJUTSU_MAX_CREDITS_PER_TASK']]);");
  assert.deepEqual(config.flags, {
    'higgsfield-soul-2': true, 'higgsfield-soul-cinema': true, 'higgsfield-marketing-studio-image': false, 'higgsfield-genjutsu-motion-transfer': true,
  }, 'Marketing Studio Image sigue desactivado en el gateway: ni la web ni la skill pueden usarlo');
  assert.equal(config.cap, 1000);
  assert.equal(config.genjutsu, 2100);
  assert.equal(higgsfield.hardCreditCap({ id: 'genjutsu', ...catalog.models.genjutsu }), 2100);
  assert.equal(higgsfield.hardCreditCap({ id: 'soul-2', ...catalog.models['soul-2'] }), 1000);
  // Ambos endpoints piden el scope `generate`, que concede un token de dispositivo.
  assert.match(sourceOf('app/api/skill/higgsfield.php'), /wallet_require_scope\('generate'\)/);
  assert.match(sourceOf('app/api/wallet/higgsfield-gateway.php'), /wallet_require_scope\('generate'\)/);
});

test('prepare de un modelo desactivado se detiene antes de subir nada y los activos siguen igual', async () => {
  const config = path.join(temporary, 'cli-config');
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_CATALOG_PATH: catalogPath, AILAB_CONFIG_DIR: config,
    AILAB_CREDENTIALS_DIR: path.join(temporary, 'cli-credentials'), AILAB_BASE_URL: 'http://127.0.0.1:9/' };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  await assert.rejects(exec('prepare', 'higgsfield-soul-cinema', '--prompt', 'x'), /no esta disponible/);
  const models = await exec('models');
  assert.match(models.stdout, /higgsfield-soul-cinema · Higgsfield SOUL Cinema \[image\] · CARO · NO DISPONIBLE/);
  assert.match(models.stdout, /higgsfield-marketing-studio-image · Higgsfield Marketing Studio Image \[image\] · CARO · NO DISPONIBLE/);
  assert.doesNotMatch(models.stdout, /soul-2 · Higgsfield SOUL 2 \[image\] · CARO · NO DISPONIBLE/);
  const validated = await exec('validate', 'higgsfield-soul-cinema', '--prompt', 'x', '--batch_size', '4');
  assert.match(validated.stdout, /el coste lo cotiza el servidor/);
  const info = await exec('info', 'higgsfield-genjutsu-motion-transfer');
  assert.match(info.stdout, /Higgsfield Genjutsu \(genjutsu\)/);
});
