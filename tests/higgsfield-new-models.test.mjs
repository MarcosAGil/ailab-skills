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
// Genjutsu, que ya estaban en la skill con ids cortos. La skill habla con api/skill/higgsfield.php, que admite los
// cuatro con cotización, envío idempotente y estado. Los dos nuevos van con `enabled: true` y `min_cli_version`
// 2.3.13; que el servidor los deje pasar lo decide, igual que en la web, HIGGSFIELD_FEATURE_FLAGS (hoy Marketing Studio
// Image está en false y responde 403 sin cobro).
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

test('los dos modelos nuevos están activos desde la CLI 2.3.13, con cotización del servidor y sin exponer rutas del proveedor', () => {
  for (const model of [cinema, marketing]) {
    assert.equal(model.driver, 'higgsfield-v1');
    assert.equal(model.enabled, true, 'el servidor de la skill ya los admite');
    assert.equal(model.status, 'active');
    assert.equal(model.min_cli_version, '2.3.13');
    assert.equal(model.estimate.kind, 'higgsfield_quote');
    assert.equal(requiresServerQuote(model), true);
    assert.equal(modelUsable(model).ok, true);
    assert.equal(estimateCredits(model, {}).server_quote, true, 'sin tarifa local inventada: la cotiza el servidor');
    assert.equal(higgsfield.serverModelId(model), model.id);
    assert.equal(higgsfield.hardCreditCap(model), 1000);
    const text = JSON.stringify(model);
    assert.equal(/pendiente de activaci/i.test(text), false, 'la descripción ya no habla de una activación pendiente');
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
  assert.deepEqual(supported, ['higgsfield-genjutsu-motion-transfer', 'higgsfield-marketing-studio-image', 'higgsfield-soul-2', 'higgsfield-soul-cinema'], 'si esto cambia, ajusta el catálogo');
  for (const [id, model] of Object.entries(catalog.models)) {
    if (model.driver !== 'higgsfield-v1') continue;
    const server = higgsfield.serverModelId({ id, ...model });
    assert.equal(model.enabled, supported.includes(server), `${id} (${server}): enabled debe coincidir con la compatibilidad del servidor`);
  }
});

test('las CLI anteriores (2.3.7 a 2.3.12) aceptan el catálogo con los dos modelos activos y no los ofrecen: piden la 2.3.13', { skip: !CANONICAL && 'sin AILAB_CANONICAL_REPO' }, async () => {
  for (const version of ['2.3.7', '2.3.8', '2.3.9', '2.3.10', '2.3.11', '2.3.12']) {
    const old = await import(pathToFileURL(path.join(CANONICAL, 'app/api/v1/skill/releases', version, 'scripts/lib/catalog.mjs')).href);
    const parsed = old.validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath, 'utf8')));
    for (const id of ['higgsfield-soul-cinema', 'higgsfield-marketing-studio-image']) {
      const usable = old.modelUsable(parsed.models[id]);
      assert.equal(usable.ok, false, `${version} ${id}`);
      assert.match(usable.reason, /necesita CLI 2\.3\.13/, `${version} ${id}: la CLI antigua pide actualizar, no ofrece el modelo`);
    }
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
  // El validador del endpoint de la skill (api/skill/higgsfield.php): es el que recibe el cuerpo real de la CLI.
  const validateSkill = (modelId, input) => php(`$spec = ailab_skill_higgsfield_spec($argv[1]); if ($spec === null) { echo json_encode(['msg' => 'sin modelo']); exit; } echo json_encode(['input' => ailab_skill_higgsfield_input(['input' => json_decode($argv[2], true)], $spec)], JSON_UNESCAPED_UNICODE);`,
    [modelId, JSON.stringify(input)], { skillHiggsfield: true });
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
    // El endpoint de la skill acepta el mismo cuerpo y lo normaliza igual que el gateway web.
    const skill = validateSkill(model.id, payload.input);
    assert.ok(skill.input, `${model.id}: el endpoint de la skill debía aceptar ${JSON.stringify(payload.input)} y respondió ${JSON.stringify(skill)}`);
    assert.deepEqual(skill.input, server.input, `${model.id}: misma normalización que el gateway web`);
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
    const skill = validateSkill(id, input);
    assert.ok(skill.msg && !skill.input, `${id}: el endpoint de la skill debía rechazar ${JSON.stringify(input)}`);
    assert.equal(skill.msg, server.msg, `${id}: mismo motivo de rechazo`);
  }
  // Única diferencia declarada: SOUL Cinema no tiene estilos (la web los deja pasar, la skill no los ofrece).
  assert.ok(validate(cinema.id, { prompt: 'x', style_id: 'abc' }).input);
  assert.match(validateSkill(cinema.id, { prompt: 'x', style_id: 'abc' }).msg, /style_id no esta permitido/);
  // Y el catálogo no ofrece a la CLI nada que el endpoint no pueda validar: cada parámetro del catálogo está permitido.
  for (const model of [cinema, marketing]) {
    const allowed = Object.keys(model.params);
    for (const key of allowed) {
      assert.ok(!(validateSkill(model.id, { prompt: 'x', [key]: 'x' }).msg || '').includes(`El parametro ${key} no esta permitido`), `${model.id}.${key} esta en el catalogo y el endpoint lo rechaza como desconocido`);
    }
  }
  assert.equal(validateParams(cinema, { prompt: 'x', batch_size: '2' }).ok, false);
  assert.equal(validateParams(cinema, { prompt: 'x', aspect_ratio: '5:4' }).ok, false);
  assert.equal(validateParams(cinema, { prompt: 'x', resolution: '4k' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', resolution: '8k' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', quality: 'ultra' }).ok, false);
  assert.equal(validateParams(marketing, { prompt: 'x', image_urls: Array.from({ length: 17 }, (_, i) => media.image(`px${i}.png`, 400, 400)) }).ok, false);
});

