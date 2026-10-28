# Prompts de imagen

Todas las imágenes se generan con **GPT Image 2.5** (`gpt-image-2-5`), a **16:9**, salvo que el usuario pida otro modelo o ratio. Los parámetros salen siempre de `info gpt-image-2-5` y mandan sobre esta tabla.

| Pieza | `--mode` | Referencias (`--image_urls`, en orden) | `--aspect_ratio` |
|---|---|---|---|
| Retrato base | `t2i` | ninguna (en texto a imagen no se adjuntan) | `3:4` (propuesta, ver sección 1) |
| Hoja de rostro | `i2i` | todas las del rostro (de 1 a 16) | `16:9` |
| Hoja de cuerpo | `i2i` | 1 = hoja de rostro aprobada (siempre primera); 2 = imagen principal de identidad | `16:9` |
| Hoja de outfit | `i2i` | 1 = hoja de cuerpo; 2 = foto del outfit | `16:9` |
| Hoja de producto | `i2i` | fotos del producto (de 1 a 16) | `16:9` |
| Boceto de tamaño | `i2i` | hoja de cuerpo y hoja de producto | `16:9` |

Resto de parámetros por defecto: `--version sunburst` y `--resolution 2K` **[?]**. Los ejemplos aportados por el autor se generaron con la versión `sunburst`, y `flare` es el valor por defecto del modelo (misma tarifa). Si el resultado no convence, se prueba la otra versión cambiando solo ese parámetro. Cada referencia se pasa repitiendo `--image_urls` (un parámetro `file[]` puede repetirse).

## Cómo se usan estos prompts

- Se copian **tal cual**, rellenando solo las variables `{{...}}`. No se reescriben, no se "mejoran" y no se añaden restricciones propias sin consultar al usuario.
- Cada prompt se guarda en `prompts_intermedios/generaciones/<pieza>-vN.txt` y la imagen resultante con el mismo nombre base.
- "Image A" es siempre la **primera** imagen adjunta y "Image B" la **segunda**. El orden de `--image_urls` importa.
- Los prompts están en inglés. Las variables se rellenan en inglés.

### Variables

| Variable | Qué poner | Ejemplo |
|---|---|---|
| `{{OUTFIT}}` | El vestuario completo del personaje, por piezas, tal como aparece en la imagen de identidad o en la ficha. No se inventa | `grey long-sleeve t-shirt, blue denim jeans, white sneakers` |
| `{{TOP}}` | La prenda que queda junto al cuello (para situar el difuminado del cuello) | `t-shirt` |
| `{{HER}}` | Pronombre posesivo según la ficha: `her`, `his` o `their` | `her` |
| `{{DESCRIPTION}}` | Solo en el retrato base: descripción física concreta de la ficha | ver sección 1 |

Si el pronombre es `their`, se comprueba que los verbos sigan en singular donde corresponda.

## 1. Retrato base (solo personaje inventado)

**Propuesta de esta skill, no es un prompt del autor [?].** Sirve para tener una imagen de identidad cuando el usuario no aporta fotos. Se genera, se enseña y el usuario aprueba la identidad **antes** de generar ninguna hoja.

```text
Task: Generate a photorealistic head-and-shoulders portrait of {{DESCRIPTION}}.

Front-facing, neutral relaxed expression, eyes open and looking at the camera, with the clothing and accessories exactly as described in the character description, neutral light gray studio background, soft and even studio lighting similar to a professional modeling digitization session.
Natural unretouched skin with visible pores and fine texture. Do not beautify, stylize, or smooth the skin.

Restrictions:
Do not add text, logos, or watermarks. Do not turn the image into an illustration, anime, or CGI render.

Final result:
A real high-end photorealistic portrait of a single person, with clear, evenly lit facial features suitable as a facial identity reference.
```

`{{DESCRIPTION}}` sale de la sección 2 de la ficha (edad aparente, rostro, pelo, piel, rasgos distintivos), sin añadir rasgos que el usuario no haya dado.

## 2. Hoja de rostro con expresiones (3x3)

Referencias: **todas** las del rostro. Cuantas más haya, con distintas expresiones y ángulos, mejor. Si hay solo una, se usa la versión original (singular). Si hay varias, la versión plural, que cambia únicamente "reference image" por "reference images" en tres sitios.

**Versión original (una referencia):**

