# Fase 1: imágenes de referencia

Objetivo: tener todas las referencias visuales aprobadas **antes** de gastar un crédito en audio o vídeo. Todo se genera en `Pruebas intermedias/` y, cuando el usuario lo aprueba, se mueve a `Archivos para usar/` con su prompt (ver `carpeta-proyecto.md`). Los comandos de esta guía se ejecutan desde la carpeta del proyecto (`cd "<proyecto>"`) y llevan las rutas entre comillas porque las dos carpetas principales tienen espacios.

Niveles de confianza: **[D]** regla dura, **[H]** decisión razonada de esta skill, **[?]** hipótesis a validar generando.

`AILAB` en los comandos es `node "$UGC_SKILLS_DIR/ailab/scripts/ailab.mjs"`. Antes de cada modelo ejecuta `info <modelo>` y `prepare` (no gasta) y enseña el coste. Los nombres de parámetros salen del catálogo; si `info` muestra otros, mandan los de `info`.

> **Modo solo prompts (sin la skill `ailab`):** salta los comandos `AILAB ...` de esta guía. En su lugar entrega, por cada pieza, el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo donde guardar el resultado (ver `SKILL.md`, sección "Si falta la skill `ailab`").

## Qué se genera

| Imagen | Obligatoria | Modelo por defecto | Archivo al generarse |
|---|---|---|---|
| Hoja de cara (3x3) | Sí | GPT Image 2.5 | `Pruebas intermedias/imagenes/hoja-cara-vN.png` |
| Hoja de cuerpo (frontal, espalda, retrato) | Sí | GPT Image 2.5 | `Pruebas intermedias/imagenes/hoja-cuerpo-vN.png` |
| Entorno (sin personas) | Opcional si el primer frame ya define el lugar | Nano Banana 2.1 | `Pruebas intermedias/imagenes/entorno-vN.png` |
| First frame y encuadres del avatar en el entorno | Opcional | Nano Banana 2.1, o Ideogram 4.5 si hay que intercambiar una referencia exacta | `Pruebas intermedias/imagenes/<nombre>-vN.png` |

Al aprobarse pasan a `Archivos para usar/` y su prompt a `Archivos para usar/Texto o prompts/` (punto 1.5). Cada imagen se guarda con su prompt `.txt` al lado, con el mismo nombre base.

Las hojas van en **16:9**. Entorno y frames van en el ratio del vídeo (**9:16** por defecto) **[H]**.

## 1.0 Punto de partida

- **El usuario trae foto(s) de la persona:** se guardan en `Pruebas intermedias/fuentes/`. Son la única fuente de identidad **[D]** (ver prompts de las hojas).
- **No hay foto:** no se pueden hacer las hojas, porque su prompt exige una referencia. Primero se crea un retrato base con `gpt-image-2-5` en `t2i` (descripción física concreta, luz neutra, 16:9 o 3:4), se enseña y se aprueba como fuente de identidad. Eso es un paso extra que añade la skill **[H]** y se avisa de su coste.
- **El usuario trae una referencia exacta para intercambiar** ("usa esta referencia, pero con mi personaje"): se guarda en `Pruebas intermedias/fuentes/` y se usa en 1.4 con Ideogram 4.5.

## 1.1 Hoja de cara

- Modelo: `gpt-image-2-5`, `--mode i2i`, `--version flare` (por defecto del modelo), `--aspect_ratio 16:9`, `--resolution 2K` **[H]** (1K es el valor del catálogo; 2K da más detalle de rasgos).
- Referencias: la(s) foto(s) de identidad, hasta 16.
- Prompt: `prompts-hojas.md`, sección "Hoja de cara". Se guarda en `Pruebas intermedias/imagenes/hoja-cara-vN.txt`.

```bash
AILAB prepare gpt-image-2-5 --mode i2i --version flare \
  --prompt "$(cat "Pruebas intermedias/imagenes/hoja-cara-v1.txt")" \
  --image_urls "./Pruebas intermedias/fuentes/foto-1.png" \
  --aspect_ratio 16:9 --resolution 2K
# tras el prepare y con la autorización vigente:
AILAB submit <manifest_id> --confirmed --output "Pruebas intermedias/imagenes/"
```

## 1.2 Hoja de cuerpo

