# Método 2: Seed Audio en vídeo

La pista sonora completa de una escena ya escrita, generada con Seed Audio y clonando la voz del personaje a partir de su pangrama, montada en un vídeo negro de segundos enteros. Quien haga el vídeo la usa como **pista exacta**.

Niveles de confianza: **[D]** documentado o dato de la CLI, **[C]** comprobado en la escena de la corbata con Luis, **[H]** decisión razonada, **[?]** hipótesis por validar.

## 1. Los dos métodos

La primera parte es la misma en los dos: hojas del personaje (3x3 y una de 3 paneles por outfit) y voz con el pangrama, con ElevenLabs v4 o con Seed Audio (`flujo-crear.md`, fases 1 a 6). Cambia cómo llega la voz a la escena.

| | **Método 1 · Pangrama en vídeo** | **Método 2 · Seed Audio en vídeo** |
|---|---|---|
| Qué recibe el modelo de vídeo | El vídeo negro del pangrama (o el clip) como **guía de voz** | Una pista con **todo el sonido de la escena** como audio exacto |
| Quién decide qué se dice y cuándo | El modelo de vídeo, a partir de su prompt | La pista: diálogo, pausas, ambiente y efectos ya están hechos |
| Qué hace la skill | Las hojas, la voz, el vídeo negro y, si se pide, el clip | Lo mismo y, por cada escena, la pista con Seed Audio y su vídeo negro |
| Cuándo conviene | Escenas sencillas o cuando el diálogo aún puede cambiar | Escenas con diálogo cerrado, varias voces o mucho sonido que tiene que caer en su sitio |

En el método 2 la voz llega solo por la pista: el vídeo negro del pangrama no se adjunta, y las referencias visuales son las **hojas (modo A)**. El clip también lleva la voz del pangrama: junto a la pista serían dos fuentes de voz con palabras distintas, así que con el método 2 no se usa **[H]**.

## 2. El flujo completo y quién hace cada paso

| Paso | Qué se hace | Quién lo hace |
|---|---|---|
| 1 | Personaje: hojas, outfit y voz con el pangrama | Esta skill |
| 2 | Prompt de vídeo de la escena | **Otro sistema**: un agente de prompts de vídeo, una skill de prompting o una persona |
| 3 | Prompt de Seed Audio de la escena, a partir del paso 2 | Esta skill |
| 4 | Generar la pista con el pangrama adjunto como voz | Esta skill (o el usuario en la plataforma) |
| 5 | Vídeo negro con la pista, en segundos enteros | Esta skill |
| 6 | Cambiar el prompt de vídeo para meter el vídeo negro como pista exacta | **El sistema del paso 2** |
| 7 | Generar el vídeo | Quien haga el vídeo |

**Esta skill no escribe ni modifica prompts de vídeo** (pasos 2 y 6), para ningún modelo. Si el usuario los pide, se le dice en una línea que eso lo hace su sistema de prompts de vídeo y se le da lo que necesita pasarle: la carpeta del personaje, la ruta del vídeo negro y el mapa de tiempos (sección 6).

## 3. Qué necesita

1. **El prompt de vídeo de la escena**, ya escrito (paso 2). Sirve el de cualquier modelo.
2. **La duración de la escena (T)**, en segundos enteros. Si el prompt de vídeo no la dice, se pregunta.
3. **La carpeta de cada personaje que habla**, con su audio del pangrama aprobado: `hojas-y-voz/Audio1_voz-pangrama_<Tp>s.wav` (Tp es la duración del pangrama, no la de la escena).
4. **La carpeta de la escena**, donde se guarda todo lo de este método. Si no está clara, se pregunta una vez. Nada de esto va a la carpeta del personaje: la pista es de la escena. En ella se crea un `registro.md` con la misma tabla que el del personaje (`flujo-crear.md`, fase 0) para apuntar prompt, task_id, coste y estado.

## 4. Escribir el prompt de Seed Audio

Del prompt de vídeo se saca **solo la capa sonora**:

| Se saca | Cómo |
|---|---|
| Duración | La del prompt de vídeo. Va en el brief y en `[ETIQUETA]` |
| Espacio y acústica | Dónde suena cada cosa: sala dura y reverberante, otra más seca, exterior |
| Cada voz | Quién habla, edad, idioma y acento, y si está en cuadro o fuera de campo |
| Cada frase | **Literal**, entre comillas dobles rectas, con su emoción, ritmo, volumen y distancia. Nunca se reescribe ni se parafrasea |
| Cada sonido | Pasos, ropa, objetos, golpes, respiraciones: en el tramo en que pasan |
| Tramos | Los mismos tiempos que los stages o tramos del prompt de vídeo |
| Lo que no hay | Música, narrador, subtítulos |

