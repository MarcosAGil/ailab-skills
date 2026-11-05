---
name: entorno-consistente-blender
description: Método de Ailendra Labs para crear cualquier espacio (habitación, tienda, local, set, exterior) 100 % consistente y generar de él todas las imágenes que se quieran, desde cualquier ángulo y con cualquier personaje en posición y pose exactas. Claude construye el espacio en Blender por MCP a escala real, el usuario lo revisa en un visor web sin abrir Blender, se colocan maniquíes con la pose de cada personaje, Image Prompter (AILAB) escribe el prompt, Nano Banana 2.1 (AILAB) genera la foto y cada imagen se comprueba con contornos y se corrige con edición y parche local. Úsala cuando el usuario quiera un entorno consistente entre planos, una hoja de entorno, varias vistas del mismo espacio, meter personajes en un sitio o pose concretos, un contrapicado, perfil o cenital de un espacio ya creado, corregir un detalle sin rehacer la imagen, o diga que la IA le mueve los objetos o le cambia el espacio entre generaciones, aunque no mencione Blender.
---

# Entorno consistente con Blender + IA · Ailendra Labs

> **Skill oficial de la comunidad de Ailendra Labs.** Sirve para cualquier espacio y cualquier personaje, y funciona mucho mejor con AILAB: los prompts los escribe Image Prompter y las imágenes las genera Nano Banana 2.1 en AILAB. Es autocontenida: todo lo que necesita está dentro de su carpeta, salvo Blender y el plugin de AILAB, que se instalan aparte (Fase 0).

La IA de imagen no recuerda un espacio: en cada generación mueve muebles, cambia tamaños, reinventa cuadros y coloca a las personas donde quiere. Este método reparte el trabajo:

```
Blender decide la geometría, la cámara y dónde está cada persona
+ la IA pone el acabado fotográfico y la identidad de cada personaje
= el mismo espacio, desde cualquier ángulo, con quien quieras dentro
```

- **Blender manda en la composición** (medidas reales, cámaras exactas, maniquíes con la pose de cada personaje). La IA solo pone el aspecto: recibe el render como Image 1 y las vistas aprobadas y las hojas de personaje como referencias.
- **El usuario nunca toca Blender.** Revisa en un visor web con la marca de Ailendra Labs y pega sus correcciones en el chat. Si algo falla en Blender, lo arreglas tú.
- **Control absoluto.** Cada imagen se comprueba con los contornos del render; lo que falla se corrige con una edición y, si el modelo toca de más, con un parche local que solo cambia esa zona.

**Qué se puede generar:** hoja de entorno y cualquier vista del espacio (frontales a cualquier distancia, tres cuartos, lateral, cenital, maqueta, detalle); vistas con uno o varios personajes en posición y pose exactas (perfil, contrapicado, rodilla, plano medio, primer plano, picado, varias vistas del mismo momento); ediciones (añadir a alguien con la pose de una foto, cambiar una pantalla, corregir un objeto o un outfit); fotogramas consistentes para vídeo. Detalle: `references/10-catalogo-de-vistas.md`. Mapa de archivos: `references/00-mapa-de-la-skill.md`.

## Fase 0 · Comprobar el entorno (siempre, lo primero)

1. `bash <skill>/scripts/comprobar_entorno.sh`: Blender, uv, MCP de Blender, addon en el puerto 9876, Python + Pillow, Node, skill AILAB y su sesión, ffmpeg. No instala ni gasta.
2. Lo que falte: el comando exacto que imprime el script y `references/01-requisitos-e-instalacion.md`. Lo que puedas hacer tú, hazlo. El `login` de AILAB lo hace **siempre el usuario** en su terminal.
3. Blender cerrado: ábrelo tú (`open -a Blender "<archivo.blend>"`), espera al puerto 9876 y `mcp__blender__get_addon_status`.
4. Sintaxis vigente de AILAB: `node <ailab>/scripts/ailab.mjs guide`.

## Fase 1 · Encargo y carpeta

Pide la referencia del espacio, las vistas que necesita y, si hay personas, sus hojas de personaje y los objetos que llevan. Pregunta con opciones y una recomendación lo que cambia la escena: vista principal entera, puertas, objetos sueltos, pared de enfrente, luz (tabla en `references/12-caso-real-sala-espera.md`). Carpeta `<proyecto>/Blender-<espacio>/` con `referencias/ texturas/ renders/fase1/ renders/fase2-ia/ visor/ versiones/` y el `.blend` guardado ahí desde el principio.

