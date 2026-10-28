# Cómo pedir distintos acentos

Los acentos dependen del modelo y de la ruta. Esta guía recoge lo documentado y propone redacciones para probar. **Casi todo lo regional es [?]**: ningún acento está garantizado. La skill no puede escuchar el audio, así que el usuario lo valida.

Niveles de confianza: **[D]** documentado, **[H]** heurística razonada, **[?]** hipótesis por validar generando, **[ND]** no documentado.

## 1. Regla común

- Se declara **idioma y variante regional de forma explícita** y concreta. Se evitan descriptores vagos como "extranjero" o "exótico".
- Se describe el carácter, el ritmo y la distancia al micro con palabras observables (`relaxed and conversational`, `quick but clear`).
- Un acento fuerte o muy específico puede salir peor que uno suave. Se prueba y se ajusta **una variable** cada vez.

## 2. Según la ruta

| Ruta | Cómo se pide el acento | Confianza |
|---|---|---|
| **Seed Audio** | En la línea `Voice (<Nombre>): ... español de España, acento castellano ...`, **repetido** en cada `[DIAL]` y en `[ETIQUETA]` | Español: experimental **[D]**. Otros idiomas y acentos: **[?]** |
| **ElevenLabs, diseñar una voz** | En la **primera frase** del prompt de diseño: `Native <language>, <regional dialect>.` La palabra `accent` solo para un dialecto regional real; la melodía y el énfasis se describen con `intonation`, `emphasis` o `delivery` | **[D]** como método; el resultado depende del modelo |
| **ElevenLabs, voz existente (biblioteca o propia)** | El acento lo da **la voz**. No se añaden etiquetas de acento por defecto. Si hay un problema de acento y el usuario acepta probar, un tag de acento es un refuerzo **experimental** | **[D]** |
| **ElevenLabs, clon** | El acento sale de la grabación. Se elige una grabación con el acento deseado | **[D]** |

Seed Audio: la documentación oficial ha descrito inglés y chino como idiomas actuales, con ampliación multilingüe anunciada. La CLI de AILAB no expone `multilingual` **[D]**. Para español y otros idiomas, se presenta como experimental y se ofrece ElevenLabs si la fidelidad regional es crítica.

## 3. Redacciones para probar

Son ejemplos de redacción para el prompt, **no probados salvo donde se indique**. Para ElevenLabs diseño, la frase va al principio del prompt; para Seed Audio, en la línea `Voice`.

| Acento deseado | ElevenLabs diseño (primera frase, inglés) | Seed Audio (`Voice`, castellano o inglés) |
|---|---|---|
| Español de España, castellano | `Native Spanish, European Spanish as spoken in Spain.` **[D]**, es el ejemplo de la guía de diseño | `español de España, acento castellano` **[D]**, es el ejemplo validado del Audio Prompter |
| Español de España, andaluz | `Native Spanish, Andalusian Spanish as spoken in Andalusia, Spain.` **[?]** | `español de España, acento andaluz` **[?]** |
| Español de México | `Native Spanish, Mexican Spanish as spoken in Mexico.` **[?]** | `español de México, acento mexicano` **[?]** |
| Español rioplatense | `Native Spanish, Rioplatense Spanish as spoken in Argentina.` **[?]** | `español de Argentina, acento rioplatense` **[?]** |
| Español de Colombia | `Native Spanish, Colombian Spanish as spoken in Colombia.` **[?]** | `español de Colombia, acento colombiano` **[?]** |
| Inglés británico | `Native English, British English as spoken in England.` **[?]** | `British English, southern England accent` **[?]** |
| Inglés estadounidense | `Native English, American English as spoken in the United States.` **[?]** | `American English, general American accent` **[?]** |

El autor ha usado en prompts de vídeo el castellano, el andaluz y el inglés con acento australiano para el diálogo de Seedance 2.5, pero eso **no valida** estas redacciones en Seed Audio ni en el diseño de ElevenLabs.

## 4. Cómo probar un acento

1. Se genera **una** muestra con la redacción de la tabla y se pide al usuario que la escuche.
2. Si el acento no sale, se cambia **una sola variable**: la palabra del dialecto, su posición, o el nivel de detalle. No se acumulan descriptores.
3. Con ElevenLabs diseño, se puede subir el realismo del acento describiendo `intonation` y `delivery`, no con más adjetivos de acento.
4. Con voz de biblioteca, se busca una voz que ya tenga el acento (`voices eleven --language es --search ...`) antes de forzarlo con texto.
5. Lo que funcione se anota en `prompt.md (sección 6)` con el prompt exacto, para reproducirlo.
6. Si no sale tras unos intentos, se dice con honestidad y se ofrece otra ruta (otra voz de biblioteca, una grabación para clonar).

## 5. Dos voces en una toma

Con Seed Audio, un solo campo de voz no asigna acentos distintos a dos personajes. La vía documentada es una referencia de audio por persona (`--audio_urls`, hasta tres), citadas como `@Audio1` y `@Audio2` en `Voice` y en cada `[DIAL]`. Sin referencias, las voces solo se diferencian por descripción y no se presenta como asignación exacta.