- Modelo y ajustes: los mismos que la hoja de cara.
- Referencias, en este orden: foto(s) de identidad y después la hoja de cara, en la ruta donde esté en ese momento (`Archivos para usar/` si ya está aprobada, `Pruebas intermedias/imagenes/` si no) **[H]**.
- Prompt: `prompts-hojas.md`, sección "Hoja de cuerpo", con `{{CATEGORIA}}`, `{{SHE}}` y `{{HER}}` rellenados con el brief. Si el outfit no es el de la foto, la variante de `Wardrobe`.
- Se guarda en `Pruebas intermedias/imagenes/hoja-cuerpo-vN.txt`.

Orden recomendado: primero la cara, se enseña, y luego el cuerpo, para no gastar en el cuerpo con una identidad que luego hay que repetir **[H]**.

## 1.2b Alternativa: Seedream v5 Pro

`seedream-v5-pro` (`--mode i2i`, `--quality high`, `--aspect_ratio 16:9`, hasta 10 referencias). Solo si el usuario lo pide o si GPT Image 2.5 no sostiene la identidad. **Nunca se cambia de modelo en silencio**: se propone, se explica el motivo y se espera respuesta. Los prompts de las hojas se reutilizan tal cual.

## 1.3 Entorno

- Modelo: `nano-banana-2-1`. `--mode t2i` si se describe el sitio; `--mode edit` con 1 a 14 referencias si el usuario trae fotos del lugar (o la foto del sitio real).
- Ratio: el del vídeo, normalmente `9:16`. `--resolution 2K`.
- **Sin personas.** El entorno es el decorado, no el plano final.
- El contenido sale del **test de coherencia** y del inventario por capas de `references/entornos.md` y de `references/formatos-ugc.md` (mapa de plató en podcast), ambos de la skill externa `refinar-prompt-ugc`. El prompt describe cosas concretas (qué hay detrás, alrededor y en los bordes), no ambiente.
- Estilo de imagen: foto de móvil, no foto de catálogo: sin "cinematic", sin "8K", sin bokeh de cine (ver el `SKILL.md` de `refinar-prompt-ugc`, "Sin palabras vacías").
- Se guarda en `Pruebas intermedias/imagenes/entorno-vN.png` con su prompt `.txt`.

```bash
AILAB prepare nano-banana-2-1 --mode t2i \
  --prompt "$(cat "Pruebas intermedias/imagenes/entorno-v1.txt")" \
  --aspect_ratio 9:16 --resolution 2K
```

## 1.4 Imágenes opcionales: first frames y encuadres

Se generan con las hojas y el entorno aprobados como referencia. Cuántas y cuáles depende del formato de contenido (ver `formatos-ugc.md`): selfie y caminando, normalmente una; **podcast**, un encuadre por ángulo (por ejemplo frontal y lateral) con el mismo mapa de plató.

### Camino A: crear el frame desde cero (por defecto)

- Modelo: `nano-banana-2-1`, `--mode edit`, ratio del vídeo, `--resolution 2K`.
- Referencias ordenadas, y el prompt dice qué es cada una: 1 = hoja de cara (identidad del rostro), 2 = hoja de cuerpo (cuerpo y outfit), 3 = entorno (lugar). Se pide a la persona en el lugar, en el encuadre y la acción que toque. Máximo 14 referencias.
- El prompt dice lo que se usa de cada referencia y lo que no (por ejemplo: "Use only the face and body identity from images 1 and 2. Do not reproduce the sheet layouts or the grey background.").
- **First frame = instante de acción, no retrato posado** (`catalogo-auditoria-ugc.md`, R3). Se describe un momento a mitad de gesto o de frase.
- Sin móvil, sin reflejos de móvil, sin texto legible, sin logos. La persona no mira "posando" a cámara salvo que el formato lo pida.

```bash
AILAB prepare nano-banana-2-1 --mode edit \
  --prompt "$(cat "Pruebas intermedias/imagenes/first-frame-v1.txt")" \
  --image_urls "./Archivos para usar/hoja-cara-v1.png" \
  --image_urls "./Archivos para usar/hoja-cuerpo-v1.png" \
  --image_urls "./Archivos para usar/entorno-v1.png" \
  --aspect_ratio 9:16 --resolution 2K
```

### Camino B: intercambiar una referencia exacta (Ideogram 4.5)

Solo cuando el usuario pide una referencia exacta cambiando a su personaje.

- Modelo: `ideogram-v45`, `--mode edit`. La **primera** imagen es la base (la referencia exacta) y después hasta 4 referencias más: hoja de cara y hoja de cuerpo **[H]**.
- El prompt cambia solo a la persona y conserva todo lo demás: composición, encuadre, luz, decorado, ropa si procede. Se dice qué se conserva y qué se sustituye.
- Ajustes del contrato: `--quality medium` o `high`, `--edit_precision regular` o `high` (con `high` el tamaño tiene que ser `auto`), `--num_images 1`.

