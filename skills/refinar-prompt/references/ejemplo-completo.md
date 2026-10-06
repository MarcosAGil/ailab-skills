# Ejemplo completo y banco de preguntas

Un ciclo entero con un prompt corto y genérico, para calibrar el nivel de detalle y el tono. Es un ejemplo de cómo se ve el trabajo, no una plantilla para copiar.

## 1. El prompt de entrada

```text
A 6 second video of a barista making a coffee in a small cafe. The camera moves
dynamically toward her as she smiles at the customer and says "Buenos días".
She looks happy. Cinematic, warm light, handheld feel.
```

Referencias: `@Image1` es la ficha de personaje de la barista; `@Image2` es una foto del interior de la cafetería.

## 2. El informe de auditoría

```text
Auditoría de tu prompt
Veredicto: buena idea y escena clara, pero tiene 5 bloqueantes: la cámara, el encuadre, la mirada, la emoción y el rol de @Image2.

Ya está bien resuelto: el diálogo es una sola frase y la duración es razonable.

Bloqueantes
1. [C2] Dónde: "moves dynamically toward her". Problema: sin disparador, velocidad ni aterrizaje, y "toward" puede salir como zoom.
2. [C4] Dónde: no aparece. Problema: no hay tamaño de plano inicial ni final, ni se dice que el cliente no debe salir.
3. [P2] Dónde: "smiles at the customer". Problema: no dice si mira a la lente ni dónde está el cliente respecto a la cámara.
4. [P1] Dónde: "She looks happy". Problema: es una etiqueta, no una conducta visible.
5. [R2] Dónde: @Image2. Problema: no dice si es el primer frame o solo la localización.

Importantes
6. [E2] Dónde: "Cinematic ... handheld feel". Problema: se pisan; no está claro cuál manda.
7. [A1] Dónde: "making a coffee". Problema: sin estados inicial y final, ni qué mano hace qué.
8. [P9] Dónde: "Buenos días". Problema: sin variedad de español ni forma de decirlo.
9. [F1] Dónde: no aparece. Problema: no se dice qué está nítido.
10. [A8] Dónde: no aparece. Problema: no se dice cómo acaba el clip.

Menores que decidiré yo: ratio, sonido ambiente, microvida.
```

## 3. Las preguntas (resumen de las dos rondas)

**Ronda 1 (bloqueantes)**

- [C2 + C4 + F1] "Dices 'moves dynamically toward her'. ¿Cómo lo quieres?" A) La cámara avanza andando, despacio y constante, de un plano medio a uno medio corto, y el foco queda en su cara (Recommended). B) Cámara quieta con ligera deriva de mano. C) Un acercamiento rápido y corto.
- [P2] "¿Dónde está el cliente y a dónde mira ella?" A) El cliente está fuera de cuadro, justo a la derecha de la lente, y ella le mira a los ojos, sin mirar nunca a la lente (Recommended). B) Mira a cámara al saludar.
- [P1] "'Looks happy' no dice cómo se ve. ¿Qué conducta?" A) Sonrisa tranquila que crece, ojos que se arrugan, hombros sueltos (Recommended). B) Sonrisa amplia y enérgica. C) Amable pero cansada.
- [R2] "¿@Image2 es el primer frame o solo la localización?" A) Solo la localización (Recommended). B) El primer frame exacto.

**Ronda 2 (importantes)**

- [E2] "'Cinematic' y 'handheld feel' chocan. ¿Cuál manda?" A) Cámara en mano y luz cálida natural, sin grade (Recommended). B) Look cinematográfico y cámara estable.
- [A1] "Describe qué hace con cada mano al preparar el café." A) Mano derecha vierte la leche de una jarra en una taza, la izquierda sujeta la taza, y al acabar deja la jarra sobre la barra (Recommended). B) Otra.
- [P9] "¿Cómo suena el saludo?" A) Castellano de España, cálido y relajado (Recommended). B) Otra variedad.
- [A8] "¿Cómo acaba?" A) Corte seco al dejar la jarra, sin pose ni espera (Recommended). B) Mantiene la sonrisa un segundo.

## 4. El prompt refinado (con las opciones recomendadas)

