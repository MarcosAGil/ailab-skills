# Ejemplos Seedance 2.5: Patrones validados

## Propósito

Esta base reúne prompts que han producido buenos resultados reales. Se utiliza
para calibrar estructura, densidad, referencias, audio, continuidad, cámara y
acción. No sustituye `references/guia-seedance-2-5.md`: la guía contiene reglas; este
archivo muestra cómo se aplican en casos complejos.

No copiar un ejemplo completo de forma mecánica. Identificar primero el patrón
que corresponde a la petición y adaptar únicamente sus módulos relevantes.

Los ejemplos originales se han normalizado al contrato de variables de
Ailendra Labs. Toda referencia utiliza un token compacto como `@Image1`,
`@Video1` o `@Audio1`; nunca lleva espacios ni conserva wrappers de exportación.
El tipo y el índice siguen el orden real de los adjuntos.

---

## Índice de casos

| # | Caso | Modalidad | Referencias | Contrato de audio | Aprendizaje central |
|---:|---|---|---|---|---|
| 1 | Demostración UGC de proteína, 30 s | First frame + identidad + plano continuo | 2 imágenes + vídeo negro con audio | Exacto, autoridad total | Sincronización audiovisual y estados físicos de producto |
| 2 | Comercial de jabón, 11 s | Multi-shot musical | 2 imágenes + vídeo usado solo como música | Música exacta como timing master | Cortes a beat, Foley añadido y órbitas diagonales |
| 3 | Batalla fantástica, 15 s | Plano continuo de acción | 2 referencias de personaje | Audio diegético generado | Cámara lenta y bullet-time dentro de un take sin cortes |
| 4 | Ponencia UGC, 10 s | Imagen de personaje/escena + plano continuo | 1 imagen + vídeo negro con audio | Exacto, timing y diálogo bloqueados | Lip-sync, mirada de audiencia y timeline sonoro granular |
| 5 | Batalla épica multi-stage | Multi-referencia y secuencia de acción | 6 imágenes + vídeo negro con audio | Guía libre de voz y estética | Jerarquía de referencias, propiedad de armas y cambios de estado |
| 6 | Sustitución de presentadora y voz | Edición conservadora multimodal | 1 vídeo maestro + 1 imagen + 1 audio | Guion/timing del vídeo; identidad vocal del audio | Tres autoridades, scope mínimo y timeline heredado |

---

## Patrones aprendidos

### 1. Separar autoridades

Una referencia puede ser autoridad exclusiva para un dominio:

- imagen de primer frame: composición, cámara, espacio y estado inicial;
- imagen de identidad: rostro, cuerpo, pelo y vestuario;
- imagen de producto: estructura, material y packaging;
- vídeo negro: audio sin herencia visual;
- vídeo musical: tempo, beats, acentos y transiciones;
- vídeo de movimiento: acción o cámara, sin identidad ni escena.

El prompt debe decir `Use ONLY`, `sole authority`, `ignore visual content` o una
formulación equivalente cuando el aislamiento sea crítico.

### 2. Audio exacto frente a guía libre

**Audio exacto:** conservar pista, diálogo, timing, pausas, voz, ambiente y
eventos; no regenerar, parafrasear ni añadir otra voz. Acciones y labios se
sincronizan a la pista existente.

**Guía libre:** heredar voz, acento, tono o estética sonora, pero generar una
nueva mezcla. Declarar expresamente `loose guide, not an exact track`.

Nunca dejar implícita esta diferencia.

### 3. El vídeo negro es un contenedor de audio

Cuando el vídeo de referencia solo contiene una pantalla negra:

```text
@Video1 is a blank black video carrying only the audio track.
Use ONLY its audio. Ignore its black visual content entirely.
```

Después hay que definir si la pista es exacta o libre.

### 4. Estados de producto y causalidad

Las demostraciones físicas mejoran cuando cada etapa fija:

- estado inicial;
- contacto de manos;
- acción;
- cambio material;
- estado final;
- condición previa para la siguiente etapa.

Ejemplo: tapa fuera → polvo entra en agua → tapa se cierra → solo entonces se
agita → el líquido cambia de parcialmente mezclado a uniforme.

### 5. Música como timing master

En montaje musical, el audio existente controla:

- punto de corte;
- ritmo;
- aceleración;
- acentos;
- transición.

El Foley puede añadirse debajo de la música sin sustituirla ni dominarla.

### 6. Cámara humana controlada

La imperfección se describe como:

- micro-shake;
- deriva mínima;
- pequeñas correcciones;
- asentamiento;
- respiración del operador;
- autofocus o exposure breathing moderados.

No basta con escribir `handheld`. También se define intensidad y excepciones
por plano.

### 7. Cámara lenta dentro de una toma continua

El patrón validado es:

1. declarar un único take sin cortes;
2. asignar velocidad a cada rango;
3. vincular el cambio de velocidad a un contacto o impacto exacto;
4. describir qué queda suspendido;
5. mantener trayectoria de cámara y posiciones;
6. volver explícitamente a la velocidad anterior;
7. conservar el estado físico resultante.

El valor de fps funciona como instrucción de intensidad temporal; no debe
interpretarse como garantía de captura técnica exacta.

### 8. Propiedad, manos y destrucción

En acción compleja, asignar:

- arma a personaje;
- mano concreta;
- estado del objeto;
- momento de rotura;
- ausencia posterior.

Si un escudo o espada se destruye, no puede reaparecer. Si una mano sostiene un
arma, la otra debe quedar explícitamente disponible para agarrar o bloquear.

### 9. Parámetros, aliases y SFX

- En generación, aspect ratio y duración se muestran fuera del bloque del
  prompt. La duración es un entero entre 4 y 30 segundos; redondear `10.63s` a
  un valor válido como `11s`.
