# Clip de referencia (opcional)

Un clip corto de dos paneles sobre gris que fija a la vez **la cara, la voz, el outfit y la forma de actuar** del personaje. El modelo probado es **Seedance 2.5** **[C]**.

Niveles de confianza: **[D]** documentado, **[C]** comprobado en `ejemplo-luis.md`, **[H]** decisión razonada, **[?]** hipótesis por validar.

## 1. ¿Hace falta?

**No.** Para las escenas basta con las hojas aprobadas y el vídeo negro con el pangrama:

| Forma de usar el personaje | Referencias en la escena | Cuándo |
|---|---|---|
| **A. Hojas + voz** (por defecto) | Hoja 3x3, hoja de 3 paneles del outfit, hojas de escala de los objetos y el vídeo negro del pangrama | Siempre funciona. No necesita el clip |
| **B. Clip de referencia** | El clip (sustituye a la 3x3 y a la voz suelta), más las hojas de escala si hay objetos | Cuando se quiere más consistencia de cara, voz y actuación, o la escena tiene mucho diálogo |

El clip **puede mejorar los resultados**, porque el modelo ve al personaje hablar con su voz, girar la cabeza y moverse con su ropa. Pero cuesta un vídeo extra (Seedance 2.5 es modelo caro) y sus segundos cuentan dentro del límite de referencias. Se le pregunta al usuario si lo quiere. Se pide **una vez por outfit**, si el outfit cambia.

## 2. Qué necesita

1. La hoja de 3 paneles del outfit, aprobada.
2. La hoja 3x3, aprobada.
3. El vídeo negro con la voz aprobada, de T segundos exactos.
4. La personalidad en 2 o 3 adjetivos y cómo se nota (cabeza, cuánto se mueve, tamaño de las reacciones). Si la ficha no la tiene, se saca de la descripción de voz aprobada y se confirma con el usuario.
5. Los tiempos de los silencios del audio (`silencedetect`, ver `volumen-y-video-negro.md`).
6. El modo de la voz (natural o rango emocional) y, si es emocional, el pangrama etiquetado.

## 3. Tiempos

- **Panel derecho:** un solo plano de T segundos.
- **Panel izquierdo:** n planos, con **n = el menor de 7 y T ÷ 2 redondeado hacia abajo**. Los planos 2 a n duran 2 s; **el plano 1 se queda con el resto (T − 2 × (n − 1))**.
- Orden del montaje: giro de cuerpo entero, espalda, perfil derecho completando el giro, y después detalles del outfit.

| T | Planos izquierda | Plano 1 |
|---|---|---|
| 5 | 2 | 3 s |
| 8 | 4 | 2 s |
| 10 | 5 | 2 s |
| 12 | 6 | 2 s |
| 14 | 7 | 2 s |
| 15 | 7 | 3 s |

## 4. Giros de cabeza

La cabeza nunca se queda quieta en un ángulo: gira entre 15 y 20 grados a cada lado del frente. El estilo sale de la personalidad:

| Personalidad | Cómo se mueve la cabeza |
|---|---|
| Tímido, dulce | Movimientos pequeños, suaves y dudosos, mira hacia abajo, se sobresalta |
| Frío, controlado | Lento, mínimo y preciso; pausas largas; un giro seco en el pico |
| Descarado, caótico | Rápido y con rebote, se balancea con el ritmo, da un latigazo en la frase alta |
| Agresivo, duro | Barbilla baja, mirada dura, giros pesados, empuja hacia delante en la frase alta |
| Cálido, abierto | Giros fáciles y generosos, se inclina, mira mucho cerca del objetivo |
| Seguro, cercano, sin sobreactuar | Giros fáciles y sin prisa, nunca teatrales; un giro más decidido en la exclamación **[C]** |

En modo natural no hay etiquetas: cada movimiento va a **una frase**, con los segundos medidos en el audio **[C]**. En modo emocional, cada etiqueta lleva un movimiento y un gesto facial, en orden.

## 5. Plantilla (Seedance 2.5)

