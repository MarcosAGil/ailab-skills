#!/bin/bash
# Comprueba TODO lo que necesita la skill antes de empezar y dice cómo instalar lo que falte.
# No instala nada ni gasta créditos. Uso: bash comprobar_entorno.sh
# Salida: una línea por dependencia (OK / AVISO / FALTA) y, al final, los comandos de instalación pendientes.
set -u
FALTAN=(); AVISOS=0
ok()    { printf "  OK     %-26s %s\n" "$1" "$2"; }
aviso() { printf "  AVISO  %-26s %s\n" "$1" "$2"; AVISOS=$((AVISOS+1)); }
falta() { printf "  FALTA  %-26s %s\n" "$1" "$2"; FALTAN+=("$3"); }
ver_ge() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" = "$2" ]; }   # ver_ge actual minima

echo "Entorno consistente con Blender + IA · comprobación de dependencias"
echo

# 1. Sistema
OS=$(uname -s); ARCH=$(uname -m)
[ "$OS" = "Darwin" ] && ok "Sistema" "macOS $(sw_vers -productVersion 2>/dev/null) ($ARCH)" || aviso "Sistema" "$OS: la skill se validó en macOS; las rutas de Blender y los comandos open/brew cambian"

# 2. Blender
BL=""
for c in blender /Applications/Blender.app/Contents/MacOS/Blender; do command -v "$c" >/dev/null 2>&1 && { BL="$c"; break; }; [ -x "$c" ] && { BL="$c"; break; }; done
if [ -n "$BL" ]; then
  V=$("$BL" --version 2>/dev/null | head -1 | awk '{print $2}')
  ver_ge "$V" "4.2" && ok "Blender" "$V ($BL)" || aviso "Blender" "$V: se recomienda 4.2 o superior (validado en 5.2.3)"
else
  falta "Blender" "no encontrado" "brew install --cask blender    # o descarga en https://www.blender.org/download/"
fi

# 3. uv / uvx (lanza el servidor MCP de Blender)
if command -v uvx >/dev/null 2>&1 || [ -x "$HOME/.local/bin/uvx" ]; then
  U=$( (command -v uvx || echo "$HOME/.local/bin/uvx") | head -1); ok "uv / uvx" "$("$U" --version 2>/dev/null | awk '{print $2}') ($U)"
else
  falta "uv / uvx" "no encontrado" "curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# 4. Servidor MCP de Blender registrado en Claude Code
MCP_OK=0
command -v claude >/dev/null 2>&1 && claude mcp get blender >/dev/null 2>&1 && MCP_OK=1
# Si el comando claude no está disponible en el terminal, se mira la configuración de usuario directamente
[ $MCP_OK -eq 0 ] && [ -f "$HOME/.claude.json" ] && python3 -c "import json,sys; d=json.load(open('$HOME/.claude.json')); sys.exit(0 if 'blender' in d.get('mcpServers',{}) or any('blender' in p.get('mcpServers',{}) for p in d.get('projects',{}).values()) else 1)" 2>/dev/null && MCP_OK=1
if [ $MCP_OK -eq 1 ]; then ok "MCP blender" "registrado en Claude Code (en la sesión: herramientas mcp__blender__*)"
else falta "MCP blender" "no registrado" "claude mcp add blender -s user -e DISABLE_TELEMETRY=true -e BLENDER_MCP_DISABLE_TELEMETRY=true -- uvx mcp-for-blender   # y reinicia la sesión"; fi

# 5. Addon de Blender escuchando en el puerto 9876 (Blender abierto + Start MCP Server)
if nc -z 127.0.0.1 9876 >/dev/null 2>&1; then ok "Addon Blender MCP" "escuchando en 127.0.0.1:9876"
else aviso "Addon Blender MCP" "no responde: abre Blender (open -a Blender). Si sigue sin responder: uvx mcp-for-blender install-addon y activa 'Blender MCP' en Preferencias > Add-ons > Start MCP Server"; fi

# 6. Python 3 + Pillow
if command -v python3 >/dev/null 2>&1; then
  ok "Python" "$(python3 --version 2>&1 | awk '{print $2}')"
  P=$(python3 -c "import PIL; print(PIL.__version__)" 2>/dev/null)
  [ -n "$P" ] && ok "Pillow" "$P" || falta "Pillow" "no instalado" "python3 -m pip install --user Pillow"
else
  falta "Python 3" "no encontrado" "brew install python"
fi

# 7. Node.js (CLI de AILAB)
if command -v node >/dev/null 2>&1; then
  N=$(node --version | tr -d v); ver_ge "$N" "18" && ok "Node.js" "$N" || falta "Node.js" "$N (se necesita 18 o superior)" "brew install node"
else
  falta "Node.js" "no encontrado" "brew install node"
fi

# 8. Skill AILAB (Ailendra Labs) + sesión
A=$(ls -d "$HOME"/.claude/plugins/cache/ailendra-labs/ailab/*/skills/ailab 2>/dev/null | sort -V | tail -1)
if [ -n "$A" ]; then
  ok "Skill AILAB" "$(basename "$(dirname "$(dirname "$A")")") ($A)"
  if command -v node >/dev/null 2>&1; then
    if node "$A/scripts/ailab.mjs" balance >/tmp/ailab_balance.$$ 2>&1; then ok "Sesión AILAB" "$(tail -1 /tmp/ailab_balance.$$)"
    else aviso "Sesión AILAB" "sin sesión: el usuario ejecuta en SU terminal: node $A/scripts/ailab.mjs login"; fi
    rm -f /tmp/ailab_balance.$$
  fi
else
  falta "Skill AILAB" "no instalada" "instala el plugin 'ailab' de Ailendra Labs (comunidad Ailendra Labs en Skool) y ejecuta login"
fi

# 9. Opcionales
command -v ffmpeg >/dev/null 2>&1 && ok "ffmpeg (opcional)" "$(ffmpeg -version | head -1 | awk '{print $3}') · GIFs de la documentación" || aviso "ffmpeg (opcional)" "sin ffmpeg no se generan GIFs: brew install ffmpeg"
command -v rsvg-convert >/dev/null 2>&1 && ok "rsvg-convert (opcional)" "logo SVG a PNG" || aviso "rsvg-convert (opcional)" "no hace falta: el logo ya va en PNG en assets/"

echo
if [ ${#FALTAN[@]} -eq 0 ]; then
  echo "Todo listo$( [ $AVISOS -gt 0 ] && echo " ($AVISOS avisos: revísalos arriba)")."
  exit 0
fi
echo "Falta instalar (${#FALTAN[@]}):"
for c in "${FALTAN[@]}"; do echo "  $c"; done
exit 1
