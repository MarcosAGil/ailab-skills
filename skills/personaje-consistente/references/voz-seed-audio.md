# Voz con Seed Audio (alternativa a ElevenLabs v4)

> **Alcance:** audio de referencia del personaje diciendo el **pangrama** (ver `voz-pangrama.md`). La pista sonora completa de una escena es el método 2 y tiene su propia guía: `seed-audio-en-video.md`.

ElevenLabs v4 con etiquetas es la ruta por defecto (`voz-elevenlabs.md`). Seed Audio es la alternativa, y se mantiene con su forma de prompting porque **clona voces a partir de un audio de referencia**: es lo que hace el método 2 con el pangrama (`seed-audio-en-video.md`). Clonar la grabación de una persona real exige su permiso (regla 15 de `SKILL.md`).

Niveles de confianza: **[D]** documentado, **[C]** comprobado en `ejemplo-luis.md`, **[H]** heurística razonada, **[?]** hipótesis por validar, **[ND]** no documentado.

## 1. Qué es y qué papel juega

Seed Audio genera una **escena acústica integrada**: voz, ambiente, efectos y, si se pide, música, en una sola pasada. No da pistas separadas y no garantiza sincronía por fotograma **[D]**. Es un **modelo caro**: se avisa antes de enviar.

## 2. Contrato de AILAB

Se comprueba siempre con `AILAB info seed-audio`. Con el catálogo de 2026-10-24:

| Parámetro CLI | Regla |
|---|---|
| `--prompt` | Obligatorio. Máximo **2.048 caracteres** **[D]** |
| `--audio_urls` | Hasta 3 referencias de audio, cada una de hasta 30 s y 10 MB **[D]** |
| `--image_url` | Una imagen. **No se combina con `--audio_urls`** **[D]** |
| `--estimated_duration_seconds` | Es una **estimación**; la duración real la decide el modelo |
| `--output_format` | `wav` (referencia y posproducción), `mp3`, `pcm`, `ogg_opus` |
| `--speed`, `--volume`, `--pitch` | 0,5 a 2 · 0,5 a 2 · de -24 a 24 semitonos |

**La CLI no expone un campo `voice` ni `multilingual`** **[D]**: la voz se define en el texto del prompt (línea `Voice (...)` y `[DIAL]`).

## 3. Reglas del prompt

- **Sin nombres sueltos [C].** Seed Audio no tiene referencia de nombre: un nombre sin audio de referencia no ancla nada y puede leerse en voz alta. En el pangrama se escribe siempre `Voice (Man)` / `Voice (Woman)` y `[DIAL] Man (...)` / `[DIAL] Woman (...)`. Con audio de referencia, el nombre va junto a su handle: `Voice (Luis / @Audio1)` y `[DIAL] Luis (...)`, como en la escena de la corbata (`seed-audio-en-video.md`) **[C]**.
- **El ambiente es una variable.** Por defecto, una habitación tranquila. Se cambia si el usuario lo pide.
- Orden fijo: `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]`.
- Diálogo entre **comillas dobles rectas**, literal.
- Idioma y acento en **tres sitios**: línea `Voice`, cada `[DIAL]` y `[ETIQUETA]`.
- Duración en el brief y en `[ETIQUETA]`: la T objetivo del vídeo negro (normalmente 15).
- El pangrama se reparte en dos `[DIAL]`: la primera mitad y la segunda.
- **Etiquetas de ElevenLabs dentro de los `[DIAL]` [?]:** en el ejemplo, las etiquetas `[curious]`, `[whispers]`, `[gasps]` y demás dentro del texto entrecomillado funcionaron al oído del usuario. No está documentado: se usa para el modo de rango emocional y se escucha siempre.
- Salida en `wav` cuando se genera con AILAB.
- Se cuenta la longitud antes de enviar: `printf %s "$(cat voz-v1.txt)" | wc -m`. Si no cabe, se acorta el brief, la textura o el entorno. **Nunca el pangrama.**

## 4. Plantillas aprobadas

### Modo natural (sin etiquetas)

Es el modo que se eligió en el ejemplo **[C]**.

