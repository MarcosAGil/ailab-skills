# Ejemplo completo y banco de preguntas

Un ciclo entero con un prompt corto y vago, para calibrar el nivel de detalle y el tono. Es un ejemplo de cómo se ve el trabajo, no una plantilla para copiar: la ciudad, la hora, los objetos y el producto cambian en cada caso.

## 1. El prompt de entrada

```text
UGC video of a woman showing a steel water bottle in her living room, then she walks to the kitchen while talking. Shot on iPhone, handheld, natural light, very realistic. She says: "Mira, esta es la botella de la que te hablaba." and then "Ven, que te enseño cómo cierra."
```

Referencias: `@Image1` es la ficha de la mujer; `@Image2` es la botella. Sin audio. Pide 10 s.

## 2. El informe de auditoría

```text
Auditoría de tu prompt
Veredicto: el texto está claro y la acción es sencilla, pero tiene 6 bloqueantes que harán que se vea como un anuncio: cómo se graba, cómo vibra, qué se ve, cómo cambia la luz, a dónde mira y qué está nítido.

Ya está bien resuelto: las dos frases están completas y la acción tiene sentido (enseñar y caminar).

Coherencia de escena: pasa a medias. Falta el motivo para grabar (K1) y el tipo de vivienda (E2).

Bloqueantes
1. [D2][D3] Dónde: "Shot on iPhone, handheld". Problema: no dice el montaje ni si es la cámara frontal o la trasera, y "handheld" no basta.
2. [V1][V3] Dónde: "handheld" y "then she walks". Problema: sin perfil de vibración, y caminar mientras enseña el producto pide un único movimiento principal.
3. [E1] Dónde: "living room", "kitchen". Problema: sin inventario de lo visible; el modelo pondrá un fondo de catálogo.
4. [L2][L3] Dónde: paso del salón a la cocina. Problema: no dice cómo reacciona la luz y la exposición.
5. [P2] Dónde: no aparece. Problema: no dice a dónde mira (lente, botella, camino).
6. [F1] Dónde: no aparece. Problema: no dice qué está nítido, y la botella cerca de la lente se deformará.

Importantes
7. [A2][A6] Dónde: "cómo cierra". Problema: no dice qué cierra ni con qué mano ni cómo.
8. [S1] Dónde: las dos frases. Problema: sin audio de referencia, la voz y la sincronía saldrán peor. Te recomiendo generar la voz con Seed Audio y pasármela.
9. [E9] Dónde: no aparece. Problema: ciudad, tipo de vivienda y hora sin decidir.
10. [A8] Dónde: no aparece. Problema: no dice cómo acaba.
11. [I3] Dónde: "very realistic". Problema: no aporta; se sustituye por detalle observable.

Menores que decidiré yo: ratio 9:16, dial natural, vida de fondo, microvida, texto sin leer en la botella.
```

## 3. Las preguntas (resumen de las dos rondas)

**Ronda 1 (bloqueantes)**

- [D2 + D3 + V1 + V3] "Dices 'handheld' y que 'walks' mientras enseña. ¿Cómo se graba?" A) Selfie con la cámara frontal a la distancia del brazo, y el móvil la acompaña mientras anda (Recommended). B) Cámara trasera y alguien la sigue. C) Móvil apoyado en el salón y luego corte.
- [P2] "¿A dónde mira?" A) A la lente casi todo el tiempo, con destellos a la botella y a dónde va (Recommended). B) Solo a la botella.
- [E1 + E9] "¿Qué casa es y qué se ve?" A) Un piso corriente de Madrid, por la tarde, con el salón y la cocina descritos por capas (Recommended). B) Otra ciudad o tipo de casa.
- [L2 + L3] "¿Cómo cambia la luz al entrar en la cocina?" A) Pasillo más oscuro; la cámara tarda en ajustar y luego la cocina tiene un led frío de techo (Recommended). B) Misma luz en todo el recorrido.

**Ronda 2 (importantes)**

- [A2 + A6] "¿Cómo cierra la botella?" A) Con una tapa abatible que cierra con el pulgar de un solo gesto (Recommended). B) Con rosca, a dos manos.
- [A8] "¿Cómo acaba?" A) Corte en movimiento, justo al cerrar la tapa, sin pose (Recommended). B) Se queda mirando a la lente.
- [S1] "¿Pasas audio de Seed Audio?" A) Todavía no, sigo sin audio y lo cambiamos luego (elegida en este ejemplo).

## 4. El prompt refinado (con las opciones recomendadas)

