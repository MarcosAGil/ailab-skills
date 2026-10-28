# Flujo: crear, añadir y actualizar

Niveles de confianza: **[D]** documentado, **[H]** decisión razonada de esta skill, **[?]** hipótesis por validar generando.

`AILAB` en los comandos es `node ~/.claude/skills/ailab/scripts/ailab.mjs` (o la carpeta real donde esté instalada la skill `ailab`). Antes de cada modelo se ejecuta `info <modelo>`, que no gasta, y los nombres de parámetros que salgan ahí mandan sobre esta guía.

> **Modo solo prompts (sin `ailab`):** se saltan los comandos `AILAB ...`. En su lugar, por cada pieza se entrega el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo para guardar el resultado en `prompts_intermedios/generaciones/`.

## Estructura fija de carpetas

Se pide el **nombre del personaje** (por ejemplo, Marta) y se usa en todos los nombres de carpeta y de archivo. `<nombre>` va en minúsculas y `<NOMBRE>` en mayúsculas.

```text
<carpeta-base>/<nombre>/
├── prompt.md                      definición del personaje (fuera de las carpetas)
├── ref_<nombre>/                  imágenes validadas, nada más
│   ├── <NOMBRE>_CARA.png          hoja de rostro aprobada
│   ├── <NOMBRE>_CUERPO.png        hoja de cuerpo aprobada
│   └── <NOMBRE>_OUTFIT_<OUTFIT>.png    un archivo por outfit adicional (si lo hay)
├── voz_<nombre>/                  audio validado, nada más
│   └── <nombre>_<modelo>.wav      <modelo> = seedaudio | elevenlabs
└── prompts_intermedios/           todo lo demás: prompts, fuentes e intermedios
    ├── registro.md                cada generación: pieza, modelo, referencias, prompt, task_id, estado
    ├── fuentes/                   fotos de partida, retrato base, fotos de producto y de outfit
    └── generaciones/              prompts .txt y resultados que no están aprobados
```

- **Nombres de imagen:** `<NOMBRE>_CARA`, `<NOMBRE>_CUERPO`, `<NOMBRE>_OUTFIT_<OUTFIT>` y `<NOMBRE>_PRODUCTO`, siempre en mayúsculas y con guion bajo.
- **Nombre de voz:** `<nombre>_<modelo>`, en minúsculas, con el modelo con el que se generó (`seedaudio` o `elevenlabs`). Así se ve de un vistazo qué audio es.
- **Versiones:** si una pieza se regenera, la nueva se guarda en `prompts_intermedios/generaciones/` con sufijo `-v2`. La carpeta `ref_<nombre>/` solo guarda la versión aprobada en uso.
- **Estructura propia:** si el usuario prefiere otros nombres o carpetas, se usan los suyos y se anotan en la sección de carpeta de `prompt.md`. La skill sigue el esquema que el usuario pida.

## Fase 0. Brief y carpeta

1. Recoge lo del primer contacto: nombre, origen (inventado o fotos), piezas, voz, idioma y acento y la carpeta base. Si la carpeta base no está clara, se pregunta una vez y se guarda en `prompt.md`.
2. Si parte de **fotos** de una persona real, pregunta una vez si esa persona ha dado permiso para crear su personaje y, si se va a clonar la voz, para usarla. Si no lo ha dado, no se sigue con esas fotos, pero se puede seguir con un personaje inventado.
3. Crea la estructura y copia la plantilla de la ficha:

```bash
P="<carpeta-base>/<nombre>"
N="<nombre>"
NOMBRE="<NOMBRE>"
mkdir -p "$P/ref_$N" "$P/voz_$N" "$P/prompts_intermedios/fuentes" "$P/prompts_intermedios/generaciones"
cp ~/.claude/skills/personaje-consistente/plantillas/prompt-ficha.md "$P/prompt.md"
```