## Fase 2 · Blockout, cámaras y visor (iterar hasta aprobar)

Nombre fijo para cada pared, confirmado con el usuario. Primitivas a escala real (`scripts/blender/utilidades.py`) en colecciones; cámaras con `scripts/blender/camaras.py`. Visor web en cada vuelta (`exportar_visor.py` + `construir_visor.py`, publicado como artefacto, mismo enlace). Versión por vuelta. Cierra el blockout **antes** de la estética. Detalle: `references/02` y `references/03`.

## Fase 3 · Estética en Blender

Formas finales, texturas CC0 de Poly Haven recoloreadas con colores medidos, recortes de la referencia para lo único (cuadros, fotos, objetos colgados), arte propio de objetos protagonistas y luz de estudio. Render de prueba de la vista más parecida a la referencia antes de seguir. Detalle: `references/04` y `references/05`.

## Fase 4 · Personajes (si los hay)

Un maniquí por personaje con `scripts/blender/maniquies.py` (posición, orientación, altura, asiento, pose y objeto entre las manos). Para copiar la pose de una imagen ya generada, amplíala, anota cada detalle (qué pierna encima, manos, mirada) y ajusta hasta que coincida desde su cámara. Lo que choque con un personaje se mueve **solo en esa vista** con `scripts/blender/estado_vista.py`. Encuadra con `mcp__blender__look(mode="camera")` y enséñalo si es un plano nuevo. Detalle: `references/07`.

## Fase 5 · Pases de render

`scripts/blender/render_pases.py` (`CAMS`, `CENITALES`, `TECHO`): color, clay, profundidad y contornos de cada vista, con su estado aplicado. Después `scripts/normalizar_profundidad.py` y una hoja para el usuario. Detalle: `references/06`.

## Fase 6 · Prompt con Image Prompter (AILAB)

Rellena `assets/plantillas/brief-image-prompter.md` y ejecuta `bash <skill>/scripts/pedir_prompt.sh <vista>/brief.md <vista> <imágenes en el orden que irán al modelo>`. Extrae el prompt, **revísalo con la lista de comprobación** de `references/08-generacion-ailab.md`, corrígelo y guárdalo como `<vista>/prompt.txt`. Sin Image Prompter: `assets/plantillas/prompts-de-reserva.md` y `assets/ejemplos/prompts-reales/`.

## Fase 7 · Imagen con Nano Banana 2.1 (AILAB)

- **Gasto solo cuando el usuario lo pide.** Antes, cuántas imágenes y consultas y el coste que da la CLI. Reglas de AILAB resumidas en `references/08`.
- `RESOLUCION=2K PROPORCION=16:9 bash <skill>/scripts/generar_vista.sh <prompt.txt> <salida> <imagen_1> ...`: prepara, envía, espera con `status`, un solo reintento ante 429.
- Image 1 = render de esa vista (composición); después vistas aprobadas, hojas de personaje y objetos (aspecto).
- Secuencia: maestra (render + referencia) → aprobación → segunda vista (render + maestra) → resto (render + maestra + segunda) → personajes (render con maniquíes + vistas aprobadas + hojas). **La maestra arrastra sus errores:** revísala antes de seguir.
- Fallos repetidos del proveedor: no insistas; ofrece esperar u otro proveedor conectado con el mismo modelo, solo con permiso.

## Fase 8 · Control, corrección y entrega

1. `scripts/control_contornos.py`: contornos sobre cada imagen y hojas de control y de entorno con el logo de Ailendra Labs. Revisa tú cada una (`references/09`).
2. Lo que falle: edición con la imagen como Image 1 y un prompt corto con solo lo que cambia. Si el modelo toca de más: `scripts/mascara.py` + `scripts/componer_parche.py`.
3. Si no se puede corregir, repite **solo esa vista**.
4. Guarda en orden (`generaciones-ia/<modelo>_<NN>_vista-<clave>.png` y una carpeta por vista con prompt, brief, referencias, control y `LEEME.md`). Entrega imagen, prompt exacto, `Guardado en:` con rutas absolutas y créditos gastados. GIFs con `scripts/gif_comparativa.py` si los pide.

## Cómo hablar con el usuario

No tiene que saber Blender. Habla en metros y en lo que ve, no en nodos. En cada vuelta: qué cambió, enlace o imagen y qué falta decidir, con opciones y una recomendación. Sé honesto con lo que se desvió en cada imagen y propón cómo corregirlo.
