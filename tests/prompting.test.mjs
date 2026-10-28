import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('estilo-ugc se instala con sus scripts y pasa su autodiagnóstico sin red', t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'estilo-ugc-install-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const result=spawnSync(process.execPath,['tools/install.mjs','estilo-ugc','--dir',dir],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/Instalada estilo-ugc 1\.0\.0/);
 for(const script of ['medir_audio.py','lint_prompt.py'])assert.ok(fs.existsSync(path.join(dir,'estilo-ugc','scripts',script)));
 const text=fs.readFileSync(path.join(dir,'estilo-ugc','SKILL.md'),'utf8');
 for(const match of text.matchAll(/\]\((references\/[^)]+)\)/g))assert.ok(fs.existsSync(path.join(dir,'estilo-ugc',match[1])),match[1]);
});

test('el lint UGC detecta huecos de plantilla sin red ni proveedores', t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'estilo-ugc-lint-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'prompt.txt');fs.writeFileSync(file,'[Characters]\n[Name] smiles.\n[Stage 1 | 0.00-5.00s]\nA quiet moment.\n');
 const result=spawnSync('python3',['skills/estilo-ugc/scripts/lint_prompt.py',file,'--duration','5'],{encoding:'utf8',timeout:10000});
 assert.notEqual(result.status,0);
 assert.match(result.stdout+result.stderr,/Name|plantilla/i);
});
