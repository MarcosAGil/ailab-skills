import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

// AILAB publica README.md, el SKILL.md de cada skill y sus references (o guide_references) como
// guide-knowledge.json, con un tope de 131.072 bytes. Este test reproduce esa construccion y exige
// al menos un 10 % de margen para que un cambio de documentacion no rompa la publicacion.
const GUIDE_LIMIT = 131072;
const GUIDE_TARGET = 118000;

function knowledgeBytes() {
  const registry = JSON.parse(read('registry.json'));
  const document = (relative) => ({ path: relative, text: read(relative) });
  const knowledge = {
    schema_version: 1,
    revision: '0'.repeat(40),
    common: [document('README.md')],
    skills: registry.skills.map((skill) => ({
      id: skill.id,
      version: skill.version,
      documents: [document(skill.path + '/SKILL.md'),
        ...(skill.guide_references
          ? skill.guide_references.map((p) => skill.path + '/' + p)
          : fs.existsSync(path.join(ROOT, skill.path, 'references'))
            ? fs.readdirSync(path.join(ROOT, skill.path, 'references')).filter((n) => n.endsWith('.md')).sort().map((n) => skill.path + '/references/' + n)
            : []).map(document)],
    })),
  };
  for (const skill of knowledge.skills) for (const doc of skill.documents) doc.sha256 = '0'.repeat(64);
  knowledge.common[0].sha256 = '0'.repeat(64);
  return Buffer.byteLength(JSON.stringify(knowledge) + '\n');
}

test('la documentacion que alimenta la guia de la web deja al menos un 10 % de margen bajo el tope de 128 KiB', () => {
  const bytes = knowledgeBytes();
  assert.ok(bytes < GUIDE_TARGET, 'guide-knowledge.json ocuparia ' + bytes + ' bytes; el objetivo es menos de ' + GUIDE_TARGET + ' (tope ' + GUIDE_LIMIT + ').');
  assert.ok(bytes < GUIDE_LIMIT * 0.9);
});

test('ningun documento de la guia supera 32 KiB; README y la skill ailab no llevan rayas largas', () => {
  const registry = JSON.parse(read('registry.json'));
  for (const skill of registry.skills) {
    for (const file of [skill.path + '/SKILL.md', ...(skill.guide_references || []).map((p) => skill.path + '/' + p)]) assert.ok(Buffer.byteLength(read(file)) <= 32768, file);
  }
  assert.ok(Buffer.byteLength(read('README.md')) <= 32768);
  for (const file of ['README.md', 'skills/ailab/SKILL.md', 'docs/instalacion-plugin.md']) assert.equal(read(file).includes(String.fromCharCode(0x2014)), false, file);
});
