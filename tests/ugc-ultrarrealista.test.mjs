import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateParams} from '../skills/ailab/scripts/lib/catalog.mjs';
const skill=path.resolve('skills/ugcia-ultrarrealista-aill');
function temp(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ugc-ultra-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function run(script,args=[],options={}){return spawnSync('bash',[path.join(skill,'scripts',script),...args],{encoding:'utf8',timeout:30000,...options});}
function project(t){const root=temp(t);const r=run('crear_proyecto.sh',['Prueba',root]);assert.equal(r.status,0,r.stderr);return r.stdout.trim();}

test('los modelos y ajustes del workflow encajan en el catálogo sin llamadas al proveedor',t=>{
 const catalog=JSON.parse(fs.readFileSync('skills/ailab/catalog/catalog.json','utf8'));
 const dir=temp(t),image=path.join(dir,'ref.png'),audio=path.join(dir,'audio.wav');
 fs.writeFileSync(image,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64'));
 fs.writeFileSync(audio,'referencia sintética para validación del esquema');
 const cases=[
  ['gpt-image-2-5',{mode:'i2i',version:'flare',prompt:'test',image_urls:[image],aspect_ratio:'16:9',resolution:'2K'}],
  ['nano-banana-2-1',{mode:'edit',prompt:'test',image_urls:[image],aspect_ratio:'9:16',resolution:'2K'}],
  ['ideogram-v45',{mode:'edit',prompt:'test',image_urls:[image],quality:'high',edit_precision:'regular',image_size:'auto',num_images:1}],
  ['seed-audio',{prompt:'test',image_url:image,output_format:'wav',speed:1,estimated_duration_seconds:60}],
  ['seedance-2-5',{mode:'ref',prompt:'test',duration:10,aspect_ratio:'9:16',resolution:'720p',generate_audio:true,reference_image_urls:[image],reference_audio_urls:[audio]}],
  ['seedream-v5-pro',{mode:'i2i',prompt:'test',quality:'high',aspect_ratio:'16:9',image_urls:[image]}]
 ];
 for(const [id,params]of cases){const model=catalog.models[id];assert.ok(model,id);const result=validateParams({id,...model},params);assert.deepEqual(result.errors,[],id);}
});

test('instalación integrada guarda workflow y dependencias sin gasto',t=>{
 const dir=temp(t);const r=spawnSync(process.execPath,['tools/install.mjs','ailab','refinar-prompt-ugc','ugcia-ultrarrealista-aill','--dir',dir],{encoding:'utf8',timeout:30000});
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/ugcia-ultrarrealista-aill 1\.1\.2/);
 for(const id of ['ailab','refinar-prompt-ugc','ugcia-ultrarrealista-aill'])assert.ok(fs.existsSync(path.join(dir,id,'SKILL.md')));
 const portableEnv={...process.env};delete portableEnv.AILAB_SKILLS_DIR;delete portableEnv.CLAUDE_SKILLS_DIR;
 const checked=spawnSync('bash',[path.join(dir,'ugcia-ultrarrealista-aill/scripts/comprobar_requisitos.sh')],{encoding:'utf8',timeout:30000,env:portableEnv});
 assert.equal(checked.status,0,checked.stdout+checked.stderr);assert.match(checked.stdout,/MODO: completo/);
 const standalone=run('install.sh',['--target','codex','--forzar'],{env:{...portableEnv,AILAB_SKILLS_DIR:dir}});
 assert.equal(standalone.status,0,standalone.stdout+standalone.stderr);assert.match(standalone.stdout,/sesión nueva en codex/);
 assert.ok(fs.readdirSync(dir).some(n=>n.startsWith('ugcia-ultrarrealista-aill.bak-')));
});

test('promoción rechaza traversal y enlaces sin mover archivos externos',t=>{
 const p=project(t),outside=path.join(p,'fuera.txt');fs.writeFileSync(outside,'preservar');
 assert.notEqual(run('promover.sh',[p,'../fuera.txt']).status,0);assert.equal(fs.readFileSync(outside,'utf8'),'preservar');
 fs.symlinkSync(outside,path.join(p,'Pruebas intermedias','enlace.txt'));
 assert.notEqual(run('promover.sh',[p,'enlace.txt']).status,0);assert.ok(fs.existsSync(outside));
});

test('colisión de prompt no mueve parcialmente la imagen',t=>{
 const p=project(t),src=path.join(p,'Pruebas intermedias/imagenes'),dst=path.join(p,'Archivos para usar');
 fs.writeFileSync(path.join(src,'a.png'),'imagen');fs.writeFileSync(path.join(src,'a.txt'),'nuevo');fs.writeFileSync(path.join(dst,'Texto o prompts/a.txt'),'anterior');
 const r=run('promover.sh',[p,'imagenes/a.png']);assert.notEqual(r.status,0);
 assert.equal(fs.readFileSync(path.join(dst,'Texto o prompts/a.txt'),'utf8'),'anterior');assert.ok(fs.existsSync(path.join(src,'a.png')));assert.equal(fs.existsSync(path.join(dst,'a.png')),false);
});

test('promoción comprueba todos los destinos antes del primer movimiento',t=>{
 const p=project(t),src=path.join(p,'Pruebas intermedias/imagenes');
 fs.writeFileSync(path.join(src,'a.png'),'a');fs.writeFileSync(path.join(src,'b.png'),'b');fs.writeFileSync(path.join(p,'Archivos para usar/b.png'),'anterior');
 assert.notEqual(run('promover.sh',[p,'imagenes/a.png','imagenes/b.png']).status,0);assert.ok(fs.existsSync(path.join(src,'a.png')));
});

test('doctor fallido no se informa como sesión correcta',t=>{
 const dir=temp(t);for(const folder of ['ailab/scripts','refinar-prompt-ugc/references','refinar-prompt-ugc/scripts'])fs.mkdirSync(path.join(dir,folder),{recursive:true});
 fs.writeFileSync(path.join(dir,'ailab/SKILL.md'),'test');fs.writeFileSync(path.join(dir,'ailab/scripts/ailab.mjs'),'process.exitCode=1;');
 fs.writeFileSync(path.join(dir,'refinar-prompt-ugc/SKILL.md'),'test');fs.writeFileSync(path.join(dir,'refinar-prompt-ugc/references/formato-salida.md'),'test');
 const r=run('comprobar_requisitos.sh',['--doctor'],{env:{...process.env,AILAB_SKILLS_DIR:dir}});assert.notEqual(r.status,0);assert.match(r.stdout,/doctor no ha confirmado/);
});

test('audio no sobrescribe, no acepta fracciones y no recorta al sustituir pista',t=>{
 if(spawnSync('ffmpeg',['-version']).status!==0||spawnSync('ffprobe',['-version']).status!==0){t.skip('FFmpeg y FFprobe ausentes');return;}
 const dir=temp(t),audio=path.join(dir,'audio.wav'),video=path.join(dir,'video.mp4'),out=path.join(dir,'existente.wav');
 const a=spawnSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','sine=duration=5','-y',audio],{encoding:'utf8'});assert.equal(a.status,0,a.stderr);
 const v=spawnSync('ffmpeg',['-loglevel','error','-f','lavfi','-i','color=c=black:s=32x32:d=4','-pix_fmt','yuv420p','-y',video],{encoding:'utf8'});assert.equal(v.status,0,v.stderr);
 fs.writeFileSync(out,'preservar');assert.notEqual(run('ajustar_audio.sh',[audio,'5',out]).status,0);assert.equal(fs.readFileSync(out,'utf8'),'preservar');
 assert.notEqual(run('ajustar_audio.sh',[audio,'5.5',path.join(dir,'fraccion.wav')]).status,0);
 const bad=path.join(dir,'recortado.mp4'),r=run('verificar_video.sh',[video,audio,'--reemplazar',bad]);assert.notEqual(r.status,0);assert.equal(fs.existsSync(bad),false);assert.match(r.stderr,/duraciones distintas/);
});