Reglas, además de las de `voz-seed-audio.md`:

- Orden fijo: `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]` **[C]**.
- **Las voces con pangrama** se citan con su handle de audio, en el orden en que se adjuntan: `Voice (<Nombre> / @Audio1)` en `[AESTHETIC]` y `[DIAL] <Nombre> (...)` en `[EXECUTION]` **[C]**. Seed Audio admite hasta 3 audios de referencia **[D]**: hasta tres voces clonadas por escena.
- **Si otro personaje de la escena tiene su propio pangrama**, se adjunta también, como `@Audio2` (y `@Audio3`), con su línea `Voice (<Nombre> / @Audio2)`. Así su voz es la misma en todas sus escenas.
- **Las voces sin pangrama** se describen enteras en su línea `Voice (<rol>)`: edad, idioma, acento, tono y distancia. En la corbata, la mujer fue `Voice (Wife)` y Seed Audio la inventó **[C]**. Si esa voz se va a repetir en otras escenas, conviene hacerle antes su pangrama.
- Un nombre propio solo aparece **junto a su handle** (`Luis / @Audio1`). Sin handle, un nombre no ancla nada y puede leerse en voz alta: se usa `Man`, `Woman` o un rol (`Wife`).
- Idioma y acento en tres sitios: cada línea `Voice`, cada `[DIAL]` y `[ETIQUETA]`.
- Cada tramo de `[EXECUTION]` lleva su tiempo: `[0.0-3.5s]`.
- **2.048 caracteres como máximo** **[D]**. Se cuentan antes de enviar (`printf %s "$(cat <prompt>.txt)" | wc -m`). Si no cabe, se acorta el brief, la textura o la paleta. **Nunca un diálogo.**

### Plantilla

Se rellenan todas las variables y se repiten las líneas que haga falta (una `Voice` por voz, un tramo por stage). El ejemplo de la sección 8 es esta plantilla rellena.

```text
{{T}}-sec {{TIPO_DE_ESCENA}} in {{UNA_TOMA_O_VARIAS}}, {{ESPACIOS}}. High-fidelity acoustic integration of dialogue, spatial reflections, and action-driven foley. No music, no subtitles, no narrator.

[AESTHETIC]
- Texture: {{TEXTURA_Y_ACUSTICA_DE_CADA_ESPACIO}}, clear vocal hierarchy over foley.
- Environment: {{ENTORNO}}.
- Voice ({{Nombre}} / @Audio1): {{DESCRIPCION_VOZ}}. {{CAMBIO_DE_TONO_A_LO_LARGO_DE_LA_ESCENA}}.
- Voice ({{ROL_SIN_PANGRAMA}}): {{EDAD, IDIOMA, ACENTO, TONO Y DISTANCIA}}.
- Palette: {{SONIDOS_DE_LA_ESCENA}}.

[EXECUTION]
[{{a}}-{{b}}s] [AMBI] {{AMBIENTE}} -> [DIAL] {{Nombre}} ({{EMOCION, RITMO, VOLUMEN, DISTANCIA}}, {{IDIOMA}}): "{{FRASE_LITERAL}}" -> [EVENT] {{SONIDO}}.
[{{a}}-{{b}}s] [EVENT] {{SONIDO}}.
[{{a}}-{{T}}s] [DIAL] ... -> [TRANS] room tone holds until {{T}}.0s fade out.

[ETIQUETA: {{IDIOMA}}, {{NUMERO_Y_TIPO_DE_VOCES}}, sin narrador, sin música, duración exacta {{T}}.0s]
```

`{{DESCRIPCION_VOZ}}` sale de la fila "Voz" del `LEEME.md` de cada personaje. Si la escena lleva música o narrador, se quitan de la línea del brief y de `[ETIQUETA]`.

## 5. Generar la pista

