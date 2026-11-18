import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = path.join(ROOT, 'skills', 'ailab');
const runtime = fs.readFileSync(path.join(skillRoot, 'scripts', 'pg.mjs'), 'utf8');
const assistantsLib = fs.readFileSync(path.join(skillRoot, 'scripts', 'lib', 'assistants.mjs'), 'utf8');
const requestsLib = fs.readFileSync(path.join(skillRoot, 'scripts', 'lib', 'assistant-requests.mjs'), 'utf8');
const instructions = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const approval = fs.readFileSync(path.join(skillRoot, 'references', 'approval-flows.md'), 'utf8');

test('la skill fija OpenRouter multimodal y no permite enrutar por el modelo solicitado', () => {
  // assistants-v3.json (schema 3, sin precios) o el schema 2 anterior; los importes los da price.php.
  assert.match(assistantsLib, /SCHEMA_VERSIONS = \[2, 3\]/);
  assert.match(assistantsLib, /SCHEMA_VERSIONS\.includes\(value\.schema_version\)/);
  assert.doesNotMatch(assistantsLib, /estimated_credits'\)|max_authorized_credits > /);
  assert.match(assistantsLib, /billing\.type !== 'actual_usage'/);
  assert.match(runtime, /resolveAssistantModel\(catalog, catalog\.default_model\)/);
  assert.match(runtime, /--model se acepta por compatibilidad/);
  assert.match(runtime, /Modelo fijo:/);
  assert.match(runtime, /--image\|--audio\|--video ruta/);
  // Desde la 2.5.0 los textos que se instalan no nombran la plataforma intermedia (contrato, sección 2).
  assert.match(instructions, /Todos usan siempre Gemini 3\.5 Flash Lite multimodal\./);
  assert.doesNotMatch(instructions, /OpenRouter/);
  assert.doesNotMatch(instructions, /--model claude/);
});

test('un único sí autoriza Prompter y generación sin preguntas intermedias', () => {
  assert.match(instructions, /Una orden explícita de ejecutarlo ya lo autoriza/);
  assert.match(instructions, /sin solicitar otra\s+confirmación/);
  assert.match(approval, /Sin techo explícito/);
  assert.match(approval, /permite un único reintento del mismo paso sin otra confirmación/);
  assert.match(approval, /Nunca edites el manifiesto/);
  assert.match(runtime, /Si el usuario ya autorizo el flujo completo, ejecutalo ahora sin volver a preguntar/);
});

test('las peticiones conservan máximo, adjuntos y retry acotado dentro de la integridad local', () => {
  assert.match(requestsLib, /attachment_urls: \[\]/);
  assert.match(requestsLib, /max_credits_authorized/);
  assert.match(runtime, /for \(let attempt = 1; attempt <= 2; attempt\+\+\)/);
  assert.match(runtime, /retry_same_request === true/);
  assert.match(runtime, /Reintentando una vez dentro del plan ya autorizado/);
  assert.match(runtime, /response\.kind === 'rate_limited'/);
  assert.match(runtime, /await sleep\(seconds \* 1000\)/);
  assert.match(runtime, /state: 'needs_review'/);
});