test('paridad con el PHP real: el endpoint de la skill respeta HIGGSFIELD_FEATURE_FLAGS exactamente igual que el gateway web', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const cases = [
    {}, { 'higgsfield-marketing-studio-image': false }, { 'higgsfield-marketing-studio-image': true },
    { 'higgsfield-marketing-studio-image': 1 }, { 'higgsfield-marketing-studio-image': 'true' }, { 'higgsfield-soul-cinema': true },
    { 'higgsfield-soul-cinema': null }, [], 'no es un array',
  ];
  const result = php(`
    $out = [];
    foreach (json_decode($argv[1], true) as $flags) {
      $cfg = ['HIGGSFIELD_FEATURE_FLAGS' => $flags];
      foreach (['higgsfield-soul-2', 'higgsfield-soul-cinema', 'higgsfield-marketing-studio-image', 'higgsfield-genjutsu-motion-transfer'] as $model) {
        $out[] = [higgsfield_feature_enabled($cfg, $model), ailab_skill_higgsfield_feature_enabled($cfg, $model)];
      }
    }
    echo json_encode($out);`, [JSON.stringify(cases)], { higgsfield: true, skillHiggsfield: true });
  assert.equal(result.length, cases.length * 4);
  for (const [web, skill] of result) assert.equal(skill, web);
  assert.ok(result.some(([web]) => web === true) && result.some(([web]) => web === false));
  const skillSource = sourceOf('app/api/skill/higgsfield.php');
  const quote = skillSource.slice(skillSource.indexOf('function ailab_skill_higgsfield_quote'), skillSource.indexOf('function ailab_skill_higgsfield_create'));
  assert.match(quote, /feature_enabled\(\$cfg, \$model\)[\s\S]*pendiente de activacion[\s\S]*ailab_skill_higgsfield_input/, 'el flag se comprueba antes de validar, estimar o guardar nada');
});

test('paridad con el PHP real: configuración de acceso de Higgsfield (interruptores y tope) tal como figura en el repositorio', { skip: !canRunParity() && 'sin AILAB_CANONICAL_REPO o sin PHP' }, () => {
  const config = php("$c = wallet_config(); echo json_encode(['flags' => $c['HIGGSFIELD_FEATURE_FLAGS'], 'cap' => $c['HIGGSFIELD_MAX_CREDITS_PER_TASK'], 'genjutsu' => $c['HIGGSFIELD_GENJUTSU_MAX_CREDITS_PER_TASK']]);");
  assert.deepEqual(config.flags, {
    'higgsfield-soul-2': true, 'higgsfield-soul-cinema': true, 'higgsfield-marketing-studio-image': false, 'higgsfield-genjutsu-motion-transfer': true,
  }, 'Marketing Studio Image sigue desactivado en el gateway: ni la web ni la skill pueden usarlo hasta que se active en producción');
  assert.equal(config.cap, 1000);
  assert.equal(config.genjutsu, 2100);
  assert.equal(higgsfield.hardCreditCap({ id: 'genjutsu', ...catalog.models.genjutsu }), 2100);
  assert.equal(higgsfield.hardCreditCap({ id: 'soul-2', ...catalog.models['soul-2'] }), 1000);
  // Ambos endpoints piden el scope `generate`, que concede un token de dispositivo.
  assert.match(sourceOf('app/api/skill/higgsfield.php'), /wallet_require_scope\('generate'\)/);
  assert.match(sourceOf('app/api/wallet/higgsfield-gateway.php'), /wallet_require_scope\('generate'\)/);
});

test('models lista los dos modelos como disponibles y validate no gasta; el id del Playground resuelve a la skill', async () => {
  const config = path.join(temporary, 'cli-config');
  const env = { ...process.env, AILAB_SKIP_UPDATE: '1', AILAB_SKIP_NOTICES: '1', AILAB_CATALOG_PATH: catalogPath, AILAB_CONFIG_DIR: config,
    AILAB_CREDENTIALS_DIR: path.join(temporary, 'cli-credentials'), AILAB_BASE_URL: 'http://127.0.0.1:9/' };
  const cli = process.env.AILAB_TEST_RUNTIME || path.join(root, 'skills/ailab/scripts/ailab.mjs');
  const exec = (...args) => execute(process.execPath, [cli, ...args], { env, timeout: 30000 });
  const models = await exec('models');
  assert.match(models.stdout, /^ {2}higgsfield-soul-cinema · Higgsfield SOUL Cinema \[image\] · CARO$/m);
  assert.match(models.stdout, /^ {2}higgsfield-marketing-studio-image · Higgsfield Marketing Studio Image \[image\] · CARO$/m);
  assert.doesNotMatch(models.stdout, /higgsfield-(soul-cinema|marketing-studio-image) .*NO DISPONIBLE/);
  const validated = await exec('validate', 'higgsfield-soul-cinema', '--prompt', 'x', '--batch_size', '4');
  assert.match(validated.stdout, /el coste lo cotiza el servidor/);
  const info = await exec('info', 'higgsfield-marketing-studio-image');
  assert.match(info.stdout, /Higgsfield Marketing Studio Image/);
  assert.match(info.stdout, /preset_id/);
  const infoGenjutsu = await exec('info', 'higgsfield-genjutsu-motion-transfer');
  assert.match(infoGenjutsu.stdout, /Higgsfield Genjutsu \(genjutsu\)/);
});
