<p align="center">
  <img src="plugins/ailab/assets/ailab-logo.png" alt="AILAB" width="120">
</p>

# AILAB Skills

Repositorio público oficial de AILAB para Claude Code y Codex: el plugin de AILAB y las skills de
prompting y creación de la comunidad de Ailendra Labs.

> **Beta técnica:** disponible para cuentas de AILAB que tengan habilitado el
> acceso beta. Catálogo, asistentes y actualizaciones se sirven desde AILAB y el
> servidor sigue siendo la autoridad de acceso, saldo y cobro.

Las skills son clientes públicos. Descargar este repositorio no concede acceso a
AILAB, créditos ni credenciales de proveedores. Cada miembro utiliza su propia
cuenta y un token de dispositivo personal y revocable creado desde AILAB.

## Instálalo con tu agente (lo más fácil)

Copia el prompt de [`docs/instalar-con-tu-agente.md`](docs/instalar-con-tu-agente.md), pégalo en una
conversación nueva de Claude Code o Codex y sigue sus pasos. Hay uno para el plugin de AILAB y otro
para las skills de la comunidad.

## Plugin de AILAB

El plugin `ailab` instala la skill `ailab` en Claude Code y en Codex sin copiar carpetas a
mano. Modelos, precios y mejoras llegan solos desde AILAB; el plugin solo cambia cuando tú lo
actualizas.

Claude Code:

```bash
claude plugin marketplace add MarcosAGil/ailab-skills
claude plugin install ailab@ailendra-labs
```

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
| `ailab` | Beta (plugin) | Playground, modelos generativos y asistentes de AILAB. |
| `estilo-espontaneo-viral` | Estable | Prompts de Seedance 2.5 con estética espontánea grabada a mano. |
| `estilo-amateur-ccd` | Estable | Prompts de Seedance 2.5 con estética de compacta CCD de los 2000. |
| `estilo-ugc` | Estable | Auditor de realismo para prompts de vídeo UGC grabados con móvil. |
| `refinar-prompt` | Estable | Auditoría crítica de prompts de Seedance 2.5 y sus referencias. |
| `personaje-consistente` | Beta | Personaje de IA consistente: ficha, hojas de referencia y voz con AILAB. |
| `vervideo` | Beta | Análisis completo o editorial de vídeos locales y URLs públicas, con tu clave de OpenRouter. |

Las cinco skills de la comunidad son autocontenidas y sirven con cualquier plataforma que use
Seedance 2.5; con AILAB rinden mejor. Solo `personaje-consistente` genera (con tus créditos y tu
aprobación en cada fase).

El índice legible por máquinas está en [`registry.json`](registry.json). Cada skill
es independiente y vive dentro de `skills/<id>/`.

