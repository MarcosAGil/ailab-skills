# 08 · Generación con AILAB: Image Prompter + Nano Banana 2.1

Todo pasa por la skill **AILAB** de Ailendra Labs (`ailab:ailab`). Ruta de la CLI:

```bash
A=$(ls -d ~/.claude/plugins/cache/ailendra-labs/ailab/*/skills/ailab | sort -V | tail -1)
node $A/scripts/ailab.mjs guide      # guía vigente de la CLI (sin gasto): consúltala ante cualquier duda
```

## Reglas de la skill AILAB (obligatorias)

- Solo se gasta con una petición directa del usuario en el chat. Antes del primer gasto, dile el alcance: cuántas imágenes, cuántas consultas a Image Prompter y el coste estimado que da la CLI. Una orden explícita de ejecutar el flujo ya lo autoriza: no pidas otro sí por cada imagen.
- `prepare` y `assistant-prepare` no cobran; `submit --confirmed` y `assistant-submit --confirmed` sí.
- Nunca pidas, leas ni pegues tokens. El usuario hace `login` en su terminal. No leas `~/.config/ailendra/` ni `~/.config/ailab/`.
- Precios: los da la CLI (`prepare`, `info nano-banana-2-1`). No los cites de memoria. Orientativo (noviembre de 2026): Nano Banana 2.1 a 2K, 7 créditos; Image Prompter, unos 12 créditos por consulta (se cobra el consumo real).
- "Limitado temporalmente" (429): espera lo que diga la CLI y **un solo** reintento. Nada de bucles ni envíos en paralelo (varios a la vez disparan el 429).
- Envío incierto o "generate task timeout": conserva el ID y recupera con `status <id>`. No generes otra para "arreglarlo". Un timeout del proveedor no cobra: compruébalo con `balance`.
- Al entregar: prompt exacto enviado, previsualización y `Guardado en:` con la ruta absoluta de cada archivo.

## Paso 1 · Prompt con Image Prompter

Image Prompter es el asistente de AILAB que convierte una idea en un prompt adaptado al modelo de imagen. Se le pasa un brief completo y las mismas imágenes, en el mismo orden, que irán después a Nano Banana 2.1.

1. Rellena `assets/plantillas/brief-image-prompter.md` y guárdalo como `<carpeta_vista>/brief.md`.
2. Ejecuta:
   ```bash
   bash <skill>/scripts/pedir_prompt.sh <carpeta_vista>/brief.md <carpeta_vista> render.png ref2.png ref3.png ...
   ```
3. Lee `<carpeta_vista>/respuesta_image_prompter.md`, extrae el prompt y **revísalo con la lista de abajo**. Corrige lo que falle (es texto: lo editas tú) y guárdalo como `<carpeta_vista>/prompt.txt`.

Si el usuario no quiere gastar en Image Prompter o el asistente no responde, usa las plantillas de `assets/plantillas/prompts-de-reserva.md` (son las que funcionaron en el caso real; ejemplos completos en `assets/ejemplos/prompts-reales/`).

### Lista de comprobación del prompt (antes de gastar en la imagen)

- [ ] En inglés.
- [ ] Dice qué es cada imagen por su número (Image 1, Image 2...) y coincide con el orden real de los archivos.
- [ ] "Composition comes only from Image 1" y la lista de lo que se conserva: cámara, encuadre, objetivo, posición y tamaño de cada objeto, cuadros y qué muestra cada uno.
- [ ] "Do not add, remove, move or resize anything" y "Do not add doorways, windows, lamps, plants or extra furniture".
- [ ] Describe la vista: desde dónde se mira y qué hay en primer plano, en medio y al fondo. Si hay vacío alrededor, "plain neutral grey studio background; keep it".
- [ ] Materiales concretos y luz de las vistas aprobadas.
- [ ] Si hay maniquíes: cada uno asignado a su personaje, pose con lado izquierdo/derecho, mirada, objetos y cómo los lleva.
- [ ] Si hay una foto de pose: "take only the pose from Image N, not the clothes...".
- [ ] "No new text, logos or watermarks" (con la excepción explícita del texto de un objeto de referencia, si lo hay).
- [ ] Nada que contradiga al render (un objeto que no está, un ángulo distinto).

## Paso 2 · Imagen con Nano Banana 2.1

- Modelo `nano-banana-2-1`, `--mode edit`, 1 a 14 referencias, `2K`, `16:9` (o la proporción que pida el usuario: 9:16 para vertical, etc.). Salida PNG de unos 2752 × 1536 a 2K.
- Script:
  ```bash
  RESOLUCION=2K PROPORCION=16:9 bash <skill>/scripts/generar_vista.sh <carpeta_vista>/prompt.txt <carpeta_vista>/nano-banana-2-1 render.png ref2.png ...
  ```
  Prepara (muestra coste y saldo), envía, espera el resultado con `status` y guarda el ID de tarea en `tarea.txt`. Ante un 429 hace un único reintento.
- Si quieres verlo todo a mano:
  ```bash
  node $A/scripts/ailab.mjs prepare nano-banana-2-1 --mode edit --prompt "$(cat prompt.txt)" --image_urls render.png --image_urls ref2.png --resolution 2K --aspect_ratio 16:9
  node $A/scripts/ailab.mjs submit <manifiesto> --confirmed --output <carpeta>
  node $A/scripts/ailab.mjs status <tarea> --output <carpeta>
  ```
- Imágenes pesadas: pásalas a JPG de unos 2K antes de subir (los PNG de 7 MB tardan más). Pillow: `im.thumbnail((2048, 2048)); im.save(x, quality=90)`.

## Secuencia de referencias

| Paso | Image 1 (composición) | Images 2..n (aspecto) |
|---|---|---|
| Maestra (vista más parecida a la referencia) | Su render color | Referencia original |
| Segunda vista (frontal o muy distinta) | Su render | Maestra aprobada |
| Resto de vistas del espacio | Su render | Maestra + segunda vista |
| Vista con personajes | Render con maniquíes | 1 o 2 vistas aprobadas + hojas de cada personaje + objetos |
| Otra vista del mismo momento | Render con maniquíes | Imagen aprobada de ese momento + vista del espacio + hojas |
| Añadir personaje / corregir | Imagen aprobada | Pose / referencia de lo que debe aparecer + hojas |

**La maestra arrastra sus errores**: lo que la IA cambie en ella lo repetirá en todas. Revísala con contornos antes de seguir.

## Comparar modelos (si el usuario lo pide)

Misma vista, mismo prompt, varios modelos; hoja con render, imágenes y contornos. Resultado del caso real (noviembre de 2026):

| Modelo | Maestra | Segunda vista |
|---|---|---|
| Nano Banana 2.1 | Buena, con desvíos (añadió un cartel de la referencia) | Geometría casi exacta: elegido |
| GPT Image 2.5 | Casi exacta al render | La más parecida a su maestra; ligero desvío de escala |
| Ideogram 4.5 | Ignoró el render y rehízo la referencia | Geometría exacta, pero su maestra era otra sala |

## Plan B si AILAB falla

Si AILAB devuelve fallos repetidos del proveedor (en el caso real, "generate task timeout" en cinco envíos seguidos, sin cobrar), no insistas. Díselo al usuario y pregúntale si quiere esperar o usar otro proveedor que ya tenga conectado con el mismo modelo (en el caso real, el MCP de Higgsfield con `nano_banana_2_1`, 2 créditos por imagen a 2K, mismo prompt y mismas referencias en el mismo orden). No cambies de proveedor sin su permiso.
