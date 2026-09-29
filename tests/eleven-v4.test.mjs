import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// Las pruebas HTTP usan solo directorios vacíos temporales, nunca credenciales reales.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-v4-client-'));
process.env.AILAB_CONFIG_DIR=temp;process.env.AILAB_CREDENTIALS_DIR=temp;
const {validateParams,estimateCredits,validateCatalogShape}=await import('../skills/ailab/scripts/lib/catalog.mjs');
const adapter=await import('../skills/ailab/scripts/adapters/eleven-v1.mjs');
const catalog=JSON.parse(fs.readFileSync(new URL('../skills/ailab/catalog/catalog.json',import.meta.url),'utf8'));
const model=structuredClone(catalog.models['eleven-tts']);
model.params.version.values.push('v4');model.min_cli_version='2.3.3';
model.estimate={kind:'per_1000_chars',characters_param:'text',rate_param:'version',credits_per_1000_by_value:{flash:10.2,multi:20.4,v3:20.4,v4:16.32},minimum_credits:1,round_up:true,approximate:false,promo:{label:'Cierre anticipado de AILAB',until:'2026-10-11T00:00:00Z',credits_per_1000_by_value:{v4:4.488}}};
const given={version:'v4',text:'Hola Cristina.',voice_id:'dNjJKg63Fr5AXwIdkATa'};

test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
test('v4 is staged, absent from the active published catalog',()=>{assert.ok(!catalog.models['eleven-tts'].params.version.values.includes('v4'));});
test('strict catalog accepts per-version prices and bounded promotion',()=>{const c=structuredClone(catalog);c.models['eleven-tts']=model;assert.equal(validateCatalogShape(c),c);});
test('v4 omits unsupported defaults while old versions keep their full payload',()=>{const v=validateParams(model,given);assert.equal(v.ok,true);assert.ok(!('style' in v.params));assert.ok(!('speed' in v.params));const b=adapter.buildPayload(model,v.params,{});assert.deepEqual(b.input.voice_settings,{stability:0.5,similarity_boost:0.75});const old=validateParams(catalog.models['eleven-tts'],{version:'flash',text:'Hola'});assert.equal(adapter.buildPayload(model,old.params,{}).input.voice_settings.speed,1);});
test('explicit unsupported options or unverified voice are refused before submitting',()=>{for(const key of ['style','speed'])assert.equal(validateParams(model,{...given,[key]:0}).ok,false);assert.equal(validateParams(model,{...given,voice_id:'another123456789'}).ok,false);});
test('UTF-8 counts codepoints with exact 10k boundary',()=>{const v=validateParams(model,{...given,text:'😀'.repeat(10000)});assert.equal(v.ok,true);assert.equal(validateParams(model,{...given,text:'😀'.repeat(10001)}).ok,false);});
test('short text is billed per character, not in 1000-character blocks',()=>{assert.equal(estimateCredits(model,{...given,text:'x'.repeat(74)},Date.parse('2026-09-29')).credits,1);assert.equal(estimateCredits(model,{...given,text:'x'.repeat(1000)},Date.parse('2026-09-29')).credits,5);assert.equal(estimateCredits(model,{...given,text:'x'.repeat(1000)},Date.parse('2026-10-11T00:00:00Z')).credits,17);assert.equal(estimateCredits(model,{...given,text:'😀'.repeat(1000)},Date.parse('2026-09-29')).credits,5);});
test('invalid or absent promotion uses ordinary rate',()=>{const m=structuredClone(model);delete m.estimate.promo;assert.equal(estimateCredits(m,{...given,text:'x'.repeat(1000)},Date.parse('2026-09-29')).credits,17);m.estimate.promo={until:'invalid',credits_per_1000_by_value:{v4:0.1}};assert.equal(estimateCredits(m,{...given,text:'x'.repeat(1000)},Date.parse('2026-09-29')).credits,17);});
test('pending response is a recoverable task; status reads without a generation POST',async()=>{const original=globalThis.fetch;let calls=[];globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);calls.push(body);return new Response(JSON.stringify({code:200,data:body.action==='generate'?{taskId:'el-v4:fixture',state:'pending'}:{taskId:'el-v4:fixture',state:'success',audio:'https://media.example.test/voice.mp3',credits:1}}),{headers:{'content-type':'application/json'}});};try{const r=await adapter.submit(model,adapter.buildPayload(model,validateParams(model,given).params,{}),{client_request_id:'fixture',max_credits_authorized:1});assert.equal(r.ok,true);assert.equal(r.taskRef.version,'v4');assert.deepEqual(r.taskRef.immediateUrls,[]);assert.equal((await adapter.check(model,r.taskRef)).status,'success');assert.deepEqual(calls.map(b=>b.action),['generate','v4_status']);}finally{globalThis.fetch=original;}});