Se rellenan todos los corchetes. Sin nombres de personaje, sin relación de aspecto en el texto, sin palabras de grano ni de defectos de lente, sin niebla y sin bloque de prompt negativo. El ejemplo midió 12.789 caracteres; Seedance 2.5 admite 30.000 **[D]**.

```text
Two side-by-side panels, total [T] seconds. The LEFT panel is a montage of [n] shots with hard cuts inside the left panel only: shot 1 runs [s1] seconds, shots 2 through [n] run 2 seconds each. The RIGHT panel is 1 continuous shot for the full [T] seconds, never cutting. No transitions, no dissolves. All footage real-time, no slow motion, no speed ramping anywhere.
Style: 8K photorealism, high dynamic range, large-format film look. NOT a 3D render, NOT a game engine, NOT a game-cutscene aesthetic, NOT a cartoon.
Operating style: clean studio character-reference capture, in-camera feel, tactile textures, photochemical look.
Texture: matte non-reflective surfaces, [the outfit's real materials], no digital gloss, no plastic sheen.
Skin: pore-level realism, fine vellus hair, natural asymmetry, no smoothing, no retouching.
Technical: real-time 24fps, true 180-degree shutter with a real 1/48 second exposure on every frame, genuine photographic motion blur, each frame blending smoothly into the next. No flicker, no warping, no morphing, no frame interpolation, no frame blending, no ghosting, no high-shutter video crispness.
NO ON-SCREEN TEXT, CRITICAL: no on-screen text of any kind anywhere in frame at any point. No captions, no subtitles, no burned-in dialogue, no auto-captions, no karaoke text, no lower thirds, no titles, no title cards, no credits, no watermarks, no logos, no timecode, no UI overlays, no social-media overlays, no interface elements, no [script of the language: "Latin-alphabet words or letters" for Spanish]. The frame is clean of all overlay graphics from first frame to last.
THE SPEECH IS THE PRIMARY SUBJECT, CRITICAL: in the RIGHT panel the [man/woman/person] speaks out loud to the attached voice recording in @Video1, in [language and accent], every syllable formed on [his/her/their] lips in time with it, for its full length. [He/She/They] is the speaker of this recording, never mouthing along. The words [he/she] forms, in order: "[the pangram exactly, tags removed]" Every closed consonant lands as a complete visible lip seal held a beat before releasing: both lips press fully together on [every word with a real b, p or m closure]. [For Spanish: A b or v between vowels does not seal the lips in Castilian Spanish: on (words) the lips come close without closing.] Open vowels are held open, the jaw working with the phrasing, never lazily half-open or mumbling. [If facial hair: The lip line stays readable under the moustache at every moment.] [His/Her] mouth is the focus of the right panel.
THE HEAD TURN AND THE MOUTH, CRITICAL: in the right panel [he/she] turns [his/her] head naturally while speaking, so the camera reads [his/her] facial expressions and bone structure from several angles. [Style of the turns from the personality.] [The head path beat by beat, with the seconds measured in the audio: where it starts, where it drifts on each line, the pauses, the one firmer turn on the peak, where it settles for the last line.] Every turn stays about fifteen to twenty degrees either side of front. [His/Her] mouth stays unobstructed and clearly readable in every frame and at every angle. Nothing ever covers it: no hand, no hair, [no collar or accessory that could rise over it].
THE TWO PANELS, CRITICAL: the frame is two equal side-by-side vertical panels on one continuous flat neutral 18% gray field, separated by a thin straight seam of the same gray. Every cut happens inside the LEFT panel only; the RIGHT panel runs unbroken through every left-panel cut, its performance never jumping, resetting, or pausing. Only the right panel speaks: in the left panel [his/her] face is fully visible and sharp, [his/her] mouth closed, never forming words, never mouthing along with the recording. The two panels never mirror each other or move in sync. The layout never shifts, resizes, or merges.
ASSETS:
@Image1 = identity and wardrobe reference only: its layout, panel arrangement, headless front view, and framing are never reproduced; the figure always has [his/her] head. [Sex, height in cm, build, skin, hair, eyes, brows, facial hair, identity marks with position, then the outfit one clause per garment, hardware, jewelry, what is NOT worn, nails, tattoos or none.] THIS SCENE: standing alone on the gray field. [His/Her] face identical in both panels. 100% match to the reference.
@Image2 = face and bone structure only; its grid, [clothing in the 3x3], background, and framing are not used.
GEOMETRY MAP: LEFT panel: each montage shot centred on [his/her] body against the bare gray field. RIGHT panel: tight close-up from just above the crown of [his/her] head to just below [the top of the outfit's neckline], [his/her] body angled slightly toward camera-left while the head turns on the neck. [He/She] is sharp in every shot, the gray field behind softly falling off. Nobody else is in either panel.
FIRST FRAME: already in motion in both panels: the left panel already mid-turn, the right panel already drawing [a breath in the personality's style] before the first word. No empty establishing hold, no static frame.
LENS LOCK LEFT, shots 1 to 3 = 84° (24mm) full body head to [shoe] soles with clear gray margin above and below, kept at distance so proportions stay true, no edge distortion. LENS LOCK LEFT, shots 4 to [n] = 12° (180mm) tight detail inserts. LENS LOCK RIGHT = 18° (120mm): a LONG lens, strong compression, the gray thrown soft, only [his/her] face sharp. NOT wide-angle, no deep focus. No focal drift within any shot.
CAMERA: locked-off for every shot in both panels, real tripod weight, no movement. The stillness of the frame is the subject.
LIGHT: relight from scratch overriding reference lighting. One broad, very soft diffused key from the front and slightly above, warm-neutral, wrapping evenly, faithful skin, a gentle soft triangle of light on the shadow cheek in the right panel that travels naturally across the face as the head turns, showing the brow, cheekbone, and jaw from each angle. The background is completely shadowless: no cast shadow from [his/her] body on the field or floor at any point, the gray evenly lit edge to edge. [Soft highlights travelling along any shiny materials or hardware.] Blacks lifted, highlights rolled off softly.
COLOUR: ~[x]% [dominant tones and their sources]; ~[y]% [skin and hair]; ~[z]% [accent color and its source].
ATMOSPHERE: the air carries real density at every depth: a continuous soft scattering gradient from the lens to the gray field, blacks lifted on [the darkest garments], the field falling off gently behind [him/her]. Low macro contrast; high micro contrast: [the outfit's textures], individual hair strands, skin pores, and hardware. [He/She] moves through the air without disturbing it. No plumes, no wisps, no beams, no rays. Nothing in the air is emitted by anything.
ACTION:
LEFT panel, shot 1, full body: a [personality-style] turn on the spot to [his/her] OWN left, from front through three-quarter toward profile, [one small character gesture].
LEFT panel, shot 2, full body: [his/her] back to the lens, weight shifting from one hip to the other: [hair from behind, back of every garment, footwear heels].
LEFT panel, shot 3, full body: [his/her] right side in profile, completing the turn back to front, settling into [a stance that fits the personality], a [personality-style] glance toward camera-right.
LEFT panel, shot 4, insert: [outfit detail].
[...one insert per remaining shot, each a different detail: collar or top construction, hardware, hands and jewelry, waist and belt, footwear with one heel lifting as [he/she] shifts.]
RIGHT panel, throughout: [he/she] speaks with the recording while the head turns as described, [his/her] eyes moving past the lens toward camera-left and back, never into the lens. [How much the shoulders move for this personality]; most of the movement lives in the neck, the jaw, and the face.
Micro-motion: [breathing in the personality's rhythm], hair shifting and settling on every head movement, [fabric creasing or settling]. Nothing in the environment moves.
PHYSICS: real gravity and bodyweight: [footwear] planting and pivoting with weight transfer through the hips, [garments and accessories swinging and settling], hair moving with real weight. [He/She] stands firmly grounded on the shadowless floor. Nothing floats, nothing slides.
ACTING: RIGHT panel: a [personality] presence, active brows and eyes matched to each line in order: [one facial beat per line or tag, in order, written as visible muscle: brows, eyes, mouth corners, cheeks, jaw]. Every expression lives in real facial muscle, never a frozen mask, never dead eyes. LEFT panel: [carriage in the personality's style], a neutral face with natural blinking and small idle shifts of the eyes, never mannequin-stiff.
AUDIO: the attached clip @Video1 is the sole and complete audio source for this sequence. Generate no additional audio of any kind: no room tone, no foley, no ambience, no breath, no added dialogue, no music.
LOCKS: two panels held for the full take: the left panel a [n]-shot outfit montage from three full-body angles into [n − 3] detail inserts, the right panel one unbroken close-up speaking with the recording while the head turns through about fifteen to twenty degrees either side of front. Cuts stay inside the left panel. One [man/woman/person], identical to @Image1 throughout: [hair, facial hair, identity marks, key garments, hardware] unchanged. Only the right panel speaks; the left panel mouth stays closed. Speech applies per THE SPEECH. The background stays completely shadowless and the light stays soft and identical across both panels. The air holds uniform density. Skin reads true cinematic matte: zero shine on forehead, nose bridge, cheekbones, and chin, real fine even pore texture, peach fuzz at the jaw and hairline, light absorbed like true subsurface scattering, rendering true and natural, never plastic. No CGI, no rendered look, no digital cleanliness, no AI smoothness, no frozen posing, no stabilized glide, no high-shutter crispness, no frame interpolation, no dropped frames.
```