- Si se usan timestamps, cuantizar primero el montaje: límites exclusivamente
  `.00/.50`, tramos mínimos de 1,00 s, rangos consecutivos y último límite
  idéntico a la duración total. Nunca trasladar timings como `1.10` o `3.05`.
- No escribir `1080x1920`, resolución de salida ni fps base dentro del prompt;
  son parámetros de plataforma. Los fps usados para describir un speed ramp son
  una indicación creativa de intensidad temporal, no un ajuste de exportación.
- Todo alias debe vincularse al asset real: `[CHARACTER_REFERENCE] corresponds
  to @Image1.` Nunca dejarlo como `first attached image`.
- Cada SFX puntual se escribe con `< >` inline en el shot o stage donde ocurre
  su causa visible, no únicamente en una lista de audio al final.

### 10. Cuantización obligatoria de timelines

Un análisis puede detectar que el material dura 10,63 s o proponer cortes con
centésimas. Esos valores no se copian al prompt. Para una nueva generación se
selecciona una duración entera y se redistribuye el montaje sobre la rejilla de
0,50 s. Una normalización válida de nueve planos sería:

```text
[Shot 1 | 0.00–1.00s]
[Shot 2 | 1.00–2.00s]
[Shot 3 | 2.00–3.00s]
[Shot 4 | 3.00–4.00s]
[Shot 5 | 4.00–5.00s]
[Shot 6 | 5.00–6.50s]
[Shot 7 | 6.50–8.00s]
[Shot 8 | 8.00–9.50s]
[Shot 9 | 9.50–11.00s]
```

📐 Aspect ratio: 9:16 | ⏱ Duration: 11s

Cada plano dura al menos 1,00 s, no hay huecos ni solapamientos y el último
termina exactamente en 11,00 s. Si no hace falta precisión temporal, usar
stages sin inventar timestamps más granulares. En una plantilla de otro modelo
que exija declarar la duración dentro del prompt, la forma válida sería
`Create an 11-second ...`, nunca una duración con centésimas.

---

## Ejemplo 1: Demostración UGC de proteína con audio exacto

### Qué enseña

- First frame como autoridad espacial.
- Referencia separada para identidad.
- Vídeo negro usado exclusivamente como pista final exacta.
- Plano continuo de 30 segundos.
- Lip-sync y Foley bloqueados a una pista existente.
- Estados materiales del líquido y secuencia física de tapa, scoop y shaker.
- Cantidad exacta de sujetos y props.

### Prompt completo

```text
Single-take UGC protein demonstration.
@Image1 is the first frame. It defines the exact opening composition, camera position, vertical framing, Creator position, kitchen layout, countertop, daylight, Soylent pouch placement, shaker placement, glass placement, and all visible spatial relationships. Begin directly from this exact visual state.
@Image2 defines the same Creator's identity and appearance throughout the full video. Use only her face, blonde braided hair, athletic body proportions, white sports top, black shorts, black sports watch, sunglasses resting on her head, skin tone, and overall appearance. 100% match the same woman throughout. Do not use the gray studio background or character-sheet composition from @Image2.
[Audio Reference]
@Video1 is a blank black video carrying only the final 30.0-second audio track. Use ONLY its audio. Ignore its black visual content entirely.
Match @Video1's exact spoken audio, timing, pauses, Spanish-from-Spain voice, vocal tone, kitchen echo, room ambience, pouch sounds, lid sounds, powder-pour sounds, shaker slosh, and sip timing.
Do not regenerate, rewrite, paraphrase, shorten, extend, or replace the dialogue. Do not generate a second voice. The Creator's lips, facial movements, breathing, gestures, and physical actions must synchronize naturally to the exact existing audio in @Video1.
[Generation Goal]
Create a natural talking-head UGC protein demonstration in one continuous take. The Creator talks casually to camera while demonstrating how she prepares the Soylent protein shake. She behaves like a real fitness creator talking to friends, not like an actress reading an advertisement.
[Camera]
Single continuous take from the exact camera position established by @Image1.
Keep the camera mostly static with subtle natural phone-camera micro-shake, tiny framing drift, slight autofocus adjustment when products move closer to the lens, minimal exposure breathing, and small human imperfections.
No cuts, no cinematic reframing, no gimbal-perfect movement, no polished commercial camera behavior.
[Performance]
The Creator is warm, relaxed, confident, and conversational.
Her gaze alternates naturally between the lens, the pouch, the shaker, and her hands.
Use small eyebrow lifts, subtle smiles, light nods, tiny weight shifts, realistic blinking, natural breathing, and restrained hand gestures.
She continues speaking while handling the products. Never freeze her body merely to lip-sync.
[Stage 1]
Initial: begin exactly from @Image1. The Creator already faces the camera behind the kitchen counter. The Soylent pouch, shaker, glass, and visible products remain in their first-frame positions.
Primary event: from 0.00 to 4.50 seconds, she picks up the Soylent pouch naturally and raises it to chest height, presenting it clearly toward the camera while lip-syncing precisely to @Video1. She gives a small friendly smile and briefly looks at the pouch before returning her eyes to the lens.
End: she begins lowering the pouch back toward the counter.
[Stage 2]
Initial: the pouch returns to its original area on the countertop.
Primary event: from 4.50 to 9.00 seconds, she continues speaking with small natural hand gestures. One hand rests briefly near the pouch while the other makes restrained conversational gestures. Her expression is relaxed and sincere, with a small approving nod.
End: her attention naturally shifts toward the shaker.
[Stage 3]
Initial: the shaker remains in its original position from @Image1.
Primary event: from 9.00 to 14.50 seconds, she picks up the shaker with one hand and grips the lid with the other. While continuing to lip-sync to @Video1, she slowly rotates the lid two or three times with realistic wrist movement and light physical resistance.
The bottle remains stable in one hand while the lid turns naturally in the other. <Soft lid twisting>
End: the lid comes fully off and she places it naturally beside the shaker.
[Stage 4]
Initial: the shaker is open and contains clear water. The Soylent pouch remains upright nearby.
Primary event: from 14.50 to 20.50 seconds, she opens the Soylent pouch, looks inside briefly, reaches into it, removes one scoop of pale matcha-green protein powder, and brings the scoop directly above the open shaker.
She pours the full scoop into the water. <Soft pouch rustle> <Protein powder pours into water>
The matcha powder enters the water realistically, creating pale-green cloudy swirls and suspended powder trails. The liquid becomes partially green but is not yet fully mixed.
End: the scoop is empty, the powder is inside the shaker, and the liquid shows visible green swirls.
[Stage 5]
Initial: the shaker is still open and contains partially mixed pale-green liquid.
Primary event: from 20.50 to 24.00 seconds, she picks up the lid, places it correctly onto the shaker, and twists it firmly closed while continuing to lip-sync to the existing audio. <Lid twists closed>
End: the lid is fully secured. The shaker must be visibly closed before any shaking begins.
[Stage 6]
Initial: the shaker is closed and held securely with both hands.
Primary event: from 24.00 to 28.00 seconds, she gives the shaker exactly two or three short natural shakes. Her forearms, wrists, shoulders, and body respond naturally to the bottle's weight. <Liquid sloshes inside shaker>
During the shaking, the remaining powder disperses completely and the drink changes from cloudy partial green to a smooth, uniform matcha-green color.
She then stops shaking and briefly holds the finished shaker up toward the camera with a small satisfied smile.
End: the shake is completely mixed and uniformly green.
[Stage 7]
Initial: she holds the finished matcha-green shake.
Primary event: from 28.00 to 30.00 seconds, she brings the shaker to her mouth and takes one short natural sip. Her lips make correct contact with the drinking opening and her jaw and throat show a believable swallow. <Small drinking sound>
She lowers the shaker, looks back into the lens, gives a subtle satisfied smile and a small approving nod while completing the exact final spoken words from @Video1.
End: she remains relaxed behind the counter holding the shaker naturally, with the same friendly UGC energy.
[Maintain Consistency]
@Image1 is the sole authority for the first frame, kitchen environment, camera position, opening composition, countertop layout, initial product positions, and lighting.
@Image2 is the sole authority for the Creator's identity, face, hair, body proportions, clothing, sunglasses, watch, and physical appearance.
@Video1 is the sole authority for the exact 30.0-second audio, spoken dialogue, voice, Spanish-from-Spain accent, pauses, vocal delivery, kitchen ambience, and synchronized sound-event timing.
Keep one continuous Creator, one Soylent pouch, one shaker, one scoop, and one glass throughout.
The shaker begins with clear water, becomes partially green only after the matcha powder is poured in, and becomes completely uniform matcha green only after shaking.
The lid must remain off while the powder is poured and must be securely closed before shaking.
Keep all hand-object contact, lid rotation, scoop movement, liquid behavior, weight transfer, and swallowing physically realistic.
No cuts, no subtitles, no music beyond anything already contained in @Video1, no additional dialogue, no narrator, no duplicate products, no extra people, no identity drift, and no black visual content from @Video1.
The finished video feels like one authentic smartphone recording of the same woman casually preparing her favorite protein shake in her own kitchen while speaking naturally to friends.
```