```bash
E="<carpeta de la escena>"; ESC="<etiqueta-de-la-escena>"; T=<duración de la escena>
P1="<carpeta del personaje 1>"; P2="<carpeta del personaje 2, si tiene pangrama>"
AILAB info seed-audio
AILAB prepare seed-audio --prompt "$(cat "$E/prompt_seed-audio_${ESC}.txt")" \
  --audio_urls "$P1/hojas-y-voz/Audio1_voz-pangrama_<Tp>s.wav" \
  --audio_urls "$P2/hojas-y-voz/Audio1_voz-pangrama_<Tp>s.wav" \
  --output_format wav --estimated_duration_seconds $T
AILAB submit <manifest_id_real> --confirmed --output "$E/"
```

La línea de `$P2` solo va si hay segunda voz con pangrama.

- Un `--audio_urls` por voz con pangrama, en el orden de los handles (`@Audio1`, `@Audio2`...). Cada audio de referencia: 30 s y 10 MB como máximo **[D]**.
- Sin `--image_url`: no se combina con `--audio_urls` **[D]**.
- Seed Audio es **modelo caro**: se enseña el coste de `prepare` y se avisa antes de enviar.
- El usuario puede generarla él en la plataforma con el mismo prompt y los mismos audios adjuntos. Así se hizo en la corbata **[C]**.
- El archivo que descarga la CLI se renombra, sin convertirlo, a `$E/pista-${ESC}_original.<ext>`, con la extensión que traiga (`wav` si se pidió así; `mp3` si viene de la plataforma).
- **Puerta:** el usuario la escucha y la aprueba. La skill no puede escuchar. Si pide un cambio, se cambia una sola cosa del prompt.

## 6. Vídeo negro en segundos enteros

**El audio no se toca:** ni ganancia, ni compresión, ni filtros. Solo se codifica en AAC para meterlo en el MP4. El medidor de −24 LUFS es del pangrama, no de esta pista. Lo único que cambia es la duración, a segundos enteros:

1. Se mide la duración real (`ffprobe`) y los silencios (`silencedetect`), como en `volumen-y-video-negro.md`, sección 2.
2. **Dura menos que T:** se rellena con silencio hasta T.
3. **Dura más que T:** si lo que sobra es silencio, se recorta a T. Si se cortaría sonido, T pasa a ser la duración redondeada hacia arriba (`T=<entero superior>`) y se avisa: el prompt de vídeo tendrá que usar esa duración. Un MP3 a 24 kHz añade unos 0,048 s de relleno que no es sonido: se recorta.
4. Con la T ya decidida, se monta el vídeo negro conservando la frecuencia de muestreo original:

```bash
IN="$E/pista-${ESC}_original.<ext>"
ffmpeg -y -f lavfi -i color=c=black:s=1280x720:r=24 -i "$IN" -map 0:v -map 1:a -t $T \
  -af "apad,atrim=0:${T}" -c:v libx264 -pix_fmt yuv420p -preset medium -tune stillimage \
  -c:a aac -b:a 192k -movflags +faststart "$E/Pista_${ESC}_${T}s.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_type,duration,nb_frames -of compact "$E/Pista_${ESC}_${T}s.mp4"
```

Si el usuario trae la pista ya montada en vídeo negro y dura T exactos, se usa tal cual, sin recodificar. La de la corbata era un MP4 de 640 x 480 con audio AAC y duraba 18,000 s **[C]**. Si no dura segundos enteros, se le aplican los pasos 2 a 4.

5. **Mapa de tiempos.** Se miden los tramos con sonido (`silencedetect`) y, si está instalado `whisper` (opcional, ver Requisitos en `SKILL.md`), los tiempos de cada palabra. Se entrega como tabla: tiempo, quién habla o qué suena. Sin `whisper`, se dan los tramos y el usuario confirma qué es cada uno. Con este mapa, quien escriba el prompt de vídeo cuadra cada stage con su sonido.

## 7. Entrega

1. El **prompt de Seed Audio exacto**, guardado en `$E/prompt_seed-audio_${ESC}.txt`.
2. `Guardado en:` con la ruta absoluta del vídeo negro `Pista_<escena>_<T>s.mp4`.
3. Duración comprobada y el mapa de tiempos.
4. El **contrato de la pista**, para quien adapte el prompt de vídeo:
   - Es un vídeo negro: solo se usa su audio y la imagen negra se ignora.
   - Es la **pista exacta** de la escena. Manda sobre el diálogo, las voces, el acento, las pausas, el ambiente y el momento de cada sonido.
   - No se regenera, reescribe, acorta, alarga ni sustituye ningún diálogo. No se crea ninguna voz nueva ni se añade ningún sonido.
   - Labios, respiración, gestos, pasos y contactos con objetos se sincronizan con la pista.
   - Quién es cada voz: `<la voz de hombre es Luis; la de mujer, su mujer fuera de campo>`.
