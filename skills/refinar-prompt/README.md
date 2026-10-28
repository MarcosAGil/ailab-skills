<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# Refinar prompt (auditoría crítica de Seedance 2.5)

**Skill oficial de la comunidad de Ailendra Labs.** Versión 1.0.0.

Audita con ojo crítico un prompt estructurado de Seedance 2.5 con todas sus referencias: ambigüedades, detalles que faltan, movimientos de cámara de riesgo, contradicciones, geometría imposible y stages demasiado rápidos o lentos. Propone una solución por punto y solo entrega el prompt refinado cuando el usuario quiere lanzarlo.

## Funciona con cualquier caso de uso, mejor con AILAB

- **Cualquier caso de uso.** La skill es texto y método: sirve para preparar y revisar prompts de vídeo con IA en cualquier plataforma que admita Seedance 2.5, con o sin cuenta de AILAB.
- **Mucho mejor con AILAB.** El formato de salida y las comprobaciones (límites de materiales, modos del modelo, parámetros) están calibrados para Seedance 2.5 en AILAB. Con la skill `ailab` instalada, además, puedes comprobar el modo del modelo y generar desde el mismo agente.

## Es autocontenida

Todo lo que necesita está dentro de esta carpeta: la maestra y las guías en `references/`. No depende de archivos externos ni de otras skills. Las demás skills de la comunidad (`ailab`, `refinar-prompt`, `estilo-espontaneo-viral`, `estilo-amateur-ccd`, `estilo-ugc`) son opcionales y se citan solo como complemento.

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R refinar-prompt ~/.claude/skills/
```

Reinicia la sesión e invócala con `/refinar-prompt`.

**Claude (aplicación web o de escritorio)**

Sube `refinar-prompt.zip` en la sección de Skills de los ajustes. El zip contiene la carpeta con `SKILL.md` en su raíz.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega `SKILL.md` como instrucciones y deja que lea `references/` cuando lo necesite.

## Contenido

```text
refinar-prompt/
├── SKILL.md
├── README.md
├── assets/AILL.png
├── pruebas/                 prompts de regresión
└── references/
    ├── maestra.md
    ├── guia-seedance-2-5.md
    ├── ejemplos-seedance-2-5.md
    ├── cinelabs.md
    ├── camera-movement.md
    └── actinglabs.md
```

## Lo que no hace

No escribe guiones ni crea prompts desde una idea, no convierte la estética a CCD o UGC y no envía nada a AILAB.

## Idioma

Las instrucciones están en español y responde en el idioma del usuario. Los prompts de salida van en inglés, con el diálogo en su idioma original (castellano de España si no se indica otra variedad).
