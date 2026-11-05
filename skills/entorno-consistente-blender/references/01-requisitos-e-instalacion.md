# 01 · Requisitos e instalación

Lo primero de todo, antes de tocar nada: `bash <skill>/scripts/comprobar_entorno.sh`. Dice qué está bien, qué falta y el comando exacto para instalarlo. No instala nada ni gasta créditos.

## Dependencias

| Dependencia | Versión validada | Mínimo | Para qué | Cómo se instala |
|---|---|---|---|---|
| Claude (pestaña Code) con Opus | Opus 5.5 | modelo con MCP | Orquesta todo, maneja Blender y escribe los scripts | https://claude.ai/download |
| Blender | 5.2.3 LTS | 4.2 | Escena 3D, cámaras y renders | `brew install --cask blender` o https://www.blender.org/download/ |
| uv / uvx | 0.11.16 | cualquiera reciente | Lanza el servidor MCP de Blender | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `mcp-for-blender` (PyPI) | 2.2.6 | 2.x | Servidor MCP que conecta Claude con Blender | Se lanza con `uvx`, no se instala aparte. Web: https://mcp-for-blender.com |
| Addon "Blender MCP" | 1.8 · protocolo 15 | el que pida el servidor | Escucha dentro de Blender en `127.0.0.1:9876` | `uvx mcp-for-blender install-addon` |
| Python 3 + Pillow | 3.14.6 + 12.3.0 | 3.9 + 10 | Recortes, máscaras, parches, controles, hojas | `python3 -m pip install --user Pillow` |
| Node.js | 26.11.1 | 18 | CLI de AILAB | `brew install node` |
| Skill AILAB (Ailendra Labs) | 2.3.14 | 2.3.9 (Nano Banana 2.1) | Generación con Nano Banana 2.1 e Image Prompter | Plugin `ailab` de la comunidad Ailendra Labs |
| Cuenta AILAB con créditos | · | · | Pagar las generaciones | El usuario hace `login` en su terminal |
| ffmpeg (opcional) | 9.0.2 | 4 | GIFs para documentación y clases | `brew install ffmpeg` |
| three.js (en la plantilla) | r128 (cdnjs) + OrbitControls `three@0.128.0` | · | Visor 3D web | Ya va enlazado en `assets/visor-template.html` |

Sistema validado: macOS en Apple Silicon. En Windows o Linux cambian la ruta de Blender, `open -a Blender` y la carpeta de addons; el resto es igual.

## Instalación desde cero (en este orden)

1. Blender: `brew install --cask blender`. Ábrelo una vez y ciérralo.
2. uv: `curl -LsSf https://astral.sh/uv/install.sh | sh` y abre una terminal nueva.
3. Addon: `uvx mcp-for-blender install-addon`.
4. En Blender: Preferencias > Add-ons > activar "Interface: Blender MCP" > Start MCP Server. Debe quedar escuchando en `127.0.0.1:9876`.
   - Si sale `No module named 'blender_mcp'`: el archivo del addon tiene que llamarse `blender_mcp.py` dentro de `~/Library/Application Support/Blender/<versión>/scripts/addons/`. Renómbralo y actívalo de nuevo. Claude puede hacerlo con Python dentro de Blender: `addon_utils.modules_refresh()`, `addon_utils.enable("blender_mcp")`, `bpy.ops.wm.save_userpref()`.
5. Registrar el MCP en Claude Code (el nombre va ANTES de los `-e`; si no, falla con "Invalid environment variable format"):
   ```bash
   claude mcp add blender -s user -e DISABLE_TELEMETRY=true -e BLENDER_MCP_DISABLE_TELEMETRY=true -- uvx mcp-for-blender
   ```
   Reinicia la sesión de Claude Code: aparecen las herramientas `mcp__blender__*`.
6. Pillow: `python3 -m pip install --user Pillow`.
7. Node: `brew install node`.
8. AILAB: instala el plugin `ailab` de Ailendra Labs. Después, **el usuario** ejecuta en su propia terminal (nunca se pide ni se pega un token en el chat):
   ```bash
   node ~/.claude/plugins/cache/ailendra-labs/ailab/<versión>/skills/ailab/scripts/ailab.mjs login
   node ~/.claude/plugins/cache/ailendra-labs/ailab/<versión>/skills/ailab/scripts/ailab.mjs doctor
   ```
9. Vuelve a ejecutar `comprobar_entorno.sh` hasta que salga "Todo listo".

## Comprobaciones dentro de la sesión

- `mcp__blender__get_addon_status`: versión de Blender y `up_to_date: true`.
- "Could not connect to Blender": Blender está cerrado. Ábrelo tú (`open -a Blender "<archivo.blend>"`) y espera a que el puerto 9876 responda (`nc -z 127.0.0.1 9876` en bucle de 1 s, máximo 30 s). No le pidas al usuario que lo abra.
- No hay herramientas `mcp__blender__*`: el MCP no está registrado o la sesión empezó antes de registrarlo. Hay que reiniciar la sesión.
- AILAB: `node <ailab>/scripts/ailab.mjs guide` devuelve la guía vigente de la CLI (comandos, asistentes). Ejecútalo si dudas de una sintaxis: la CLI se actualiza sola.

## Reglas al ejecutar código en Blender

- Busca los nodos por tipo, no por nombre (pueden estar traducidos): `next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")`.
- El color del render va en los nodos; `material.diffuse_color` es el del viewport y el del visor web. Pon los dos.
- Carga tus funciones en cada llamada (`exec(open(...).read())`): el espacio de nombres no siempre persiste.
- Las llamadas largas (muchos renders) se cortan por tiempo: divide en tandas.
- Antes de cualquier cambio grande, guarda una versión nueva (`versiones/<espacio>-vN.blend` o `save_as_mainfile` a `-vN+1`). Nunca sobrescribas la versión que ya generó imágenes aprobadas.