```text
[Generation Goal]
Create a 10-second live-action UGC clip in ONE continuous take, shot as front-camera phone footage at arm's length while she walks from the living room to the kitchen of her own flat. She shows a steel water bottle to the lens and talks to whoever is watching. Every visible action, lip movement, gesture, camera movement and focus change happens simultaneously in real time. The arm that holds the camera is never in frame.

[Characters]
The woman corresponds to @Image1. Use only her face, hair, build and wardrobe. Do not use the studio background or the sheet layout. All views in @Image1 are the same single woman. She wears home clothes as in @Image1. She looks into the lens most of the time, with brief glances just below it, at the bottle, and ahead toward where she is walking. Her right hand holds the bottle; her left arm stays out of frame; the hands never swap roles. Exactly one visible person. The person filming is never seen and never speaks.

[Props]
The steel water bottle corresponds to @Image2. Exactly one. It looks used, not new: a few small scratches near the base, no box, no tag. No readable text appears on it. It is held in her right hand and occupies about a third of the frame when she shows it to the lens.

[Scene]
A lived-in flat in Madrid, a weekday afternoon in early spring, soft daylight outside. Living room: a window on her left with a net curtain and the roller shutter half down lets in soft daylight; behind her, a cream wall with two framed botanical prints, one slightly crooked, and a shelf with books and a few loose papers; around her, a sofa with an unmatched grey blanket and a cushion out of place, a low table with a used mug and a TV remote; at the edge of the frame, soft and out of focus, the corner of a table with a charger cable lying on it. A short hallway between the rooms, darker, with a coat rack. Kitchen: tiled wall, extractor hood, a dish rack with two plates, a tea towel hanging from the oven handle, magnets on the fridge, a bowl of fruit; an overhead cool-white LED is on and daylight reaches from a window at the back. Nothing is perfectly symmetrical and nothing competes with her. There are no mirrors and no glossy reflective surfaces in frame. Nobody else is in the flat.

[Visual Style]
Footage as recorded by the front camera: slightly wide perspective, natural contrast, mild image noise in the dimmer hallway, soft in-camera sharpening, natural unretouched skin with visible pores and a light sheen where the window light hits. Natural imperfection level. No cinematic grade, no HDR look, no beauty filter, no creamy bokeh, no ring light.

[Camera]
The camera is the front camera at arm's length at about eye level: the viewpoint itself. The frame contains only the scene, with nothing between the lens and her, and the arm that holds the camera is never in frame. One continuous take with a single main camera movement: she walks from the living room to the kitchen and the camera goes with her. Vibration: a light fine hand tremor and a slow breathing sway; while she walks, a moderate step bounce that makes her face move a little vertically in the frame, with the digital stabilisation giving a slightly floaty feel; every few seconds a small late correction brings her face back to the centre. Starting framing: chest up, face a little above the centre. Focus: her face is the sharp plane throughout; the background stays mostly sharp, as in everyday handheld footage, and goes soft only on the bottle when it comes very close to the lens. In-lens budget: exactly two autofocus adjustments (the bottle near the lens, and the turn into the hallway) and one automatic-exposure adaptation as she passes between rooms, all silent. Not used anywhere: optical or digital zoom, whip pans, gimbal glide, rack focus, cuts, slow motion, any sound attached to camera movement.

[Stage 1 | 0.00-5.00s]
Initial state: frame 0.00, mid-moment in the living room: she is already looking into the lens, the bottle in her right hand at chest height, her left side lit by the window, a breath just taken in.
Primary event: she shows the bottle and speaks. Dialogue language: Spanish (Spain). She says in relaxed, colloquial Castilian Spanish, close to the camera, at the pace of someone talking to a friend: {Mira, esta es la botella de la que te hablaba.} As she begins this phrase, her eyes go from the lens to the bottle for an instant while her right hand brings it toward the lens from below and slightly off-centre, the room still visible behind it; on its last word her eyes return to the lens. She does NOT hold it centred and square to the lens and she does NOT rotate it slowly. Right after this phrase she shifts her grip once, turning it a few degrees and pausing as the window light catches the satin metal.
Performance: natural blinks, one soft breath through the nose, shoulders loose, a flat conversational energy.
Camera: light tremor and breathing sway; one small late correction as the bottle comes forward.
In-lens: as the bottle passes close to the lens it goes soft for about a third of a second, then the focus catches it again as she pulls it back slightly and returns to her face.
Sound: <Cloth rustle as her arm moves>
End state: she holds the bottle at chest height, looking into the lens, about to move.

[Stage 2 | 5.00-10.00s]
Continue from the previous stage: the same flat, the same light, she is about to walk.
Primary event: she walks to the kitchen while she speaks. She continues in the same Castilian Spanish, a little more offhand: {Ven, que te enseño cómo cierra.} As she begins this phrase she turns toward the hallway and walks, her eyes leaving the lens to check where she is going and coming back after the first steps. On the last word she reaches the kitchen and closes the lid with her thumb in one simple movement, the bottle still in her right hand.
Performance: a breath between steps, her hair and clothes moving with the walk, the same flat energy.
Camera: a moderate step bounce; one small late correction as she turns into the hallway.
In-lens: as she steps from the bright living room into the hallway, the light falling on her face drops; the camera's auto exposure takes about a second to catch up, her face dims slightly and then recovers, and the white balance cools a little as the kitchen's cool-white LED reaches her before settling. It reads as the camera metering, never as a lamp changing. The autofocus makes one small adjustment as she turns into the hallway.
Sound: <Soft steps on the floor> <The click of the lid closing>
End state: the clip cuts exactly at 10.00s, mid-movement, as her thumb pushes the lid shut, the frame slightly off-centre. No pose, no hold, no fade.

[Maintain Consistency]
Exactly 10 seconds, one continuous take; no cuts. No phone, no hands holding anything and no recording interface appear in the frame. One visible person, one bottle. Dialogue: only the braced lines, each spoken exactly once, in Castilian Spanish; her lips move only on them. The light changes only as described. No music, no subtitles, no on-screen text, no readable text anywhere. She never rotates the bottle slowly or holds it centred and square to the lens. Every movement has a visible beginning, middle and end.

[Audio]
Everything is the sound of a small built-in microphone as captured: a close, slightly compressed voice with light auto-gain pumping, the dry sound of the living room and the harder echo of the kitchen, clothing rustle, audible breaths, a faint fridge hum. No music, no narrator, no designed sound, and no sound on any camera movement.

The result feels like a candid clip of someone showing something to a friend while moving through her own home.
```