4. Crea `prompts_intermedios/registro.md` con la tabla de abajo.
5. **Plan y coste, antes del primer gasto** (obligatorio con `ailab`): enumera las piezas, el modelo de cada una, el número de generaciones (una por pieza; las regeneraciones se proponen aparte) y la estimación de `info` de cada modelo. Seed Audio es un **modelo caro**: se dice. Los costes exactos salen de `prepare`.

**Tabla de `registro.md`:**

| Fecha | Pieza | Modelo y ajustes | Referencias usadas (en orden) | Prompt | task_id | Estado | Aprobada |
|---|---|---|---|---|---|---|---|

## Fase 1. Ficha

1. Rellena `prompt.md` con lo que el usuario ha dicho. Pregunta lo que falte, agrupado, con opciones concretas. Los gestos, la personalidad y la forma de moverse y sonreír se escriben como **conducta visible** (qué hacen las cejas, las manos, el ritmo), no como etiquetas.
2. Lo que el usuario no sepa se deja como `(pendiente)`. No se inventa.
3. **Puerta:** enseña la ficha y pide el "aprobado" antes del primer gasto. Una vez aprobada la ficha y el plan, las piezas de ese plan se generan sin volver a pedir el sí por cada envío.

## Fase 2. Imagen de identidad

- **Personaje inventado:** genera el **retrato base** (`prompts-imagen.md`, sección 1) con `--mode t2i`. Se enseña y el usuario aprueba la identidad antes de seguir. Guarda el aprobado en `prompts_intermedios/fuentes/retrato-base.png` con su prompt.
- **Parte de fotos:** guárdalas en `prompts_intermedios/fuentes/`. Comprueba cuántas hay, si el rostro se ve bien y si llevan gafas o algo que tape los ojos (ver casos límite de `SKILL.md`). Cuantas más fotos del rostro con distintas expresiones y ángulos, mejor.

## Fase 3. Hojas

Orden: **rostro → cuerpo → (producto → boceto de tamaño) → (outfits)**. Las piezas opcionales solo si el usuario las pidió.

Para cada pieza:

1. Construye el prompt desde `prompts-imagen.md` rellenando solo las variables. Guárdalo en `prompts_intermedios/generaciones/<pieza>-vN.txt`.
2. Comprueba que las referencias obligatorias existen y su orden. Sin foto del outfit no hay hoja de outfit. Sin tamaño en cm no hay boceto.
3. Prepara (no gasta) y enseña modelo, parámetros, archivos y coste:

```bash
AILAB info gpt-image-2-5
AILAB prepare gpt-image-2-5 --mode i2i --version sunburst \
  --prompt "$(cat "$P/prompts_intermedios/generaciones/hoja-rostro-v1.txt")" \
  --image_urls "$P/prompts_intermedios/fuentes/foto-1.png" --image_urls "$P/prompts_intermedios/fuentes/foto-2.png" \
  --aspect_ratio 16:9 --resolution 2K
```

4. Con el plan aprobado, envía:

```bash
AILAB submit <manifest_id_real> --confirmed --output "$P/prompts_intermedios/generaciones/"
```

5. Entrega según `SKILL.md` ("Entrega al terminar cada pieza"): prompt exacto, imagen, `Guardado en:` y la revisión con las comprobaciones de `prompts-imagen.md`.
6. **Puerta:** el usuario aprueba o pide cambios. Un cambio es **una variable** y una regeneración propuesta, no automática. Si la generación se bloquea, se aplica lo de `ailab.md`, sección "Bloqueos de contenido".
7. Al aprobar, copia la imagen a `ref_<nombre>/` con su nombre fijo:

```bash
cp "$P/prompts_intermedios/generaciones/hoja-rostro-v1.png" "$P/ref_$N/${NOMBRE}_CARA.png"
```

8. Anota la generación en `prompts_intermedios/registro.md` y la referencia aprobada en la sección 8 de `prompt.md`.

