# Guía de instalación y uso: Refinar prompt

## Para qué sirve

Revisa un prompt de vídeo ya escrito con sus referencias. Analiza siete ejes:
cámara, enfoque, estética y luz, actuación, acción, sincronía y referencias.
Señala problemas citando el texto y conserva historia, diálogos e intención.
No crea prompts desde cero, no monta vídeos ni genera contenido en proveedores.

## Instalación

Desde el repositorio oficial `MarcosAGil/ailab-skills`:

```bash
node tools/install.mjs refinar-prompt --target codex
```

Para Claude Code, sustituye `codex` por `claude`. El instalador necesita Node.js
18.17 o posterior, pero la skill no tiene runtime, ejecutables ni dependencias
obligatorias. En instalación manual extrae el ZIP y coloca `refinar-prompt` en
`~/.codex/skills/` o `~/.claude/skills/`, con `SKILL.md` directamente dentro y
la carpeta `references` intacta. Abre una conversación nueva e invoca
`$refinar-prompt`. No basta con descargar el ZIP. No requiere cuenta de AILAB,
token, créditos ni API key. El agente utiliza tu propio plan de uso.

## Qué aportar

Prompt completo, referencias ordenadas y su papel, audio o transcripción si hay,
vídeo guía si hay, fallos observados y modelo, duración y proporción si están
decididos. Si faltan datos, puede preguntar. No debe fingir analizar archivos
inaccesibles. FFmpeg y FFprobe son opcionales para medir materiales localmente;
sin ellos solicita duración y tiempos. Un transcriptor externo de pago necesita
autorización independiente.

## Modos y salida

- Completo: informe, preguntas sobre problemas relevantes y prompt refinado.
- Diagnóstico: solo informe, sin reescribir. Ejemplo: «¿Cómo ves este prompt?».
- Rápido: decide huecos creativos y declara supuestos. No inventa transcripciones
  ni tiempos medidos. Ejemplo: «Decide tú, sin preguntas».

El resultado refinado es un bloque de texto, proporción y duración aparte y los
supuestos materiales. Su perfil editorial predeterminado es Seedance 2.5; puede
adaptarse a otros modelos sin imponer su estética. La sintaxis de ejemplo no
es una obligación API. Consultar límites vigentes de la modalidad antes de generar.
Usar esta skill no autoriza ejecutar AILAB, subir archivos ni gastar créditos.

## Mantenimiento y problemas

Actualizar el repositorio con `git pull --ff-only` y repetir el instalador,
sin sobrescribir cambios personales sin revisarlos. Para ZIP, sustituir por el
nuevo paquete conservando primero las modificaciones propias. Si el agente no
la detecta, revisar la ruta, el nombre `SKILL.md`, las referencias y abrir una
sesión nueva. Si falta audio, proporcionar archivo o transcripción con tiempos.
No garantiza resultados perfectos de un modelo generativo.

Los manuales detallados y el ejemplo completo se descargan en el ZIP. El
asistente del marketplace orienta sobre esta guía y el SKILL.md; no ejecuta
la auditoría ni descarga o analiza los archivos del usuario.
