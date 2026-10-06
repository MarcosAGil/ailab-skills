import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {fileURLToPath} from 'node:url';
const execute=promisify(execFile);const ROOT=fileURLToPath(new URL('..',import.meta.url));const CLI=path.join(ROOT,'skills/ailab/scripts/pg.mjs');const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,'skills/ailab/catalog/catalog.json'),'utf8'));
test('CLI completa: muestra, alta y v4 con voz privada; recuperación no repite el POST',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-eleven-e2e-'));const credentials=path.join(dir,'credentials');fs.mkdirSync(credentials);fs.writeFileSync(path.join(credentials,'token'),'ailp_'+'T'.repeat(48));
 let base,designs=0,creates=0,audios=0;const slot='a'.repeat(32),sample='b'.repeat(32),voice='c'.repeat(32),quote='d'.repeat(32);let manifestRef;
 const json=(res,data)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,data}));};
 const server=http.createServer(async(req,res)=>{try{
  if(req.url==='/audio.mp3'){res.setHeader('Content-Type','audio/mpeg');res.end(Buffer.from('ID3fixture-audio'));return;}
  const u=new URL(req.url,base);let raw='';for await(const chunk of req)raw+=chunk;const b=raw?JSON.parse(raw):{};const action=u.searchParams.get('action')||b.action;
  if(u.pathname.endsWith('catalog-v2.json')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(catalog));return;}
  if(u.pathname.endsWith('api.php')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,user:{email:'fixture@example.test',tier:'hub'},balance:1000,costs:{'el-v4:fixture':1}}));return;}
  assert.match(req.headers.authorization||'',/^Bearer /);
  if(action==='options')return json(res,{enabled:true,can_create:true,design_enabled:true});
  if(action==='design_quote')return json(res,{credits:7,pricing_version:'paid-v1'});
  if(action==='reserve')return json(res,{id:slot});
  if(action==='design'){designs++;manifestRef=b.client_request_id;assert.equal(b.max_credits_authorized,7);return json(res,{id:sample,state:'ready',credits:7,samples:[{id:sample}]});}
  if(action==='design_status'){assert.equal(u.searchParams.get('request_id'),manifestRef);return json(res,{id:sample,slot_id:slot,state:'ready',samples:[{id:sample,expires_at:Date.now()/1000+600}]});}
  if(action==='create'){creates++;assert.equal(b.sample_id,sample);assert.equal(b.max_credits_authorized,100);assert.equal(b.renewal_confirmed,undefined);return json(res,{id:voice,state:'available',services:['tts:v4']});}
  if(action==='create_lookup')return json(res,{id:voice,state:'available',services:['tts:v4']});
  if(action==='v4_quote'){assert.equal(b.input.private_voice_id,voice);assert.equal(b.input.voice_id,undefined);return json(res,{quote_id:quote,expires_at:new Date(Date.now()+600000).toISOString(),estimated_credits:1,max_credits_authorized:1});}
  if(action==='generate'){audios++;assert.equal(b.input.private_voice_id,voice);assert.equal(b.quote_id,quote);assert.equal(b.max_credits_authorized,1);return json(res,{taskId:'el-v4:fixture',state:'pending'});}
  if(action==='v4_status')return json(res,{taskId:'el-v4:fixture',state:'success',audio:base+'audio.mp3',credits:1});
  throw new Error('Ruta inesperada '+u.pathname+' / '+action);
 }catch(e){res.statusCode=500;json(res,{error:e.message});}});
 // El audio público es un resultado ya generado, no una API del proveedor.
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});});
 const env={...process.env,AILAB_SKIP_UPDATE:'1',AILAB_CONFIG_DIR:path.join(dir,'config'),AILAB_CREDENTIALS_DIR:credentials,AILAB_BASE_URL:base,AILAB_GENERATION_BASE_URL:base,AILAB_CATALOG_PATH:path.join(ROOT,'skills/ailab/catalog/catalog.json')};
 const run=async(...args)=>(await execute(process.execPath,[CLI,...args],{env,timeout:10000})).stdout;
 const d=JSON.parse(await run('voice-prepare','design','--description','Voz tranquila para narración de documentales','--text','x'.repeat(100)));
 await run('voice-submit',d.manifest_id,'--confirmed');await run('voice-submit',d.manifest_id,'--confirmed');assert.equal(designs,1);
 const c=JSON.parse(await run('voice-prepare','create','--name','Prueba','--sample',sample,'--request',d.manifest_id));await run('voice-submit',c.manifest_id,'--confirmed');await run('voice-submit',c.manifest_id,'--confirmed');assert.equal(creates,1);
 const p=await run('prepare','eleven-tts','--version','v4','--private_voice_id',voice,'--text','Hola');const manifest=p.match(/submit ([0-9a-f-]{36}) --confirmed/)[1];
 const result=await run('submit',manifest,'--confirmed','--output',path.join(dir,'audio'));assert.match(result,/Guardado/);assert.equal(audios,1);assert.equal(fs.readdirSync(path.join(dir,'audio')).filter(f=>f.endsWith('.mp3')).length,1);
});
