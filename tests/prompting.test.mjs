import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('las nuevas skills se instalan en una ruta aislada con sus recursos completos', t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-prompting-install-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const result=spawnSync(process.execPath,['tools/install.mjs','refinar-actuacion-camara','refinar-prompt-ugc','--dir',dir],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);
 for(const id of ['refinar-actuacion-camara','refinar-prompt-ugc']){
  const text=fs.readFileSync(path.join(dir,id,'SKILL.md'),'utf8');
  assert.doesNotMatch(text,/\/Users\/|master:/);
  for(const match of text.matchAll(/\]\((references\/[^)]+)\)/g))assert.ok(fs.existsSync(path.join(dir,id,match[1])));
 }
 for(const script of ['medir_audio.py','lint_prompt.py'])assert.ok(fs.existsSync(path.join(dir,'refinar-prompt-ugc','scripts',script)));
 assert.ok(fs.existsSync(path.join(dir,'refinar-prompt-ugc','references','workflow-ugc.md')));
});

test('el lint UGC detecta huecos de plantilla sin red ni proveedores', t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ailab-prompting-lint-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'prompt.txt');fs.writeFileSync(file,'[Characters]\n[Name] smiles.\n[Stage 1 | 0.00-5.00s]\nA quiet moment.\n');
 const result=spawnSync('python3',['skills/refinar-prompt-ugc/scripts/lint_prompt.py',file,'--duration','5'],{encoding:'utf8',timeout:10000});
 assert.notEqual(result.status,0);
 assert.match(result.stdout+result.stderr,/Name|plantilla/i);
});
