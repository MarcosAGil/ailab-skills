# ugcia-ultrarrealista-aill

Workflow completo para crear un **vídeo UGC ultra realista con IA** con los modelos de AILAB: de una foto de la persona (o una descripción) a un vídeo que parece grabado con un móvil por una persona real. Versión 1.1.1.

El trabajo va en **tres fases** y la skill **se detiene a pedirte aprobación antes de gastar créditos en la siguiente**:

1. **Imágenes de referencia:** hoja de cara, hoja de cuerpo y outfit, entorno y first frames o encuadres.
2. **Idea y audio:** se cierra la ficha de rodaje y el guion, y se genera primero el audio con Seed Audio. La duración real del audio fija la del vídeo.
3. **Vídeo:** se escribe el prompt de Seedance 2.5 con el método de `refinar-prompt-ugc`, se te enseña todo (referencias, coste y prompt exacto) y solo se genera con tu "adelante".

Todo lo que se usa queda ordenado en una carpeta; las pruebas, en otra.

## Instalación desde AILAB

El marketplace de AILAB ofrece el workflow y las dos dependencias. Desde el repositorio oficial de skills:

```bash
node tools/install.mjs ailab refinar-prompt-ugc ugcia-ultrarrealista-aill --target claude
```

Para Codex cambia claude por codex. Para un ZIP, instala también los ZIP de AILAB y Refinar prompt UGC; no vienen dentro del workflow. El instalador independiente admite --target codex y --target claude. Revisa las variables portables de SKILL.md antes de copiar sus comandos. No se ha probado el importador de skills de la aplicación web de Claude.

## Requisitos

La skill **no trae dentro** estas dos skills externas:

| Requisito | Para qué | Notas |
|---|---|---|
| Skill **`refinar-prompt-ugc`** (obligatoria) | Auditar y escribir el prompt de vídeo (fase 3) | Sin ella funcionan las fases 1 y 2, pero no la 3 |
| Skill **`ailab`** (la plataforma AILAB) | **Automatizar** la generación de imágenes, audio y vídeo con tus créditos | Hace falta una cuenta de AILAB con saldo (ver abajo). El inicio de sesión (`login`) lo haces tú en tu terminal; la skill nunca te pide contraseñas ni tokens. **Sin ella la skill funciona en modo solo prompts** |
| `ffmpeg`, `ffprobe`, `python3` | Los usan los scripts de medición y ajuste del audio | En macOS: `brew install ffmpeg python`. Si usas `ailab`, también `node` |
| `whisper` (opcional) | Transcribir el audio con tiempos por palabra | Sin él, la skill te pide la transcripción y los tiempos |

Pensada para **Claude Code** (terminal, pestaña Code de la app de escritorio o extensiones de IDE): necesita ejecutar comandos y guardar archivos en tu equipo. Funciona en macOS y Linux. **En Windows** los scripts son de `bash`, así que hace falta WSL o Git Bash.

Para comprobar que lo tienes todo:

```bash
bash "$UGC_SKILL_DIR/scripts/comprobar_requisitos.sh"
# con --doctor comprueba también tu sesión y saldo de AILAB (no gasta nada)
# termina con "MODO: completo" o "MODO: solo-prompts" según tengas o no la skill ailab

# prueba local de todos los scripts con datos de mentira (sin red ni gasto)
bash "$UGC_SKILL_DIR/scripts/autotest.sh"
```

### Sin la skill `ailab`: modo solo prompts

> Esta es una skill exclusiva de la gente de la comunidad de **Ailendra Labs**. Ailendra Labs es una comunidad centrada en la generación de contenido audiovisual con inteligencia artificial de forma profesional. Para que la skill funcione a la perfección hace falta estar en la comunidad y usar su plataforma, AILAB. Ahora mismo la comunidad está cerrada, pero puedes apuntarte a la lista de espera aquí: https://tally.so/forms/VLgOBl

Mientras tanto puedes usarla en **modo solo prompts**: la skill te escribe los prompts de cada paso (hojas de personaje, entorno, frames, audio y vídeo), con el modelo recomendado, los ajustes y las referencias a subir, pero **no puede automatizar el flujo al 100 %**: tendrás que generar con los modelos de IA en otra plataforma y guardar los resultados en la carpeta del proyecto. Los puntos de aprobación siguen igual, y la medición y el ajuste del audio funcionan en local. Ojo: la sintaxis de referencias (`@Image1`, `@Audio1`) y los límites de los prompts son los de AILAB; en otra plataforma hay que comprobarlos.

