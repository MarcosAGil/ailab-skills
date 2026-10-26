# Instalar el plugin de AILAB en Claude Code y Codex

El plugin `ailab` (marketplace `ailendra-labs`) contiene únicamente la skill `ailab`. Es la misma
skill que se instalaba con `tools/install.mjs`, pero Claude Code y Codex la instalan, la guardan en su
caché y la actualizan con sus propios comandos.

**Qué se actualiza solo y qué no**

| Se actualiza solo (vive en el servidor de AILAB) | Se actualiza cuando tú lo ejecutas |
|---|---|
| Catálogo de modelos, precios, parámetros y límites | El plugin: instrucciones de `SKILL.md`, el arranque y el runtime incluido |
| El runtime de la CLI (release firmada, se comprueba como máximo cada seis horas) | |
| La guía de uso (`guide`) y la documentación de los asistentes | |

La CLI avisa cuando haga falta actualizar el plugin (arranque antiguo) o cuando haya dos
instalaciones de AILAB. No actives la actualización automática del plugin: así un cambio de las
instrucciones nunca llega a tu agente sin que lo decidas.

## Requisitos

- Node.js 18.17 o posterior (`node --version`).
- Claude Code y/o Codex instalados.
- Una cuenta de AILAB con acceso. El token se crea desde la web y se pega en tu terminal; nunca en el chat.

## 1. Retira la skill antigua (solo si la instalaste a mano)

No tengas `ailab` por las dos vías a la vez: el agente podría cargar la copia antigua.

macOS y Linux:

```bash
git clone https://github.com/MarcosAGil/ailab-skills.git
cd ailab-skills
node tools/migrate-to-plugin.mjs            # simulación: muestra lo que haría
node tools/migrate-to-plugin.mjs --apply    # mueve las skills a una copia de seguridad
```

Windows (PowerShell), mismo flujo desde la carpeta clonada:

```powershell
git clone https://github.com/MarcosAGil/ailab-skills.git
cd ailab-skills
node tools\migrate-to-plugin.mjs
node tools\migrate-to-plugin.mjs --apply
```

La herramienta mueve (no borra) `~/.claude/skills/ailab` y `~/.codex/skills/ailab` a
`ailab-skill-backup-AAAAMMDD-HHMMSS` en tu carpeta personal. Solo toca una carpeta si su `SKILL.md`
declara `name: ailab` y su `package.json` es el de la skill de AILAB; un enlace simbólico se deja
donde está. No toca `~/.config/ailab` ni `~/.config/ailendra`: tu sesión y tu estado se conservan.
Borra la copia de seguridad tú, cuando quieras.

## 2. Añade el marketplace e instala

### Claude Code

macOS, Linux y Windows (PowerShell) usan los mismos comandos:

```bash
claude plugin marketplace add MarcosAGil/ailab-skills
claude plugin install ailab@ailendra-labs
claude plugin list
```

Dentro de Claude Code también puedes usar `/plugin marketplace add MarcosAGil/ailab-skills` y
`/plugin install ailab@ailendra-labs`. Comprueba el resultado con `claude plugin details ailab`.

Si no tienes una clave SSH de GitHub configurada y el alta falla al clonar, fuerza HTTPS antes de añadir
el marketplace:

```bash
CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1 claude plugin marketplace add MarcosAGil/ailab-skills
```

En PowerShell: `$env:CLAUDE_CODE_PLUGIN_PREFER_HTTPS = "1"; claude plugin marketplace add MarcosAGil/ailab-skills`.

### Codex

```bash
codex plugin marketplace add MarcosAGil/ailab-skills
codex plugin add ailab@ailendra-labs
codex plugin list
```

## 3. Abre una sesión nueva

Las skills de un plugin se cargan al empezar la sesión. Cierra y abre Claude Code o Codex.

## 4. Inicia sesión y comprueba

El `login` y el `doctor` los ejecutas tú en tu terminal; el token se pega oculto y se guarda fuera de
cualquier proyecto. La forma más sencilla: pide a tu agente «dime el comando para iniciar sesión en
AILAB» y copia el comando con la ruta exacta que te da. Si prefieres localizarlo tú, la skill queda en
la caché del agente:

macOS y Linux:

