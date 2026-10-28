# Voz con ElevenLabs en AILAB

Basada en el conocimiento del Audio Prompter de Ailendra Labs (ElevenLabs verificado contra su documentación el 6 de octubre de 2026) y en la skill `ailab` a fecha 2026-10-24. Los modelos, parámetros, permisos y precios los decide el catálogo activo de AILAB: se comprueban con `info`, `voice-options` y `prepare`, y mandan sobre este documento. No se inventan endpoints ni parámetros.

Niveles de confianza: **[D]** documentado, **[H]** heurística razonada, **[?]** hipótesis por validar.

## 1. Cuándo ElevenLabs en lugar de Seed Audio

- Se quiere una **voz con identidad guardada** en AILAB, reutilizable con el mismo identificador.
- Se quiere **locución limpia** de un guion con control de interpretación, no una escena sonora.
- Se dispone de una grabación **autorizada** para clonar.

Seed Audio sigue siendo la ruta recomendada por defecto (ver `voz-seed-audio.md`).

## 2. Antes de crear una voz: avisar al usuario

Se explica en una frase, antes de crear nada:
- **Cuesta y caduca.** A fecha 2026-10-24, el alta cuesta 100 créditos e incluye 48 horas. Conservarla es opcional, 15 créditos por cada periodo de 24 horas, con fecha y presupuesto máximo elegidos por el usuario y un horizonte de hasta 30 días **[D]**. Las voces y muestras caducan: no se promete recuperar una que ya se haya eliminado.
- **Una voz por miembro**, con plazas compartidas. Una plaza ocupada no autoriza a borrar otra voz.
- **Necesita un permiso del token.** Seleccionar, crear, conservar o borrar voces exige un token con el permiso **Permitir gestionar voces**, que el usuario crea en su cuenta y usa ejecutando él mismo `login` en su terminal. Nunca se pide el token por el chat. Generar audio con una voz ya creada no necesita ese permiso.
- **No hay voces de famosos.**

## 3. Ruta A: diseñar una voz por prompt

El prompt de diseño va **en inglés**, de 20 a 1.000 caracteres, con esta estructura **[D]**:

```text
Native <language>, <regional dialect>. <gender>, <age range>. <audio quality>. Persona: <2 a 5 words>. Emotion: <2 a 3 adjectives>. <One or two sentences describing vocal timbre, pacing, intonation, and delivery.>
```

Reglas del Audio Prompter:
- Idioma nativo y variante regional **en la primera frase** (por ejemplo, `Native Spanish, European Spanish as spoken in Spain`).
- La palabra `accent` solo para pedir un dialecto regional real. Para forma de hablar, énfasis o melodía, se describe `intonation`, `emphasis` o `delivery`.
- Se evitan descriptores vagos como `foreign` o `exotic`.
- Se distingue el timbre físico (`deep`, `warm`, `raspy`, `airy`, `nasal`, `resonant`) del carácter (`calm`, `confident`, `curious`, `dry`).
- Ritmo con palabras observables: `relaxed and conversational`, `deliberate and measured`, `quick but clear`.
- Calidad explícita si ayuda (`Good quality`, `Studio quality`). Una calidad muy alta puede reducir la precisión en una voz muy específica.
- Sin palabras de efecto o de canal (`reverb`, `echo`, `phone`, `tape`) en una voz de identidad.
- Sin rasgos incompatibles entre sí.

Ejemplo de referencia (agente de soporte):

```text
Native Spanish, European Spanish as spoken in Spain. Female, 35–40. Good audio quality. Persona: trustworthy support agent. Emotion: reassuring, attentive, confident. Smooth, natural timbre with gentle intonation and a relaxed pace. Clear, helpful emphasis with close, clean vocal presence.
```

Flujo de comandos **[D]** (la skill `ailab` los documenta; se consulta `AILAB voice-options` antes):

```bash
AILAB voice-options
AILAB voice-list
AILAB voice-prepare design --description-file "$P/prompts_intermedios/generaciones/descripcion.txt" --text-file "$P/prompts_intermedios/generaciones/texto-de-prueba.txt"
AILAB voice-submit <manifest_id> --confirmed
AILAB voice-status <manifest_id>
AILAB voice-samples <manifest_id> --output "$P/prompts_intermedios/generaciones/"
```

- El **texto de prueba** debe tener entre 100 y 1.000 caracteres, representar la personalidad del personaje y no contradecir la descripción. Se aprueba con el usuario.
- El diseño genera un **lote de muestras**: se enseña el precio de `prepare` antes de enviar.
- **El usuario elige la muestra después de escucharla.** No se elige ni se guarda una automáticamente, salvo instrucción explícita. La skill no puede escuchar.
- Pedir muestras **no autoriza el alta**. El alta se vuelve a presupuestar (100 créditos) y se confirma aparte:

```bash
AILAB voice-prepare create --name "<nombre del personaje>" --sample <sample_id> --request <manifest_id_de_muestras>
AILAB voice-submit <manifest_id_de_alta> --confirmed
```

## 4. Ruta B: clonar una grabación autorizada