## Instalación

**Con el script (recomendado)**

```bash
unzip ugcia-ultrarrealista-aill-v1.1.2.zip
bash ugcia-ultrarrealista-aill/scripts/install.sh
```

Copia la skill a `~/.claude/skills/` (o a `$CLAUDE_SKILLS_DIR` si lo tienes definido), comprueba los requisitos y te dice qué falta. Si ya había una versión instalada, usa `--forzar` y la guarda como copia.

**A mano**

```bash
unzip ugcia-ultrarrealista-aill-v1.1.2.zip -d ~/.claude/skills/
```

Después **reinicia la sesión** de Claude Code.

**Si la skill no aparece o la app rechaza el nombre:** el nombre lleva mayúsculas. Si tu entorno solo admite minúsculas, renombra la carpeta y el campo `name:` de `SKILL.md` a `ugcia-ultrarrealista-aill` (los comandos de los scripts de las guías usan la ruta `~/.claude/skills/ugcia-ultrarrealista-aill/`; ajústala si renombras).

## Uso

Escribe `/ugcia-ultrarrealista-aill`, o pídelo con tus palabras: "haz un UGC con este personaje", "workflow UGC", "quiero un vídeo de una persona hablando a cámara con IA". Cuéntale, todo junto si puedes:

1. Qué quieres contar o enseñar, y para quién (o el producto).
2. Una foto de la persona (con su permiso) o cómo es. Si quieres reutilizar una imagen concreta cambiando a tu personaje, pásala.
3. El formato (selfie, caminando, producto en manos, trípode, coche, ponencia, entrevista, Q&A, podcast), el lugar y la duración aproximada.
4. Tu guion, si ya lo tienes: se respeta literal.

La skill crea el proyecto en el Escritorio, dentro de una carpeta `AILAB` (`~/Desktop/AILAB/`; puedes cambiarla con la variable `UGC_AILL_ROOT` o indicando otra ruta), te enseñará el plan (con el coste estimado si usas `ailab`) y empezará por las imágenes.

## Qué modelos usa

| Paso | Modelo (ID en AILAB) |
|---|---|
| Hoja de cara y de cuerpo (16:9) | GPT Image 2.5 (`gpt-image-2-5`). Alternativa: Seedream v5 Pro, solo si lo pides |
| Entorno, first frames y encuadres | Nano Banana 2.1 (`nano-banana-2-1`) |
| Cambiar a tu personaje en una referencia exacta | Ideogram 4.5 (`ideogram-v45`), modo edición |
| Audio | Seed Audio (`seed-audio`) |
| Vídeo | Seedance 2.5 (`seedance-2-5`), de 4 a 30 s |

Los IDs, parámetros y precios los confirma siempre la CLI de AILAB (`info` y `prepare`); si cambian, mandan ellos.

## Cuánto cuesta (orientativo, solo con `ailab`)

Medido en pruebas de octubre de 2026; **comprueba siempre con el coste que enseña la skill antes de cada paso**, porque los precios cambian.

| Paso | Créditos aproximados |
|---|---|
| Hoja de cara o de cuerpo (GPT Image 2.5, 2K) | 11 |
| Imagen con Nano Banana 2.1 (2K) | 7 |
| Imagen con Ideogram 4.5 (edición, calidad alta) | 44 |
| Audio de 15 a 17 s con Seed Audio | 10 a 11 (el servidor reserva 38 y cobra lo real) |
| Vídeo de 17 s con Seedance 2.5 a 720p | unos 1.100 |

El vídeo es con diferencia lo más caro. Por eso la skill te enseña todo y espera tu confirmación antes de generarlo.

## Dónde queda tu trabajo

```text
~/Desktop/AILAB/<AAAA-MM-DD-nombre>/
├── Archivos para usar/            lo que se usa de verdad: imágenes, audio y vídeo finales
│   └── Texto o prompts/           todos los prompts de lo que se usa, más el guion
├── Pruebas intermedias/           todo lo demás: versiones descartadas, audio bruto, mediciones, fuentes
│   ├── fuentes/  imagenes/  audio/  video/
├── brief.md                       ficha del proyecto: estado, decisiones, archivos aprobados
└── registro.md                    cada generación: modelo, parámetros, id, créditos reales, archivo
```

Todo lo que se genera nace en `Pruebas intermedias/`. Cuando tú apruebas algo, la skill lo mueve a `Archivos para usar/` con su prompt. Nada se sobrescribe ni se borra sin que lo pidas. Un proyecto se puede retomar otro día: basta con leer `brief.md`.