📐 Aspect ratio: 9:16 | ⏱ Duration: 30s

---

## Ejemplo 2: Comercial de jabón editado sobre música existente

### Qué enseña

- Vídeo usado únicamente como pista musical y timing master.
- Referencia con varias vistas que representa una sola persona.
- Packaging como identidad de producto independiente.
- Foley natural añadido alrededor de música existente.
- HARD CUTS sincronizados con beats.
- Movimiento handheld premium y órbitas diagonales por plano.
- Excepción deliberada: plano de ducha casi fijo.

### Prompt completo

```text
Photorealistic outdoor lifestyle soap commercial with a fast rhythmic multi-shot sequence.
[Characters]
Male model = @Image1. Use only his identity, face, dense dark beard, long dark wet-looking hair, athletic build, chest hair, skin tone, body proportions, and relaxed natural expressions. The front, back, and close-up views in @Image1 all define the same single man. 100% match the reference throughout. Do not use the gray studio background from @Image1.
[Props]
Soap packaging = @Image2. Use only the exact olive-green box structure, proportions, typography placement, materials, front, back, side panels, and product identity. Do not use the white studio background from @Image2.
Soap bar: natural handcrafted olive-green soap removed from the package and used by the same man.
[Scene]
A real arid high-desert landscape with cactus vegetation, dusty roads, dry mountain formations, warm golden-hour light, and a rustic outdoor wooden shower area near the desert environment.
The desert travel shots use warm late-afternoon sunlight. The outdoor-shower shots use bright natural daylight with a clear blue sky, textured wood, realistic water highlights, and clean outdoor contrast.
[Audio Reference]
@Video1 is a video carrier used ONLY for its existing audio track.
Use ONLY @Video1's audio: preserve its exact music, rhythm, tempo, beat structure, transitions, accents, dynamic changes, and overall sound timing.
Ignore @Video1's visual content entirely.
Do not regenerate or replace the music.
Every visual cut must be synchronized to a clear beat, percussion hit, musical accent, or rhythmic change already present in @Video1.
Add only the natural sound effects written inline inside each stage, preserving the music as timing master. Keep them tactile and realistic without overpowering the existing music.
[Camera Language]
Every shot has subtle human-operated camera movement: tiny handheld shake, breathing movement, imperfect micro-corrections, slight weight shifts, and organic settling. Never perfectly stabilized.
The shake remains controlled and premium, not chaotic.
For the shower-head water shot, keep the camera almost fixed with only extremely subtle handheld micro-movement.
For all other shower shots, use short dynamic diagonal orbital camera moves around the subject or product. These orbits move partially around the subject while also changing height: upper-left toward lower-right, lower-right toward upper-left, or low-to-high diagonal arcs. Keep each orbit compact, fast, and physically plausible.
No gimbal-perfect smoothness.
[Editing]
Fast rhythmic commercial editing.
HARD CUTS only between shots.
Every cut follows the beat structure of @Video1.
No fade.
No dissolve.
No crossfade.
No digital transition effects.
[Stage 1]
Initial: extreme close environmental detail of desert cactus in the foreground, warm mountains softly blurred behind it. The first visible frame is already occupied by the cactus and desert environment.
Primary event: a slow handheld pan moves slightly across the cactus while tiny human camera corrections remain visible. Warm golden-hour light catches the cactus edges. <Soft desert wind>
End: cut sharply on a musical beat.
[Stage 2]
Initial: POV from inside a moving vehicle traveling along a dusty desert road. A small portion of the dashboard or vehicle interior remains visible in the lower foreground.
Primary event: the vehicle moves quickly toward distant rock formations. The camera vibrates naturally from the road surface, with subtle human handheld correction layered over vehicle movement. <Car tires over dirt and gravel> <Light suspension rattle>
End: hard cut on the next strong beat.
[Stage 3]
Initial: the same man from @Image1 is already visible from behind, centered on the desert trail.
Primary event: he walks away from camera along the sandy path with natural heel contact, weight transfer, arm swing, and realistic body mass. The camera follows handheld from behind with a slight forward drift and continuous micro-shake. <Footsteps on dry sand>
End: hard cut synchronized with the music.
[Stage 4]
Initial: close detail shot at the outdoor wooden shower. The same man's hand holds the soap package from @Image2 close to camera, front panel clearly readable.
Primary event: perform a short diagonal orbital move around the hand and package, descending slightly from upper-left to lower-right while maintaining the product as the center of attention. The package rotates minimally and naturally in his grip. <Cardboard package handling>
End: hard cut on beat.
[Stage 5]
Initial: close shot of the package in his hands beside the outdoor shower.
Primary event: he opens the package and slides the olive-green soap bar out. The camera performs a fast compact diagonal orbit from lower-right upward toward upper-left, revealing the soap and the wooden shower environment behind it. <Soap package opens> <Soap bar slides out>
End: the soap bar is fully visible in his hand. Hard cut on beat.
[Stage 6]
Initial: low-angle close-up of the black shower head against the bright blue sky.
Primary event: water suddenly begins flowing strongly from the shower head. The camera remains nearly fixed, with only very subtle natural handheld micro-shake. Sunlight catches individual streams and droplets. <Outdoor shower water starts>
End: water flow is fully established. Hard cut on beat.
[Stage 7]
Initial: medium-low-angle shot of the same man already standing under the outdoor shower, water falling across his shoulders, chest, hair, and beard.
Primary event: he rubs the soap naturally over one shoulder and across his upper chest while enjoying the water. The camera performs a dynamic diagonal orbital move around his torso, moving from slightly above one shoulder toward a lower opposite-side position. His eyes remain away from the lens and his expression stays relaxed and authentic. <Running water> <Wet soap against skin>
End: visible lather begins forming on his shoulder and chest. Hard cut on beat.
[Stage 8]
Initial: tight detail of his wet hands holding the soap bar.
Primary event: he rubs the bar briskly between both hands, creating thick wet foam. The camera performs another compact diagonal orbital move, rising slightly while circling around the hands so the wet soap texture and foam remain visually dominant. <Wet hands rubbing soap> <Foam movement>
End: both hands are visibly coated with fresh lather. Hard cut on the next musical accent.
[Stage 9]
Initial: close three-quarter profile of the same man beneath the outdoor shower.
Primary event: water runs through his dark hair and dense beard while he smiles naturally, relaxed and refreshed. The camera performs a final subtle diagonal orbit around his face, beginning slightly low on one side and rising toward the opposite side. His eyes never look directly into the lens. Water droplets catch the daylight across his face and beard. <Running shower> <Water striking beard and shoulders>
End: he remains under the water with a relaxed satisfied expression as the final musical beat lands.
[Maintain Consistency]
Keep the same single man from @Image1 throughout every shot where he appears. His face, beard, hair, body proportions, skin tone, and identity must remain stable.
Keep the soap packaging exactly consistent with @Image2. Do not redesign the box or invent alternative packaging.
Preserve the narrative order exactly:
desert cactus → moving car POV → man walking away → packaged soap reveal → soap removed from box → shower water → man washing → hands lathering soap → final shower portrait.
All cuts must follow @Video1's existing musical rhythm.
Every shot has subtle organic human camera shake. The isolated shower-head water shot has only extremely subtle micro-shake. The product reveal, soap removal, washing, hand-lather, and final shower shots use short diagonal orbital camera moves combined with natural handheld imperfection.
No dialogue, no voice-over, no subtitles, no added graphics, no extra people, no identity drift, no product redesign.
The finished film feels like a fast, tactile outdoor lifestyle commercial cut precisely to the existing music, with immersive natural Foley layered beneath the soundtrack and energetic human-operated camera movement.
```

