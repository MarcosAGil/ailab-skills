# Voz con Seed Audio (ruta recomendada)

> **Alcance:** esta plantilla sirve para un **audio de referencia** del personaje (voz limpia, sin ambiente ni música). Si el usuario quiere un audio de escena (mar, viento, música), se redacta con su propio brief y se guarda en `prompts_intermedios/generaciones/`; solo entra en `voz_<nombre>/` si lo aprueba como referencia.

Esta guía integra el conocimiento del Audio Prompter de Ailendra Labs sobre Seed Audio (documentación oficial de fal.ai verificada el 10 de agosto de 2026) y el catálogo de AILAB a fecha 2026-10-24. Si algo no está documentado, aquí se dice.

Niveles de confianza: **[D]** documentado, **[H]** heurística razonada, **[?]** hipótesis por validar generando, **[ND]** no documentado.

## 1. Qué es y qué papel juega

Seed Audio genera una **escena acústica integrada**: voz, ambiente, efectos y, si se pide, música, en una sola pasada. No da pistas separadas, no asigna presets de voz distintos a cada personaje y no garantiza sincronía por fotograma **[D]**. Es un **modelo caro**: se avisa antes de enviar.

Para esta skill se usa de la forma más simple: **una sola voz, hablando limpia y de cerca**, para obtener un audio de referencia del personaje.

## 2. Contrato de AILAB

Se comprueba siempre con `AILAB info seed-audio`. Con el catálogo de 2026-10-24:

| Parámetro CLI | Regla |
|---|---|
| `--prompt` | Obligatorio. Máximo **2.048 caracteres** **[D]** |
| `--audio_urls` | Hasta 3 referencias de audio, cada una de hasta 30 s y 10 MB **[D]** |
| `--image_url` | Una imagen. **No se combina con `--audio_urls`** **[D]** |
| `--estimated_duration_seconds` | Es una **estimación**; la duración real la decide el modelo |
| `--output_format` | `wav` (referencia y posproducción), `mp3`, `pcm`, `ogg_opus` |
| `--speed` | 0,5 a 2 (por defecto 1) |
| `--volume` | 0,5 a 2 (por defecto 1) |
| `--pitch` | Semitonos, entero, de -24 a 24 (por defecto 0) |

**La CLI de AILAB no expone un campo `voice` ni `multilingual`** **[D]**. La documentación del Audio Prompter habla de un preset de voz y de `multilingual`, pero aquí **la voz se define en el texto del prompt** (línea `Voice (...)` y `[DIAL]`). Nunca se escribe un preset como si fuera un flag. Si algún día `info` los muestra, se usan.

## 3. Plantilla del prompt de voz de referencia

El orden es siempre `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]`. El diálogo va entre **comillas dobles rectas**. Idioma y acento se repiten en **tres sitios**: línea `Voice`, cada `[DIAL]` y `[ETIQUETA]`. Las instrucciones descriptivas van en inglés; la frase de muestra, en su idioma, con tildes y eñes.

```text
<N>-sec clean voice reference clip, one person speaking to camera in a quiet room, natural, conversational, no music.

[AESTHETIC]
- Texture: dry, clean close-mic vocal, no reverb.
- Environment: quiet small room, almost silent background.
- Voice (<Nombre>): <edad, sexo, país/acento, carácter, ritmo y distancia al micro>.
- Mix: voice dominant; no ambience or effects; never covering the voice.
- Palette: none beyond the voice; at most faint room tone.

[EXECUTION]
[AMBI] Faint room tone -> [DIAL] <Nombre> (<carácter>, <idioma y acento>): "<frase de muestra>" -> [TRANS] Natural end of the phrase, no tail.

[ETIQUETA: <idioma y acento>, una sola voz <femenina|masculina>, sin narrador, sin música, duración exacta <N>.0s]
```

Notas:
- Es una **plantilla de esta skill [H]**, construida con la estructura del Audio Prompter. Pensada para un audio limpio y reutilizable: voz seca, sin ambiente ni música, que es lo que mejor sirve como referencia y para clonar.
- La **línea `Voice`** se redacta desde la sección 6 de la ficha: edad, sexo, país y acento, carácter, ritmo y distancia al micro. Es la **identidad de la voz**: se guarda exacta en `prompt.md (sección 6)` y en la ficha.
- **Frase de muestra:** de 25 a 45 palabras para unos 10 a 15 segundos, representativa del personaje. La aporta el usuario; si no, se propone una y se aprueba. No se parafrasea ni se recorta sin permiso.
- **Longitud:** el prompt completo (brief hasta `[ETIQUETA]`, con diálogo, tags, espacios y saltos de línea) no puede pasar de 2.048 caracteres. Se cuenta antes de enviar:

```bash
printf %s "$(cat prompts_intermedios/generaciones/voz-v1.txt)" | wc -m
```

  Si no cabe, se acorta el brief, la textura o el entorno. **Nunca la frase de muestra.**