```text
[Generation Goal]
Create a 6-second live-action shot in ONE continuous handheld take. A barista finishes pouring milk into a cup at the counter of a small cafe, looks up at a customer standing just beside the camera and greets them warmly. The camera walks in slowly as she greets. Every visible action, lip movement, gesture and camera movement happens simultaneously in real time. The only cut is the out-point at 6.00s.

[Characters]
The barista corresponds to @Image1. Use only her face, hair, build and wardrobe. Do not use the studio background or the sheet layout. She never looks into the lens: her eyes go to the customer, who stands off frame just to the right of the lens. Her right hand is the pouring hand and her left hand steadies the cup; the hands never swap roles. Exactly one visible person. The customer and the person filming are never seen.

[Props]
One white cup on the counter and one small steel milk pitcher, both belonging only to the barista. Exactly one of each.

[Scene]
The cafe interior references @Image2. Use @Image2 only for the room: counter, shelves, windows, layout. Do not use @Image2 as a first frame.

[Visual Style]
Warm natural window light, soft contrast, natural unretouched skin, handheld footage with no colour grade.

[Camera]
Handheld at chest height by an ordinary person, with light natural drift, never fixed. Starting framing: medium shot from the customer's side of the counter, the barista framed from the thighs up, counter in the foreground. Final framing: medium close-up, chest up, her face on the upper third line with loose headroom. Focus: the sharp plane is the barista, and her face is the sharp plane from the first frame. Not used anywhere: optical or digital zoom, whip pans, orbit, slow motion, cuts.

[Stage 1 | 0.00-3.00s]
Initial state: the barista stands behind the counter, pitcher in her right hand, cup half full under it, her left hand steadying the cup, her eyes on the pour, a faint relaxed smile.
Primary event: she finishes pouring in a thin, steady stream. As the pitcher tips back upright, her eyes lift from the cup to the customer. The camera has started walking in slowly and constantly, a physical move at ordinary walking pace, never a zoom, and keeps her centred.
Performance: one natural blink, her shoulders loose, her breath calm.
Camera: the operator begins to walk in as she finishes the pour and arrives at the final framing at the end of the stage, landing a little late with a small correction.
End state: the pitcher is upright in her right hand, her eyes on the customer, the smile starting to grow.

[Stage 2 | 3.00-6.00s]
Continue from the previous stage: the pitcher upright in her right hand, her eyes on the customer, the camera in the medium close-up.
Primary event: she greets the customer and sets the pitcher down.
Dialogue language: Spanish (Spain). The barista says in warm, easy, relaxed Castilian Spanish, with a smile in her voice: {Buenos días}
As she begins this phrase, her smile grows and the corners of her eyes crinkle; on its last word she sets the pitcher down on the counter beside the cup with her right hand, small and unhurried. She does NOT wave and does NOT look into the lens.
Performance: a soft breath after the phrase, a small nod.
Sound: <The pitcher touches the counter with a soft metallic tap>
End state: the pitcher rests on the counter, her smile held, eyes on the customer; the clip cuts exactly at 6.00s. No final pose, no hold, no fade.

[Maintain Consistency]
Exactly 6 seconds, one continuous take. One visible person. Dialogue: only the braced line, spoken once. The camera never zooms. No music, no subtitles, no on-screen text.

[Audio]
Ambient cafe sound at low level and the listed sounds, as captured by the camera at close range. No music.

The result feels like a warm, candid moment caught on the move, with the camera always a step behind her.
```

📐 Aspect ratio: 16:9 | ⏱ Duration: 6s

Supuestos:
- La cámara avanza andando y no hace zoom; el cliente queda fuera de cuadro, a la derecha de la lente.
- @Image2 es solo la localización; no hay primer frame, así que el ratio (16:9) lo he elegido yo.
- Castellano de España para el saludo; ambiente de cafetería a volumen bajo.

## 5. Banco de preguntas modelo

Para calibrar el tono. Se adaptan al caso; todas citan el prompt, dicen por qué falla y ofrecen opciones con una recomendada.

- **[C5]** "Dices 'hold this stable framing', pero él echa la silla atrás y tira la cabeza hacia atrás. Si la cámara se queda fija, se sale de plano. ¿Cómo lo quieres?" A) La cámara retrocede con él y lo mantiene centrado (Recommended). B) Plano más holgado y él se mueve dentro. C) Plano fijo y que salga de cuadro.
- **[P2]** "En ningún sitio dices a dónde mira mientras teclea. ¿Dónde está el monitor y a dónde van sus ojos?" A) Al monitor, junto a la lente y a su derecha (Recommended). B) A la nada, ligeramente por encima de la lente. C) A cámara.
- **[F1]** "No dices qué está nítido al empezar. Con el teclado pegado a la lente, ¿qué queda enfocado?" A) Teclado y fondo al principio, y el foco pasa a la cara al subir la cámara (Recommended). B) Cara siempre nítida y teclado blando.
- **[A2]** "La puerta: ¿se abre hacia dentro o hacia fuera? Cambia dónde está la cámara y qué ve." A) Hacia dentro, con las bisagras como en la referencia (Recommended). B) Hacia fuera.
- **[S2]** "Tu audio dura 9,40 s y el prompt pide 9 s: cortaría la última palabra. ¿Cómo lo resolvemos?" A) 10 s con una espera final del personaje (Recommended). B) 9 s y recortamos el audio.
- **[E2]** "Pides 'raw CCD' y a la vez 'cinematic grade'. Chocan. ¿Cuál manda?" A) Raw CCD, sin grade (Recommended). B) Look cinematográfico y sin grano marcado.
- **[P1]** "'Furioso' no dice cómo se ve. ¿Qué conducta quieres?" A) Furia contenida: mandíbula apretada, ojos fijos, respiración corta (Recommended). B) Furia explosiva: gestos amplios, respiración fuerte. C) Cansancio y resignación.
- **[S5]** "Dices que la impresora saca dos hojas durante la frase del médico, pero no sé en qué momento exacto suena en el audio. ¿Lo anclo a la segunda frase?" A) Sí, a la segunda frase (Recommended). B) Dime el segundo exacto.
- **[P4]** "Mientras ella habla, ¿qué hace el otro?" A) Escucha activa: la sigue con la mirada y asiente una vez, sin hablar (Recommended). B) Sigue con lo suyo (teclear, leer). C) Se queda quieto mirándola.