📐 Aspect ratio: 9:16 | ⏱ Duration: 11s

---

## Ejemplo 3: Acción continua con cámara lenta y bullet-time

### Qué enseña

- Un único take de 15 segundos sin cortes ni transiciones ocultas.
- Inicio directamente mid-action.
- Speed ramps asociados a impactos físicos exactos.
- Bullet-time descrito mediante partículas, deformación y estado suspendido.
- Cámara que conserva una trayectoria continua durante los cambios de velocidad.
- Física de masa, agarre, rebote, shockwave y destrucción.
- Estado irreversible de objetos: la espada rota desaparece.
- Manos y armas asignadas de forma permanente.

### Patrón reutilizable de cámara lenta

```text
[time range | base speed → slow motion]
<Action begins in continuous motion>. At the exact instant <physical
contact or impact>, playback drops to <extreme slow-motion intensity>.
<Particles, deformation, cloth, debris, body reaction, and camera behavior
become visibly suspended or stretched>. The camera continues its existing
path without a cut or reset. Playback then returns to <next speed>, while
the physical consequences remain in the scene.
```

### Prompt completo

```text
Style/Camera: Ultra-realistic live-action fantasy battle, one continuous handheld take, no cuts, no transitions, anamorphic composition. Use only @Image1 for the protagonist knight and @Image2 for the antagonist orc. Preserve both characters’ exact faces, body proportions, armor, clothing, weapons, scars, skin texture, and overall likeness consistently across every frame. The camera flows continuously through the duel with aggressive handheld motion, impact-driven dutch tilts, breath-level micro-jitter, rapid spatial reframing, and in-camera speed ramps: real-time → heavy slow motion for major combat beats → suspended bullet-time at three impact peaks → back to real-time for the ending. Feature-film realism, practical-looking VFX, physically coherent motion, no anime rendering, no game-engine appearance.
Audio: Diegetic sound only. Howling blizzard wind, dense undead army beating metal weapons against breastplates, distant artillery booms, rearing skeletal horses, snapping ragged banners, sword impacts, armor strain, snow impacts, bone cracks, one massive low-frequency explosion, shockwave debris, and the orc’s final roar toward the sky. No music, no narrator, no dialogue.
Lighting: Dark overcast daylight under an almost black storm sky. Cold blue-grey ambient light, deep shadows, pale snow bounce, occasional dim orange-white artillery flashes diffused through distant fog. The main explosion produces one violent orange-white backlight, rim-lighting the orc’s silhouette and illuminating the fog and crowd behind him.
Location: A wide circular pale-snow clearing, approximately 25–30 meters across, surrounded on every side by a dense imperfect ring of undead infantry packed shoulder-to-shoulder. The army extends backward in layered ranks of millions, fading into fog and smoke with no visible end. Heavy undead cavalry is distributed throughout the ring in every direction: skeletal and half-decomposed horses rear repeatedly while dead riders thrust spears overhead. Hundreds of ragged, torn, blood-stained war banners snap horizontally in the wind. Distant orange fire columns and faint explosion silhouettes pulse through the whiteout haze. Snow drifts across the clearing and thin diagonal blizzard streaks pass over the lens.
Main Character - Protagonist Knight: Use @Image1. Preserve his exact face, short dark hair, facial injuries, blood marks, ornate red-and-silver armor, red cloak, sword, boots, gauntlets, and body proportions. He begins the scene with his helmet off, matching the visible face from the reference. His sword is a real battle-worn steel longsword, not crystal, not magical. Maintain his identity and armor damage consistently throughout.
Main Character - Antagonist Orc: Use @Image2. Preserve his exact pale scarred skin, bald head, pointed ears, facial scars, muscular proportions, leather harness, shoulder armor, shield, boots, and brutal curved sword. He stands approximately 3.2–3.5 meters tall, nearly twice the knight’s height. His right hand holds the curved sword; his left hand is free for grabbing and slamming the knight. The shield remains strapped to his left forearm or back but never replaces the grabbing hand. No biological blade, no mutation, no extra limbs.
Scene Flow:
[0.00–2.50s | 60fps → 240fps]
The take opens with the knight already skidding backward spine-first through the snow toward the inner undead ring. His body is dragged closer and closer to the crowd while churned snow sprays behind him. He drives his steel sword vertically into the frozen ground with his right hand, carving a deep furrow and braking hard. His left gauntlet drops into the snow for balance. He stops on one knee only half a meter from the undead line.
The camera catches up from behind and pushes into a tight close-up of his bloodied face and armor as he raises his head toward the threat. Without cutting, the camera performs a sharp right-to-left handheld orbital sweep around his body and settles behind his shoulders looking into the arena. Playback ramps to 240fps during the orbit.
As the camera arrives behind him, the giant orc from @Image2 is already airborne, lunging directly toward him. The orc’s curved sword is raised high overhead for a descending strike. The knight reacts instantly, pulling his planted longsword free and raising it overhead with both hands in a desperate cross-body block.
[2.50–5.00s | 240fps]
The orc descends with overwhelming mass and slams his curved sword down onto the knight’s steel blade. The impact is thunderous and physically heavy. The knight’s sword bends, fractures, and shatters into dozens of dark metallic fragments and fine steel dust, with no glow and no magical particles. The broken blade collapses from the impact point outward; the hilt remains briefly in the knight’s hands before breaking loose.
The orc’s sword continues past the failed block and bites deeply into the snow beside the knight, sending ice and powder upward. The knight stumbles backward with both hands suddenly empty.
[5.00–7.00s | 240fps → 10000fps peak]
With his right-hand sword temporarily buried in the snow, the orc shoots his free left hand forward and grabs the knight around the torso. At the exact instant the fingers close around the knight’s ribcage and shoulder plate, playback drops to 10000fps for suspended bullet-time. Armor buckles beneath the grip; snow crystals, metal fragments, and droplets hang motionless in the air.
Playback returns to 240fps. The orc lifts the knight horizontally into the air using one arm, the knight’s head rising only to the orc’s chest height. The orc then wrenches his sword free from the ice with a grinding metallic scrape.
[7.00–9.50s | 240fps → 10000fps peak]
The orc drives the knight straight downward in a violent pile-driver motion, slamming him spine-first into the snow directly at the orc’s feet. At the instant of impact, playback drops again to 10000fps. Snow and fractured ice bloom outward in a frozen halo. The knight’s body visibly rebounds 15–20 centimeters from the ground, then his shoulders and head strike the snow a second time before he settles flat on his back.
His broken sword is gone. His hands remain empty. The orc towers over him.
[9.50–12.00s | 240fps]
The camera slides continuously around into a low frontal angle on the orc, looking upward at his chest and face. The knight lies on his back at the orc’s feet in the foreground. The orc raises his curved sword high overhead, preparing a final killing strike aimed at the knight’s chest.
The knight throws both armored forearms across his face and chest in a tight defensive X, bracing for impact.
[12.00–13.50s | 10000fps explosion peak]
At the exact instant the orc reaches the top of the killing wind-up, a massive orange-white explosion detonates directly against his upper back between the shoulder blades, as if a projectile struck him from behind. Playback drops to 10000fps and holds through the full bloom.
The fireball expands behind his silhouette. The shockwave tears off pieces of leather, shoulder armor, straps, and fragments of his back armor. Scorched skin, shrapnel pits, dark blood, smoke, and debris appear across his upper back and shoulders. The sword stroke is interrupted before it lands. Suspended fragments and snow particles travel forward past his shoulders toward the camera.
[13.50–15.00s | 60fps]
Playback ramps back to real-time. The shockwave drives the orc sideways across the snow. He takes several uncontrolled lateral steps, knees buckling, body lurching, smoke streaming from the wounds on his back. The camera pans laterally with him in a rough handheld move and catches a brief dutch tilt from his mass.
The orc regains his footing, straightens, throws his head far back toward the dark sky, and roars upward in rage and pain. His free hand reaches behind to the blast wound and returns dark with soot and blood.
For the final second, the camera settles into a clean low-angle portrait of the orc’s face and upper torso. His mouth is open in the dying roar, smoke curling around his shoulders, the infinite undead army and fog wall behind him, with distant orange fires pulsing through the blizzard.
Constraints: Use only @Image1 and @Image2 as character references. Preserve exact character identities throughout. No helmet magically appearing on the knight. No crystal sword, no magical blade, no biological weapon, no extra limbs, no character morphing, no armor redesign, no duplicated weapons, no missing shield, no size inconsistency, no teleportation, no cuts, no hidden transitions, no camera resets, no cartoon motion, no anime rendering, no video-game look, no low-detail CGI, no gore close-ups, no dismemberment, no subtitles, no logos, no watermarks. Keep the orc’s right hand assigned to the curved sword and the left hand assigned to the grab and slam. Maintain clear spatial continuity in one unbroken take.
```