**Luz [C]:** el clip lleva a propósito un modelado suave (una sombra ligera en la mejilla que viaja al girar la cabeza), distinto de la luz plana de las hojas. Sirve para que se lea la forma de la cara desde cada ángulo. En el ejemplo se aprobó así.

Bloques CRITICAL: cuatro como máximo. Si todo es crítico, nada lo es: no se añaden más **[H]**.

## 6. Orden de subida

**Ojo: para crear el clip el orden es distinto del de las escenas.** La plantilla del clip pone primero la hoja de 3 paneles y después la 3x3 **[C]**:

| Handle en el prompt del clip | Archivo |
|---|---|
| `@Image1` | `hojas-y-voz/Image2_<outfit>_3paneles.png` |
| `@Image2` | `hojas-y-voz/Image1_cara-3x3.png` |
| `@Video1` | `hojas-y-voz/Video1_voz-pangrama_<T>s.mp4` |

El prompt, solo el bloque de código y en texto plano, se guarda en `$D/clip-<outfit>_v1.txt`.

Si el usuario genera él en la plataforma y quiere los archivos numerados, se le hacen copias en una carpeta **temporal fuera del personaje** (por ejemplo en el escritorio) con el orden de subida en el nombre, y se borran al terminar. Dentro del personaje no se duplica nada.