Requisitos **[D]**:
- La voz propia, o una voz para la que exista **permiso explícito del titular**. No se infieren derechos por tener el archivo.
- Un documento de autorización (PDF o texto), **obligatorio también para voz propia**. No se publica ni se cita su contenido.
- Audio MP3 o WAV de hasta 20 MB y 120 segundos, con una sola voz, clara, sin música, ruido ni reverberación, con la dicción y energía que se quieren conservar. La calidad importa más que acumular clips.

```bash
AILAB voice-prepare clone --name "<nombre>" --audio "<ruta>/voz.mp3" --evidence "<ruta>/autorizacion.pdf" --rights-confirmed
AILAB voice-submit <manifest_id> --confirmed
AILAB voice-status <manifest_id>
```

Un prompt descriptivo **no** clona una voz. Sin audio autorizado y documento, no se clona.

## 5. Ruta C: elegir una voz de la biblioteca

```bash
AILAB voices eleven --language es --search "<nombre o descripción>" --page 0
AILAB voice-select <voice_id> --owner <public_owner_id> --name "<nombre>" --confirmed
```

- Solo se eligen entradas con `usable: true`.
- No recorre todas las páginas sin pedirlo.
- Elegir una voz no genera audio ni cobra alta privada; la respuesta da el ID incorporado que se usa en `prepare`.
- La voz es de la biblioteca: **no es exclusiva** y otros usuarios pueden usarla.

## 6. Generar audio con la voz

```bash
AILAB info eleven-tts
AILAB prepare eleven-tts --version v4 --text "$(cat "$P/prompts_intermedios/generaciones/frase.txt")" --private_voice_id <id_ailab>
AILAB submit <manifest_id_real> --confirmed --output "$P/prompts_intermedios/generaciones/"
```

- **Voz privada propia:** `--private_voice_id <id_ailab>`. **Voz de biblioteca:** `--voice_id <id>`. Nunca los dos, y no se usa el ID privado como `voice_id`. La voz debe estar activa, vigente y ofrecer `tts:v4`.
- `--version` admite `flash`, `multi`, `v3` y `v4`. Con **v4**: hasta 10.000 caracteres; se pueden indicar `--stability` y `--similarity_boost` (0 a 1); **no se usan `--style` ni `--speed`**, el runtime los rechaza **[D]**. Si `info` no ofrece v4, no se fuerza.
- El precio es por caracteres de entrada y versión. `prepare` lo cotiza y no gasta.
- Un envío conserva su UUID: si falta el audio, se consulta con `status <task_id>`, sin generar otro.

### Guion con etiquetas

- Con **v3** y **v4** se pueden escribir **etiquetas de audio** entre corchetes. Se escriben **en inglés** y el diálogo se queda en su idioma. Ejemplos de dirección contenida: `[casual, conversational]`, `[relaxed, slightly breathy]`, `[slightly amused]`.
- **Se conserva el texto exacto**: solo se añaden etiquetas, pausas y puntuación. No se corrige ni se reescribe el guion sin permiso.
- **No se añaden por iniciativa propia** risas, suspiros, carraspeos, respiraciones ni otros efectos: se preguntan.
- **No se añaden etiquetas de acento por defecto.** El acento y la pronunciación dependen sobre todo de la voz. Una etiqueta de acento es un refuerzo experimental que solo se prueba si el usuario ha comunicado un problema de acento.
- v3 y v4 **no admiten** la pausa SSML `<break>`. Las pausas se hacen con puntuación y estructura.
- Un prompt muy corto (menos de unos 250 caracteres) puede dar resultados menos consistentes: más contexto o varias tomas.
- Las etiquetas son instrucciones generativas, no garantías: su efecto depende de la voz.

## 7. Qué no está disponible aquí

Según el contrato de v4 de AILAB, el **diálogo con varias voces**, Turbo y la conversación en directo no están activados. La skill **no** promete conversaciones entre varios personajes con ElevenLabs. Para dos voces en una misma toma, la vía documentada de Seed Audio es una referencia de audio por persona (ver `voz-seed-audio.md`).

## 8. Qué se guarda

En la sección 6 de `prompt.md`:
- La ruta (diseño, clonación o biblioteca), la referencia AILAB de la voz (no un token) y su vigencia y conservación.
- La descripción del diseño o el origen de la voz de biblioteca.
- El archivo de audio de muestra aprobado.
- Quién dio el permiso, si es un clon (sin copiar el documento).

El borrado de una voz es irreversible: solo con una orden explícita del usuario para esa voz exacta.

## 9. Control de calidad

- ¿Es diseño, clonación, biblioteca o TTS de un guion? No se confunden.
- El prompt de diseño lleva idioma y variante regional en la primera frase, y entre 20 y 1.000 caracteres.
- Sin palabras de efecto en el prompt de identidad.
- Clonación solo con audio y documento de autorización.
- Alta presupuestada y confirmada aparte de las muestras.
- v4 sin `--style` ni `--speed`.
- Etiquetas en inglés, texto intacto, sin reacciones ni acento añadidos.