📐 Aspect ratio: 21:9 | ⏱ Duration: 15s

---

## Ejemplo 4: Ponencia UGC con vídeo negro y diálogo exacto

### Qué enseña

- Una sola imagen controla identidad, ropa, micrófono, luz y mood escénico.
- El vídeo negro aporta exclusivamente una pista final de diez segundos.
- Diálogo, timing, voz y eco deben coincidir con exactitud.
- La acción se mantiene natural mediante mirada móvil, gestos, respiración y
  ajustes de distancia del micrófono.
- Timeline de audio separado del stage visual.
- Una sola voz, sin narrador, música ni subtítulos.

### Prompt completo

```text
UGC-style conference talk, filmed handheld by someone in the audience: a confident speaker addresses the room mid-answer, natural gestures.
[Characters]
Speaker = @Image1. Use only face, hair, proportions, white blazer and trousers, held microphone. Keep the same soft conference lighting mood as @Image1.
[Scene]
Modern conference stage, soft diffused key light, out-of-focus audience heads in the foreground, pale sky-toned backdrop, matching the mood of @Image1.
[Audio Reference]
@Video1 is a blank black video carrying only the audio track. Use ONLY its audio: adult Spanish woman voice (España), confident, slightly arrogant, strong conviction, close handheld mic proximity with light room echo. Ignore its black/blank visual content entirely. Match this audio's exact timing and spoken line.
[Stage 1] Initial: Speaker seated, holding the microphone close, mid-gesture with her free hand, mouth closed, per @Image1. Event: she speaks continuously and naturally, turning her head to address different parts of the room, eyes scanning across the audience rather than fixed on one point, natural blinks, mic proximity shifts slightly with her head, free hand gestures emphasize her points, subtle weight shifts. Dialogue language: Spanish (Spain). Speaker says, confident and slightly arrogant, strong conviction: {UGC, ads, spots comerciales, contenido cinematográfico... Literalmente todo lo que te puedas imaginar. El cuello de botella en tu negocio ya no es el contenido, es tu creatividad.} End: she finishes the line, takes a small breath, hand settles, faint audience reaction in the background.
[Maintain Consistency] Keep Speaker's identity, face, hair, white outfit, and the microphone exact throughout. Camera is handheld, filmed by an audience member: subtle continuous shake and micro drift throughout, no cuts, single continuous take. Lighting and background stay consistent with @Image1 throughout.
Audio: follow @Video1's audio track closely, matching its exact 10.00s timing. [0.00-1.00s] quiet conference room tone, soft mic handling, slight chair creak. [1.00-9.00s] Speaker's dialogue as above. [9.00-10.00s] the line resolves, followed by a small breath through the mic, faint audience reaction, and fading room echo. Single female voice only, no narrator, no music, no subtitles.
```