## 7. Ajustes de generación

| Ajuste | Valor | Por qué |
|---|---|---|
| Modelo | Seedance 2.5 (`seedance-2-5`) | Es el modelo probado **[C]** |
| Modo | `ref` | Referencias de imagen y de vídeo |
| Formato | **16:9**, no `adaptive` | Dos paneles iguales de 8:9: cabe bien el cuerpo entero a la izquierda y el primer plano a la derecha. 9:16 deja paneles de 9:32, demasiado estrechos; 21:9, paneles más anchos que altos **[H]** |
| Resolución | 720p | La del ejemplo **[C]** |
| Duración | T | La del vídeo negro |
| Audio del modelo | Apagado (`--generate_audio false`) | La voz sale de `@Video1` **[H]** |

Con AILAB:

```bash
AILAB info seedance-2-5
AILAB prepare seedance-2-5 --mode ref --aspect_ratio 16:9 --resolution 720p --duration $T --generate_audio false \
  --prompt "$(cat "$D/clip-<outfit>_v1.txt")" \
  --reference_image_urls "$H/Image2_<outfit>_3paneles.png" \
  --reference_image_urls "$H/Image1_cara-3x3.png" \
  --reference_video_urls "$H/Video1_voz-pangrama_${T}s.mp4"
```

Seedance 2.5 es **modelo caro** y cobra también los segundos del vídeo de referencia: se enseña el coste de `prepare` y se espera el sí. El usuario puede generarlo él en la plataforma con ese orden de subida; así se hizo en el ejemplo.

