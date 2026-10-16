import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {validateCatalogShape, validateParams, estimateCredits, requiresServerQuote} from '../skills/ailab/scripts/lib/catalog.mjs';
import {buildPayload} from '../skills/ailab/scripts/adapters/labs-queue-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalogPath=path.join(root,'skills/ailab/catalog/catalog.json');
const model={id:'krea-3',...validateCatalogShape(JSON.parse(fs.readFileSync(catalogPath))).models['krea-3']};
const execute=promisify(execFile);

test('Krea 3 exige cotización, valida incompatibilidades y no expone semilla',()=>{
  assert.equal(requiresServerQuote(model),true);
  assert.equal(estimateCredits(model,{}).credits,null);
  assert.equal(model.params.seed,undefined);
  const valid={prompt:'Edita <image-1>',mode:'edit',image_urls:['a.png'],variant:'berry',reasoning_level:'high',resolution:'1k'};
  assert.equal(validateParams(model,valid).ok,true);
  for(const change of [{image_urls:[]},{image_urls:Array(9).fill('x.png')},{variant:'jam',negative_prompt:'rojo'},{mode:'t2i'},{resolution:'auto'},{resolution:'custom',width:3200,height:3200},{prompt:' '},{prompt:'x'.repeat(5001)}]) {
    assert.equal(validateParams(model,{...valid,...change}).ok,false,JSON.stringify(change));
  }
  const payload=buildPayload(model,{...valid,seed:123,price:0,reference_dimensions:[{width:1,height:1}]},{image_urls:['https://uploads.test/a.png']});
  assert.deepEqual(payload.input.image_urls,['https://uploads.test/a.png']);
  for(const key of ['seed','price','reference_dimensions'])assert.equal(payload.input[key],undefined);
});

test('CLI real Krea 3: prepare congela la cotización y submit recupera el mismo trabajo',async t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-krea-cli-'));
  const credentials=path.join(temp,'credentials'),config=path.join(temp,'config');
  fs.mkdirSync(credentials);fs.writeFileSync(path.join(credentials,'token'),'ailp_'+'K'.repeat(48),{mode:0o600});
  const requests=[];let base;
  const server=http.createServer(async(req,res)=>{
    const chunks=[];for await(const c of req)chunks.push(c);
    const body=JSON.parse(Buffer.concat(chunks).toString()||'{}');
    const url=new URL(req.url,base);requests.push({path:url.pathname,action:url.searchParams.get('action'),body});
    if(url.pathname==='/result.png') {
      res.writeHead(200,{'content-type':'image/png'});
      return res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==','base64'));
    }
    let response={ok:true,user:{email:'test@example.invalid',tier:'hub'},balance:1000};
    if(body.action==='task_costs')response={ok:true,costs:{'fal:krea-cli-job':6}};
    if(url.pathname.endsWith('/fal-gateway.php')) {
      const action=url.searchParams.get('action');
      if(action==='quote')response={code:200,data:{quote_id:'signed-test-quote',estimated_credits:6,max_credits_authorized:6,expires_at:new Date(Date.now()+600000).toISOString()}};
      else if(action==='submit')response={code:200,data:{request_id:'krea-cli-job'}};
      else response={code:200,data:{status:'COMPLETED',images:[{url:base+'result.png'}]}};
    }
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(response));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/`;
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});});
  const env={...process.env,AILAB_SKIP_UPDATE:'1',AILAB_BASE_URL:base,AILAB_GENERATION_BASE_URL:base,AILAB_CATALOG_PATH:catalogPath,AILAB_CONFIG_DIR:config,AILAB_CREDENTIALS_DIR:credentials,AILAB_OUTPUT_DIR:path.join(temp,'out')};
  const cli=process.env.AILAB_TEST_RUNTIME||path.join(root,'skills/ailab/scripts/ailab.mjs');
  const run=(...args)=>execute(process.execPath,[cli,...args],{env,timeout:30000});
  const {stdout}=await run('prepare','krea-3','--prompt','Una imagen','--max-credits','6');
  const id=/Manifiesto: ([0-9a-f-]{36})/.exec(stdout)?.[1];assert.ok(id,stdout);
  const manifest=JSON.parse(fs.readFileSync(path.join(config,'manifests',id+'.json')));
  assert.equal(manifest.quote_id,'signed-test-quote');assert.equal(manifest.quote_max_credits,6);
  assert.equal(requests.filter(r=>r.action==='submit').length,0);
  const completed=await run('submit',id,'--confirmed');
  assert.match(completed.stdout,/Coste real: 6 cr/);
  const sends=requests.filter(r=>r.action==='submit');assert.equal(sends.length,1);
  assert.equal(sends[0].body.quote_id,manifest.quote_id);assert.equal(sends[0].body.max_credits_authorized,6);
  assert.equal(sends[0].body.input.mode,'t2i');assert.equal(sends[0].body.input.variant,'berry');
  await assert.rejects(run('submit',id,'--confirmed'),/ya se ejecutó/);
  await run('status','fal:krea-cli-job');
  assert.equal(requests.filter(r=>r.action==='submit').length,1,'No debe duplicar un envío confirmado');
});