```text
{{T}}-sec natural storytelling scene, clean interior acoustic, voice-forward mix, conversational tone, no background music.

[AESTHETIC]
- Texture: natural room acoustic, warm intimate voice, subtle dynamic range.
- Environment: {{AMBIENTE}}.
- Voice ({{Man|Woman}}): {{DESCRIPCION_VOZ}}.
- Palette: subtle natural breath, gentle vocal presence.

[EXECUTION]
[AMBI] {{AMBIENTE_CORTO}} -> [DIAL] {{Man|Woman}} ({{CARACTER_1}}, {{IDIOMA}}): "{{PANGRAMA_PARTE_1}}" -> [EVENT] Subtle natural pause.
[DIAL] {{Man|Woman}} ({{CARACTER_2}}, {{IDIOMA}}): "{{PANGRAMA_PARTE_2}}" -> [TRANS] Gentle room silence decay.

[ETIQUETA: {{IDIOMA}}, una sola voz {{masculina|femenina}}, sin narrador, sin música, duración exacta {{T}}.0s]
```

### Modo rango emocional (con etiquetas)

```text
{{T}}-sec expressive storytelling scene, natural room acoustic, voice-forward mix with rich dynamic range, no background music.

[AESTHETIC]
- Texture: clean room acoustic, warm intimate voice-forward dynamic range.
- Environment: {{AMBIENTE}}.
- Voice ({{Man|Woman}}): {{DESCRIPCION_VOZ}}, muy expresivo y dinámico.
- Palette: soft breath dynamics, subtle vocal posture changes.

[EXECUTION]
[AMBI] {{AMBIENTE_CORTO}} -> [DIAL] {{Man|Woman}} ({{CARACTER_1}}, {{IDIOMA}}): "{{PANGRAMA_ETIQUETADO_PARTE_1}}" -> [EVENT] Soft breath shift.
[DIAL] {{Man|Woman}} ({{CARACTER_2}}, {{IDIOMA}}): "{{PANGRAMA_ETIQUETADO_PARTE_2}}" -> [TRANS] Natural vocal decay into quiet room ambience.

[ETIQUETA: {{IDIOMA}}, una sola voz {{masculina|femenina}}, sin narrador, sin música, duración exacta {{T}}.0s]
```

`{{DESCRIPCION_VOZ}}` sale de la fila "Voz" de `LEEME.md`, sección 2, sin nombre: edad, idioma y acento, tono. Ejemplo del caso real: `hombre de 30 años, español de España, acento castellano, tono seguro de sí mismo, natural, cercano, sin sobreactuar`. Los dos prompts completos del ejemplo están en `ejemplo-luis.md`.

## 5. Generar la referencia

```bash
AILAB info seed-audio
AILAB prepare seed-audio --prompt "$(cat "$D/voz-pangrama-<modo>_v1.txt")" \
  --output_format wav --estimated_duration_seconds 15
AILAB submit <manifest_id_real> --confirmed --output "$D/"
```

1. Se enseña el coste de `prepare` y se avisa de que es un modelo caro.
2. Se guarda el archivo tal cual salió en `backup/fuentes/voz-pangrama-<modo>_original.<ext>`.
3. Se mide **duración, silencios y volumen** y se prepara el WAV final con la regla del medidor (ver `volumen-y-video-negro.md`). La skill no puede escuchar el audio: lo mide y el usuario lo escucha.
4. **Puerta:** el usuario aprueba o pide **un** cambio. No se regenera sin su sí.

Si el usuario genera el audio fuera (por ejemplo, un MP3 de la plataforma), se usa ese archivo como original y se sigue igual desde el paso 2.

## 6. Mantener la voz entre generaciones

Dos caminos, ninguno garantizado **[?]**:

- **A. Repetir exactamente la misma línea `Voice`.** La voz concreta que sale no está documentada **[ND]**.
- **B. Usar el audio aprobado como referencia** (`--audio_urls hojas-y-voz/Audio1_voz-pangrama_<T>s.wav`, citado como `@Audio1`). Solo con material autorizado y limpio, y **sin** `--image_url`. Es lo que hace el método 2 (`seed-audio-en-video.md`).

## 7. Control de calidad

- Sin nombres sueltos: `Man` / `Woman`, o el nombre junto a su `@AudioN`.
- Orden `brief + [AESTHETIC] + [EXECUTION] + [ETIQUETA]`.
- Idioma y acento en `Voice`, `[DIAL]` y `[ETIQUETA]`.
- Pangrama literal, entre comillas dobles rectas.
- Menos de 2.048 caracteres contados.
- Una sola voz, sin música.
- `--image_url` y `--audio_urls` nunca juntos.
- Volumen medido y ajustado antes de aprobar.