📐 Aspect ratio: 16:9 | ⏱ Duration: 10s

---

## Ejemplo 5: Batalla épica multi-referencia con audio como guía libre

### Qué enseña

- Múltiples referencias de personajes, props, escena y opening face.
- Imagen adicional utilizada solo para encuadre/expresión de apertura.
- Vídeo negro usado como guía vocal y estética sonora, no pista exacta.
- Separación de dominio: ejército y antagonista en tierra; dragón controla el
  cielo cuando comparten plano.
- Propiedad de armas y pérdida irreversible tras destruirse.
- Escalado de acción mediante stages y estados finales.
- Una sola línea de diálogo; criaturas limitadas a rugidos.

### Prompt completo

```text
Epic medieval battle: an ice giant ruler awakens a risen army, a knight rallies his own forces beneath an enormous dragon, both sides clash, dragon carries the ice ruler away at the end.
[Characters]
Knight = @Image2. Use only face, hair, beard, proportions, red-and-silver armor, red cloak. Exclude the grey studio background.
Ice Ruler = @Image3. Use only face, massive beast proportions, translucent cracked-ice anatomy. Exclude the grey studio background.
Ice Ruler opening face = @Image6, exact framing/expression/cold breath, opening shot only.
Dragon = @Image4. Use only white scaled anatomy, wings, head design. Exclude the studio background.
[Props]
Round Shield = @Image5, belongs only to Knight.
Double-Bladed Axe: no image; short haft, two long curved blades opposite each other, belongs only to Knight.
[Scene]
Battlefield = @Image1: burnt snow terrain, scattered fires, overcast palette only, not its camera angle.
[Audio Reference]
@Video1 is a blank black video carrying only the audio track. Use ONLY its audio: Knight's voice (30s man, Spain Spanish accent, furious energetic) and sound aesthetic (heavy impacts, ice cracks, wind, fire, echo, monster roars only from Ice Ruler/Dragon). Ignore its black/blank visual content entirely. Loose stylistic and vocal guide, not an exact track.
[Stage 1] Initial: extreme close-up Ice Ruler face per @Image6. Event: camera pulls out and tilts up fast like a rising drone, revealing Ice Ruler's full body as he roars and raises both arms; pale blue-eyed risen soldiers push up out of the snow around him. End: wide view of Ice Ruler amid dozens of risen soldiers.
[Stage 2] Event: hard cut to tight close-up on Knight, army in ranks behind him; camera pulls out fast revealing Knight spinning the Double-Bladed Axe, Round Shield in the other hand. End: Knight mid-distance, weapon and shield visible, army behind.
[Stage 3] Event: Knight looks up, camera pans up fast, Dragon fills the frame, wings blocking light, roars; huge shadow sweeps the field. End: shadow over the ground, camera panning back down.
[Stage 4] Event: pan lands on Knight, confident half-smile. Spanish, shouting, energetic: {Bienvenido a una nueva era!} Raw battle scream, sprints, army charges behind him. End: Knight and army mid-charge.
[Stage 5] Event: lateral follow shot, Knight cutting down blue-eyed risen soldiers with axe and shield, heavy hits; ramps to slow motion as three enemies circle him, he clears all three in one axe spin; hard cut to wide aerial: Dragon sweeps low, breathes fire across endless ranks. End: battlefield in chaos, Dragon fire visible, Knight advancing.
[Stage 6] Event: Knight reaches Ice Ruler, heavy blunt blows exchanged; Ice Ruler throws his ice spear, Knight blocks with the shield, shield shatters completely; tight close-up as a new ice spear rapidly crystallizes from his palm. End: both re-armed, facing off, Knight without his shield.
[Stage 7] Event: both charge and leap at once, axe and spear clash head-on and shatter; same beat, Dragon dives, jaws close around Ice Ruler, lifts him and banks away. End: Dragon flying off with Ice Ruler, battlefield falling away below.
[Maintain Consistency] Keep Knight, Ice Ruler, and Dragon's identity, proportions, armor, anatomy exact throughout. Axe and shield are Knight's only weapons until they shatter in Stages 6-7. Risen soldiers stay generic. Ice Ruler and risen soldiers stay on the ground; Dragon owns the sky whenever both share frame. Overcast light throughout, fire glow only in Stage 5 and Stage 7.
Audio: follow @Video1's audio track as a loose guide, not an exact track. Ignore @Video1's visual content, it is blank. Dragon roar with echo in Stage 3. Distant clamor, metal clash, wind through Stages 1-4. Weapon impacts, shield shattering, ice cracking in Stage 6. Fire roar and wing-beat whoosh in Stage 7. Knight's line and scream are the only dialogue; Ice Ruler and Dragon never speak, roars only. No music, no narrator, no subtitles.
```

