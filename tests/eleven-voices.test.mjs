import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-voices-client-'));
process.env.AILAB_CONFIG_DIR=path.join(root,'config');process.env.AILAB_CREDENTIALS_DIR=path.join(root,'credentials');
const {prepareVoice,submitVoice,voiceStatus,listElevenVoices,runVoiceCommand}=await import('../skills/ailab/scripts/lib/voice-commands.mjs');
const {loadManifest}=await import('../skills/ailab/scripts/lib/manifest.mjs');
const {validateParams,requiresServerQuote}=await import('../skills/ailab/scripts/lib/catalog.mjs');
const {privateVoiceSample,normalize}=await import('../skills/ailab/scripts/lib/http.mjs');
const adapter=await import('../skills/ailab/scripts/adapters/eleven-v1.mjs');
const cat=JSON.parse(fs.readFileSync(new URL('../skills/ailab/catalog/catalog.json',import.meta.url),'utf8'));
const original=globalThis.fetch;let calls=[];
const slot='a'.repeat(32),sample='b'.repeat(32),voice='c'.repeat(32);
function mock(handler) {calls=[];globalThis.fetch=async(url,init={})=>{const u=new URL(url);const body=typeof init.body==='string'?JSON.parse(init.body):init.body;calls.push({action:u.searchParams.get('action'),method:init.method||'GET',body,url:u});
  const d=await handler(calls.at(-1));return d instanceof Response?d:Response.json({ok:true,data:d});};}