```text
Task: Edit the character sheet generation to strictly integrate specific facial expressions across the grid portraits based on the reference image.

Use the provided reference image as the absolute and ONLY source of truth for the character's facial identity, structure, skin tone, hair, and unique features.

Generate a professional 3×3 character sheet showing the exact same person from multiple angles and expressions on a neutral light gray background:

The identity must remain absolutely identical to the reference: same facial structure, eye shape and spacing, nose, lips, jawline, hairstyle and hairline, skin tone, proportions, age, ethnicity, and facial asymmetries.
Do NOT beautify, stylize, or reinterpret the person in any way.
Include nine evenly spaced portraits covering a mix of angles and expressions.
Mandatory expressions to include across the grid:
At least one portrait must show an angry expression with a distinctly furrowed brow and tight jaw.
At least one portrait must show a subtle, friendly smile where the teeth are softly and naturally visible.
Lighting must be soft and perfectly consistent across every frame, similar to a professional modeling digitization session.
Hair, clothing, makeup, and accessories must remain identical in every portrait.
Camera distance, focal length, and framing should stay consistent throughout.
Preservation:

Strictly preserve identity consistency, facial realism, and accurate anatomical proportions from the reference image.
Maintain the neutral light gray background and consistent studio lighting across all nine panels.
Restrictions:

No artistic interpretation.
No beauty filters.
No skin smoothing.
No extra accessories or background variation.
Do not alter the core identity or facial features.
Final result:

A real high-end photorealistic 3×3 facial identity reference sheet used by professional VFX, AAA game studios, or film character departments, featuring precise identity consistency, consistent studio lighting, an angry expression with a furrowed brow, and a subtle, friendly smile with visible teeth.
```

**Versión plural (varias referencias):**

```text
Task: Edit the character sheet generation to strictly integrate specific facial expressions across the grid portraits based on the reference images.

Use the provided reference images as the absolute and ONLY source of truth for the character's facial identity, structure, skin tone, hair, and unique features.

Generate a professional 3×3 character sheet showing the exact same person from multiple angles and expressions on a neutral light gray background:

The identity must remain absolutely identical to the reference: same facial structure, eye shape and spacing, nose, lips, jawline, hairstyle and hairline, skin tone, proportions, age, ethnicity, and facial asymmetries.
Do NOT beautify, stylize, or reinterpret the person in any way.
Include nine evenly spaced portraits covering a mix of angles and expressions.
Mandatory expressions to include across the grid:
At least one portrait must show an angry expression with a distinctly furrowed brow and tight jaw.
At least one portrait must show a subtle, friendly smile where the teeth are softly and naturally visible.
Lighting must be soft and perfectly consistent across every frame, similar to a professional modeling digitization session.
Hair, clothing, makeup, and accessories must remain identical in every portrait.
Camera distance, focal length, and framing should stay consistent throughout.
Preservation:

Strictly preserve identity consistency, facial realism, and accurate anatomical proportions from the reference images.
Maintain the neutral light gray background and consistent studio lighting across all nine panels.
Restrictions:

No artistic interpretation.
No beauty filters.
No skin smoothing.
No extra accessories or background variation.
Do not alter the core identity or facial features.
Final result:

A real high-end photorealistic 3×3 facial identity reference sheet used by professional VFX, AAA game studios, or film character departments, featuring precise identity consistency, consistent studio lighting, an angry expression with a furrowed brow, and a subtle, friendly smile with visible teeth.
```

Comprobaciones al revisar la imagen:
- Hay nueve retratos, en rejilla 3x3, de la misma persona.
- Está al menos un retrato con enfado (ceño claramente fruncido y mandíbula tensa) y al menos uno con sonrisa suave con los dientes visibles de forma natural. El prompt solo fija esas dos expresiones; el resto de ángulos y expresiones los elige el modelo.
- Luz, fondo gris claro, encuadre, pelo, ropa y accesorios son idénticos en los nueve.
- Los rasgos coinciden con las referencias. Sin suavizado de piel ni embellecimiento.
- Los ojos se ven. Si las referencias llevaban gafas y la hoja las hereda, se avisa y se pide alguna referencia sin ellas.

## 3. Hoja de cuerpo entero (4 paneles)

Referencias: la hoja de rostro aprobada (Image A, siempre la primera, para fijar la cara) y, a continuación, la imagen principal de identidad (Image B) **[H]**. Si no hay hoja de rostro aprobada, no se genera la hoja de cuerpo.