**Referencias de cada hoja:**
- Rostro: todas las fotos o imágenes del rostro.
- Cuerpo: la hoja de rostro aprobada primero (Image A, fija la cara en el panel de primer plano) y la imagen principal de identidad después (Image B) **[H]**.
- Producto: todas las fotos del producto.
- Boceto: hoja de cuerpo y hoja de producto **[H]**.
- Outfit: 1 = hoja de cuerpo; 2 = foto del outfit.

El `registro.md` guarda la ruta de cada referencia usada, para poder reproducir la generación.

## Fase 4. Voz

Se elige la ruta con el usuario:

| Ruta | Cuándo | Guía |
|---|---|---|
| **Seed Audio** (recomendada) | Por defecto. Genera un audio de referencia del personaje hablando | `voz-seed-audio.md` |
| **ElevenLabs, diseñar** | Quiere una voz nueva con identidad guardada en AILAB | `voz-elevenlabs.md` |
| **ElevenLabs, clonar** | Hay una grabación autorizada de la voz | `voz-elevenlabs.md` |
| **ElevenLabs, biblioteca** | Quiere elegir una voz ya hecha | `voz-elevenlabs.md` |

Para cualquier acento, ver `acentos.md`. La skill **no puede escuchar** el audio: lo mide y el usuario lo escucha y lo aprueba (**puerta**). El audio aprobado se copia a `voz_<nombre>/<nombre>_<modelo>.wav`, con el modelo con el que se generó. La voz aprobada se documenta en la sección 6 de `prompt.md`.

Esta voz es la **referencia** del personaje. Si el usuario pide audio de escena (ambiente, mar, música), se genera con su propio brief y se guarda en `prompts_intermedios/generaciones/`; no entra en `voz_<nombre>/` salvo que lo apruebe como referencia.

## Fase 5. Cierre

1. Completa `prompt.md`: secciones 6 (voz), 8 (referencias aprobadas) y 9 (cómo usar el personaje en un prompt, con el bloque de `usar-en-escena.md`). Cambia `estado` a `aprobado`.
2. Comprueba que `prompts_intermedios/registro.md` está al día y que `ref_<nombre>/` y `voz_<nombre>/` solo contienen lo aprobado.
3. Resume al usuario: qué se creó, dónde está, qué queda pendiente y cómo recuperarlo ("usa a <nombre> en esta escena").

## Añadir una pieza a un personaje que ya existe

Lee `prompt.md` y `prompts_intermedios/registro.md`. Salta a la fase de la pieza: outfit (fase 3, con foto del outfit), producto o boceto (fase 3, con tamaño en cm) o voz (fase 4). Mismas puertas y reglas de gasto. Si el outfit es nuevo, la foto del outfit va a `prompts_intermedios/fuentes/` y, al aprobar la hoja, a `ref_<nombre>/<NOMBRE>_OUTFIT_<OUTFIT>.png`.

## Actualizar la ficha

1. Pregunta qué cambia y por qué.
2. Edita `prompt.md` y añade una fila al historial con la fecha y el cambio.
3. Calcula qué referencias quedan desfasadas:

| Cambio | Referencias afectadas |
|---|---|
| Rostro, pelo o piel | Hoja de rostro, hoja de cuerpo y todos los outfits |
| Vestuario base | Hoja de cuerpo |
| Altura o proporciones | Hoja de cuerpo y boceto de tamaño |
| Personalidad, gestos, movimiento o sonrisa | Ninguna: solo texto de la ficha |
| Voz | La voz de referencia en `voz_<nombre>/` |
| Producto o su tamaño | Hoja de producto y boceto de tamaño |

4. Enseña la lista y propón regenerar solo lo afectado, con su coste. **No se regenera nada sin el sí.**
5. Las versiones anteriores se conservan en `prompts_intermedios/generaciones/`: la nueva pasa a `-v2` y la anterior se queda ahí, fuera de `ref_<nombre>/` y `voz_<nombre>/`.
6. Anota en el historial qué referencias se regeneraron.
