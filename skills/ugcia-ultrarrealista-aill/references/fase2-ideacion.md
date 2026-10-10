# Fase 2a: ideación

Objetivo: entender qué quiere el usuario y dejarlo cerrado, por escrito, antes de generar el audio. Esta fase no gasta créditos y puede hacerse mientras se revisan las imágenes. **El audio no se genera hasta que las imágenes están aprobadas (punto de aprobación 1) y la idea está cerrada.**

La skill no necesita agentes externos para esto: la ideación es la **ficha de rodaje** y el **test de coherencia** de la skill externa `refinar-prompt-ugc` (su `SKILL.md`, secciones 0 y 1), ampliadas con lo que necesita el audio.

## Qué se cierra

1. **Ficha de rodaje** (los 11 campos del `SKILL.md` de `refinar-prompt-ugc`, sección 1): persona, lugar y contexto, formato de contenido y montaje, cámara frontal o trasera, acción por tramos, producto y objetos, luz, audio, dial de imperfección, formato y duración, zona libre para texto.
2. **Test de coherencia** (bloqueante): producto, lugar, persona, motivo para grabar, prueba de una frase, registro y equipo. Si no pasa, se cambia el lugar o el motivo, no la luz.
3. **Guion hablado literal** (`guion.md`, en `Archivos para usar/Texto o prompts/`): ver abajo.
4. **Duración objetivo** y número de tomas (ver límites).
5. **Producto**: referencia, cuántos, cómo se maneja, si se lee la marca (no se renderiza texto de marca: ver el `SKILL.md` de `refinar-prompt-ugc`).

## Reglas

- **Preguntas** como en el `SKILL.md` de `refinar-prompt-ugc`, sección 4: voz de prompter experto, directa, citando el fragmento, opciones concretas con la recomendada primero, y máximo 3 rondas. Lo que ya contestan las imágenes aprobadas o el brief no se pregunta.
- **Perfiles por defecto** de `formatos-ugc.md` para no agobiar (por ejemplo "selfie hablando en casa").
- **Se parte de lo que ya existe:** el brief del usuario, las imágenes aprobadas (qué persona, qué lugar) y los frames. Los frames fijan formato, lugar y persona; no se vuelven a discutir.
- **No se inventan cifras, afirmaciones de producto, casos ni fechas.** Si el guion necesita un dato que no está, se pregunta o se deja `(pendiente)`.

## Sobre el guion

- Si el usuario trae su texto, se respeta **literal** (ortografía, abreviaturas y signos tal cual). Eso es lo normal.
- Si pide ayuda con el texto hablado, se le propone un borrador **solo con los datos que él ha dado**, en castellano de España y tono de conversación entre personas, sin ganchos de venta ni llamadas a la acción agresivas, y se queda como borrador hasta que lo apruebe. Esta skill no es un guionista; es una ayuda puntual **[H]**.
- Una vez aprobado, el guion **no se toca** en ninguna fase posterior sin avisar.
- Cada frase aparece una vez. Se anota en `Archivos para usar/Texto o prompts/guion.md` el texto exacto y, aparte, las pausas deseadas.

## Límites que condicionan la idea

| Límite | Valor | Consecuencia |
|---|---|---|
| Duración de Seedance 2.5 | 4 a 30 s por generación | Una idea de más de 30 s se parte en varias tomas con cortes duros en pausas. Cada toma tiene su audio y su vídeo |
| Prompt de Seed Audio | 2.048 caracteres | Un guion largo puede obligar a dividir el audio (ver `seed-audio.md`) |
| Habla natural | 2,5 a 3,5 palabras por segundo en castellano conversacional **[?]** | Con 3 palabras por segundo, 30 s son unas 90 palabras como tope práctico |
| Una voz | Una sola voz por audio, salvo referencias de audio | Formatos con varios hablantes (podcast, Q&A, entrevista) son de riesgo: se avisa antes |

Si el guion pide más de lo que cabe, se dice al usuario con números ("este texto son 118 palabras, unos 39 s; en una toma caben unas 90") y se le dan las opciones: recortar él el texto, partirlo en dos tomas, o aceptar una voz más rápida. No se recorta nunca por cuenta propia.

## Entregable de la fase 2a

Escribe en el proyecto:

- `brief.md`: ficha de rodaje cerrada, formato, duración objetivo, decisiones y supuestos, imágenes aprobadas con su rol.
- `Archivos para usar/Texto o prompts/guion.md`: texto hablado literal aprobado.

Resume al usuario en pocas líneas qué se ha cerrado y confirma con una sola pregunta: "¿Cierro la idea así y paso a generar el audio?". Si las imágenes aún no están aprobadas, se dice que el audio espera a eso.
