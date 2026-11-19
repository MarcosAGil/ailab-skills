# Usar el personaje en una escena

Niveles de confianza: **[D]** documentado o dato de la CLI, **[C]** comprobado, **[H]** decisión razonada, **[?]** hipótesis por validar.

## 1. La idea: la carpeta del personaje se explica sola

Cada personaje es una carpeta con su nombre (estructura en `flujo-crear.md`). Quien escriba o revise el prompt de una escena (un agente de prompts de vídeo, una skill que refina prompts o una persona) recibe **la carpeta** y no tiene por qué conocer esta skill. Por eso la carpeta lleva en la raíz su ficha y guía: **`LEEME.md`**.

`LEEME.md` dice, para ese personaje concreto:

1. Qué hay en la carpeta, qué es esencial y qué no se adjunta nunca.
2. Quién es: aspecto, rasgos que se desvían, outfits, personalidad, forma de actuar y voz, con los rasgos ya escritos en inglés.
3. Cómo elegir el modo de referencias: **A** (hojas) o **B** (clip), y qué hacer si la escena lleva otro outfit.
4. Qué aporta cada referencia y qué no se hereda de ella.
5. Los dos métodos para la voz: **pangrama en vídeo** (guía de voz) o **Seed Audio en vídeo** (pista exacta), con el contrato de cada uno.
6. Lo que nunca se hace y una lista de comprobación para quien revise.

**`LEEME.md` no lleva prompting de vídeo [H].** Ni bloques para pegar, ni sintaxis de un modelo, ni ajustes de Seedance, Kling o Wan. Describe el personaje y sus referencias con palabras que sirven para cualquier modelo; cómo se escriben en el prompt lo deciden el sistema de prompts de vídeo y las normas del modelo. El único prompt de vídeo que escribe esta skill es el del clip de referencia, porque esa pieza la genera ella (`clip-referencia.md`).

## 2. Completar y mantener `LEEME.md`

Se crea en la fase 0 de `flujo-crear.md`, su sección 2 se rellena en la fase 1 y el resto en la fase 8. **Se actualiza cada vez que cambia algo del personaje**: un outfit nuevo, un objeto, otra voz, un clip nuevo o un cambio en la ficha. El modelo de buen resultado es `ejemplos/Luis/LEEME.md`.

1. Rellena cada `{{VARIABLE}}` con lo que dio el usuario y con los archivos aprobados (tabla de abajo). Nada se inventa: lo que no exista se escribe como "no hay" o `(pendiente)`.
2. El árbol de la sección 1 refleja la carpeta **real**: un `Video1_clip` por outfit con clip, una `Escala_` por objeto, sin líneas de lo que no existe.
3. La tabla de modos (sección 3) cubre **todos** los outfits.
4. Quita las notas `{{...}}` de la plantilla y lo que no aplique (la sección 4 sin clip, la nota del pangrama que no corresponda).
5. Repasa cada imagen que cita: lo que no se hereda de ella (por ejemplo, la camiseta que lleva en la 3x3) se escribe en su línea.
6. Comprueba que cada ruta citada existe (`ls`) y que no hay em dashes.
7. Enséñaselo al usuario y anota el cambio en el historial de `LEEME.md`.

| Variable | De dónde sale |
|---|---|
| `{{Nombre}}`, pronombres | El usuario, fase 0 |
| `{{ALTURA}}`, `{{COMPLEXION}}` | `LEEME.md`, sección 2 |
| `{{RASGOS_DERIVA_EN}}` | "Rasgos que más se desvían" (sección 2), en inglés, con cómo deben verse |
| `{{MARCAS_EN}}` | "Marcas" (sección 2), con su posición, en inglés |
| `{{OUTFIT_EN}}` | El `{{WARDROBE}}` de `backup/prompts/prompt_<outfit>-3paneles.txt`, resumido sin perder prendas, herrajes ni accesorios |
| `{{T}}`, `{{T_CLIP}}` | Duración real con `ffprobe` (siempre N,000 s) |

