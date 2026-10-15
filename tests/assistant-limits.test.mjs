import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantLimits, validateAssistantBatch, LEGACY_ASSISTANT_LIMITS } from '../skills/ailab/scripts/lib/assistant-limits.mjs';
const limits = { max_attachments:50, max_by_kind:{image:50,audio:2,video:2},max_bytes:{image:10485760,audio:12582912,video:12582912},max_total_bytes:12582912,max_inline_bytes:12582912 };
test('los límites remotos permiten siete referencias sin inventar capacidades', () => {
  assert.equal(assistantLimits(limits), limits);
  assert.doesNotThrow(() => validateAssistantBatch(Array(7).fill({kind:'image',size:1000}),limits));
  assert.throws(() => validateAssistantBatch(Array(51).fill({kind:'image',size:1000}),limits), /50/);
  assert.throws(() => validateAssistantBatch(Array(7).fill({kind:'image',size:1000}),LEGACY_ASSISTANT_LIMITS), /6/);
});
test('se rechazan exceso de medios, tamaño agregado y contratos mal formados antes de subir', () => {
  assert.throws(() => validateAssistantBatch(Array(3).fill({kind:'audio',size:1000}),limits), /Máximo: 2/);
  assert.throws(() => validateAssistantBatch([{kind:'image',size:7*1048576},{kind:'video',size:6*1048576}],limits), /tamaño conjunto/);
  assert.throws(() => validateAssistantBatch([{kind:'image',size:0}],limits), /vacía/);
  for (const invalid of [null,{...limits,max_attachments:1000},{...limits,max_bytes:{...limits.max_bytes,video:-1}}]) assert.throws(() => assistantLimits(invalid));
});