5. La frase para el usuario: "Pásale a tu sistema de prompts de vídeo el prompt de la escena, este vídeo negro y el mapa de tiempos, y pídele que meta el vídeo negro como pista exacta."

## 8. Ejemplo: la escena de la corbata

Escena de 18 s con Luis: se mira la corbata en el espejo del baño, sale a enseñársela a su mujer, que nunca se ve, ella le contesta seca, vuelve al espejo y se arranca el nudo. Dos voces: Luis con su pangrama como `@Audio1` y su mujer sin referencia. 2.017 caracteres. El usuario lo generó en la plataforma y el resultado funcionó **[C]**.

```text
18-sec domestic scene in one continuous take, bathroom and adjacent bedroom. High-fidelity acoustic integration of dialogue, spatial reflections, and action-driven foley. No music, no subtitles, no narrator.

[AESTHETIC]
- Texture: realistic domestic audio, hard reflective bathroom acoustics, drier bedroom space, clear vocal hierarchy over foley.
- Environment: stone bathroom with open doorway leading to a dimmer bedroom.
- Voice (Luis / @Audio1): hombre de 30-35 años, español de España, acento castellano. Cambia de tono cálido y orgulloso a rabioso, rápido y finalmente agotado.
- Voice (Wife): mujer de 30 años, español de España, acento castellano, fuera de campo desde el dormitorio, acústica más distante y seca.
- Palette: silk tie fabric friction, heavy footsteps on floor, bathroom counter contact, deep exhale.

[EXECUTION]
[0.0-3.5s] [AMBI] quiet apartment room tone with subtle bathroom reverb -> [DIAL] Luis (warm, proud, proyectando hacia el dormitorio, español de España): "Cariño, ¿cómo ves la corbata?" -> [EVENT] silk tie rasping against shirt collar.
[3.5-6.5s] [EVENT] steady rhythmic footsteps moving from bathroom to bedroom.
[6.5-8.5s] [DIAL] Wife (off-screen left, flat, dry, disappointed, español de España): "No aprendes, eh." -> [AMBI] brief heavy silence.
[8.5-11.0s] [EVENT] quick heavy footsteps pacing back into the bathroom.
[11.0-14.5s] [DIAL] Luis (angry, fast, through teeth, español de España): "Nada, pues a hacer el nudo como la princesa quiera." -> [EVENT] tie fabric snapping loudly as the knot is yanked loose.
[14.5-18.0s] [DIAL] Wife (off-screen, sharp,  español de España): "¿Qué dices?" -> [DIAL] Luis (low, to himself, drained, tired, español de España): "Ni respirar uno puede." -> [EVENT] long heavy exhale -> [EVENT] hand resting firmly on stone counter -> [TRANS] room tone holds until 18.0s fade out.

[ETIQUETA: español de España, dos voces (hombre principal, mujer fuera de campo), sin narrador, sin música, duración exacta 18.0s]
```

Mapa de tiempos medido en la pista (whisper, perfil de energía y `silencedetect`):

| Tiempo (aprox.) | Sonido |
|---|---|
| 0,2 s | Luis: «Cariño,» |
| 2,9 a 3,7 s | Luis: «¿cómo ves la corbata?» |
| 4,4 · 5,2 · 6,0 s | Pasos |
| 6,8 a 8,5 s | Mujer: «No aprendes, eh.» |
| 9,7 · 10,3 · 10,8 s | Pasos |
| 11,0 s | Luis: «Nada,» |
| 12,6 a 14,4 s | Luis: «pues a hacer el nudo como la princesa quiera.» |
| 14,5 s | Tirón de la corbata y mujer: «¿Qué dices?» |
| 15,1 a 16,0 s | Luis: «Ni respirar uno puede.» |
| 16,0 a 16,9 s | Resoplido |
| 17,3 s | Mano contra la encimera |

Lo que enseña:

- Los tramos no caen exactos donde dice el prompt: «Cariño» y «¿cómo ves la corbata?» quedaron separados por una pausa larga. Por eso se mide la pista y se entrega el mapa, en vez de dar por buenos los tiempos del prompt **[C]**.
- El usuario aprobó la pista al oírla, con la voz de Luis clonada desde su pangrama en tres emociones distintas (orgulloso, rabioso, agotado) **[C]**.
