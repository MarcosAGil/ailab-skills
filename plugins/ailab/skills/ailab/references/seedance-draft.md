# Draft de Seedance 2.5

Un draft es una generación a 480p que después se puede generar a 1080p. La palabra es siempre draft, nunca «borrador».
Necesita la skill 2.3.16. Lo atiende el mismo servidor que la web; con el modo cerrado responde 403 y no cobra nada.

## 1. Generar un draft

```bash
node <skill-dir>/scripts/ailab.mjs prepare seedance-2-5 --draft true --prompt "..." --duration 6 --aspect_ratio 9:16
node <skill-dir>/scripts/ailab.mjs submit <manifest_id> --confirmed
```

- Modelos: `seedance-2-5` y `seedance-2-5-lite`, en `t2v`, `i2v` y `ref`.
- Solo 480p (sin `--resolution` se usa 480p) y duración fija de 4 a 30 s.
- Sin edición y sin `--auto_duration`. La CLI lo rechaza antes de enviar nada.
- Cuesta lo mismo que 480p en la misma combinación: `prepare` da la cifra, con o sin vídeo de referencia.
- El `task_id` que imprime `submit` es el del draft. Caduca a los 7 días menos 1 hora.

## 2. Listar los drafts

```bash
node <skill-dir>/scripts/ailab.mjs drafts [--cursor <valor>]
```

Solo lee: no gasta y no pide confirmación. Muestra 20 drafts por página, del más reciente al más antiguo, con `task_id`,
versión, duración, formato, estado, fecha límite (UTC), coste de 1080p y URL. Si hay más, imprime el comando de la página
siguiente. Solo aparecen los drafts terminados con vídeo.

| Estado | Significado |
|---|---|
| `ready` | Se puede generar a 1080p. |
| `upgrading` | Hay un 1080p en curso. Consulta su tarea con `status`. |
| `upgraded` | El 1080p terminó; la salida da su URL. |
| `expired` | Caducó. Ya no se puede generar a 1080p. |
| `review` | El 1080p está en revisión. No lo repitas: lo resuelve un administrador. |

## 3. Generar a 1080p

```bash
node <skill-dir>/scripts/ailab.mjs prepare seedance-2-5-draft-1080p --draft_task_id <task_id>
node <skill-dir>/scripts/ailab.mjs submit <manifest_id> --confirmed
```

- El precio lo fija el servidor para cada draft. `prepare` toma el coste del listado y `submit` autoriza esa cifra exacta:
  no la calcules ni la cites de memoria. `--max-credits` se respeta igual que en cualquier modelo.
- Es un gasto: enseña el coste al usuario y aplica [la autorización del encargo](approval-flows.md).
- Si la salida dice «como máximo», es un draft de Lite con vídeo de referencia: se cobra el coste real, nunca más.
- `status <task_id>` recupera la tarea y descarga el archivo aunque se pierda el recibo local.
- Una generación a 1080p por draft. Si falla sin cargo, el draft vuelve a `ready`. Ante un envío ambiguo no prepares otra:
  el draft queda ocupado hasta que se resuelva.