La sección **Skills y automatización** de [AILAB](https://ailendra.com/ailab/skills.html)
utiliza [`marketplace.json`](marketplace.json) para sus fichas y la documentación de
su asistente de instalación. Las versiones proceden de `registry.json`; el despliegue
de AILAB publica una copia validada junto a los ZIP, sin depender de GitHub al abrir
la página. Al publicar una skill nueva, actualiza ambos catálogos y sincroniza AILAB.

## Cambios relevantes

- 2.3.15: precios exactos de Seedance 2.5 Normal y Lite, 10 vídeos y 10 audios de referencia en ambos; Seedance 2.5, 2.0 y Mini miden los vídeos de referencia y presupuestan (salida + entrada) con la tarifa con vídeo; Editar vídeo cobra 2 x segundos del clip. Kling 2.6 y 3.0 Motion Control cobran por el vídeo medido, no por `--duration`.
- 2.3.14: Genjutsu Light (`higgsfield-genjutsu-light`); Higgsfield termina las tareas `nsfw` y `rejected` con su motivo, y un 429 o 5xx al consultar espera con retroceso.
- 2.3.13: `guide` devuelve la guía de uso vigente; Seed Audio reserva 100 cr y cobra la duración
  real (0,625 cr/s, nunca más de 100 cr); el arranque avisa de plugin antiguo, doble instalación y
  sandbox de Codex; nuevos Kling 4.0 (referencias, sujetos, voces y fotogramas clave) y Seedance 2.5 Lite; `info` muestra la tarifa vigente de hoy (una promoción solo mientras esté activa, con su fecha de fin) y los precios se auditan contra el servidor. Las versiones anteriores están en el historial de Git.

Una fuente nueva requiere empaquetado, publicación firmada y verificación del catálogo servido: no
acredita por sí sola disponibilidad en producción.

## Requisitos

- Node.js 18.17 o posterior.
- Para `ailab`: una cuenta de AILAB habilitada y créditos para las operaciones de pago.
- Para `vervideo`: Python 3.9 o posterior, FFmpeg, FFprobe y yt-dlp, y una API key propia de OpenRouter
  en `~/.config/openrouter/.env` (permisos `600`; nunca dentro de la skill ni en el chat).
- Para instalar las skills de la comunidad desde el repositorio: Git. `estilo-ugc` usa Python 3 para
  sus scripts de comprobación (opcional); `personaje-consistente`, FFmpeg y FFprobe (opcional).

## Instalación manual de las skills

Clona este repositorio y ejecuta el instalador desde su raíz:

```bash
git clone https://github.com/MarcosAGil/ailab-skills.git
cd ailab-skills
node tools/install.mjs estilo-ugc refinar-prompt --target claude   # ~/.claude/skills/
node tools/install.mjs --all --target codex                         # todas, en ~/.codex/skills/
```

También puedes extraer el ZIP de cada skill (página Skills de AILAB) en la carpeta `skills` de tu
agente, con `SKILL.md` directamente dentro. No instales `ailab` por las dos vías a la vez: si ya la
tienes como skill manual, retírala con `node tools/migrate-to-plugin.mjs` (simulación) y `--apply`.

El instalador valida el registro, rechaza enlaces simbólicos y realiza una copia atómica. Ejecuta el
autodiagnóstico de las skills ejecutables; en las de solo instrucciones valida archivos y referencias
sin ejecutar comandos de la skill.

## Primer uso

Invoca la skill por su nombre (`$ailab`, `$estilo-ugc`…) o deja que el agente la descubra. Para
AILAB, la primera vez ejecuta personalmente en tu terminal `login` y `doctor` (el agente te da el
comando con la ruta exacta del plugin). Nunca pegues el token en un chat: `login` lo pide de forma
oculta y lo guarda fuera del repositorio con permisos restringidos.

## Actualizaciones

Los modelos, parámetros, precios finales y asistentes se obtienen desde AILAB. El
runtime comprueba releases firmadas y conserva la última versión válida si una
actualización falla. No necesitas hacer `git pull` cada vez que se añade un modelo.

Los cambios en las instrucciones de uso de `SKILL.md` requieren actualizar el plugin
(`claude plugin marketplace update ailendra-labs` y `claude plugin update ailab@ailendra-labs`;
en Codex, `codex plugin marketplace upgrade ailendra-labs`) o volver a ejecutar el instalador de
la skill manual. La sesión y la configuración personal viven fuera de la carpeta de la skill y se
conservan. La guía de uso vigente, siempre al día, la devuelve `guide`.

Las skills de la comunidad se actualizan con `git pull --ff-only` y el instalador. Una skill nueva se
publica como una carpeta adicional y una entrada nueva en `registry.json` y `marketplace.json`.

## Seguridad

Consulta [`SECURITY.md`](SECURITY.md). No abras una incidencia que contenga tokens,
datos de cuenta, URLs firmadas, prompts privados o información personal.

## Estado de la beta

La infraestructura y los contratos automatizados no equivalen a una verificación
real de todos los proveedores. Los modelos disponibles y su estado operativo se
controlan desde el servidor de AILAB.

## Licencia

Este repositorio se publica bajo la [licencia MIT](LICENSE).