La plantilla es de Seedance 2.5. Esta skill no cubre otros modelos para el clip: si el usuario quiere otro, se avisa de que no está probado **[?]**.

## 8. Revisar el clip

```bash
V="<clip>.mp4"; TMP="<carpeta temporal>"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,sample_rate,duration,nb_frames -of compact "$V"
# Hoja de contactos, un fotograma por segundo:
ffmpeg -y -i "$V" -vf "fps=1,scale=640:-1,tile=4x4" -frames:v 1 "$TMP/hoja-1s.png"
# Boca del panel derecho a 4 fotogramas por segundo (ajusta el recorte a la boca):
ffmpeg -y -i "$V" -vf "fps=4,crop=380:260:800:380,scale=256:-1,tile=10x6" -frames:v 1 "$TMP/bocas.png"
# Silencios del clip, para compararlos con los del audio original:
ffmpeg -hide_banner -i "$V" -af silencedetect=noise=-40dB:d=0.25 -f null - 2>&1 | grep silence_
```

| Comprobación | Cómo |
|---|---|
| Formato y duración | `ffprobe`. Si sale con un fotograma de más, se recorta a T (ver `volumen-y-video-negro.md`, sección 6) |
| Estructura | Dos paneles, el derecho sin cortes, el montaje izquierdo en el orden del prompt |
| Audio | Silencios en los mismos sitios que en el original (en el ejemplo, menos de 0,02 s de diferencia) y sin audio añadido |
| Boca | Abierta cuando hay voz, cerrada en las pausas. Los cierres de cada palabra no se pueden asegurar a 4 fotogramas por segundo: se le pide al usuario que los mire en sus segundos |
| Cara | Recorte frontal del panel derecho al lado de la 3x3 |
| Outfit | Cada prenda y cada detalle en los planos de detalle |
| Panel izquierdo | Boca cerrada |

Fallos menores vistos en el ejemplo y aceptados **[C]**: la barba sale algo más rala que en la 3x3, mira a cámara aunque el prompt pide mirar más allá del objetivo, y el panel izquierdo insinúa un suelo con un gris distinto al del derecho.

## 9. Problemas y soluciones

| Síntoma | Solución |
|---|---|
| La sincronía de labios se desvía | La duración del vídeo negro no coincide con T, o el texto de THE SPEECH no coincide con el audio |
| Los labios no cierran en b, p, m | Falta o está incompleta la lista de cierres |
| La cabeza se queda quieta | Falta el bloque de giros o es vago: escribirlo frase a frase |
| La cabeza gira demasiado y deforma la cara | Repetir "fifteen to twenty degrees either side of front" |
| El pelo, el cuello o el bigote tapan la boca | Nombrar esa cosa concreta en la línea de la boca |
| El panel izquierdo también habla | Repetir que la boca del panel izquierdo está cerrada |
| Aparecen subtítulos | El bloque NO ON-SCREEN TEXT se ha movido o recortado |
| El outfit cambia | Listar cada prenda en ASSETS y dar un plano de detalle a la pieza que falla |
| Bloqueo de moderación | Revisar primero las referencias (una cara borrosa puede bloquear) y después reformular |

## 10. Clip de escala con un objeto (opcional)

Mismo esquema de dos paneles, **sin diálogo y sin audio**: a la izquierda, montaje de cuerpo entero con el objeto (en reposo, llevado, levantado, de espaldas); a la derecha, un plano medio continuo de las manos y el objeto contra el torso, girándolo despacio. Referencias: hoja de 3 paneles y hoja de escala. Sin probar **[?]**.