const options={can_create:true,design_enabled:true};
const quiet=()=>{};
test.after(()=>{globalThis.fetch=original;fs.rmSync(root,{recursive:true,force:true});});
test.afterEach(()=>{globalThis.fetch=original;});
test('listing merges community and private references without conflating provider and private IDs',async()=>{
  let printed;mock(()=>({voices:[{voice_id:'public1234567890',name:'A'}],community_voices:[{voice_id:'public1234567890',name:'A'},{voice_id:'other1234567890',name:'B'}],private_voices:[{id:voice,name:'Propia',state:'available',services:['tts:v4'],provider_id:'must-not-leak'}]}));
  await listElevenVoices({},v=>printed=JSON.parse(v));assert.equal(printed.voices.length,2);assert.equal(printed.private_voices[0].private_voice_id,voice);assert.equal('provider_id' in printed.private_voices[0],false);
});
test('library searches one requested page and selecting requires confirmation before HTTP',async()=>{
  mock(()=>({voices:[],page:2,has_more:true}));await listElevenVoices({language:'en',search:'story',page:'2'},quiet);
  assert.equal(calls.length,1);assert.equal(calls[0].body.page,2);
  await assert.rejects(runVoiceCommand('voice-select',['public1234567890'],{owner:'owner1234567890'},quiet),/Confirma/);assert.equal(calls.length,1);
});
test('a sample plan quotes without spending and rejects a user ceiling before reserving a slot',async()=>{
  mock(({action})=>action==='options'?options:{credits:7,pricing_version:'paid-v1'});
  await assert.rejects(prepareVoice('design',{description:'Voz suave y cálida para narración',text:'x'.repeat(100),'max-credits':'6'},quiet),/supera/);
  assert.deepEqual(calls.map(c=>c.action),['options','design_quote']);
});
test('sample prepare and submit freeze the exact cost and repeated submit only reads the same request',async()=>{
  mock(({action})=>action==='options'?options:action==='design_quote'?{credits:7,pricing_version:'paid-v1'}:action==='reserve'?{id:slot}:{id:sample,state:'ready',credits:7,samples:[{id:sample}]});
  const m=await prepareVoice('design',{description:'Voz suave y cálida para narración',text:'ñ'.repeat(100)},quiet);
  assert.equal(loadManifest(m.manifest_id).max_credits_authorized,7);assert.equal(calls.filter(c=>c.action==='design').length,0);
  await assert.rejects(submitVoice(m.manifest_id,{},quiet),/autorización/);
  await submitVoice(m.manifest_id,{confirmed:true},quiet);await submitVoice(m.manifest_id,{confirmed:true},quiet);
  assert.equal(calls.filter(c=>c.action==='design').length,1);assert.equal(calls.at(-1).action,'design_status');
  assert.equal(calls.find(c=>c.action==='design').body.client_request_id,m.manifest_id);
});
test('lost creation response preserves its UUID and never sends a second POST',async()=>{
  mock(({action})=>{if(action==='options')return options;if(action==='design_status')return{state:'ready',slot_id:slot,samples:[{id:sample,expires_at:Date.now()/1000+600}]};if(action==='create')throw new Error('connection lost');return{id:voice,state:'review'};});
  const m=await prepareVoice('create',{name:'Mi voz',sample,request:'12345678-1234-4123-8123-123456789abc'},quiet);
  await assert.rejects(submitVoice(m.manifest_id,{confirmed:true},quiet),/voice-status/);assert.ok(loadManifest(m.manifest_id).attempted_at);
  await submitVoice(m.manifest_id,{confirmed:true},quiet);assert.equal(calls.filter(c=>c.action==='create').length,1);assert.equal(calls.at(-1).action,'create_lookup');
});
test('a forged manifest price or changed file cannot trigger an HTTP mutation',async()=>{
  mock(()=>({id:voice,state:'available'}));const m=await prepareVoice('delete',{id:voice},quiet);
  const p=path.join(root,'config/manifests',m.manifest_id+'.json');const stored=JSON.parse(fs.readFileSync(p));stored.params.id='d'.repeat(32);fs.writeFileSync(p,JSON.stringify(stored));
  await assert.rejects(submitVoice(m.manifest_id,{confirmed:true},quiet),/ha cambiado/);assert.equal(calls.length,0);
});
test('retention is off without a date; explicit conservation uses the server price and ceiling',async()=>{
  mock(()=>({credits:45}));const off=await prepareVoice('renew',{id:voice},quiet);assert.equal(off.params.enabled,false);assert.equal(off.max_credits_authorized,0);assert.equal(calls.length,0);
  await assert.rejects(prepareVoice('renew',{id:voice,until:'2026-10-20','max-credits':'44'},quiet),/supera/);
  const on=await prepareVoice('renew',{id:voice,until:'2026-10-20','max-credits':'45'},quiet);assert.equal(on.params.enabled,true);assert.equal(on.max_credits_authorized,45);
});
test('cloning rejects missing consent, invalid audio and unreadable authorization before uploads',async()=>{
  mock(()=>options);
  await assert.rejects(prepareVoice('clone',{name:'Mi voz',audio:'missing'},quiet),/autorización/);
  await assert.rejects(prepareVoice('clone',{name:'Mi voz',audio:'missing','rights-confirmed':true},quiet),/MP3/);
  assert.equal(calls.some(c=>c.method==='POST'),false);
});
test('cloning sends evidence and the original recording once, with no permanent upload URL',async()=>{
  const audio=path.join(root,'voice.wav'),evidence=path.join(root,'consent.txt');const wav=Buffer.alloc(16044);wav.write('RIFF');wav.writeUInt32LE(16036,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);fs.writeFileSync(audio,wav);fs.writeFileSync(evidence,'Autorización ficticia para la prueba.');
  const crypto=await import('node:crypto');const sha=crypto.createHash('sha256').update(fs.readFileSync(evidence)).digest('hex');
  mock(({action,body})=>{if(action==='options')return options;if(action==='reserve')return{id:slot};if(action==='upload'){assert.equal(body.get('kind'),'evidence');return{id:sample,sha256:sha};}if(action==='create'){const p=JSON.parse(body.get('payload'));assert.equal(p.evidence_id,sample);assert.equal(p.consent_evidence_hash,sha);assert.equal(p.max_credits_authorized,100);assert.equal(p.renewal_confirmed,undefined);assert.equal(body.get('audio').size,wav.length);return{id:voice,state:'available'};}return{id:voice,state:'available'};});
  const m=await prepareVoice('clone',{name:'Prueba',audio,evidence,'rights-confirmed':true},quiet);await submitVoice(m.manifest_id,{confirmed:true},quiet);await submitVoice(m.manifest_id,{confirmed:true},quiet);
  assert.equal(calls.filter(c=>c.action==='create').length,1);assert.equal(calls.filter(c=>c.action==='upload').length,1);assert.ok(fs.existsSync(audio));
});
test('TTS uses a private AILAB ID exclusively, validates IDs and requests server quotes for v4',()=>{
  const m=cat.models['eleven-tts'];assert.equal(validateParams(m,{version:'v4',text:'Hola',private_voice_id:voice}).ok,true);
  assert.equal(validateParams(m,{version:'v4',text:'Hola',private_voice_id:voice,voice_id:'public1234567890'}).ok,false);
  assert.equal(validateParams(m,{version:'v4',text:'Hola',private_voice_id:'../private'}).ok,false);
  assert.equal(requiresServerQuote(m,{version:'v4'}),true);assert.equal(requiresServerQuote(m,{version:'flash'}),false);
});
test('v4 quote rejects malformed responses and returns the exact server amount',async()=>{
  const payload={input:{version:'v4',text:'hola',voice_id:'public1234567890'}};
  mock(()=>({credits:1}));assert.equal((await adapter.quote(cat.models['eleven-tts'],payload)).ok,false);
  mock(()=>({quote_id:slot,expires_at:new Date(Date.now()+600000).toISOString(),estimated_credits:1,max_credits_authorized:1}));
  assert.equal((await adapter.quote(cat.models['eleven-tts'],payload)).quote.estimated_credits,1);
});
test('sample downloads forbid redirects and reject non-MP3 responses',async()=>{
  globalThis.fetch=async(url,init)=>{assert.equal(init.redirect,'error');assert.match(String(url),/private-voices.php\?action=media/);return new Response('ID3audio',{headers:{'content-type':'audio/mpeg'}});};
  assert.equal((await privateVoiceSample(sample)).toString(),'ID3audio');
  globalThis.fetch=async()=>new Response('<html>bad</html>',{headers:{'content-type':'text/html'}});await assert.rejects(privateVoiceSample(sample),/no disponible/);
});
test('private API errors preserve actionable messages',()=>{assert.equal(normalize(400,{ok:false,message:'Exporta MP3 estándar.'},'application/json').message,'Exporta MP3 estándar.');});