📐 Aspect ratio: 16:9 | ⏱ Duration: 30s

---

## Ejemplo 6: Edición conservadora: identidad visual y voz

### Qué enseña

- `@Video1` es el único vídeo maestro y define guion, timing, actuación,
  cámara, montaje y audio no dialogado; duración y ratio se heredan sin
  escribirlos en el prompt.
- `@Image1` aporta exclusivamente la identidad visual del sustituto.
- `@Audio1` aporta exclusivamente su identidad vocal, nunca el guion ni el
  timing.
- Las vistas frontal, trasera y facial pertenecen a un solo hombre.
- La edición modifica únicamente la presentadora y su voz.
- No se recomiendan parámetros nuevos: duración y ratio proceden del source.

### Prompt completo

```text
[Edit Goal]
Edit @Video1 as the sole editing master. Replace only the female on-screen performer with the male performer defined by @Image1, and replace only her spoken voice with the male voice identity defined by @Audio1. Keep every other element of the video exactly as it is in @Video1.

[Source Video Role]
@Video1 is the sole editing master. It defines the complete finished video: exact shot order, framing, camera position and movement, lens behavior, cuts, transitions, composition, location, background, lighting, color, props, graphics, text, action order, performance timing, body movement, gestures, facial-performance timing, eyelines, pauses, entrances and exits, occlusions, editing rhythm, and total audiovisual timing. It is also the sole authority for the original spoken script: preserve every word exactly as it appears in @Video1, in the same language and order. Do not rewrite, paraphrase, shorten, extend, translate, censor, or add dialogue.

[Target Reference Role]
@Image1 defines the male performer's facial identity, facial proportions, skin tone, hairstyle, beard, body proportions, physique, and wardrobe: black T-shirt, white trousers, white sneakers. It shows one single man from multiple views; treat all views as the same person. Do not use @Image1's grey studio background, triptych layout, panel borders, poses, camera angles, or lighting. Do not create multiple copies of the man.

@Audio1 defines ONLY the male speaker's vocal identity: timbre, resonance, pitch, accent, and natural vocal texture. It is not the dialogue script and not the timing master. Ignore any words or unrelated sounds in @Audio1 that conflict with @Video1's script.

[Edit Scope]
Modify only two things across the entire duration of @Video1: (1) the on-screen performer's identity, replacing the woman with the man from @Image1, and (2) her spoken voice, re-synthesized with the vocal identity from @Audio1 speaking @Video1's exact original script at the exact original timing. Do not modify anything else.

[Timeline Inheritance]
The male performer inherits the original woman's complete timeline: every appearance, screen position, blocking, pose, action, walking path, hand action, gesture, head movement, gaze direction, facial-expression beat, interaction, contact point, speed change, pause, occlusion, entrance, and exit, with the same timing and duration. Preserve the intent and timing of the original performance; adapt the motion naturally to the man's body proportions while keeping the original choreography, spatial relationships, eyelines, interaction timing, and final poses unchanged. Maintain his identity from @Image1 consistently through every shot, angle, expression, head turn, profile, partial occlusion, and change of scale. Preserve natural male anatomy and the same recognizable face throughout.

The new male dialogue occupies the exact same temporal positions as the original female dialogue in @Video1: same start and end of every utterance, same pauses, same conversational rhythm, same total dialogue duration. Match mouth shapes, jaw movement, breathing, and facial preparation precisely to the newly synthesized male speech. Do not add the original woman's voice, a second speaker, a narrator, extra dialogue, or overlapping duplicate speech.

[Content to Preserve]
Keep everything else from @Video1 unchanged: shot sequence and cuts, camera framing and movement, scene geometry and background, lighting, exposure, color and visual style, props and object states, graphics, logos, captions and visible text, action timing and editing rhythm, interactions and occlusion relationships, and all non-vocal audio (music, ambience, room tone, sound effects, Foley) at their original timing, levels, and synchronization with visible events. Do not redesign, restage, add or remove shots, change the location or camera angles, add subtitles, or add people.
```

