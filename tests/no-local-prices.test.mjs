// Desde la 2.5.0 el plugin no lleva ninguna tarifa (contrato «precio-opaco-historial-2026-11-18», secciones 1, 5 y 9):
// ni bloques `estimate` en el catálogo, ni factor de cuenta, ni cálculo local de precios, ni cifras de créditos en la
// documentación. Esta prueba recorre el árbol de la skill y el plugin generado y falla si vuelve cualquiera.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TREES = ['skills/ailab', 'plugins/ailab/skills/ailab'].map((dir) => path.join(ROOT, dir)).filter((dir) => fs.existsSync(dir));

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = TREES.flatMap(walk);
const rel = (file) => path.relative(ROOT, file);
const read = (file) => fs.readFileSync(file, 'utf8');
const scripts = files.filter((file) => /\/scripts\/.*\.mjs$/.test(file));
const catalogs = files.filter((file) => /\/catalog\/.*\.json$/.test(file));
const docs = [...files.filter((file) => /\/(SKILL\.md|references\/.*\.md|agents\/.*)$/.test(file)), path.join(ROOT, 'README.md')];

// Cifra de créditos: «14 cr», «2,55 cr», «100 créditos», «40,8 cr/s».
const CREDIT_FIGURE = /\b\d+(?:[.,]\d+)?\s?(?:cr|cr\/s|créditos|creditos)\b/i;
// Tarifas del proveedor en dólares, márgenes y multiplicadores de precio.
const TARIFF_HINTS = /\$\s?\d|\bUSD\b\s*(?:por|\/)|\bmargen\b|x\s?1,02|×\s?1[,.]\d/i;

test('hay árbol que revisar: la skill, sus scripts, el catálogo y la documentación', () => {
  assert.ok(TREES.length >= 1);
  assert.ok(scripts.length > 20, 'scripts: ' + scripts.length);
  assert.ok(catalogs.length >= 1);
  assert.ok(docs.length > 5);
});

test('el catálogo empaquetado no lleva bloques `estimate` ni cifras de créditos en ayudas, notas o descripciones', () => {
  for (const file of catalogs) {
    const text = read(file);
    assert.equal(/"estimate"\s*:/.test(text), false, rel(file) + ' lleva un bloque estimate');
    const catalog = JSON.parse(text);
    for (const [id, model] of Object.entries(catalog.models || {})) {
      assert.equal(model.estimate, undefined, rel(file) + ' ' + id);
      const strings = [];
      const collect = (value) => {
        if (typeof value === 'string') strings.push(value);
        else if (Array.isArray(value)) value.forEach(collect);
        else if (value && typeof value === 'object') Object.values(value).forEach(collect);
      };
      collect(model);
      for (const value of strings) assert.equal(CREDIT_FIGURE.test(value), false, rel(file) + ' ' + id + ': «' + value + '»');
    }
  }
});

test('los scripts no conocen factor de cuenta, caché de precio ni cálculo local de tarifas', () => {
  const forbidden = [
    [/price_factor/, 'price_factor'],
    [/frozenFactor/, 'frozenFactor'],
    [/\bpriced\s*\(/, 'priced()'],
    [/pricing\s*\.\s*factor|\.factor\s*[!=]==|factor\s*:\s*\d/, 'factor de me.pricing'],
    [/estimateCredits|pricingLines|requiresServerQuote|effectiveEstimate/, 'motor local de estimación'],
    [/HARD_CREDIT_CAPS|hardCreditCap|accountCreditCap/, 'techos de créditos locales'],
    [/\bestimate\s*:\s*\{\s*kind/, 'bloque estimate con tarifa'],
    [/credits_by_value|per_second_by|tenths|TENTHS/, 'tabla de tarifas'],
  ];
  for (const file of scripts) {
    const text = read(file);
    for (const [pattern, name] of forbidden) assert.equal(pattern.test(text), false, rel(file) + ' contiene ' + name);
    // La única mención permitida de la caché de la 2.4.0 es la que la borra al arrancar.
    const mentions = text.split('\n').filter((line) => line.includes('account-pricing'));
    if (mentions.length) assert.match(rel(file), /lib\/account\.mjs$/, rel(file) + ' menciona account-pricing');
  }
  assert.equal(files.some((file) => /lib\/(pricing|account-pricing)\.mjs$/.test(file)), false, 'los módulos de precio local ya no existen');
});

test('SKILL.md, references y README no llevan cifras de créditos, tarifas ni la idea de «precio de miembro»', () => {
  for (const file of docs) {
    const lines = read(file).split('\n');
    lines.forEach((line, index) => {
      const where = rel(file) + ':' + (index + 1) + ': ' + line;
      assert.equal(CREDIT_FIGURE.test(line), false, where);
      assert.equal(TARIFF_HINTS.test(line), false, where);
      assert.equal(/precios? de miembro/i.test(line), false, where);
    });
  }
  const skill = read(path.join(ROOT, 'skills/ailab/SKILL.md'));
  assert.match(skill, /El precio lo da siempre AILAB/);
});