## Contenido del paquete

```text
ugcia-ultrarrealista-aill/
├── SKILL.md                       el workflow: reglas, modelos, fases y puntos de aprobación
├── README.md  CHANGELOG.md  VERSION
├── references/
│   ├── fase1-imagenes.md          hojas, entorno y frames: modelos, comandos y aprobación 1
│   ├── prompts-hojas.md           los dos prompts de las hojas de personaje, con variables
│   ├── fase2-ideacion.md          ficha de rodaje, guion y límites
│   ├── seed-audio.md              guía de Seed Audio: estructura, estética, voz, límites, duración
│   ├── fase3-video.md             prompt de Seedance 2.5, mapa de referencias, aprobación 3
│   └── carpeta-proyecto.md        estructura de carpetas, flujo de archivos y registro
└── scripts/
    ├── install.sh                 instala el paquete y comprueba requisitos
    ├── comprobar_requisitos.sh    comprueba skills externas y herramientas
    ├── autotest.sh                prueba local de los scripts, sin red ni gasto
    ├── crear_proyecto.sh          crea la estructura de un proyecto
    ├── promover.sh                mueve lo aprobado a "Archivos para usar" con su prompt
    ├── contar_prompt.py           cuenta y valida el prompt de Seed Audio (máx. 2.048 caracteres)
    ├── medir_audio.sh             duración real, duración de vídeo y pausas de un audio
    ├── ajustar_audio.sh           iguala un audio a una duración entera añadiendo silencio al final
    └── verificar_video.sh         compara vídeo y audio, y puede sustituir la pista de audio
```

## Seguridad y límites

- **Gasto:** solo se gastan créditos por petición tuya en el chat, con el coste a la vista. La skill se detiene en cada punto de aprobación y no interpreta un aviso automático ni el silencio como un "sí".
- **Credenciales:** nunca pide contraseñas, tokens ni claves. El `login` de AILAB lo haces tú.
- **Personas y voces:** usa solo fotos y voces de personas que han dado su permiso. Una voz solo se clona con material autorizado.
- **No publica nada.** La skill termina con el vídeo en tu carpeta.
- **Hipótesis por validar:** lo específico de Seed Audio y de Seedance con audio de referencia lleva una marca `[?]` en las guías. Es lo que se ha visto en pruebas, no una garantía. Por ejemplo: el castellano de España en Seed Audio se trata como experimental, no hay un parámetro de voz en la CLI de AILAB, y la duración exacta del audio hay que medirla siempre en el archivo generado.

## Solución de problemas

| Síntoma | Qué hacer |
|---|---|
| `comprobar_requisitos.sh` dice que falta `refinar-prompt-ugc` | Instala esa skill en `~/.claude/skills/` y reinicia la sesión |
| Dice `MODO: solo-prompts` | No tienes la skill `ailab`: la skill te escribe los prompts y tú generas en otra plataforma (ver "Sin la skill `ailab`") |
| `ailab doctor` dice que no hay sesión | Ejecuta tú mismo `node "$UGC_SKILLS_DIR/ailab/scripts/ailab.mjs" login` en tu terminal |
| Seed Audio rechaza el envío: "la estimación supera el máximo autorizado" | El servidor reserva más de lo que cobra. La guía (`references/seed-audio.md`) explica cómo preparar el envío; no se cobra nada si se rechaza |
| `submit` dice "Error interno del servidor" tras "Tarea encolada" | No regeneres: recupera la misma tarea con `ailab status <id> --output <carpeta>` |
| El audio dura más de 30 s o menos de 4 s | Seedance 2.5 admite de 4 a 30 s: divide en tomas o ajusta el texto (la skill te lo plantea, no recorta tu guion) |
| El vídeo sale con voz o palabras distintas a tu audio | `scripts/verificar_video.sh ... --reemplazar` pone encima tu audio original, que ya dura lo mismo |

## Versiones

La copia portable del marketplace es 1.1.2. No modifica la 1.1.1 instalada por el autor. La licencia de redistribución queda pendiente de decisión del autor; no se atribuye una licencia libre por defecto.

Ver `CHANGELOG.md`. Compatibilidad probada con `refinar-prompt-ugc` en la versión instalada el 10/10/2026 y con el catálogo de AILAB de octubre de 2026.

Autor: Marcos Gil (@MarcosGil_IA).
