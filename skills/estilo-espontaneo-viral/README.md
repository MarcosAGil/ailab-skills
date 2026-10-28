<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# Estilo espontáneo-viral (Seedance 2.5)

**Skill oficial de la comunidad de Ailendra Labs.** Versión 1.0.0.

Crea y refina prompts de Seedance 2.5 en estilo espontáneo-viral: una escena cotidiana que parece grabada a mano por un testigo con móvil, sin cámara profesional. Recibe una idea, un prompt (incluido el borrador del Video Prompter), un vídeo de referencia, imágenes o audio. Comprueba el estilo, las reglas y los errores comunes de prompting, propone arreglos, pregunta y entrega el prompt con la arquitectura de Seedance 2.5.

## Funciona con cualquier caso de uso, mejor con AILAB

- **Cualquier caso de uso.** La skill es texto y método: sirve para preparar y revisar prompts de vídeo con IA en cualquier plataforma que admita Seedance 2.5, con o sin cuenta de AILAB.
- **Mucho mejor con AILAB.** El formato de salida y las comprobaciones (límites de materiales, modos del modelo, parámetros) están calibrados para Seedance 2.5 en AILAB. Con la skill `ailab` instalada, además, puedes comprobar el modo del modelo y generar desde el mismo agente.

## Es autocontenida

Todo lo que necesita está dentro de esta carpeta: la maestra y las guías en `references/`. No depende de archivos externos ni de otras skills. Las demás skills de la comunidad (`ailab`, `refinar-prompt`, `estilo-espontaneo-viral`, `estilo-amateur-ccd`, `estilo-ugc`) son opcionales y se citan solo como complemento.

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R estilo-espontaneo-viral ~/.claude/skills/
```

Reinicia la sesión e invócala con `/estilo-espontaneo-viral`.

**Claude (aplicación web o de escritorio)**

Sube `estilo-espontaneo-viral.zip` en la sección de Skills de los ajustes. El zip contiene la carpeta con `SKILL.md` en su raíz.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega `SKILL.md` como instrucciones y deja que lea `references/` cuando lo necesite.

## Contenido

```text
estilo-espontaneo-viral/
├── SKILL.md
├── README.md
├── assets/AILL.png
├── pruebas/                 borradores reales para regresión
└── references/
    ├── maestra.md           reglas, ejes de auditoría, plantilla y casos
    ├── guia-seedance-2-5.md
    ├── ejemplos-seedance-2-5.md
    ├── auditoria-refinar-prompt.md
    ├── cinelabs.md
    ├── camera-movement.md
    ├── actinglabs.md
    └── ugc.md
```

## Lo que no hace

No audita prompts de otro estilo (usa `refinar-prompt`), no hace estética CCD ni UGC (`estilo-amateur-ccd`, `estilo-ugc`), no escribe guion y no envía nada a AILAB.

## Idioma

Las instrucciones están en español y responde en el idioma del usuario. Los prompts de salida van en inglés, con el diálogo en su idioma original (castellano de España si no se indica otra variedad).
