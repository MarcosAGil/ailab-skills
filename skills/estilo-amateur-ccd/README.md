<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# Estilo amateur CCD de los 2000 (refinar prompt)

**Skill oficial de la comunidad de Ailendra Labs.** Versión 1.0.0.

Lleva un prompt de vídeo ya hecho a la estética amateur de compacta digital CCD de los 2000: operador humano con reflejos limitados, cámara en mano que bota y llega tarde, autofoco y exposición contados, piel con poros, grano, luz de cámara constante y dirección total de cada persona. Entrega el prompt en formato Seedance 2.5, listo para pegar en AILAB.

## Funciona con cualquier caso de uso, mejor con AILAB

- **Cualquier caso de uso.** La skill es texto y método: sirve para preparar y revisar prompts de vídeo con IA en cualquier plataforma que admita Seedance 2.5, con o sin cuenta de AILAB.
- **Mucho mejor con AILAB.** El formato de salida y las comprobaciones (límites de materiales, modos del modelo, parámetros) están calibrados para Seedance 2.5 en AILAB. Con la skill `ailab` instalada, además, puedes comprobar el modo del modelo y generar desde el mismo agente.

## Es autocontenida

Todo lo que necesita está dentro de esta carpeta: la maestra y las guías en `references/`. No depende de archivos externos ni de otras skills. Las demás skills de la comunidad (`ailab`, `refinar-prompt`, `estilo-espontaneo-viral`, `estilo-amateur-ccd`, `estilo-ugc`) son opcionales y se citan solo como complemento.

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R estilo-amateur-ccd ~/.claude/skills/
```

Reinicia la sesión e invócala con `/estilo-amateur-ccd`.

**Claude (aplicación web o de escritorio)**

Sube `estilo-amateur-ccd.zip` en la sección de Skills de los ajustes. El zip contiene la carpeta con `SKILL.md` en su raíz.

**Otros agentes**

`SKILL.md` y los archivos de `references/` son Markdown normal. Si tu herramienta no soporta skills, pega `SKILL.md` como instrucciones y deja que lea `references/` cuando lo necesite.

## Contenido

```text
estilo-amateur-ccd/
├── SKILL.md
├── README.md
├── assets/AILL.png
└── references/
    ├── maestra.md           procedimiento, plantilla, comprobaciones de calidad y ejemplos
    ├── guia-seedance-2-5.md
    ├── ejemplos-seedance-2-5.md
    ├── auditoria-refinar-prompt.md
    ├── cinelabs.md
    ├── camera-movement.md
    └── actinglabs.md
```

## Lo que no hace

No crea prompts desde una idea suelta, no sirve para ediciones conservadoras, Genjutsu ni motion graphics, y no envía nada a AILAB.

## Idioma

Las instrucciones están en español y responde en el idioma del usuario. Los prompts de salida van en inglés, con el diálogo en su idioma original (castellano de España si no se indica otra variedad).
