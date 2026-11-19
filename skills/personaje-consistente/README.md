<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# personaje-consistente

Skill para crear un personaje con IA y mantener su aspecto, su voz y su forma de actuar entre vídeos. Versión 0.6, probada con un personaje completo.

> **EN:** Creates and maintains a consistent AI character across videos. It builds one folder per character, named after it, with a `LEEME.md` that is both its profile and a usage guide for whoever writes or reviews scene prompts, generates reference sheets with Seedream 5.5 (3x3 face sheet, one three-panel sheet per outfit, product and scale sheets per object), a pangram voice reference at a measured loudness, a black-frame voice video in whole seconds and, optionally, a two-panel reference clip made with Seedance 2.5. A second method takes a scene's video prompt, already written elsewhere, and builds its full sound layer with Seed Audio, cloning the character's voice from the pangram, as a black video in whole seconds to be used as the exact audio track. It does not write scripts or scene video prompts for any model and never publishes. Instructions are in Spanish; it answers in the user's language.

## Qué hace

1. Crea la **carpeta del personaje** con su nombre en tu ruta de trabajo y redacta su **ficha** en `LEEME.md`: aspecto, altura, personalidad, gestos y voz.
2. Genera con AILAB y **Seedream 5.5** las **hojas de referencia**: rostro 3x3 con expresiones, una hoja de 3 paneles por outfit (frente sin cabeza, espalda y primer plano) y, por cada objeto, hoja de producto y hoja de escala.
3. Crea la **voz de referencia** con un **pangrama** (ElevenLabs v4 con etiquetas, o Seed Audio), la deja a −24 LUFS y en segundos exactos, y monta el **vídeo negro** con esa voz.
4. Opcionalmente, prepara el **clip de referencia** de dos paneles para Seedance 2.5. No hace falta: las hojas y el vídeo negro ya sirven como referencias, pero el clip puede mejorar los resultados.
5. **Método 2, Seed Audio en vídeo:** cuando otro sistema ya ha escrito el prompt de vídeo de una escena, escribe el prompt de Seed Audio con toda su capa sonora, lo genera adjuntando el pangrama para clonar la voz y lo monta en un vídeo negro de segundos enteros. Ese sistema lo mete después en su prompt como pista exacta.
6. Deja en la carpeta del personaje un **`LEEME.md`**: la guía para quien escriba o revise el prompt de una escena (tu agente de prompts de vídeo, una skill de refinado o una persona). Dice qué referencias hay, qué aporta cada una, qué no se hereda y cómo funciona cada método de voz. No es un prompt ni está escrito para un modelo concreto.

Se detiene al final de cada pieza y espera tu aprobación.

## Qué no hace

No escribe guiones ni prompts de vídeo de escenas, para ningún modelo, y no publica. No crea ni clona personas reales sin permiso.

## Qué necesita

- La skill `ailab` y una cuenta de AILAB con créditos, para generar de forma automática. Sin ella, funciona en modo solo prompts: te escribe los prompts y los ajustes y tú generas en otra plataforma.
- `ffmpeg` y `ffprobe`: para recortar fotos, medir y ajustar el volumen, montar el vídeo negro y revisar imágenes y vídeos.

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R personaje-consistente ~/.claude/skills/
```

Reinicia la sesión y pídele "crea un personaje consistente", o invócala con `/personaje-consistente`.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega el contenido de `SKILL.md` como instrucciones y deja que lea `references/` cuando lo necesite.

## Cómo se usa

- "Crea un personaje a partir de esta foto" (de una persona que ha dado permiso).
- "Añade un outfit nuevo a Lucía" con la foto del outfit.
- "Hazle la hoja de escala a Lucía con su libreta".
- "Dame la voz de Lucía en español de España" y después "genera el vídeo negro".
- "Prepárame el clip de referencia de Lucía".
- "Usa a Lucía en esta escena: ...".
- "Hazme la pista de Seed Audio de esta escena" con el prompt de vídeo ya escrito.

## Carpeta de cada personaje

```text
<ruta de trabajo>/<Nombre>/
├── LEEME.md                       ficha + guía de uso
├── Video1_clip-<outfit>.mp4       clip de referencia (opcional)
├── Escala_<objeto>.png            una por objeto
├── hojas-y-voz/                   Image1_cara-3x3 · Image2_<outfit>_3paneles · Video1_voz-pangrama · Audio1_voz-pangrama
└── backup/                        fuentes · prompts · descartes · registro.md (nunca se adjunta)
```

Al entrar se ve lo que se usa. Para escribir o revisar el prompt de una escena, basta con pasar la carpeta y decir que se lea primero `LEEME.md`.

## Contenido

```text
personaje-consistente/
├── SKILL.md
├── README.md
├── plantillas/
│   └── LEEME-personaje.md
├── references/
│   ├── flujo-crear.md
│   ├── prompts-imagen.md
│   ├── voz-pangrama.md
│   ├── voz-elevenlabs.md
│   ├── voz-seed-audio.md
│   ├── acentos.md
│   ├── volumen-y-video-negro.md
│   ├── clip-referencia.md
│   ├── usar-en-escena.md
│   ├── seed-audio-en-video.md
│   ├── ejemplo-luis.md
│   └── ailab.md
└── ejemplos/
    └── Luis/                   personaje de ejemplo con la estructura real de carpeta
```

## Notas

- Las reglas llevan un nivel de confianza: **[D]** documentado, **[C]** comprobado en el ejemplo, **[H]** heurística razonada, **[?]** hipótesis a validar generando. La consistencia de voz entre generaciones y los acentos son [?] hasta que los pruebes.
- Los precios y los parámetros de los modelos salen siempre de `prepare` e `info` de AILAB y mandan sobre cualquier cifra de estos archivos.
- Las instrucciones están en español. La skill responde en el idioma del usuario.