```text
Task: Generate an advanced photorealistic four-panel character reference sheet based on the provided character reference images, applying specific head visibility modifications to both the front and side views.

Use Image A (and any attached character references) as the absolute source of truth for the character's facial identity, hair texture, skin tone, body proportions, and clothing ({{OUTFIT}}).

Create a clean four-panel vertical character reference sheet in a professional casting-sheet style with a neutral grey studio backdrop and clean vertical divider lines separating the four columns:

First panel (Full-body front headless view): The model stands in a natural confident stance, but {{HER}} head is completely removed and the neck area is softly blurred, feathered, or faded out smoothly just above the collar of the {{TOP}}, ensuring no face or head is visible.
Second panel (Full-body side profile headless view): Full-body lateral profile standing view facing sideways, but {{HER}} head is completely removed and the neck/shoulder transition is softly blurred, feathered, or faded out smoothly at the exact same level as the front panel, ensuring no facial profile or head is visible.
Third panel (Full-body back view): Full-body rear view showing the back of the character, accurately preserving {{HER}} exact hairstyle, hair color, and head shape from the reference images.
Fourth panel (Close-up portrait): Head-and-shoulders facial portrait displaying {{HER}} exact face, realistic skin texture, and natural expression based on the reference character.
Preservation:

Strictly preserve {{HER}} facial identity, hair, skin tone, clothing details, body proportions, and overall photorealism across the panels where they appear. Maintain the clean neutral studio backdrop, vertical panel separations, and high-end apparel reference-sheet look.

Restrictions:

Do not add text, logos, or watermarks. Do not show any facial features or head on the first front panel or the second side profile panel. Do not turn the image into an illustration, anime, or CGI render.

Final result:

A real high-end photorealistic four-panel character reference sheet where the front and side profile views have their heads removed with necks softly blurred, the back view shows {{HER}} hair and head from behind, and the rightmost panel shows {{HER}} facial close-up, maintaining exact identity consistency.
```

Comprobaciones:
- Exactamente cuatro paneles verticales con líneas divisorias, sobre fondo gris de estudio neutro.
- Paneles 1 y 2 (frontal y perfil): **sin cabeza ni rostro**, con el cuello difuminado al mismo nivel en los dos.
- Panel 3 (espalda): peinado, color de pelo y forma de la cabeza iguales a las referencias.
- Panel 4 (primer plano): el rostro del personaje, con piel con textura.
- El outfit, las proporciones y los accesorios son los mismos en todos los paneles donde aparecen. Sin texto, logos ni marcas de agua. Aspecto de fotografía real.

Aviso para el uso posterior: los paneles frontal y lateral no tienen cabeza. Al usar esta hoja como referencia de un vídeo, hay que indicar que esos paneles solo aportan cuerpo y ropa (ver `usar-en-escena.md`).

## 4. Hoja de outfit nuevo (3 paneles)

**Las dos imágenes son obligatorias y su orden importa.** Image A = la hoja de cuerpo del personaje (primera). Image B = una foto del outfit (segunda). Sin la foto del outfit, la skill no genera: la pide.

El outfit se deja **tal cual** aparece en la foto: si lleva gafas de sol, bolso u otros accesorios, se reproducen. Esta hoja no lleva panel de primer plano.

```text
Task: Generate a multi-reference character outfit transformation sheet consisting strictly of three vertical panels based on the provided reference images.

Use Image A as the strict source of truth for the character's facial identity, hair identity (hair color, texture, length), skin tone, anatomical body proportions, height impression, studio layout, neutral grey studio backdrop, and camera perspective logic.

Use Image B as the strict source of truth for the new outfit, clothing elements, footwear, accessories, colors, and styling direction that must be transferred onto the character from Image A.

Create a clean three-panel vertical character reference sheet in a professional casting-sheet style with a neutral grey studio backdrop and clean vertical divider lines separating the three columns:

First panel (Full-body front headless view): The model stands in a natural stance wearing the exact outfit, garments, shoes, and accessories from Image B, but {{HER}} head is completely removed and the neck area is softly blurred, feathered, or faded out smoothly just above the collar, ensuring no face or head is visible.
Second panel (Full-body side profile headless view): Full-body lateral profile standing view facing sideways wearing the outfit from Image B, but {{HER}} head is completely removed and the neck/shoulder transition is softly blurred, feathered, or faded out smoothly at the exact same level as the front panel.
Third panel (Full-body back view): Full-body rear view showing the back of the character wearing the outfit from Image B, while accurately preserving {{HER}} exact hairstyle, hair color, hair density, and head shape from Image A.
Preservation:

Strictly preserve from Image A: character identity, facial identity, hair color and texture (where visible on the back view), skin tone, body proportions, natural anatomy, neutral grey studio backdrop, clean vertical divider lines, camera angle, lighting softness, and overall photographic clarity.
Strictly preserve from Image B: outfit design, garment types, colors, materials, fit, styling, footwear, visible accessories, bags, straps, and layering.
Ensure the outfit from Image B fits naturally and realistically onto the anatomical body structure of the character from Image A, with correct gravity, fabric tension, folds, and contact shadows.
Restrictions:

Do not include any close-up facial portrait panel. Exactly three panels must be generated.
Do not add text, logos, or watermarks.
Do not show any facial features or head on the first front panel or the second side profile panel.
Do not turn the image into an illustration, anime, or CGI render.
Final result:

A real high-end photorealistic three-panel character reference sheet where the front and side profile views show the new outfit from Image B with heads removed and necks softly blurred, and the third back view shows the character's hair from behind, maintaining exact identity consistency with Image A and exact outfit fidelity with Image B.
```