## 3. Las dos formas de usar las referencias

| | **A. Hojas** (por defecto) | **B. Clip** (opcional) |
|---|---|---|
| Se adjunta | 3x3 + hoja de 3 paneles del outfit + hojas de escala, y la voz según el método | Clip del outfit + hojas de escala |
| Requisito | Hojas y voz aprobadas | Clip aprobado **de ese outfit** |
| Ventaja | Sin coste extra de creación | El modelo ve al personaje hablar, girar la cabeza y moverse con su ropa |

- **No se mezclan [H]:** con el clip, este es la única fuente del personaje. Añadir la 3x3 da dos fuentes de la misma cara que no coinciden del todo y el modelo las mezcla. Lo que se desvía se refuerza **por texto** (rasgos que se desvían), no con otra imagen.
- **Rango emocional:** el clip enseña cómo se emociona el personaje solo si se hizo con el pangrama emocional. Con el natural, la emoción se describe en el prompt **[H]**.
- **Otro outfit:** lo decide quien haga el vídeo. La skill solo recomienda crear antes la hoja de 3 paneles de ese outfit (`flujo-crear.md`, fase 3) **[H]**.

## 4. Los dos métodos para la voz

| | **Método 1 · Pangrama en vídeo** | **Método 2 · Seed Audio en vídeo** |
|---|---|---|
| Qué llega al modelo de vídeo | El vídeo negro del pangrama (modo A) o el clip (modo B) | El vídeo negro con toda la capa sonora de la escena, con las hojas (modo A) |
| Contrato | Guía de voz: hereda el timbre, no las palabras | Pista exacta: manda sobre diálogo, voces, pausas y sonidos |
| Qué hace la skill | Nada más: la voz ya está en la carpeta | La pista de cada escena, a partir de su prompt de vídeo ya escrito |
| Guía | `LEEME.md`, sección 6 | `seed-audio-en-video.md` |

## 5. Preparar una escena concreta

Cuando el usuario pide usar al personaje en una escena:

1. Localiza la carpeta del personaje y lee `LEEME.md`. Si está desfasado (cita algo que no existe o falta una pieza aprobada), actualízalo antes (sección 2).
2. Pregunta lo mínimo: qué outfit lleva, si habla, qué objetos usa y con qué método quiere la voz.
3. Comprueba que cada objeto tiene su hoja de escala. Sin ella se propone generarla antes (`prompts-imagen.md`, sección 7). Si el outfit no está en la carpeta, recomienda su hoja de 3 paneles.
4. Elige el modo de referencias con la tabla de `LEEME.md`, sección 3.
5. Entrega:
   - la tabla de referencias en orden de subida, con su ruta absoluta y lo que aporta cada una;
   - la frase para el usuario: "Para escribir o revisar el prompt de la escena, pásale la carpeta `<ruta>` y dile que lea primero `LEEME.md`."
6. **Con el método 2**, cuando el prompt de vídeo ya esté escrito, se hace la pista con `seed-audio-en-video.md`.

**No escribe el prompt de vídeo de la escena**, para ningún modelo: ni stages, ni cámara, ni sintaxis de referencias. Si el usuario lo pide, se le dice que eso lo hace su sistema de prompts de vídeo y se le entrega lo del paso 5. Tampoco se modifican los archivos del personaje: si la escena pide un cambio permanente, es la operación "actualizar la ficha".

## 6. Si el personaje sale distinto

Se anota qué cambió (cara, voz, gesto, ropa, tamaño de un objeto) y se propone **una** corrección:

- más rasgos en "rasgos que se desvían" (y se actualiza `LEEME.md`);
- pasar al modo B si existe el clip;
- en el modo B, rehacer el clip si el fallo ya está en el clip;
- con un outfit sin hoja, crear su hoja de 3 paneles;
- actualizar la ficha.

Se recuerda que la consistencia de cara y voz entre generaciones **no está garantizada** **[D]**.
