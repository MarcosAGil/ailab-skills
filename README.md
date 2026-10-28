<p align="center">
  <img src="plugins/ailab/assets/ailab-logo.png" alt="AILAB" width="120">
</p>

# AILAB Skills

Repositorio público oficial de las skills de AILAB para Claude Code y Codex.

> **Beta técnica:** disponible para cuentas de AILAB que tengan habilitado el
> acceso beta. Catálogo, asistentes y actualizaciones se sirven desde AILAB y el
> servidor sigue siendo la autoridad de acceso, saldo y cobro.

Las skills son clientes públicos. Descargar este repositorio no concede acceso a
AILAB, créditos ni credenciales de proveedores. Cada miembro utiliza su propia
cuenta y un token de dispositivo personal y revocable creado desde AILAB.

## Plugin de AILAB (recomendado)

El plugin `ailab` instala la skill `ailab` en Claude Code y en Codex sin copiar carpetas a
mano. Modelos, precios y mejoras llegan solos desde AILAB; el plugin solo cambia cuando tú lo
actualizas.

Claude Code:

```bash
claude plugin marketplace add MarcosAGil/ailab-skills
claude plugin install ailab@ailendra-labs
```

(En Claude Code 2.1.275 o posterior también sirve `/plugin install ailab --marketplace MarcosAGil/ailab-skills`.)

Codex:

```bash
codex plugin marketplace add MarcosAGil/ailab-skills
codex plugin add ailab@ailendra-labs
```

Abre una sesión nueva, ejecuta `login` y `doctor` en tu terminal y pide al agente que prepare
algo con AILAB. La guía completa (macOS, Linux, Windows, sandbox de Codex, actualización y
migración desde la skill manual) está en [`docs/instalacion-plugin.md`](docs/instalacion-plugin.md).

## Skills disponibles


| Skill | Estado | Descripción |
|---|---|---|
| `ailab` | Beta | Playground, modelos generativos y asistentes de AILAB. |
| `vervideo` | Beta | Análisis completo o editorial de vídeos locales y URLs públicas. |
| `refinar-prompt` | Beta | Auditoría y refinado de prompts de vídeo. Solo instrucciones, sin generaciones ni claves. |
| `refinar-actuacion-camara` | Beta | Método personal portable de Marcos, sin imponer estética. |
| `refinar-prompt-ugc` | Beta | Realismo UGC, once formatos, medición de audio y lint local. |
| `ugc-bajo-coste-ailab` | Beta | Guion y referencias → Gemini Omni → ambiente SAM y voz ElevenLabs, con pistas separadas. Requiere `ailab`. |
| `ugcia-ultrarrealista-aill` | Beta | Workflow por fases con imágenes, Seed Audio y Seedance 2.5. Requiere `refinar-prompt-ugc`; `ailab` para automatizar. |

El índice legible por máquinas está en [`registry.json`](registry.json). Cada skill
es independiente y vive dentro de `skills/<id>/`.

