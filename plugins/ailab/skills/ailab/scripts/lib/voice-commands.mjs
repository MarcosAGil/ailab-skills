// Usa exclusivamente los servicios AILAB y la misma lógica comercial de la web.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { servicePost, serviceGet, privateVoiceMultipart, privateVoiceSample, explain } from './http.mjs';
import { createManifest, loadManifest, manifestExpired, markSubmitted } from './manifest.mjs';
import { stableStringify } from './catalog.mjs';
import { inspectPricingMetadata, rehashMatches } from './files.mjs';
import { resolveOutputDir, nextFreePath } from './output.mjs';

const PV='api/wallet/private-voices.php';
const EL='api/wallet/elevenlabs-gateway.php';
const HEX=/^[0-9a-f]{32}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ref=value=>{if(!HEX.test(value||''))throw new Error('Referencia AILAB no válida.');return value;};
const unwrap=r=>{if(!r.ok)throw new Error(explain(r));return r.data;};
function optsOnly(opts,allowed) { for(const key of Object.keys(opts))if(!allowed.includes(key)||Array.isArray(opts[key]))throw new Error('Parámetro no válido o repetido: --'+key); }
function textOption(opts,key,min,max) {
  if(opts[key]!==undefined&&opts[key+'-file']!==undefined)throw new Error('Usa --'+key+' o --'+key+'-file, no ambos.');
  let v=opts[key];
  if(opts[key+'-file']!==undefined){const p=fs.realpathSync(String(opts[key+'-file']));if(!fs.statSync(p).isFile()||fs.statSync(p).size>16384)throw new Error('Archivo de texto demasiado grande.');v=fs.readFileSync(p,'utf8');}
  if(typeof v!=='string'||Array.from(v.trim()).length<min||Array.from(v.trim()).length>max)throw new Error(key+': admite de '+min+' a '+max+' caracteres.');return v.trim();
}
function ceiling(opts,credits){if(opts['max-credits']!==undefined&&(!Number.isFinite(Number(opts['max-credits']))||Number(opts['max-credits'])<credits))throw new Error('El coste de '+credits+' cr supera --max-credits. No se ha enviado nada.');}
function evidenceFile(value) {
  const p=fs.realpathSync(String(value||'')),s=fs.statSync(p);if(!s.isFile()||s.size<1||s.size>20971520)throw new Error('Autorización: archivo PDF o texto de hasta 20 MB.');
  const bytes=fs.readFileSync(p);const mime=bytes.subarray(0,5).toString()==='%PDF-'?'application/pdf':null;
  if(!mime&&(bytes.includes(0)||!Buffer.from(bytes.toString('utf8')).equals(bytes)))throw new Error('La autorización debe ser PDF o texto UTF-8.');
  return {path:p,size:s.size,mime:mime||'text/plain',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),param:'evidence'};
}
const print=(out,data)=>out(JSON.stringify(data,null,2));

export async function listElevenVoices(opts={},out=console.log) {
  optsOnly(opts,['search','language','accent','tone','use_case','sort','page']);
  if(Object.keys(opts).length){const page=Number(opts.page||0);if(!Number.isSafeInteger(page)||page<0||page>50)throw new Error('Página de 0 a 50.');
    return print(out,unwrap(await servicePost(EL+'?action=library_search',{action:'library_search',...opts,language:opts.language||'es',page})));}
  const d=unwrap(await servicePost(EL+'?action=voices',{action:'voices'}));
  const publicVoices=[...(d.voices||[]),...(d.community_voices||[])];const seen=new Set();
  print(out,{voices:publicVoices.filter(v=>!seen.has(v.voice_id)&&seen.add(v.voice_id)),
    private_voices:(d.private_voices||[]).map(v=>({private_voice_id:v.id,name:v.name,state:v.state,paid_until:v.paid_until,services:v.services})),
    hint:'Busca en la biblioteca con voices eleven --language es --search nombre. Usa voice-select para incorporar una voz utilizable.'});
}

