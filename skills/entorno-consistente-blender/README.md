<p align="center"><img src="assets/AILL.png" alt="Ailendra Labs" width="120"></p>

# entorno-consistente-blender

> **Skill oficial de la comunidad de Ailendra Labs.** Sirve para cualquier espacio y cualquier personaje, y funciona mucho mejor con AILAB: los prompts los escribe Image Prompter y las imágenes las genera Nano Banana 2.1 en AILAB. Es autocontenida: todo lo que necesita está dentro de su carpeta, salvo Blender y el plugin de AILAB, que se instalan aparte.

Skill para crear cualquier espacio 100 % consistente y generar de él todas las imágenes que quieras, desde cualquier ángulo y con tus personajes en una posición y una pose exactas, sin que nada cambie de sitio ni de tamaño. Versión 0.1, beta.

> **EN:** Builds any space (room, shop, set, office, exterior) in Blender at real scale through the Blender MCP, lets the user review it in a 3D web viewer without opening Blender, places posed mannequins for each character, renders every view in passes, asks AILAB's Image Prompter for the prompt and generates the final photo with Nano Banana 2.1 on AILAB. Every image is checked against the render's contours and fixed with edits and local patches. Instructions are in Spanish; it answers in the user's language.

## Cómo funciona

```
Blender decide la geometría, la cámara y dónde está cada persona
+ la IA pone el acabado fotográfico y la identidad de cada personaje
= el mismo espacio, desde cualquier ángulo, con quien quieras dentro
```

1. **Comprueba tu equipo** y te dice qué falta y cómo instalarlo.
2. **Construye el espacio en Blender** con medidas reales y cámaras exactas. Tú lo revisas en un **visor 3D web** y apuntas correcciones.
3. **Aplica materiales, recortes y luz** para que todas las vistas salgan iguales.
4. **Coloca a tus personajes** con maniquíes en la pose que quieras (de pie, jugando, sentado, piernas cruzadas, leyendo...).
5. **Renderiza cada vista** en cuatro pases (color, forma, profundidad y contornos).
6. **Image Prompter** escribe el prompt y **Nano Banana 2.1** genera la foto en AILAB.
7. **Comprueba cada imagen** con los contornos del render y **corrige** lo que falle con una edición y, si hace falta, con un parche local que solo cambia esa zona.

## Qué puedes generar

- Hoja de entorno, frontales a cualquier distancia, tres cuartos, laterales, cenital, maqueta, detalles.
- Planos con personajes: general, perfil, contrapicado desde el suelo, a la altura de la rodilla, plano medio, primer plano, picado. Varias vistas del mismo momento.
- Ediciones: añadir a alguien con la pose de una foto, cambiar lo que sale en una pantalla, corregir un objeto o un cable, cambiar un outfit.
- Primeros y últimos fotogramas consistentes para vídeo.

## Qué no hace

No crea personajes desde cero (para eso, `personaje-consistente`), no genera vídeo y no publica. No copia arte ni logotipos de marcas o juegos reales que no sean tuyos.

## Qué necesita

- Blender 4.2 o posterior (validada con 5.2.3) y el MCP de Blender (`uvx mcp-for-blender`).
- Python 3.9 o posterior con Pillow, y Node.js 18 o posterior.
- La skill `ailab` y una cuenta de AILAB con créditos para Image Prompter y Nano Banana 2.1.
- Opcional: FFmpeg, para los GIFs.

La primera fase ejecuta `scripts/comprobar_entorno.sh`, que lo revisa todo y te da el comando exacto para lo que falte.

## Instalación

**Claude Code**

```bash
mkdir -p ~/.claude/skills
cp -R entorno-consistente-blender ~/.claude/skills/
```

Reinicia la sesión y pídele "crea un entorno consistente de esta sala", o invócala con `/entorno-consistente-blender`.

**Otros agentes**

`SKILL.md` y `references/` son Markdown normal; los scripts son Python y Bash. Si tu herramienta no soporta skills, pega `SKILL.md` como instrucciones y deja que lea `references/` cuando lo necesite. Necesita acceso a Blender por MCP.

## Cómo se usa

- "Quiero una sala de espera vintage como esta imagen, consistente desde varios ángulos."
- "Dame una vista desde el suelo del hombre que lee el periódico, en contrapicado."
- "Mete a mi personaje sentado en el sofá de la derecha con esta pose."
- "En la pantalla de la máquina tiene que salir esta imagen."

Gasta créditos solo cuando tú lo pides y te dice antes cuántas imágenes y cuánto cuesta.