- Para castellano de España, la documentación lo trata como **experimental** hasta validarlo localmente **[D]**. Se avisa solo si el usuario pregunta por garantías o el resultado falla. Ver `acentos.md`.

**Ejemplo de ejecución (solo de formato, personaje inventado):**

```text
12-sec clean voice reference clip, one person speaking to camera in a quiet room, natural, conversational, no music.

[AESTHETIC]
- Texture: dry, clean close-mic vocal, no reverb.
- Environment: quiet small room, almost silent background.
- Voice (Lucía): mujer joven, español de España, acento castellano, tono cálido y conversacional, ritmo pausado, cerca del micro.
- Mix: voice dominant; no ambience or effects; never covering the voice.
- Palette: none beyond the voice; at most faint room tone.

[EXECUTION]
[AMBI] Faint room tone -> [DIAL] Lucía (cálida, conversacional, español de España): "Hola, me llamo Lucía y me encanta contarle a la gente cómo hago las cosas, paso a paso y sin prisa. Si algo no sale a la primera, lo vuelvo a intentar." -> [TRANS] Natural end of the phrase, no tail.

[ETIQUETA: español de España, una sola voz femenina, sin narrador, sin música, duración exacta 12.0s]
```

## 4. Generar la referencia

```bash
AILAB info seed-audio
AILAB prepare seed-audio --prompt "$(cat "$P/prompts_intermedios/generaciones/voz-v1.txt")" \
  --output_format wav --estimated_duration_seconds 12
AILAB submit <manifest_id_real> --confirmed --output "$P/prompts_intermedios/generaciones/"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/prompts_intermedios/generaciones/<archivo>.wav"
```

1. Se enseña el coste de `prepare` y se avisa de que es un modelo caro.
2. Se mide la duración real con `ffprobe` y se informa. **La skill no puede escuchar el audio**: lo dice y pide al usuario que lo escuche.
3. **Puerta:** el usuario aprueba, o pide **un** cambio (por ejemplo, el ritmo o la descripción del timbre). No se regenera sin su sí.
4. Si el clip aprobado dura más de 30 s, se recorta a un tramo limpio de hasta 30 s para poder usarlo como referencia (`audio_urls` admite hasta 30 s y 10 MB):

```bash
ffmpeg -i "$P/prompts_intermedios/generaciones/<archivo>.wav" -t 30 -c copy "$P/voz_$N/${N}_seedaudio.wav"
```

Si es más corto de 30 s, se copia tal cual a `voz_<nombre>/<nombre>_seedaudio.wav`.

## 5. Qué se guarda de la voz

En la sección 6 de `prompt.md`:
- La **línea `Voice` exacta** y el prompt completo con el que se generó.
- La frase de muestra, el idioma y el acento declarados.
- Los ajustes (`output_format`, `speed`, `volume`, `pitch`) y la duración real.
- El archivo aprobado: `voz_<nombre>/<nombre>_seedaudio.wav`.
- La advertencia de que la consistencia no está validada.

## 6. Mantener la voz entre generaciones

Hay dos caminos, ambos **[?]**, ninguno garantizado:

- **A. Repetir exactamente la misma línea `Voice`** en cada prompt de Seed Audio. La voz concreta que sale no está documentada **[ND]**: se valida escuchando.
- **B. Usar el audio aprobado como referencia.** Se pasa `voz_<nombre>/<nombre>_seedaudio.wav` como `--audio_urls`, y se cita como `@Audio1` en `Voice (@Audio1)` y en `[DIAL] @Audio1`. Solo es válido con material autorizado y limpio, y **no se combina con `--image_url`**: si se quiere usar una imagen, se pierde la referencia de audio.

```text
- Voice (@Audio1): <misma descripción de voz>.
...
[DIAL] @Audio1 (<carácter>, <idioma y acento>): "<frase>"
```

Si el usuario necesita una voz estable, se le dice que ninguna de las dos garantiza la consistencia y se le ofrece probar con dos tomas y escuchar la diferencia. Para una voz fija con identidad guardada en AILAB, ver `voz-elevenlabs.md`.

No se sabe si una voz creada con ElevenLabs en AILAB puede usarse dentro de Seed Audio **[ND]**; no se promete.

## 7. Usar la voz en un vídeo

El audio aprobado se puede pasar como referencia de audio (`@Audio1`) al generar vídeo con Seedance 2.5, o se pueden generar audios nuevos con la línea `Voice` guardada. Ver `usar-en-escena.md`.

## 8. Control de calidad

- Es el orden `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]`.
- Idioma y acento repetidos en `Voice`, `[DIAL]` y `[ETIQUETA]`.
- Frase de muestra entre comillas dobles rectas, literal, sin tocar.
- Menos de 2.048 caracteres contados.
- Una sola voz. Sin música ni ambiente que tape la voz.
- `--image_url` y `--audio_urls` nunca juntos.
- Ningún flag `voice` ni `multilingual`.
- Salida `wav` para la referencia.