```bash
# Claude Code
SKILL="$(ls -d ~/.claude/plugins/cache/ailendra-labs/ailab/*/skills/ailab | sort -V | tail -1)"
# Codex
SKILL="$(ls -d ~/.codex/plugins/cache/ailendra-labs/ailab/*/skills/ailab | sort -V | tail -1)"

node "$SKILL/scripts/ailab.mjs" login
node "$SKILL/scripts/ailab.mjs" doctor
```

Windows (PowerShell):

```powershell
# Claude Code (para Codex, sustituye .claude por .codex)
$skill = Get-ChildItem "$HOME\.claude\plugins\cache\ailendra-labs\ailab\*\skills\ailab" |
  Sort-Object { [version]$_.Parent.Parent.Name } | Select-Object -Last 1
node "$($skill.FullName)\scripts\ailab.mjs" login
node "$($skill.FullName)\scripts\ailab.mjs" doctor
```

`doctor` sin sesión no llama al servidor ni gasta: te pide hacer `login`. Con sesión comprueba
contrato, saldo, carpeta de salida, intentos abiertos y que el arranque esté al día.

Después, pide al agente algo como «Prepara una imagen con AILAB, muéstrame el coste y espera mi
confirmación antes de gastar». La skill no gasta créditos sin tu orden directa.

## Ajuste del sandbox de Codex

Codex ejecuta los comandos en un sandbox que puede bloquear la red y la escritura fuera del proyecto.
Si AILAB falla por eso, la CLI lo dice y muestra el ajuste exacto con tus rutas. Resumen: en
`~/.codex/config.toml`

```toml
[sandbox_workspace_write]
network_access = true
writable_roots = ["/Users/tu-usuario/.config/ailab", "/Users/tu-usuario/Downloads/AILAB"]
```

(En Windows, usa rutas con comillas simples: `'C:\Users\tu-usuario\.config\ailab'`.) Para una sola
sesión: `codex --add-dir ~/.config/ailab --add-dir ~/Downloads/AILAB -c sandbox_workspace_write.network_access=true`.
Reinicia Codex tras cambiar el archivo. El token se guarda en `~/.config/ailendra` y el agente solo
necesita leerlo; el `login` hazlo siempre en tu terminal, fuera del sandbox. AILAB nunca guarda el
token dentro del proyecto.

## Actualizar el plugin a mano

Mira la versión instalada con `claude plugin list` o `codex plugin list`.

Claude Code (reinicia la sesión al terminar):

```bash
claude plugin marketplace update ailendra-labs
claude plugin update ailab@ailendra-labs
```

Sin el primer comando, Claude Code responde que ya estás en la última versión: necesita refrescar el
marketplace antes. Dentro de Claude Code: `/plugin marketplace update ailendra-labs`.

Codex (abre una sesión nueva al terminar):

```bash
codex plugin marketplace upgrade ailendra-labs
```

Una versión nueva solo llega si cambia `version` en el plugin. La CLI de AILAB te lo recuerda cuando el
arranque instalado es más antiguo que el mínimo que exige el runtime.

## Desinstalar

```bash
claude plugin uninstall ailab@ailendra-labs
claude plugin marketplace remove ailendra-labs
codex plugin remove ailab@ailendra-labs
codex plugin marketplace remove ailendra-labs
```

No se toca `~/.config/ailab`: si vuelves a instalar, conservas la sesión. Para cerrar sesión de verdad,
ejecuta `logout` y revoca el dispositivo desde tu cuenta de AILAB.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| «AILAB está instalada dos veces» | Ejecuta `node tools/migrate-to-plugin.mjs --apply` (paso 1). |
| «Actualiza el plugin de AILAB» | Sigue «Actualizar el plugin a mano». Mientras tanto la CLI sigue funcionando. |
| El agente no ve la skill | Abre una sesión nueva y comprueba `claude plugin list` / `codex plugin list`. |
| «El sandbox de Codex impide que AILAB funcione» | Aplica el ajuste de la sección del sandbox. |
| `guide` no existe | El runtime es anterior a 2.3.13: `node <ruta>/scripts/ailab.mjs update --confirmed`. |
| No hay sesión | `login` en tu terminal (paso 4). |