📐 Aspect ratio: 9:16 | ⏱ Duration: 10s

Supuestos:
- Sin audio de referencia: te recomiendo generar la voz con Seed Audio y pasármela; el ritmo de habla es una estimación.
- Madrid, piso, entre semana, por la tarde y a principios de primavera: no lo habías dicho y lo elegí para que encaje con la luz y el decorado.
- Una sola toma, cámara frontal, dial natural, sin cortes ni transiciones.
- La botella tiene una tapa abatible que cierra con el pulgar; no lo habías dicho.

## 5. Banco de preguntas modelo

Para calibrar el tono. Se adaptan al caso; todas citan el prompt, dicen por qué falla y ofrecen opciones con una recomendada.

- **[D1]** "Escribes 'se graba con el móvil en la mano'. Si el móvil es la cámara, no puede verse. ¿Lo quito o quieres un segundo móvil como utilería?" A) Lo quito (Recommended). B) Segundo móvil con pantalla de referencia.
- **[D4]** "El baño tiene un espejo grande detrás. El modelo dibujará el móvil en el reflejo. ¿Lo quito?" A) Sin espejo en cuadro (Recommended). B) Espejo tapado por una toalla.
- **[V2]** "Dices 'cámara fija' y que 'sigue a la persona'. Son dos físicas distintas. ¿Cuál mandas?" A) Móvil apoyado: ella entra y sale del cuadro (Recommended). B) En mano, la sigue.
- **[V5]** "'Push-in' puede salir como zoom. ¿Se acerca andando?" A) Se acerca andando, físico y nunca zoom (Recommended). B) Zoom digital de pellizco.
- **[F3]** "Pides 'fondo desenfocado'. En un móvil normal el fondo se ve casi nítido. ¿Qué quieres?" A) Profundidad amplia de móvil (Recommended). B) Modo retrato, con halos en el borde del pelo.
- **[L2]** "La luz 'se vuelve más cálida' en la mitad del clip sin motivo. ¿Qué la provoca?" A) Se enciende una lámpara con un clic y la cámara se reajusta (Recommended). B) Atardece lentamente por la ventana.
- **[E1]** "Pones 'salón' y nada más. ¿Qué cuelga de la pared y qué hay sobre la mesa?" A) Dos láminas botánicas, una algo torcida, y una taza usada (Recommended, a ajustar). B) Otro inventario.
- **[P4]** "Pides 'entusiasmo' en todo el clip. ¿Lo dejamos plano con un solo momento genuino?" A) Energía plana con una risa corta en una frase (Recommended). B) Entusiasmo sostenido.
- **[A3]** "La botella se bebe en cámara. Beber suele deformar. ¿La acotamos?" A) Enseña la botella y acaba antes de beber (Recommended). B) Bebe y lo asumimos.
- **[S1]** "Hay diálogo y no hay audio. ¿Quieres generarlo con Seed Audio y pasármelo?" A) Sí, te lo paso (Recommended). B) Sigo sin audio.
- **[S3]** "Tu audio dura 9,40 s y pides 9 s: cortaría la última palabra. ¿Lo resolvemos?" A) 10 s con una espera final (Recommended). B) 9 s y recortamos el audio.