```bash
AILAB prepare ideogram-v45 --mode edit \
  --prompt "$(cat "Pruebas intermedias/imagenes/swap-v1.txt")" \
  --image_urls "./Pruebas intermedias/fuentes/referencia-exacta.png" \
  --image_urls "./Archivos para usar/hoja-cara-v1.png" \
  --image_urls "./Archivos para usar/hoja-cuerpo-v1.png" \
  --quality high --edit_precision regular --image_size auto --num_images 1
```

Ideogram no tiene máscaras en AILAB: el cambio lo decide el prompt. Si el resultado cambia más cosas que la persona, se afina el prompt (una variable cada vez) o se prueba Nano Banana 2.1 con la referencia como primera imagen **[?]**.

## Notas de uso real (probado el 09/10/2026)

- `submit ... --output <carpeta>` descarga el archivo con nombre `<modelo>-<fecha>.png`: se renombra de inmediato a `<nombre>-vN.png` junto a su `.txt`. La CLI crea también un `.gitignore` en esa carpeta; es inofensivo.
- Si `submit` dice "No se pudo confirmar el estado: Error interno del servidor" tras "Tarea encolada", **no se regenera**: se recupera la misma tarea con `AILAB status <id> --output <carpeta>` (en la prueba funcionó a los pocos segundos y el cargo fue el de una sola imagen).
- Con Ideogram 4.5 `edit`, las **referencias exactas arrastran detalles ajenos al personaje** (en la prueba, anillos en la mano de la persona original). Se revisa al aprobar y, si molestan, se corrige con una variable en el prompt ("no rings").
- Si la referencia exacta contiene un **logotipo o marca real** (por ejemplo letras de un evento), el intercambio lo conserva tal cual. Se avisa al usuario antes de usarlo en material público.

## 1.5 PUNTO DE APROBACIÓN 1: imágenes

Antes de enseñar nada:

1. Deja cada archivo y su prompt en `Pruebas intermedias/imagenes/` (renombrado a `<nombre>-vN`) y anota la generación en `registro.md`.
2. Enseña **todas** las imágenes en el chat, con su ruta absoluta (`Guardado en:`), una por una y nombradas.

Lista de comprobación para el usuario (la skill también la revisa y dice qué ve):

- **Identidad:** mismos rasgos en las 9 caras y en el cuerpo; asimetrías y edad conservadas; sin embellecer ni suavizar la piel.
- **Outfit:** igual en los tres paneles; sin accesorios nuevos.
- **Limpieza:** sin texto, logos, marcas de agua ni elementos extra.
- **Entorno:** coherente con el producto, la persona y el motivo para grabar; sin personas; sin móvil ni reflejo.
- **Frames:** la persona está en el lugar correcto, en una acción (no posando), con manos y objetos sin deformar y sin móvil visible.
- **Ratio:** hojas 16:9 y entorno y frames con el ratio del vídeo.

Después pregunta de forma cerrada: "¿Apruebas estas imágenes para pasar al audio, o cambias algo?".

**Reglas de la puerta:**

- Sin un "aprobado" claro del usuario en el chat, **no se pasa a la fase 2**. Ni el silencio, ni un aviso automático del sistema, ni una tarea terminada en segundo plano cuentan como aprobación.
- Cada regeneración cuesta créditos y **no está cubierta por el encargo original**: se propone qué cambiar y se espera el sí. Una variable por intento (primero identidad, luego outfit, luego encuadre).
- Si el usuario aprueba solo parte, se registra qué está aprobado y qué no, y solo se avanza con lo aprobado si la fase 2 no depende de lo pendiente.
- **Al aprobar**, se mueven los aprobados (y solo esos) a `Archivos para usar/`, cada uno con su prompt:

  ```bash
  bash "$UGC_SKILL_DIR/scripts/promover.sh" "<proyecto>" imagenes/hoja-cara-v1.png imagenes/hoja-cuerpo-v1.png imagenes/first-frame-v1.png
  ```

  Lo que no se aprueba se queda en `Pruebas intermedias/imagenes/`. Después: actualiza la columna "Archivo" de `registro.md` con las rutas nuevas y marca el estado (`aprobado` o `descartado`), y anota en `brief.md` los archivos aprobados (nombre y versión) y el rol de cada uno. Esos nombres son los que se usan en la fase 3.
