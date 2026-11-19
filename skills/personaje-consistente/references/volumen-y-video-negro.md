# Volumen y vídeo negro

La voz llega al modelo de vídeo como **vídeo**, no como audio: la pista va sobre un fondo negro. En la práctica el modelo coge mejor la voz así que con un audio suelto, y mejor todavía en segundos enteros **[H]**: no se ha comparado en el ejemplo. Antes, la voz del pangrama tiene que sonar alta y clara y durar un número exacto de segundos.

Este archivo vale para el **pangrama** (método 1 y audio de referencia del método 2). La **pista de escena** del método 2 no pasa por el medidor: ver la sección 7.

Niveles de confianza: **[D]** documentado, **[C]** comprobado en `ejemplo-luis.md`, **[H]** decisión razonada.

## 1. Regla del medidor de volumen

- Se mide con `ebur128`: sonoridad integrada (LUFS) y pico.
- **Objetivo: −24 LUFS integrados, con el pico siempre por debajo de −1 dBFS** **[C]**. Es el nivel de la primera prueba del ejemplo, que se oía bien.
- Si está más bajo, se sube con **ganancia lineal** (sin compresor ni limitador) hasta el objetivo, sin pasar del pico máximo. Si el pico no lo permite, se sube lo que se pueda y se avisa.
- Si está más alto que el objetivo, se deja como está: no se baja salvo que el usuario lo pida.
- La skill enseña siempre los valores **antes y después**.

```bash
IN="$P/backup/fuentes/voz-pangrama-<modo>_original.<ext>"
ffmpeg -hide_banner -i "$IN" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
```

Ganancia = −24 − I. Si pico + ganancia > −1, la ganancia baja a −1 − pico. En el ejemplo: el original medía −34,4 LUFS, se subió **+10 dB** y quedó en −24,5 LUFS con pico de −7,2 dBFS **[C]**.

## 2. Duración en segundos enteros

El vídeo negro y todo lo que salga de él duran **N,000 s exactos** (en imagen, audio y archivo). Nunca 15,3 ni 16,7.

1. Se miden duración y silencios:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN"
ffmpeg -hide_banner -i "$IN" -af silencedetect=noise=-40dB:d=0.25 -f null - 2>&1 | grep silence_
```

2. **Redondeo [C]:** hacia abajo solo si lo que se recorta es silencio. Si se cortaría voz, hacia arriba, rellenando con silencio.
3. Un MP3 a 24 kHz añade unos **0,048 s** de relleno propio del formato (un bloque MP3): no es voz y se recorta **[C]**.
4. Los tiempos de los silencios se guardan en `backup/registro.md`: sirven para escribir los giros de cabeza del clip.

## 3. Preparar el WAV final

Ganancia, 48 kHz, 24 bits y duración exacta en un paso:

```bash
T=15
G=10   # la ganancia calculada en dB
ffmpeg -y -i "$IN" -af "aresample=48000,volume=${G}dB,apad,atrim=0:${T},asetpts=N/SR/TB" -c:a pcm_s24le \
  "$P/hojas-y-voz/Audio1_voz-pangrama_${T}s.wav"
```

Se vuelve a medir y se enseña: duración (debe salir `T.000000`), LUFS integrados y pico. Este WAV es la referencia de voz que se adjunta en Seed Audio en el método 2 (mide unos 4,3 MB para 15 s, por debajo de los 10 MB que admite).

## 4. Vídeo negro

1280 x 720, 24 fps, H.264, audio AAC a 48 kHz, duración `T` exacta.

```bash
AUDIO="$P/hojas-y-voz/Audio1_voz-pangrama_${T}s.wav"
ffmpeg -y -f lavfi -i color=c=black:s=1280x720:r=24 -i "$AUDIO" -map 0:v -map 1:a -t $T \
  -c:v libx264 -pix_fmt yuv420p -preset medium -tune stillimage \
  -c:a aac -b:a 192k -movflags +faststart \
  "$P/hojas-y-voz/Video1_voz-pangrama_${T}s.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_type,duration,nb_frames -of compact "$P/hojas-y-voz/Video1_voz-pangrama_${T}s.mp4"
```

Comprobación: el formato, la imagen y el audio dan `15.000000` y la imagen tiene `T x 24` fotogramas (360 para 15 s) **[C]**.

## 5. Por qué 15 s como tope

- Los modelos de vídeo con referencias suelen limitar los segundos de vídeo de referencia y cobrarlos, a menudo redondeando cada vídeo al segundo superior. Un vídeo de 15,07 s puede contar como 16. Los límites de cada modelo los comprueba quien haga el vídeo.
- Con dos personajes en una escena, sus vídeos de referencia tienen que caber juntos. Por eso el tope práctico de cada voz de referencia es **15 s** **[H]**.

## 6. Recortar un vídeo generado a segundos exactos

Los modelos devuelven a veces un fotograma de más. El clip de referencia del ejemplo salió con 361 fotogramas y 15,072 s **[C]**. Antes de usarlo como referencia se recorta, para que no cuente como 16 s:

```bash
ffmpeg -y -i "<clip>.mp4" -t $T -map 0:v -map 0:a -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart "<clip>_${T}s.mp4"
```

La imagen no se recodifica. Se comprueba que todo da `T.000000`.

## 7. Pista de escena (método 2)

- **No se toca el volumen** ni se aplica ningún filtro: la pista sale de Seed Audio y se queda como está.
- Sí se fija la duración a **segundos enteros**, con la regla de la sección 2: se rellena con silencio, se recorta solo silencio o se redondea hacia arriba y se avisa.
- Se monta en vídeo negro como en la sección 4, sin `aresample` ni `volume`. El comando está en `seed-audio-en-video.md`, sección 6.
