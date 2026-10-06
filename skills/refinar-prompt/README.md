# refinar-prompt

Skill para refinar prompts de vídeo con IA. Versión 1.0.

> **EN:** An auditor and refiner for AI video prompts (default target: Seedance 2.5 on AILAB). Give it a finished prompt plus its references; it finds gaps in acting, camera, focus, aesthetics, action and audio sync, asks the right questions, and returns a tightened prompt. It does not impose a style. Instructions are in Spanish; it answers in the user's language.

## Qué hace

Coge un prompt de vídeo que ya tienes y lo audita como lo haría un prompter experto, en siete ejes: **dinámica de cámara, enfoque, estética y luz, movimiento y actuación de los personajes, acción, sincronía con el audio, y referencias y formato**. Te dice qué falta o se contradice (citando tu propio texto), te hace las preguntas que necesita y, cuando todo está cerrado, te devuelve el prompt refinado, listo para pegar.

Tres modos:

- **Completo** (por defecto): informe, preguntas en rondas y prompt final.
- **Diagnóstico:** "¿cómo ves este prompt?". Solo el informe, sin reescribir.
- **Rápido:** "decide tú". No pregunta; asume y lista lo asumido.

No crea prompts desde cero, no edita vídeos ya generados y no impone ninguna estética: respeta la de tu prompt y solo exige que exista, sea coherente y esté escrita sin ambigüedad.

## Qué necesita de ti

Al usarla, pásale todo junto:

1. El prompt ya escrito.
2. Todas las referencias, en orden, y qué aporta cada una.
3. El audio (archivo o transcripción) y el vídeo guía, si los hay.
4. Los fallos que hayas visto al generar, si los hay.
5. Modelo, duración y ratio, si ya los tienes decididos.

## Instalación

**Claude Code**

Copia la carpeta `refinar-prompt` a tu carpeta de skills:

```bash
mkdir -p ~/.claude/skills
cp -R refinar-prompt ~/.claude/skills/
```

Para un solo proyecto, cópiala a `<proyecto>/.claude/skills/`. Reinicia la sesión y pídele, por ejemplo: "refina este prompt de vídeo", o invócala con `/refinar-prompt`.

**Claude (aplicación web o de escritorio)**

Sube `refinar-prompt.zip` en la sección de Skills de los ajustes de la aplicación. El zip contiene la carpeta con `SKILL.md` en su raíz.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega el contenido de `SKILL.md` como instrucciones y deja que lea los archivos de `references/` cuando los necesite.

## Requisitos

Ninguno obligatorio. Es una skill de texto.

Opcional, para medir audio y vídeo guía automáticamente cuando el agente tiene terminal: `ffmpeg` y `ffprobe`, y un transcriptor con tiempos por palabra (por ejemplo `whisper`). Si no están, la skill te pedirá la duración, la transcripción y los tiempos aproximados. Nunca inventa tiempos.

## Ejemplos de uso

- "Refina este prompt" y pegas el prompt con sus referencias.
- "¿Cómo ves este prompt?" para un diagnóstico sin reescribir.
- "Decide tú, no me hagas preguntas" para el modo rápido.
- "Generé esto y la cámara hace zoom en vez de acercarse" para corregir un fallo concreto.

## Contenido

```text
refinar-prompt/
├── SKILL.md                           flujo de trabajo, modos y reglas
├── README.md                          este archivo
└── references/
    ├── catalogo-auditoria.md          siete ejes, matriz de cámara, tabla de tiempos
    ├── direccion-actuacion-camara.md  cómo se escribe la dirección
    ├── formato-salida.md              sintaxis y plantilla (Seedance 2.5) y otros modelos
    └── ejemplo-completo.md            un ciclo completo y un banco de preguntas
```

## Notas

- El perfil de salida por defecto es Seedance 2.5 tal como se usa en AILAB (encabezados entre corchetes, diálogo entre llaves, efectos entre `< >`, handles `@Image1`). Para otros modelos usa el perfil genérico descrito en `references/formato-salida.md`.
- Las instrucciones están en español. La skill responde siempre en el idioma del usuario.
