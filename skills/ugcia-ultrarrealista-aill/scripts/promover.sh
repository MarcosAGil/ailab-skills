#!/usr/bin/env bash
# Promueve archivos aprobados y sus prompts, sin sobrescribir ni salir del proyecto.
# Uso: promover.sh <proyecto> <ruta relativa a Pruebas intermedias>...
set -euo pipefail
if [ "$#" -lt 2 ]; then echo "Uso: promover.sh <proyecto> <archivo relativo>..." >&2; exit 1; fi
python3 - "$@" <<'PY'
import os, sys
from pathlib import Path
project=Path(sys.argv[1]).resolve()
src=project/'Pruebas intermedias'; dst=project/'Archivos para usar'; txt=dst/'Texto o prompts'
try:
    if not src.is_dir() or not dst.is_dir() or any(p.is_symlink() for p in (src,dst,txt)):
        raise ValueError('No es un proyecto válido o sus carpetas son enlaces simbólicos.')
    plans={}; targets=set()
    def queue(source,target):
        if source in plans: return
        if source.is_symlink() or not source.is_file() or not source.resolve().is_relative_to(src.resolve()):
            raise ValueError('Archivo fuera de Pruebas intermedias o enlace no permitido: '+str(source))
        if target.exists() or target.is_symlink() or target in targets:
            raise ValueError('Destino existente o duplicado: '+str(target))
        plans[source]=target; targets.add(target)
    for relative in sys.argv[2:]:
        rel=Path(relative)
        if rel.is_absolute() or '..' in rel.parts: raise ValueError('Usa rutas relativas dentro de Pruebas intermedias.')
        f=src/rel
        if f.suffix.lower() in ('.txt','.md'): queue(f,txt/f.name)
        else:
            queue(f,dst/f.name)
            sibling=f.with_suffix('.txt')
            if sibling.exists() or sibling.is_symlink(): queue(sibling,txt/sibling.name)
    # Se comprueban todos los conflictos antes de mover el primer archivo.
    txt.mkdir(exist_ok=True)
    for source,target in plans.items():
        # El enlace exclusivo falla si otro proceso creó el destino. No sobrescribe.
        os.link(source,target)
        try: source.unlink()
        except OSError:
            target.unlink()
            raise
        print('movido: '+str(source.relative_to(project))+' -> '+str(target.relative_to(project)))
except (ValueError,OSError) as error:
    sys.exit('ERROR: '+str(error))
PY
