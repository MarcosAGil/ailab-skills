# Instalar AILAB y las skills de la comunidad con tu agente

La forma más sencilla de instalarlo todo es pedírselo a tu propio agente. Copia el prompt que
necesites, pégalo en una conversación nueva de **Claude Code** o **Codex** y sigue lo que te diga.
El agente ejecuta los comandos y te pide permiso antes de tocar nada que ya tengas.

Necesitas **Node.js 18.17 o posterior**. Para las skills de la comunidad, también **Git**.

Nunca pegues tu token de AILAB en el chat: el agente te dará el comando de `login` para que lo
ejecutes tú en tu terminal y lo escribas allí, oculto.

## 1. Plugin oficial de AILAB

Copia y pega este prompt:

```text
Instala el plugin oficial de AILAB (Ailendra Labs) en este agente y déjalo listo. Sigue estos pasos en orden:

1. Comprueba que tengo Node.js 18.17 o posterior con `node --version`. Si no lo tengo, explícame cómo instalarlo y para aquí.
2. Detecta si eres Claude Code o Codex e instala el plugin:
   - Claude Code: `claude plugin marketplace add MarcosAGil/ailab-skills` y después `claude plugin install ailab@ailendra-labs`.
   - Codex: `codex plugin marketplace add MarcosAGil/ailab-skills` y después `codex plugin add ailab@ailendra-labs`.
   Si un comando falla por permisos o por falta de red, no insistas: dame los dos comandos para que los ejecute yo en mi terminal.
3. Si existe una instalación manual antigua de AILAB (`~/.claude/skills/ailab` o `~/.codex/skills/ailab`), avísame y no la borres sin mi permiso: no debe convivir con el plugin.
4. Solo en Codex: revisa `~/.codex/config.toml`. Si en `[sandbox_workspace_write]` no están `network_access = true` y `writable_roots` con mis carpetas `~/.config/ailab` y `~/Downloads/AILAB`, enséñame el bloque exacto con mis rutas y pregúntame antes de cambiarlo.
5. Dame el comando exacto de `login` de AILAB, con la ruta donde ha quedado instalado el plugin, para que lo ejecute yo en mi terminal. No me pidas el token en el chat.
6. Cuando te diga que he iniciado sesión, ejecuta `doctor` y dime si todo está correcto.
7. Termina recordándome que abra una sesión nueva para que el agente cargue AILAB.
```

El token se crea en tu cuenta de AILAB (sección de tokens para agentes). Después, pide por ejemplo:
«Prepara una imagen con AILAB, enséñame el coste y espera mi confirmación».

## 2. Skills de prompting y creación

Copia y pega este prompt. Si solo quieres algunas, borra de la lista las que no necesites:

```text
Instala estas skills oficiales de la comunidad de Ailendra Labs en este agente: estilo-espontaneo-viral, estilo-amateur-ccd, estilo-ugc, refinar-prompt y personaje-consistente.

1. Comprueba que tengo Git y Node.js 18.17 o posterior. Si falta algo, explícame cómo instalarlo y para aquí.
2. Si no existe, clona https://github.com/MarcosAGil/ailab-skills.git en `~/ailab-skills`. Si ya existe, entra y ejecuta `git pull --ff-only`; si tiene cambios locales, para y avísame.
3. Desde esa carpeta, ejecuta `node tools/install.mjs estilo-espontaneo-viral estilo-amateur-ccd estilo-ugc refinar-prompt personaje-consistente --target claude` si eres Claude Code, o con `--target codex` si eres Codex.
4. personaje-consistente genera con AILAB: si no tengo el plugin de AILAB instalado, avísame (funciona igual en modo solo prompts).
5. Dime qué se ha instalado y recuérdame abrir una sesión nueva.
```

| Skill | Para qué sirve |
|---|---|
| `estilo-espontaneo-viral` | Escena cotidiana que parece grabada a mano con el móvil, en Seedance 2.5. |
| `estilo-amateur-ccd` | Lleva un prompt a la estética de compacta digital CCD de los 2000. |
| `estilo-ugc` | Audita y refina prompts UGC para que parezcan grabados con un móvil. |
| `refinar-prompt` | Auditoría crítica de un prompt de Seedance 2.5 con sus referencias. |
| `personaje-consistente` | Personaje de IA consistente entre vídeos: ficha, hojas de referencia y voz. |

¿Quieres también **Ver vídeo** (`vervideo`), que analiza un vídeo existente: estética, guion, planos,
sonido y montaje? Añade `vervideo` a la lista del prompt. Necesita Python 3.9, FFmpeg, FFprobe y
yt-dlp, y tu propia clave de OpenRouter, que configuras tú en `~/.config/openrouter/.env` (nunca en el
chat). Se cobra en tu cuenta de OpenRouter, no en los créditos de AILAB.

Las skills de prompting no consumen créditos de AILAB. `personaje-consistente` usa tus créditos
solo cuando generas hojas o voces con AILAB y pide tu aprobación antes de cada fase.

## Actualizar

- **Plugin de AILAB:** los modelos y los precios llegan solos. Para recibir una versión nueva del
  plugin: `claude plugin marketplace update ailendra-labs` y `claude plugin update ailab@ailendra-labs`
  (Codex: `codex plugin marketplace upgrade ailendra-labs`). Abre una sesión nueva al terminar.
- **Skills de la comunidad:** en `~/ailab-skills`, `git pull --ff-only` y repite el comando de
  instalación del paso 3.

La guía detallada del plugin (Windows, sandbox de Codex, migración y desinstalación) está en
[instalacion-plugin.md](instalacion-plugin.md).
