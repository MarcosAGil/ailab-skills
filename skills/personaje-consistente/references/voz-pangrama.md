# Voz de referencia con pangrama

La voz de referencia del personaje es siempre el mismo texto: un **pangrama fonético**, una frase corta que pasa por casi todos los sonidos del idioma. Así el modelo de vídeo ve y oye cómo el personaje forma cada sonido, y la misma frase sirve para comparar personajes.

Niveles de confianza: **[D]** documentado, **[C]** comprobado en `ejemplo-luis.md`, **[H]** decisión razonada, **[?]** hipótesis por validar.

## 1. El pangrama de castellano de España

Unión de dos pangramas clásicos del castellano. Es fijo para todos los personajes en castellano: solo cambian las etiquetas y la puntuación de los picos.

```text
Benjamín pidió una bebida de kiwi y fresa; Noé, sin vergüenza, la más exquisita champaña del menú. El pingüino Wenceslao hizo kilómetros bajo exhaustiva lluvia y frío; añoraba a su querido cachorro.
```

| Sonido | Dónde sale |
|---|---|
| Labios cerrados (p, b, m) | Benjamín, pidió, sin vergüenza ("simbergüenza"), más, champaña, menú, pingüino, kilómetros, Bajo. Unos 9 cierres |
| z / c de España | vergüenza, Wenceslao, hizo |
| j fuerte | Benjamín, bajo |
| ch | champaña, cachorro |
| ñ | champaña, añoraba |
| ll / y | lluvia |
| r fuerte y suave | cachorro, fresa, querido |
| x de "taxi" | exquisita, exhaustiva |
| f | fresa, frío |
| g | pingüino |
| Diptongos | pidió, vergüenza, kiwi, pingüino, exhaustiva, lluvia |

No cubre ie, ei, oi ni ai. **En castellano, la b o la v entre vocales no cierra los labios** (bebida, exhaustiva, lluvia, añoraba): solo cierran la b o la v al inicio de frase o tras m o n. Esto se dice en el prompt del clip para que el modelo no cierre la boca donde no toca.

Para otro idioma se busca un pangrama clásico de ese idioma y se aprueba con el usuario. No se inventa uno.

Duración: dicho con calma, el pangrama cabe en **15 s** con pausas naturales **[C]**.

## 2. Dos modos por personaje

| Modo | Para qué | Etiquetas |
|---|---|---|
| **Natural** | La voz tal como habla el personaje. Es el que se usa por defecto como referencia **[C]** | Ninguna. Puntuación: puntos suspensivos tras "fresa" y "Wenceslao", exclamación en "¡Bajo exhaustiva lluvia y frío!" |
| **Rango emocional** | Enseñar cómo emociona: susurro, risa, grito, suspiro | Una etiqueta por trozo, en inglés, adaptada a la personalidad |

Texto del modo natural, con la puntuación que se usó:

```text
Benjamín pidió una bebida de kiwi y fresa... Noé, sin vergüenza, la más exquisita champaña del menú. El pingüino Wenceslao... hizo kilómetros. ¡Bajo exhaustiva lluvia y frío! Añoraba a su querido cachorro.
```

### Etiquetas para el rango emocional (ElevenLabs v4)

Las etiquetas **son el diseño de la actuación**: se eligen según la personalidad de la ficha.

Por defecto (curioso, expresivo):

```text
[curious] Benjamín pidió una bebida de kiwi y fresa... [mischievously] Noé, sin vergüenza, [laughs softly] la más exquisita champaña del menú. [whispers] El pingüino Wenceslao... [gasps] ¡hizo kilómetros! [shouting] ¡Bajo exhaustiva lluvia y frío! [sighs] Añoraba a su querido cachorro.
```

Frío y controlado:

```text
[cool, measured] Benjamín pidió una bebida de kiwi y fresa... [dry, faintly amused] Noé, sin vergüenza, [quiet, knowing laugh] la más exquisita champaña del menú. [low, almost a whisper] El pingüino Wenceslao... [sharp, clipped] hizo kilómetros. [cold disbelief, still controlled] ¡Bajo exhaustiva lluvia y frío! [low, calm, precise] Añoraba a su querido cachorro.
```

Caótico y descarado:

```text
[bratty, teasing, sing-song] Benjamín pidió una bebida de kiwi y fresa... [fast, mock-serious] Noé, sin vergüenza, [snorting laugh] la más exquisita champaña del menú. [exaggerated stage whisper] El pingüino Wenceslao... [dramatic gasp, pitch shooting up] ¡hizo kilómetros! [loud, playfully outraged] ¡Bajo exhaustiva lluvia y frío! [mock-tragic sigh] Añoraba a su querido cachorro.
```

Reglas: una etiqueta fuerte por trozo, nunca varias apiladas; el texto del pangrama no se toca, solo se añaden etiquetas y puntuación.

## 3. Rutas

| Ruta | Cuándo | Guía |
|---|---|---|
| **ElevenLabs v4 con etiquetas** (por defecto) | Voz diseñada, clonada con autorización o de biblioteca | `voz-elevenlabs.md` |
| **Seed Audio** (alternativa, la probada en el ejemplo) | Cuando el usuario lo prefiere. Es el modelo que clona después la voz del pangrama en las pistas de escena (método 2). Las etiquetas dentro de `[DIAL]` funcionaron en la prueba **[?]** | `voz-seed-audio.md` |

## 4. Después de generar

1. Guardar el original tal cual.
2. Medir y ajustar el volumen (regla del medidor) y fijar la duración en segundos enteros: `volumen-y-video-negro.md`.
3. El usuario lo escucha y lo aprueba.
4. Generar el vídeo negro con ese audio.

Si el usuario quiere los dos modos, se aprueba uno como **voz de referencia** (el que se usará en el vídeo negro y en el clip) y el otro se guarda como alternativa.
