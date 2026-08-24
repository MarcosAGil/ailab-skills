# AILAB Skills

Repositorio público oficial de las skills de AILAB para Claude Code y Codex.

> **Beta técnica:** el código está publicado para revisión, pero la distribución a
> miembros permanece pausada hasta que los endpoints de catálogo, asistentes y
> actualizaciones de AILAB estén activos y verificados en producción.

Las skills son clientes públicos. Descargar este repositorio no concede acceso a
AILAB, créditos ni credenciales de proveedores. Cada miembro utiliza su propia
cuenta y un token de dispositivo personal y revocable creado desde AILAB.

## Skills disponibles

| Skill | Estado | Descripción |
|---|---|---|
| `ailab` | Beta | Playground, modelos generativos y asistentes de AILAB. |

El índice legible por máquinas está en [`registry.json`](registry.json). Cada skill
es independiente y vive dentro de `skills/<id>/`.

## Requisitos

- Node.js 18.17 o posterior.
- Una cuenta de AILAB habilitada.
- Créditos en la cuenta para las operaciones de pago.

## Instalación

Clona o descarga este repositorio y ejecuta los comandos desde su raíz:

```bash
git clone https://github.com/MarcosAGil/ailab-skills.git
cd ailab-skills
```

Para Claude Code:

```bash
node tools/install.mjs ailab --target claude
```

Para Codex:

```bash
node tools/install.mjs ailab --target codex
```

Para instalar todas las skills disponibles:

```bash
node tools/install.mjs --all --target claude
```

El instalador valida el registro, rechaza enlaces simbólicos, realiza una copia
atómica y ejecuta el autodiagnóstico de la skill antes de conservarla.

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

## Actualizaciones

Los modelos, parámetros, precios finales y asistentes se obtienen desde AILAB. El
runtime comprueba releases firmadas y conserva la última versión válida si una
actualización falla. No necesitas hacer `git pull` cada vez que se añade un modelo.

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