Comprobaciones:
- Exactamente tres paneles y **ningún** primer plano de rostro.
- Paneles 1 y 2 sin cabeza ni rostro, con el cuello difuminado al mismo nivel.
- Panel 3 (espalda) con el pelo del personaje (Image A).
- Prendas, calzado, accesorios, bolsos, colores, materiales y ajuste fieles a la foto del outfit, con caída, pliegues y sombras de contacto creíbles.
- No se han filtrado rasgos de la persona que aparezca en la foto del outfit.
- Sin texto, logos ni marcas de agua. Aspecto de fotografía real.

## 5. Hoja de producto

Solo si el personaje interactúa con un objeto. Referencias: **todas** las fotos del producto (de 1 a 16), aunque sean de aficionado.

**Texto reconstruido [?].** El archivo original del autor tenía palabras cortadas y se reconstruyó sin cambiar el contenido. Las partes deducidas son suposiciones: si algo no encaja, se pregunta al autor.

```text
Task: Generate a professional product reference sheet in a structured grid layout, using the attached amateur reference photos of the product as the single source of truth for identity, while correcting amateur photography defects and physical imperfections to produce a commercial-grade documentation sheet.

Reference Images: Treat all attached images as informal, non-professional photos of the same physical product, captured by a regular user (uneven lighting, handheld angles, cluttered or inconsistent backgrounds, possible blur, reflections, or minor framing errors). Extract the product's true identity from them: exact shape, proportions, logo, label design, typography, color palette, material, and construction details. This identity must remain 100% consistent across every view and crop in the final sheet.

Execution instructions · Layout and hierarchy:

Arrange the sheet as a clean grid on a neutral, seamless studio background (soft off-white or light gray), with generous even spacing between cells and a clear visual hierarchy:

- Top row (largest cell, hero position): one main three-quarter hero view of the full product, the clearest and most representative angle.

- Second row: a horizontal sequence of full-body views at equal size · front view, left profile view, right profile view, back view. All four views must show the exact same product, perfectly upright, centered, and isolated.

- Bottom row(s): individual close-up detail cells, one distinct physical element per cell. Each cell isolates exactly ONE feature (example: one cell for the main logo/label area, one cell for the cap/closure/zipper/button, one cell for a texture or material detail, one cell for any secondary brand mark or stitching/seam). Never split a single element like a label across multiple cells, and never combine two unrelated elements into one cell.

Each grid cell must be sharply focused, evenly and softly lit, with consistent neutral background and consistent shadows.

Universal correction and perfection rules (apply the ones relevant to the product type visible in the references):

- Fabric/garment products: remove wrinkles, creases, and bunching that are not part of the garment's structural design. Present the fabric smooth, properly shaped, and with natural volume, as if freshly steamed on an invisible form.

- Liquid-filled containers (bottles, jars, perfume flacons, cosmetic tubes): if the container appears empty, underfilled, or at an unrealistic liquid level, refill it to a realistic, commercially standard fill level consistent with that product category. If the cap, lid, pump, or cork appears open, loose, or missing, show it closed and properly seated.

- Rigid packaging (boxes, cartons, etc.): remove crushed corners, dents, or warping; flatten creased surfaces; correct skewed or misaligned labels so they sit flush and level.

- Any product surface: remove dust, fingerprints, smudges, scratches, condensation, or lint that are accidental photography artifacts and not an intentional product texture or branding.

- Amateur photography artifacts: remove uneven or color-casted lighting, harsh shadows, motion blur, low sharpness, sensor noise, and distracting background clutter or reflections. Replace with clean studio lighting and a neutral backdrop across every cell.

- Perspective correction: straighten tilt, lens distortion, or handheld camera skew so the product reads as perfectly leveled and centered in every view.

Strict consistency rules (apply to every cell in the grid):

- Identical proportions, scale, shape, material finish, logo placement, logo size, label hierarchy, and typography across all views and all close-ups.

- Do not redesign, reinterpret, or restyle the product. Do not change its silhouette, size, color, branding, or materials beyond the specific corrections listed above.

- Any side, angle, or detail not visible in the references must be inferred strictly from the visible construction logic of the object (seams, symmetry, material continuity, standard design language of the category), never invented freely or filled with unrelated decoration.

- All readable text, logos, and labels must be reproduced exactly as shown in the references: correct spelling, exact wording, same font style, weight, and alignment. Do not invent new text, claims, logos, or details that are not present in the references.

Hard restrictions:

- No hands, no mannequins unless needed to hold shape, no lifestyle props, no decorative scene, no extra products, no added background elements.

- No cartoon or illustrative style. Must read as a real photographed object with accurate material behavior (fabric grain, glass refraction, metal specularity, plastic sheen, paper grain, as relevant to the product).

- Do not crop any full-body view; each of the five main views (hero, front, left profile, right profile, back) must show the entire product inside its cell.

Final output: A single hyperrealistic product reference sheet with clear visual hierarchy (hero view on top, four full-body angle views in a row, individual single-element close-up details below), a corrected, fully consistent version of the product across every cell, with all amateur photography defects and physical imperfections corrected while preserving the product's true identity.
```

