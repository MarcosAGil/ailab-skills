<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# estilo-ugc

> **Skill oficial de la comunidad de Ailendra Labs.** Funciona para cualquier caso de uso de vídeo con IA, y funciona mucho mejor con AILAB: su formato de salida y sus comprobaciones están calibrados para Seedance 2.5 en AILAB, donde además puedes generar con la skill `ailab`. Es autocontenida: todo lo que necesita está dentro de su carpeta.

Skill para dar realismo a prompts de vídeo UGC con IA. Versión 1.0.

> **EN:** An auditor and refiner for AI UGC video prompts (default target: Seedance 2.5). Give it a finished prompt or a loose brief plus references; it finds what would make the clip look fake (visible phone, wrong camera shake, empty set, unmotivated light changes, bad focus, ad-like acting), asks the right questions, and returns a tightened prompt in English. It does not write scripts or CTAs. Instructions are in Spanish; it answers in the user's language.

## Qué hace

Coge un prompt de vídeo UGC (o un brief suelto) y lo audita como un prompter experto en realismo, en diez ejes: **coherencia de escena, dispositivo y montaje de cámara, vibración, enfoque, luz y exposición, entorno y atrezo, persona y actuación, acción y producto, sonido y sincronía, y señales de IA, referencias y formato**. Te dice qué falta o se contradice (citando tu texto), te hace las preguntas que necesita y te devuelve el prompt refinado, listo para pegar, en inglés.

La idea central: el vídeo se tiene que ver **grabado con un móvil por una persona real**, así que el móvil **nunca aparece** (ni él, ni su reflejo, ni su pantalla), y cada cosa que se ve (el lugar, los objetos, la luz, el temblor, el enfoque, el sonido) está decidida y tiene una causa.

Tres modos:

- **Completo** (por defecto): informe, preguntas en rondas y prompt final.
- **Diagnóstico:** "¿cómo ves este prompt?". Solo el informe.
- **Rápido:** "decide tú". No pregunta; asume y lista lo asumido.

## Valores por defecto

Formatos incluidos: selfie en casa, caminando, producto en manos, móvil apoyado, coche, alguien graba, **ponencia desde el público**, **trípode**, **entrevista en la calle**, **Q&A** y **podcast** (cámara fija, varios ángulos, mirada al interlocutor). Por defecto: 9:16, **una sola toma**, cortes duros solo si los pides (sin transiciones), imperfección **natural**, castellano de España y el móvil siempre invisible.

## Lo que no hace

No escribe guion, ganchos, llamadas a la acción ni estructura de anuncio. Si le pasas tu texto, lo respeta literal. No genera imágenes ni vídeos: recibe un prompt (o brief) y referencias y devuelve un prompt.

## Qué necesita de ti

1. Tu prompt ya escrito, o un brief suelto con lo que quieres ver.
2. Las referencias, en orden, y qué aporta cada una.
3. **El audio.** Te recomienda generar la voz con **Seed Audio** y pasarla como referencia: así puede medir las pausas y sincronizar todo con mucha más calidad.
4. Los fallos que hayas visto al generar, si los hay.
5. Si ya lo tienes decidido: duración, ratio, número de tomas y nivel de imperfección (limpio, natural o crudo).

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R estilo-ugc ~/.claude/skills/
```

Reinicia la sesión y pídele "refina este prompt UGC", o invócala con `/estilo-ugc`. Para un solo proyecto, cópiala a `<proyecto>/.claude/skills/`.

**Claude (aplicación web o de escritorio)**

Sube `estilo-ugc.zip` en la sección de Skills de los ajustes de la aplicación. El zip contiene la carpeta con `SKILL.md` en su raíz.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega el contenido de `SKILL.md` como instrucciones y deja que lea los archivos de `references/` cuando los necesite.

## Requisitos

Ninguno obligatorio. Con **Python 3** (solo biblioteca estándar), la skill ejecuta `scripts/medir_audio.py` y `scripts/lint_prompt.py`, que atrapan por sí solos errores mecánicos (huecos de plantilla, límites de tramo sobre palabras, acciones del aparato...). Opcional, para medir audio y vídeo guía cuando el agente tiene terminal: `ffmpeg` y `ffprobe`, y un transcriptor con tiempos por palabra (por ejemplo `whisper`). Si no están, la skill te pide la duración, la transcripción y los tiempos. Nunca los inventa.

## Cómo se usa

- "Refina este prompt UGC" y pegas el prompt con sus referencias.
- "Tengo esta idea: una chica enseña una botella en su casa" y la skill completa la ficha preguntando.
- "¿Cómo ves este prompt?" para un diagnóstico sin reescribir.
- "Decide tú, no me hagas preguntas" para el modo rápido.
- "Generé esto y se ve el móvil en el reflejo" para corregir un fallo concreto. La skill lo propone para el registro de fallos.

## Contenido

```text
estilo-ugc/
├── SKILL.md                              flujo, valores por defecto, regla del móvil
├── README.md                             este archivo
├── scripts/
│   ├── medir_audio.py                    mide un audio (silencios, voz, cola, palabras)
│   └── lint_prompt.py                    comprobación mecánica del prompt final
├── evals/                                casos de prueba con defectos reales
└── references/
    ├── catalogo-auditoria-ugc.md         diez ejes con IDs y gravedad
    ├── formatos-ugc.md                   once formatos (ponencia, trípode, entrevista, Q&A, podcast...)
    ├── errores-conocidos.md              autopsia de los fallos: causa raíz y defensa
    ├── gestos-y-guion.md                 plan de movimiento: gestos que acompañan al guion
    ├── montajes-y-camara.md              montajes, vibración, enfoque, dial, movimientos de riesgo
    ├── luz.md                            luz y exposición con causa y ritmo
    ├── entornos.md                       inventarios de decorado por capas
    ├── actuacion-y-producto.md           mirada, energía, producto, acciones de riesgo
    ├── sonido-y-audio.md                 micrófono de móvil, Seed Audio, sincronía
    ├── formato-salida.md                 sintaxis y plantilla (Seedance 2.5) y otros modelos
    ├── ejemplo-completo.md               un ciclo completo y un banco de preguntas
    └── registro-de-fallos.md             registro vivo y hipótesis por validar
```

## Notas

- Las reglas de las referencias llevan un nivel de confianza: **[D]** regla dura, **[H]** heurística razonada y **[?]** hipótesis a validar. Casi todo lo específico de un modelo es una hipótesis hasta que lo compruebes generando.
- El perfil de salida por defecto es Seedance 2.5 (encabezados entre corchetes, diálogo entre llaves, efectos entre `< >`, handles `@Image1`). Para otros modelos usa el perfil genérico de `references/formato-salida.md`.
- Las instrucciones están en español. La skill responde siempre en el idioma del usuario.
