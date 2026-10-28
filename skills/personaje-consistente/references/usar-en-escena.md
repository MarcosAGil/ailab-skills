# Usar el personaje en una escena

Esta operación recupera la ficha y los materiales de un personaje que ya existe y entrega **un bloque listo para pegar** en un prompt de vídeo o de imagen. No escribe el prompt completo de la escena ni genera nada: prepara lo que hace falta para que el personaje salga igual.

Niveles de confianza: **[D]** documentado, **[H]** decisión razonada, **[?]** hipótesis por validar generando.

## 1. Pasos

1. Localiza la carpeta del personaje y lee `prompt.md` y `registro.md`. Si hay varios personajes, pregunta cuál.
2. Pregunta lo mínimo de la escena: qué hace el personaje, qué outfit lleva, si habla (idioma y acento), si usa el producto, y para qué modelo es (vídeo o imagen).
3. Elige las referencias a adjuntar, **en orden**, solo las que aporten a esta escena. No hace falta adjuntarlo todo.
4. Entrega el bloque de la sección 2 y, si habla, el bloque de voz de la sección 3.
5. Si algo de la ficha está `(pendiente)` y la escena lo necesita, se dice y se pregunta.

No se modifican los archivos del personaje. Si la escena pide un cambio permanente, es la operación "actualizar la ficha".

## 2. Bloque de personaje

Formato pensado para **Seedance 2.5 en AILAB**: handles `@Image1`, `@Image2`..., una línea por material con qué se usa y qué no. Los handles se numeran por el orden real en que el usuario sube los archivos. Se escribe en inglés. Para otro modelo se conserva el contenido y se adapta la sintaxis (ver 4).

```text
[Characters]
<Nombre> corresponds to @Image1, @Image2 and @Image3. All views are the same single person. Use only <face, hair, skin tone, body proportions and height> from them. Do not use the grey studio background, the panel layout or the divider lines. The front and side views in @Image2 have no head: use them only for body and clothing, and do not reproduce the removed head or the blurred neck. <Nombre>'s wardrobe is <outfit de esta escena, por piezas>.
Do not interchange their appearances, clothing, actions, positions or dialogue.
```

Con la tabla de adjuntos, en orden:

| Handle | Archivo | Qué aporta |
|---|---|---|
| `@Image1` | `ref_<nombre>/<NOMBRE>_CARA.png` | Identidad del rostro y expresiones |
| `@Image2` | `ref_<nombre>/<NOMBRE>_CUERPO.png` | Cuerpo, proporciones y outfit base |
| `@Image3` | `ref_<nombre>/<NOMBRE>_OUTFIT_<OUTFIT>.png` | Outfit de esta escena (si no es el base) |
| `@Image4` y siguientes | `ref_<nombre>/<NOMBRE>_PRODUCTO.png` | Producto y boceto de tamaño, si lo usa |

Notas **[H]**:
- Las hojas de cuerpo y de outfit tienen **paneles sin cabeza**. Se avisa en el bloque de que solo aportan cuerpo y ropa, para que el modelo no genere un personaje sin cabeza ni un cuello difuminado.
- Se indica que **no** se use el fondo ni la maquetación de la hoja.
- El producto lleva su propia línea: `The <producto> corresponds to @ImageN. Use only <forma, color, logotipo>. Exactly one.` Si lleva pantalla, solo la carcasa.
- Seedance 2.5 admite hasta 30 imágenes de referencia y un audio, según el contrato de AILAB a fecha 2026-10-24: se comprueba con `AILAB info seedance-2-5`.

### Conducta del personaje

Se añade, **sacado de la ficha**, un párrafo con su forma de actuar en esta escena: postura y peso, forma de caminar, mano con la que gesticula y qué hace la otra, forma de sonreír, política con la cámara y microvida. Como **conducta visible**, no como etiquetas, y solo lo que aplique a la escena.

```text
<Nombre> never addresses the camera. Her right hand is her talking hand; her left hand hangs and swings naturally. Her smile starts at the corners of the mouth, her eyes narrow slightly and the teeth show only a little. She walks with a short, unhurried step and her arms swing loosely.
```

(Ejemplo de formato. El contenido sale de la ficha, nunca se inventa.)

## 3. Bloque de voz

Según la ruta guardada en la ficha:

**Seed Audio:**
- Si se genera audio nuevo para la escena: se usa la **línea `Voice` exacta** guardada en `prompt.md (sección 6)` y se sigue `voz-seed-audio.md`.
- Si se usa el audio aprobado como referencia: se pasa `voz_<nombre>/<nombre>_seedaudio.wav` como `--audio_urls` (nunca con `--image_url`) y se cita como `@Audio1`.
- En el prompt de vídeo, el audio generado entra como `@Audio1` con el contrato de audio exacto del modelo.

**ElevenLabs:** se genera la frase con `eleven-tts` y la voz guardada (`--private_voice_id` o `--voice_id`), y el audio resultante se pasa como `@Audio1` al vídeo.

En Seedance 2.5, el diálogo va entre `{ }` y se declara el idioma y el acento antes de cada hablante:

```text
Dialogue language: Spanish (Spain). <Nombre> says in <descripción breve de la voz según la ficha>: {<frase>}
```

Se recuerda que la consistencia de voz entre generaciones **no está garantizada**.

## 4. Otros modelos

Se conserva el contenido de los bloques (identidad, qué referencias usar y cuáles no, conducta y voz) y se adapta la sintaxis a la del modelo. Si se desconoce, se pregunta o se entrega el contenido en prosa. Para imágenes con Nano Banana 2.1 en AILAB, `edit` admite de 1 a 14 referencias ordenadas: se adjuntan en el orden de la tabla y se numeran en el texto.

## 5. Después

- Si el usuario tiene una skill para escribir o refinar el prompt de vídeo completo, el bloque se pega en ella. Esta skill no escribe la escena.
- Si el personaje sale distinto al generar, se anota qué cambió (cara, voz, gesto, ropa) y se propone **una** corrección: más referencias, un bloqueo explícito en el bloque, o actualizar la ficha.
