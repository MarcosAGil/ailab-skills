<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# personaje-consistente

> **Skill oficial de la comunidad de Ailendra Labs.** Funciona para cualquier caso de uso de vídeo con IA, y funciona mucho mejor con AILAB: su formato de salida y sus comprobaciones están calibrados para Seedance 2.5 en AILAB, donde además puedes generar con la skill `ailab`. Es autocontenida: todo lo que necesita está dentro de su carpeta.

Skill para crear un personaje con IA y mantener su aspecto, su voz y su forma de actuar entre vídeos. Versión 0.1, borrador de prueba.

> **EN:** Creates and maintains a consistent AI character across videos. It builds a local folder per character (a `prompt.md` sheet plus approved references), generates reference sheets (face with expressions, full body, outfits, product and relative-size sketch) and a voice reference through AILAB, and recovers them for new scenes. It does not generate video or scripts and never publishes. Instructions are in Spanish; it answers in the user's language.

## Qué hace

1. Redacta la **ficha** del personaje (`prompt.md`): aspecto, altura, personalidad, gestos, forma de moverse y de sonreír, y cómo suena.
2. Genera con AILAB las **hojas de referencia**: rostro con expresiones, cuerpo entero, outfits y, si el personaje interactúa con un objeto, hoja del producto y boceto de tamaño relativo. Todas con GPT Image 2.5 a 16:9.
3. Crea una **voz de referencia**: con Seed Audio (la recomendada) o con ElevenLabs (diseñada, clonada con autorización o de la biblioteca), con el idioma y el acento que pidas.
4. **Recupera** la ficha y los materiales cuando preparas una escena nueva, con un bloque listo para pegar en tu prompt.

Se detiene al final de cada fase y espera tu aprobación antes de gastar créditos en la siguiente.

## Qué no hace

No genera vídeo ni guion y no publica. No crea ni clona personas reales sin permiso.

## Qué necesita

- La skill `ailab` y una cuenta de AILAB con créditos, para generar de forma automática. Sin ella, funciona en modo solo prompts: te escribe los prompts y los ajustes y tú generas en otra plataforma.
- Opcional: `ffmpeg` y `ffprobe`, para medir y recortar audio.

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

- "Crea un personaje: una mujer de 30 años, pelo rizado oscuro..." y la skill completa la ficha preguntando.
- "Crea un personaje a partir de estas fotos" (de una persona que ha dado permiso).
- "Añade un outfit nuevo a Lucía" con la foto del outfit.
- "Dame la voz de Lucía en español de México".
- "Actualiza la ficha de Lucía: ahora lleva el pelo corto".
- "Usa a Lucía en esta escena: ..." para obtener el bloque listo para tu prompt de vídeo.

## Contenido

```text
personaje-consistente/
├── SKILL.md                      flujo, reglas, operaciones
├── README.md                     este archivo
├── plantillas/
│   └── prompt-ficha.md           plantilla de la ficha del personaje
└── references/
    ├── flujo-crear.md            fases, carpeta, comandos, actualizar
    ├── prompts-imagen.md         prompts de las hojas y comprobaciones
    ├── voz-seed-audio.md         voz con Seed Audio
    ├── voz-elevenlabs.md         voces de ElevenLabs
    ├── acentos.md                cómo pedir distintos acentos
    ├── usar-en-escena.md         recuperar el personaje para una escena
    └── ailab.md                  conexión con AILAB, gasto y errores
```

## Notas

- Las reglas llevan un nivel de confianza: **[D]** documentado, **[H]** heurística razonada, **[?]** hipótesis a validar generando. La consistencia de voz entre generaciones y los acentos son [?] hasta que los pruebes.
- Los precios y los parámetros de los modelos salen siempre de `prepare` e `info` de AILAB y mandan sobre cualquier cifra de estos archivos.
- Las instrucciones están en español. La skill responde en el idioma del usuario.