### Antipatrón que este ejemplo corrige

No convertir esta tarea en un prompt genérico con `Style/Camera`, `Audio`,
`Lighting`, `Location`, `Main Character`, `[0s–END]` y un bloque largo de
`Constraints`. Aunque describa bien la conservación, ese formato no demuestra
que se haya aplicado la plantilla de edición de Seedance 2.5. La salida válida
debe conservar los handles canónicos y los seis encabezados oficiales del ejemplo
anterior en el mismo orden.

También es inválido escribir `source video`, `provided reference image` o
`separate audio reference` sin binding. Si la interfaz no expone IDs, esta
combinación se asigna automáticamente como `@Video1`, `@Image1` y `@Audio1`
según tipo y orden de adjunto, y esos handles se utilizan en todo el prompt.

---

## Matriz de reutilización

| Necesidad futura | Ejemplo de referencia | Módulos a reutilizar |
|---|---:|---|
| UGC con pista hablada ya terminada | 1 o 4 | Audio exacto, autoridad exclusiva, lip-sync, timeline sonoro |
| Demostración de producto con cambios materiales | 1 | Initial/Event/End, causalidad, estados de objeto, manos y contacto |
| Comercial editado sobre música | 2 | Música como timing master, HARD CUTS, Foley subordinado |
| Cámara handheld premium | 1, 2 o 4 | Micro-shake, deriva, correcciones, intensidad por plano |
| Slow motion dentro de plano continuo | 3 | Rango + velocidad + trigger + materia suspendida + retorno |
| Acción multi-shot con muchas referencias | 5 | Mapping, ownership, stages, estados finales, dominios espaciales |
| Audio de referencia no exacto | 5 | `Loose stylistic and vocal guide, not an exact track` |
| Varias vistas en una sola imagen | 2 | Declaración explícita de una sola persona/instancia |
| Referencia para opening shot únicamente | 5 | Rol limitado a encuadre/expresión inicial |
| Sustituir personaje y clonar voz sin alterar el vídeo | 6 | Sole editing master + identidad visual + identidad vocal + timeline inheritance |

---

## QA derivado de los ejemplos

- ¿Cada referencia posee un dominio y exclusiones?
- ¿Está claro si el audio es exacto o una guía libre?
- ¿Se ignora expresamente el contenido negro del vídeo carrier?
- ¿La autoridad del first frame está separada de la autoridad de identidad?
- ¿Cada stage declara Initial, Primary event y End cuando hay causalidad física?
- ¿Los productos cambian de estado solo después de la acción correspondiente?
- ¿Cada mano, arma y prop conserva propiedad?
- ¿Los objetos destruidos permanecen destruidos?
- ¿La cámara humana incluye intensidad y excepciones?
- ¿Los cortes musicales están ligados a beats existentes?
- ¿El Foley se subordina a la música cuando esta es timing master?
- ¿La cámara lenta empieza en un trigger físico y termina explícitamente?
- ¿La trayectoria de cámara continúa sin reset durante el slow motion?
- ¿El estado posterior conserva partículas, daños, posiciones y objetos rotos?
- ¿Se limita diálogo, narrador, música y voces según el contrato sonoro?
- En edición, ¿`@Video1` conserva ratio, duración, guion y timing sin proponer
  parámetros nuevos?
- Si se clona una voz, ¿`@Audio1` define solo identidad vocal mientras el
  diálogo procede exclusivamente de `@Video1`?
