# Sonido, audio de referencia y sincronía

Cómo suena un vídeo grabado con un móvil y cómo se trabaja con un audio de referencia. Niveles de confianza: **[D]** regla dura, **[H]** heurística, **[?]** hipótesis.

## Recomendación: generar la voz con Seed Audio

Cuando hay diálogo, lo mejor es **generar primero la voz con Seed Audio y pasarla como referencia** (`@Audio1`). Con ese audio la skill puede:

- medir la duración real, las pausas y el momento de cada frase;
- colocar los cortes y los gestos en las pausas reales;
- fijar la boca, la respiración y las miradas al audio;
- evitar el desfase de voz entre tomas.

Sin audio, el prompt sale con la voz generada por el propio modelo: peor sincronía y voces algo distintas de una generación a otra [H]. La skill lo avisa una vez (hallazgo S1) y continúa si el usuario insiste.

Si el audio no incluye ambiente, o incluye ruido de fondo, se confirma midiéndolo o preguntando. No se inventa lo que contiene [D].

## Con audio exacto

1. **Medir** (si hay terminal): `python3 scripts/medir_audio.py audio.mp3 --out medicion.json` da la duración, los silencios, el inicio y el fin de la voz, la **cola de silencio** y las palabras con tiempos. Sin Python: `silencedetect` y un transcriptor con tiempos por palabra. Con esa **tabla de tiempos** se colocan los límites de tramo solo dentro de silencios. Si no, se pide transcripción y tiempos aproximados. Nunca se inventan [D].
2. **Duración:** número entero de segundos. Si el redondeo truncara una palabra (9,40 s no cabe en 9 s), se sube y se deja una espera final con conducta [H].
3. **Contrato de pista exacta** (ver `formato-salida.md`): el audio es la autoridad; las llaves asignan hablante y tiempo, no una interpretación nueva [D].
4. **Cortes y tramos** caen en pausas reales, redondeados a la rejilla de medio segundo. Si el texto del prompt no coincide con el audio, manda el audio y se avisa [D].
5. **Cada frase aparece una sola vez** en todo el prompt, en el tramo donde se dice [D].
6. **Sonidos ambientales** solo si el audio los contiene o el usuario los da. Los sonidos puntuales con causa visible van en `< >` junto a su causa [D].

## Sin audio de referencia

- Se describe el sonido de un micrófono de móvil en `[Audio]` (más abajo).
- **Ritmo de habla:** se estima con prudencia, en torno a 2,5 a 3,5 palabras por segundo en castellano conversacional [?]. Los repositorios que consulté no se ponen de acuerdo (algunos hablan de 3 y otros de casi 6), así que se avisa de que es una estimación y se recomienda el audio.

## El sonido de un micrófono de móvil

Todo [H], salvo la regla de no música.

- **Voz cercana y algo comprimida**, con la ganancia que sube y baja un poco. A veces un golpe de aire en las "p" o "b" [H].
- **Eco de sala según el lugar:** cocina, baño y pasillo con superficies duras tienen más reverberación; un dormitorio con textiles suena más seco [H].
- **Al moverse:** la voz cambia con la distancia y con la orientación de la cabeza. Más clara de frente, más apagada y con más sala al girarse [H].
- **Ruidos del aparato y del cuerpo:** roce de ropa, respiración audible, pasos [H].
- **Exterior:** viento sobre el micrófono, tráfico y pájaros a distancia [H].
- **Coche:** zumbido de motor y rodadura constantes, intermitente, voz algo más forzada [H].
- **Sala de ponencia (desde el público):** la voz sale por la megafonía: limpia y cercana, con reverberación de auditorio, algo boomy en graves; sala en silencio atento; sin aplausos ni murmullos salvo que se pidan; ruido de sala muy bajo [H].
- **Entrevista en la calle:** la voz del entrevistado más cercana al micrófono de mano; viento, tráfico, pasos y voces lejanas de fondo. La voz del entrevistador, si se oye, está fuera de cuadro, cerca de la cámara [H].
- **Podcast:** voz de micrófono de estudio, cercana y cálida, con efecto de proximidad, sin reverberación de sala y con respiración audible; sin ruido de fondo; el interlocutor, si se oye, fuera de cuadro [H].
- **Trípode:** voz algo más lejana que en un selfie, con más sala [H].
- **Q&A:** voz cercana y cómoda, con el eco de la habitación; sin música [H].
- **Sin música ni efectos de diseño ni narrador** salvo que el usuario los pida [D]. Sin sonidos asociados al movimiento de cámara [D].
- Cada sonido puntual tiene causa visible: *`<The roller shutter rattles as it is lowered>`* junto al gesto.

## Sincronía labial y de gestos

- Con audio: "synchronize lips, breathing, gestures and physical actions to the existing audio" [D].
- Los gestos y las miradas se anclan a una frase o a un sonido del audio (`On this phrase`, `At the exact click in @Audio1`), nunca a una palabra citada entre comillas [D].
- Frases de sincronía labial muy repetidas en otros repositorios ("lip synchronization natural and precise", "pausas de 200 a 400 ms") se tratan como **[?]**: se pueden añadir si el usuario ve desfase, pero no se imponen.

## Cómo escribirlo

En `[Audio Reference]` (con audio) o `[Audio]` (sin audio), y en la línea `Sound:` de cada tramo. Plantilla sin audio:

```text
Everything is the sound of a small built-in microphone as captured: close, slightly compressed voice with light auto-gain pumping, the natural reverb of [the room], clothing rustle and audible breaths, [the ambient sounds of the place]. No music, no narrator, no designed sound, and no sound on any camera movement.
```
