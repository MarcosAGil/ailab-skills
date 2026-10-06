import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateInstructionFiles} from '../tools/validate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Refinar prompt se instala sin ejecutables, claves ni generación',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'refinar-install-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const result=spawnSync(process.execPath,['tools/install.mjs','refinar-prompt','--dir',dir],{cwd:root,encoding:'utf8',env:{PATH:process.env.PATH},timeout:30000});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Instalada refinar-prompt 1\.0\.0/);
  const dest=path.join(dir,'refinar-prompt');
  validateInstructionFiles(dest);
  assert.equal(fs.existsSync(path.join(dest,'scripts')),false);
  for(const name of fs.readdirSync(path.join(root,'skills/refinar-prompt/references')))
    assert.deepEqual(fs.readFileSync(path.join(dest,'references',name)),fs.readFileSync(path.join(root,'skills/refinar-prompt/references',name)));
});
test('la validación de instrucciones rechaza ejecutables y referencias ausentes',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'refinar-validation-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  fs.writeFileSync(path.join(dir,'SKILL.md'),'Consulta `references/ausente.md`.');
  assert.throws(()=>validateInstructionFiles(dir),/Referencia ausente/);
  fs.mkdirSync(path.join(dir,'references'));
  fs.writeFileSync(path.join(dir,'references/ausente.md'),'Referencia disponible.');
  validateInstructionFiles(dir);
  fs.writeFileSync(path.join(dir,'unsafe.mjs'),'throw Error("No ejecutar");');
  assert.throws(()=>validateInstructionFiles(dir),/solo admite Markdown/);
});
test('el ZIP de Refinar prompt es reproducible y contiene todos sus manuales',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'refinar-package-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const build=()=>spawnSync(process.execPath,['tools/package.mjs','refinar-prompt'],{cwd:root,encoding:'utf8',env:{...process.env,AILAB_DIST_DIR:dir},timeout:30000});
  let r=build();assert.equal(r.status,0,r.stderr);
  const zip=path.join(dir,'refinar-prompt-skill-v1.0.0-beta.zip'),bytes=fs.readFileSync(zip);
  r=build();assert.equal(r.status,0,r.stderr);assert.deepEqual(fs.readFileSync(zip),bytes);
  const list=spawnSync('unzip',['-Z1',zip],{encoding:'utf8'});assert.equal(list.status,0);
  const files=list.stdout.trim().split('\n');
  assert.equal(files.length,8);assert.ok(files.every(p=>p.startsWith('refinar-prompt/')));
  assert.ok(files.includes('refinar-prompt/references/ejemplo-completo.md'));
  assert.ok(files.includes('refinar-prompt/references/guia-marketplace.md'));
});
