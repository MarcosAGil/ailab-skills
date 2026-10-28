import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateInstructionFiles} from '../tools/validate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Skills oficiales de la comunidad de Ailendra Labs que solo son instrucciones (sin ejecutables).
const INSTRUCTION_SKILLS=['estilo-espontaneo-viral','estilo-amateur-ccd','refinar-prompt','personaje-consistente'];
const COMMUNITY=[...INSTRUCTION_SKILLS,'estilo-ugc'];
const walk=(dir,base=dir)=>fs.readdirSync(dir).flatMap(name=>{const p=path.join(dir,name);return fs.statSync(p).isDirectory()?walk(p,base):[path.relative(base,p)];});
test('las skills de instrucciones se instalan completas, sin ejecutables ni claves',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'community-install-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const result=spawnSync(process.execPath,['tools/install.mjs',...INSTRUCTION_SKILLS,'--dir',dir],{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH},timeout:60000});
  assert.equal(result.status,0,result.stderr);
  for(const id of INSTRUCTION_SKILLS){
    assert.match(result.stdout,new RegExp('Instalada '+id+' '));
    const dest=path.join(dir,id);
    validateInstructionFiles(dest);
    assert.equal(fs.existsSync(path.join(dest,'scripts')),false,id);
    assert.deepEqual(walk(dest).sort(),walk(path.join(root,'skills',id)).sort(),id+': se copian todos sus archivos');
  }
});
test('las cinco skills de la comunidad se declaran oficiales, llevan el logo y no tienen rutas personales ni rayas largas',()=>{
  for(const id of COMMUNITY){
    const skill=fs.readFileSync(path.join(root,'skills',id,'SKILL.md'),'utf8');
    assert.match(skill,new RegExp('^---\\nname: '+id+'\\n'));
    assert.match(skill,/Skill oficial de la comunidad de Ailendra Labs/);
    assert.ok(fs.existsSync(path.join(root,'skills',id,'assets','AILL.png')),id+': logo');
    for(const file of walk(path.join(root,'skills',id)).filter(f=>/\.(md|txt|json|py)$/.test(f))){
      const text=fs.readFileSync(path.join(root,'skills',id,file),'utf8');
      assert.doesNotMatch(text,/\/Users\/|marcosa/,id+'/'+file);
      assert.equal(text.includes(String.fromCharCode(0x2014)),false,id+'/'+file);
    }
  }
});
test('la validación de instrucciones admite imágenes y ejemplos pero rechaza ejecutables y referencias ausentes',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'instructions-validation-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'SKILL.md'),'Consulta `references/ausente.md`.');
  assert.throws(()=>validateInstructionFiles(dir),/Referencia ausente/);
  fs.mkdirSync(path.join(dir,'references'));
  fs.writeFileSync(path.join(dir,'references/ausente.md'),'Referencia disponible.');
  fs.mkdirSync(path.join(dir,'assets'));fs.writeFileSync(path.join(dir,'assets/logo.png'),'png');
  fs.mkdirSync(path.join(dir,'pruebas'));fs.writeFileSync(path.join(dir,'pruebas/caso.txt'),'prompt de prueba');
  validateInstructionFiles(dir);
  fs.writeFileSync(path.join(dir,'unsafe.mjs'),'throw Error("No ejecutar");');
  assert.throws(()=>validateInstructionFiles(dir),/solo admite Markdown/);
});
test('el ZIP de cada skill de la comunidad es reproducible y tiene una sola carpeta raíz',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'community-package-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const registry=JSON.parse(fs.readFileSync(path.join(root,'registry.json'),'utf8'));
  for(const id of COMMUNITY){
    const {version,channel}=registry.skills.find(s=>s.id===id);
    const build=()=>spawnSync(process.execPath,['tools/package.mjs',id],{cwd:root,encoding:'utf8',env:{...process.env,AILAB_DIST_DIR:dir},timeout:60000});
    let r=build();assert.equal(r.status,0,r.stderr);
    const zip=path.join(dir,`${id}-skill-v${version}-${channel}.zip`),bytes=fs.readFileSync(zip);
    r=build();assert.equal(r.status,0,r.stderr);assert.deepEqual(fs.readFileSync(zip),bytes,id);
    const list=spawnSync('unzip',['-Z1',zip],{encoding:'utf8'});assert.equal(list.status,0);
    const files=list.stdout.trim().split('\n');
    assert.ok(files.every(p=>p.startsWith(id+'/')),id);
    assert.ok(files.includes(id+'/SKILL.md')&&files.includes(id+'/assets/AILL.png'),id);
  }
});