Comprobaciones:
- Vista héroe arriba, cuatro vistas completas en una fila (frontal, perfil izquierdo, perfil derecho y trasera) y celdas de detalle con **un solo** elemento cada una.
- El mismo producto en todas las celdas, con logotipo, etiqueta y tipografía exactos a las referencias.
- Ninguna vista recortada. Sin manos, sin maniquíes, sin accesorios ni fondo añadidos.
- **Texto añadido:** el prompt dice que no se invente texto. Si la imagen trae título, lemas o rótulos que no estaban en las referencias, se avisa y se pregunta al usuario si los acepta. Pregunta abierta del autor **[?]**.

## 6. Boceto de tamaño relativo (personaje y producto)

Solo si hay producto. **Dato obligatorio: el tamaño aproximado del producto en centímetros.** Si el usuario no lo da, se pide; no se inventa. Referencias: la hoja de cuerpo y la hoja de producto **[H]**.

```text
Generame un boceto que represente el tamaño relativo entre estos dos elementos: {{PERSONAJE}} y {{PRODUCTO}}
Ten en cuenta que el {{PRODUCTO}} tiene más o menos un tamaño de {{TAMANO_CM}} cm
```

Variables: `{{PERSONAJE}}` el personaje (nombre y, si hace falta, su altura de la ficha), `{{PRODUCTO}}` el producto, `{{TAMANO_CM}}` el tamaño dado por el usuario. El texto es la plantilla corta del autor, en español **[?]**: el estilo del boceto no está definido, así que se revisa el resultado y se pregunta si se quiere otro estilo.

Comprobaciones:
- Aparecen el personaje y el producto, y la proporción entre ambos coincide con el tamaño dado y con la altura de la ficha.
- Sin texto inventado.

## Qué cambia respecto a los originales

- **Hoja de cuerpo:** el vestuario fijo (camiseta gris de manga larga, vaqueros azules y zapatillas blancas) pasa a `{{OUTFIT}}` y `{{TOP}}`, y los siete "her" pasan a `{{HER}}`. Nada más.
- **Hoja de outfit:** los tres "her" pasan a `{{HER}}`. Nada más.
- **Hoja de rostro:** idéntica al original. La versión plural cambia "reference image" por "reference images" (tres sitios).
- **Hoja de producto:** texto reconstruido a partir de un original dañado.
- **Boceto:** los marcadores `[personaje]`, `[producto]` y `Xcm` pasan a variables; la errata "[prodcuto]" se corrige a producto.
- **Retrato base:** propuesta de esta skill, no del autor.
