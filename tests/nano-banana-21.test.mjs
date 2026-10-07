import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'ailab-nano21-cli-'));
process.env.AILAB_CONFIG_DIR = path.join(isolated,'config');
process.env.AILAB_CREDENTIALS_DIR = path.join(isolated,'credentials');
process.env.AILAB_BASE_URL = 'https://ailendra.invalid/ailab/';
process.env.AILAB_GENERATION_BASE_URL = process.env.AILAB_BASE_URL;
process.env.AILAB_ALLOW_COOKIE_AUTH = '0';
test.after(()=>fs.rmSync(isolated,{recursive:true,force:true}));
const {validateCatalogShape,validateParams,estimateCredits} = await import('../skills/ailab/scripts/lib/catalog.mjs');
const {buildPayload,check} = await import('../skills/ailab/scripts/adapters/jobs-v1.mjs');
const catalog = validateCatalogShape(JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json','utf8')));
const model = catalog.models['nano-banana-2-1'];
const reference = path.join(isolated,'reference.png');
fs.writeFileSync(reference,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7r8AAAAASUVORK5CYII=','base64'));
test('Nano 2.1: 90 combinaciones, precios y referencias ordenadas',()=>{
  assert.equal(model.driver,'jobs-v1');
  let count=0;
  for(const mode of ['t2i','edit']) for(const resolution of ['1K','2K','4K']) for(const aspect_ratio of model.params.aspect_ratio.values){
    const given={mode,resolution,aspect_ratio,prompt:'Prueba Nano 2.1'};
    if(mode==='edit') given.image_urls=Array(14).fill(reference);
    const valid=validateParams(model,given);
    assert.equal(valid.ok,true,valid.errors.join('\n'));
    assert.equal(estimateCredits(model,valid.params).credits,{'1K':5,'2K':7,'4K':10}[resolution]);
    const images=Array.from({length:14},(_,i)=>`https://uploads.example/${i}.png`);
    const payload=buildPayload(model,valid.params,mode==='edit'?{image_urls:images}:{});
    assert.equal(payload.model,model.id);
    assert.deepEqual(payload.input.image_urls,mode==='edit'?images:undefined);
    count++;
  }
  assert.equal(count,90);
});
test('límites Unicode, modo, referencias y campos que no existen',()=>{
  assert.equal(validateParams(model,{prompt:'😀'.repeat(20000)}).ok,true);
  for(const given of [{prompt:'😀'.repeat(20001)},{prompt:' '},{resolution:'8K'},{aspect_ratio:'invalid'},{mode:'edit'},{image_urls:[reference]},{mode:'edit',image_urls:Array(15).fill(reference)},{num_images:2},{seed:12},{quality:'high'}]){
    assert.equal(validateParams(model,{prompt:'test',...given}).ok,false,JSON.stringify(given).slice(0,150));
  }
  const malformed=path.join(isolated,'bad.png'); fs.writeFileSync(malformed,'not an image');
  assert.equal(validateParams(model,{mode:'edit',prompt:'Edit',image_urls:[malformed]}).ok,false);
});
test('resultado ausente se recupera sin reenviar; resultado final se conserva',async()=>{
  const previous=globalThis.fetch; let calls=0;
  globalThis.fetch=async (_url,options)=>{
    assert.notEqual(options?.method,'POST'); calls++;
    return new Response(JSON.stringify({code:200,data:{state:'success',...(calls>1?{resultJson:JSON.stringify({resultUrls:['https://result.example/out.png']})}:{})}}),{headers:{'content-type':'application/json'}});
  };
  try{
    assert.equal((await check(model,{providerRequestId:'same-task'})).status,'pending');
    const result=await check(model,{providerRequestId:'same-task'});
    assert.equal(result.status,'success'); assert.deepEqual(result.urls,['https://result.example/out.png']);
  }finally{globalThis.fetch=previous;}
});