La sección **Skills y automatización** de [AILAB](https://ailendra.com/ailab/skills.html)
utiliza [`marketplace.json`](marketplace.json) para sus fichas y la documentación de
su asistente de instalación. Las versiones proceden de `registry.json`; el despliegue
de AILAB publica una copia validada junto a los ZIP, sin depender de GitHub al abrir
la página. Al publicar una skill nueva, actualiza ambos catálogos y sincroniza AILAB.

## Cambios relevantes

- 2.3.14: Genjutsu Light (`higgsfield-genjutsu-light`); Higgsfield termina las tareas `nsfw` y `rejected` con su motivo, y un 429 o 5xx al consultar espera con retroceso.
- 2.3.13: `guide` devuelve la guía de uso vigente; Seed Audio reserva 100 cr y cobra la duración
  real (0,625 cr/s, nunca más de 100 cr); el arranque avisa de plugin antiguo, doble instalación y
  sandbox de Codex; nuevos Kling 4.0 (referencias, sujetos, voces y fotogramas clave) y Seedance 2.5 Lite; `info` muestra la tarifa vigente de hoy (una promoción solo mientras esté activa, con su fecha de fin) y los precios se auditan contra el servidor. Las versiones anteriores están en el historial de Git.

Una fuente nueva requiere empaquetado, publicación firmada y verificación del catálogo servido: no
acredita por sí sola disponibilidad en producción.

## Requisitos

- Node.js 18.17 o posterior.
- Para `ugcia-ultrarrealista-aill`: Bash, Python 3.9+, FFmpeg y FFprobe; en Windows, WSL o Git Bash. Su autotest no llama a proveedores ni consume créditos.
- Para `ailab`: una cuenta de AILAB habilitada y créditos para las operaciones de pago.
- Para `vervideo`: Python 3.9 o posterior, una API key propia de OpenRouter y
  `ffmpeg`, `ffprobe` y `yt-dlp` para procesar vídeo, audio y URLs públicas.
- Para `ugc-bajo-coste-ailab`: la skill `ailab` instalada y configurada (runtime 2.2.4 o posterior), además de `ffmpeg`
  y `ffprobe`. Utiliza la cuenta y créditos de AILAB, sin claves adicionales.

## Instalación manual (alternativa al plugin)

Para el resto de skills, o si prefieres no usar el plugin, clona o descarga este repositorio y ejecuta
los comandos desde su raíz:

```bash
git clone https://github.com/MarcosAGil/ailab-skills.git
cd ailab-skills
node tools/install.mjs ailab --target claude     # ~/.claude/skills/ailab
node tools/install.mjs ailab --target codex      # ~/.codex/skills/ailab
node tools/install.mjs --all --target claude     # todas las skills
node tools/install.mjs vervideo --target claude  # solo el analizador de vídeo
```

No instales `ailab` por las dos vías a la vez. Si ya la tienes como skill manual, retírala con
`node tools/migrate-to-plugin.mjs` (simulación) y `--apply` (la mueve a una copia de seguridad).

El instalador valida el registro, rechaza enlaces simbólicos y realiza una copia atómica. Ejecuta el
autodiagnóstico de las skills ejecutables; en las de solo instrucciones valida archivos y referencias
sin ejecutar comandos de la skill.

- `refinar-prompt` (Codex o Claude Code): invoca `$refinar-prompt` con un prompt ya escrito y sus
  referencias. No requiere AILAB ni consume sus créditos.
- `ugc-bajo-coste-ailab` junto a su dependencia: `node tools/install.mjs ailab ugc-bajo-coste-ailab
  --target codex`. Invoca `$ugc-bajo-coste-ailab` con guion, formato, referencias visuales y dirección.
  Prepara un plan único (Video Prompter, Gemini Omni Flash 1.1, SAM Audio, Voice Isolator y Voice
  Changer) y entrega el vídeo original, ambiente y voz separados, sin montaje ni upscale. Cristina es
  la voz predeterminada, resuelta desde el catálogo. Su autodiagnóstico comprueba el helper, no la
  disponibilidad de la cuenta, los proveedores ni los binarios de vídeo.

## Primer uso

El agente puede descubrir la skill automáticamente. También puedes invocarla como
`$ailab`. La primera vez, ejecuta personalmente en tu terminal:

```bash
node ~/.claude/skills/ailab/scripts/ailab.mjs login
node ~/.claude/skills/ailab/scripts/ailab.mjs doctor
```

En Codex, sustituye `~/.claude/skills/` por `~/.codex/skills/`.

Nunca pegues el token en un chat. El comando `login` lo solicita de forma oculta y
lo guarda fuera del repositorio con permisos restringidos.

Para `vervideo`, configura personalmente `OPENROUTER_API_KEY` en
`~/.config/openrouter/.env` con permisos `600`. La clave no se guarda dentro de
la skill ni se incluye en sus paquetes.

`vervideo` ofrece dos modos: `completo` envía el vídeo entero a Gemini para un
análisis narrativo exhaustivo; `mini` extrae escenas, examina el hook y genera
un informe editorial con transcripción y métricas de montaje.

## Actualizaciones

Los modelos, parámetros, precios finales y asistentes se obtienen desde AILAB. El
runtime comprueba releases firmadas y conserva la última versión válida si una
actualización falla. No necesitas hacer `git pull` cada vez que se añade un modelo.

Los cambios en las instrucciones de uso de `SKILL.md` requieren actualizar el plugin
(`claude plugin marketplace update ailendra-labs` y `claude plugin update ailab@ailendra-labs`;
en Codex, `codex plugin marketplace upgrade ailendra-labs`) o volver a ejecutar el instalador de
la skill manual. La sesión y la configuración personal viven fuera de la carpeta de la skill y se
conservan. La guía de uso vigente, siempre al día, la devuelve `guide`.

Una nueva skill sí se publica como una carpeta adicional y una entrada nueva en
`registry.json`.

## Seguridad

Consulta [`SECURITY.md`](SECURITY.md). No abras una incidencia que contenga tokens,
datos de cuenta, URLs firmadas, prompts privados o información personal.

## Estado de la beta

La infraestructura y los contratos automatizados no equivalen a una verificación
real de todos los proveedores. Los modelos disponibles y su estado operativo se
controlan desde el servidor de AILAB.

## Licencia

Este repositorio se publica bajo la [licencia MIT](LICENSE).