export async function prepareVoice(mode,opts,out=console.log) {
  const allowed={design:['description','description-file','text','text-file','max-credits'],clone:['name','audio','evidence','rights-confirmed','max-credits'],
    create:['name','sample','request','slot','max-credits'],renew:['id','until','max-credits'],delete:['id'],resume:['id','max-credits']};
  if(!allowed[mode])throw new Error('Modo: design, clone, create, renew, delete o resume.');optsOnly(opts,allowed[mode]);
  let params={},files=[],credits=0;
  if(['design','clone','create'].includes(mode)){
    const options=unwrap(await serviceGet(PV,{action:'options'}));
    if(!options.can_create)throw new Error(options.message||'No puedes crear otra voz ahora. Consulta voice-list o Mis voces.');
    if(mode==='design'&&!options.design_enabled)throw new Error(options.design_message||'Diseño pausado.');
  }
  if(mode==='design') {
    params={action:'design',description:textOption(opts,'description',20,1000),text:textOption(opts,'text',100,1000)};
    const q=unwrap(await servicePost(PV+'?action=design_quote',params));
    if(!Number.isSafeInteger(q.credits)||q.credits<1||typeof q.pricing_version!=='string')throw new Error('Cotización de muestras no válida.');
    credits=q.credits;ceiling(opts,credits);params.pricing_version=q.pricing_version;params.samples_confirmed=true;
  } else if(mode==='clone') {
    if(opts['rights-confirmed']!==true)throw new Error('Necesitas autorización del titular y --rights-confirmed, también para tu propia voz.');
    const audio=inspectPricingMetadata(opts.audio);if(!audio.ok||!['audio/mpeg','audio/wav'].includes(audio.mime)||audio.size>20971520||!(audio.duration>0&&audio.duration<=120))throw new Error('Grabación MP3/WAV de hasta 20 MB y 120 s, con duración legible.');
    files=[{...audio,param:'audio'},evidenceFile(opts.evidence)];credits=100;
    params={action:'create',mode:'clone',name:textOption(opts,'name',1,80),rights_confirmed:true,creation_confirmed:true,consent_evidence_hash:files[1].sha256};
  } else if(mode==='create') {
    credits=100;params={action:'create',mode:'design',name:textOption(opts,'name',1,80),sample_id:ref(opts.sample),creation_confirmed:true};
    if(opts.request){if(!uuid.test(opts.request))throw new Error('Referencia de muestras no válida.');const d=unwrap(await serviceGet(PV,{action:'design_status',request_id:opts.request}));
      if(d.state!=='ready'||!d.samples.some(s=>s.id===params.sample_id&&s.expires_at>Date.now()/1000))throw new Error('La muestra no está disponible para el alta.');params.slot_id=d.slot_id;
    }else params.slot_id=ref(opts.slot);
  } else if(mode==='renew') {
    params={action:'renewal',id:ref(opts.id),enabled:!!opts.until,confirmed:true,price:15};
    if(opts.until){const q=unwrap(await serviceGet(PV,{action:'retention_quote',id:params.id,until:opts.until}));credits=q.credits;
      if(!Number.isSafeInteger(credits)||credits<0)throw new Error('Cotización de conservación no válida.');params.until_date=opts.until;}
  } else {params={action:mode==='resume'?'resume':'delete',id:ref(opts.id),confirmed:true};credits=mode==='resume'?15:0;}
  ceiling(opts,credits);
  if(['clone','design'].includes(mode)){
    const slot=unwrap(await servicePost(PV+'?action=reserve',{action:'reserve'}));params.slot_id=ref(slot.id);
  }
  params.max_credits_authorized=credits;
  const m=createManifest({modelId:'private-voice:'+mode,catalogVersion:'private-voices-1',modelContractHash:'private-voices-1',params,files,estimate:{credits,note:'Reglas AILAB de la web'}});
  markSubmitted(m,{voice_operation:true,client_request_id:m.manifest_id});
  print(out,{manifest_id:m.manifest_id,mode,credits,params,files:files.map(f=>({path:f.path,mime:f.mime,size:f.size})),
    note:mode==='design'?'Lote de hasta tres muestras. Alta de 100 cr aparte.':mode==='delete'?'Borrado permanente. Conserva los audios ya generados.':'Alta: 48 horas incluidas. Conservación solo si la solicitas con fecha y presupuesto.',
    submit:'voice-submit '+m.manifest_id+' --confirmed'});return m;
}

export async function voiceStatus(id,out=console.log) {
  const m=loadManifest(id);let d;
  if(m?.voice_operation){const p=m.params;
    if(m.not_sent){const d={state:'not_sent',message:m.last_error,note:'Prepara una nueva solicitud; esta no se envió al proveedor.'};print(out,d);return d;}
    d=unwrap(await serviceGet(PV,p.action==='design'?{action:'design_status',request_id:m.client_request_id}:p.action==='create'?{action:'create_lookup',request_id:m.client_request_id}:{action:'status',id:p.id}));
  }else if(HEX.test(id||''))d=unwrap(await serviceGet(PV,{action:'status',id}));
  else if(uuid.test(id||''))d=unwrap(await serviceGet(PV,{action:'request_status',request_id:id}));
  else throw new Error('Usa el ID de voz o el manifiesto de esta solicitud.');
  print(out,d);return d;
}

export async function submitVoice(id,opts,out=console.log) {
  optsOnly(opts,['confirmed','max-credits']);
  let m=loadManifest(id);if(!m?.voice_operation)throw new Error('Manifiesto de voces no encontrado.');
  if(m.attempted_at){out('Consulta del mismo intento; no se repite el envío.');return voiceStatus(id,out);}
  if(opts.confirmed!==true)throw new Error('Necesitas autorización del usuario y --confirmed.');
  if(manifestExpired(m))throw new Error('Plan caducado. Vuelve a preparar; todavía no se ha enviado.');
  const hash=crypto.createHash('sha256').update(stableStringify(m.params)).digest('hex');
  if(hash!==m.params_hash||m.max_credits_authorized!==m.params.max_credits_authorized)throw new Error('El plan ha cambiado. Vuelve a preparar.');
  ceiling(opts,m.max_credits_authorized);
  for(const file of m.files)if(!rehashMatches(file))throw new Error('Archivo cambiado: '+file.path+'. Vuelve a preparar.');
  const body={...m.params,client_request_id:m.client_request_id};
  if(m.params.mode==='clone') {
    const file=m.files.find(f=>f.param==='evidence');
    if(!m.evidence_upload){const up=unwrap(await privateVoiceMultipart('upload',{},file));if(!HEX.test(up.id)||up.sha256!==file.sha256)throw new Error('No se verificó la autorización subida. No se ha enviado el alta.');m={...m,evidence_upload:up.id};markSubmitted(m,{});}
    body.evidence_id=m.evidence_upload;
  }
  // Persistencia ANTES del POST. Un fallo de transporte obliga a consultar, no a repetir.
  m={...m,attempted_at:new Date().toISOString()};markSubmitted(m,{});
  out('Enviando solicitud de voces. Referencia recuperable: '+id);
  const r=m.params.mode==='clone'?await privateVoiceMultipart('create',body,m.files.find(f=>f.param==='audio')):await servicePost(PV+'?action='+m.params.action,body);
  if(!r.ok){markSubmitted(m,{last_error:r.message,not_sent:r.raw?.submission_state==='not_sent'});throw new Error(explain(r)+' Consulta voice-status '+id+'. No reenvíes esta solicitud.');}
  const d=r.data;markSubmitted(m,{voice_result_id:d.id||null});print(out,d);return d;
}

export async function runVoiceCommand(cmd,pos,opts,out=console.log) {
  if(pos.length>1)throw new Error('Demasiados argumentos.');
  if(cmd==='voice-prepare')return prepareVoice(pos[0],opts,out);
  if(cmd==='voice-submit')return submitVoice(pos[0],opts,out);
  if(cmd==='voice-status'){optsOnly(opts,[]);return voiceStatus(pos[0],out);}
  if(cmd==='voice-list'||cmd==='voice-options'){optsOnly(opts,[]);if(pos.length)throw new Error('Este comando no admite referencias.');return print(out,unwrap(await serviceGet(PV,{action:cmd==='voice-list'?'list':'options'})));}
  if(cmd==='voice-select') {
    optsOnly(opts,['owner','name','confirmed']);if(opts.confirmed!==true)throw new Error('Confirma la incorporación de esta voz con --confirmed.');
    return print(out,unwrap(await servicePost(EL+'?action=library_select',{action:'library_select',voice_id:pos[0],public_owner_id:opts.owner,name:opts.name,confirmed:true})));
  }
  if(cmd==='voice-samples') {
    optsOnly(opts,['output']);const d=await voiceStatus(pos[0],out);if(d.state!=='ready'||!d.samples?.length)throw new Error('Las muestras siguen pendientes o no están disponibles. No repitas la generación.');
    const dir=resolveOutputDir(opts.output);for(const s of d.samples){const bytes=await privateVoiceSample(s.id);const file=nextFreePath(dir,'muestra-'+s.id,'mp3');fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});out('Guardado en: '+file);}return;
  }
  throw new Error('Comando de voces desconocido. Consulta references/eleven-voices.md.');
}
