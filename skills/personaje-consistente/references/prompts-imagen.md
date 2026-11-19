# Prompts de imagen

Todas las imágenes se generan con **Seedream 5.5** (`seedream-5-5`) en AILAB, salvo que el usuario pida otro modelo. Los parámetros salen siempre de `AILAB info seedream-5-5` y mandan sobre esta guía.

Niveles de confianza: **[D]** documentado o dato de la CLI, **[C]** comprobado generando en el ejemplo de `ejemplo-luis.md`, **[H]** decisión razonada, **[?]** hipótesis por validar.

## Reglas comunes

- **Límite de 5.000 caracteres por prompt [D].** La CLI rechaza el envío si se pasa (`--prompt supera 5000 caracteres`). Se cuenta siempre antes de `prepare`:

```bash
printf %s "$(cat "$D/<pieza>_vN.txt")" | wc -m
```

  Si no cabe, se acortan primero las variables de descripción (`{{WARDROBE}}`, `{{IDENTITY}}`, `{{BACK_DETAILS}}`) y después la frase de texturas del final. **Nunca** se recortan el bloqueo de cara, los paneles, la frase de marcas de piel ni las variantes A/B.
- Fondo: gris plano al 18 %. Luz plana sin sombras, sin ninguna luz incorporada. Sin grano.
- Realismo máximo: poros, lunares, pecas, cicatrices y marcas se conservan como parte de la identidad. Nada de embellecer.
- La relación de aspecto no va en el prompt: se elige con `--aspect_ratio`.
- Sin texto, etiquetas ni números en la imagen.
- "Image A" es la **primera** imagen adjunta, "Image B" la segunda y así sucesivamente. El orden de `--image_urls` importa.
- Los prompts están en inglés y las variables se rellenan en inglés.
- Cada prompt se guarda en `backup/descartes/<pieza>_vN.txt` y la imagen resultante con el mismo nombre base. Al aprobarla, la imagen se mueve a su sitio (`flujo-crear.md`) y el prompt a `backup/prompts/prompt_<pieza>.txt`. Variables de ruta (`$P`, `$H`, `$F`, `$R`, `$D`): `flujo-crear.md`.
- Se pueden reescribir si el usuario lo aprueba. Cuando se cambia una plantilla, la antigua no se guarda.

## Tabla de piezas

| Pieza | `--mode` | Referencias (`--image_urls`, en orden) | `--aspect_ratio` | `--resolution` |
|---|---|---|---|---|
| 1. Retrato base (solo personaje inventado) | `t2i` | ninguna | `3:4` | `2K` |
| 2. Hoja de rostro 3x3 | `i2i` | todas las del rostro (retrato base aprobado o fotos de la persona) | `16:9` | `2K` |
| 3. Hoja de 3 paneles (una por outfit) | `i2i` | A = hoja 3x3 aprobada · B = foto del outfit **recortada por debajo de la barbilla** · C = hoja de producto de un accesorio del cuello para arriba, si lo hay | `16:9` | `2K` |
| 4. Cambio permanente | `i2i` | retrato base aprobado o foto principal de frente | `3:4` | `2K` |
| 5. Reparación de prenda | `i2i` | foto del outfit | `3:4` | `2K` |
| 6. Hoja de producto (una por objeto) | `i2i` | todas las fotos del producto | `16:9` | `2K` |
| 7. Hoja de escala (una por objeto) | `i2i` | A = hoja de 3 paneles del outfit · B = hoja de producto | `16:9` | `2K` |

Coste en el ejemplo: unos 8 cr por imagen en `i2i` a 2K, a fecha 2026-11-18 **[C]**. El de `t2i` no se ha probado. El precio que vale siempre es el de `prepare`.

Comando tipo:

```bash
AILAB prepare seedream-5-5 --mode i2i \
  --prompt "$(cat "$D/cara-3x3_v1.txt")" \
  --image_urls "$F/foto-cara.png" \
  --aspect_ratio 16:9 --resolution 2K
AILAB submit <manifest_id_real> --confirmed --output "$D/"
```

Seedream 5.5 admite hasta 10 referencias **[D]**. Si la foto de partida viene en WebP, se convierte antes a PNG con `ffmpeg -i foto.webp foto.png`.

---

## 1. Retrato base (solo personaje inventado)

`t2i`, sin referencias, 3:4, 2K. Unos 3.000 caracteres más las variables.

```text
A clean character reference headshot of a character, in a vertical frame from the forehead down to the upper chest with the face filling most of the frame, a true close-up, not a portrait with space around it.

{{BUILD_AND_HERITAGE}} {{SKIN}} {{FACE_STRUCTURE}} {{EYES}} {{BROWS}} {{LASHES}} {{NOSE}} {{LIPS}} {{EARS}} {{HAIR}} {{MAKEUP}} {{IDENTITY_MARKERS}}

{{BASELINE_WARDROBE}}, no logos, no graphics, no jewelry beyond the identity markers described above. Body squared to camera, head level, neutral relaxed expression, eyes directly to camera, lips closed and relaxed, subtle controlled energy.

The skin carries real visible pores, fine natural texture, and natural unevenness of tone, never smoothed, never retouched, never beautified. Every identity marker sits exactly where described, at its exact size, shape, and color.

The background is a single flat 18% neutral gray field, one uniform value at every pixel corner to corner, identical directly beside the subject and in the far corners, with no seam line, no gradient, no hotspot, no vignette, and no falloff to lighter or darker anywhere in the frame. It is a flat color field, not a photographed backdrop: no surface, no wall, no corner, no horizon.

Relight from scratch: completely flat shadowless illumination, one enormous soft frontal source at camera position wrapping the subject evenly, matched equal fill from camera-left and camera-right at identical intensity, matched fill from above and below, so both sides of the face read at exactly the same brightness. No key-and-fill ratio, no modelling, no shadow side, no cheek triangle, no nose shadow, no under-chin shadow, no rim light, no hair light, no kicker, no specular hotspot. Extremely low contrast, even, milky, catalogue-flat. Form is described by bone structure, hair strands, and skin texture alone, not by light and shadow.

Absolutely zero shadow anywhere outside the subject. No cast shadow, no drop shadow, no soft darkening behind the shoulders or the head, no halo, no edge darkening, and no rim separating the figure from the field. Absolutely zero light bleed outside the subject: no spill, no glow, no reflected color cast from the skin or the clothing onto the background.

Skin reads matte, zero shine on forehead, nose bridge, cheekbones, temples, and chin, no oily T-zone. Skin renders at its true natural tone, warmth preserved against the neutral gray, never pale, washed-out, or cool-shifted by the background. Real peach fuzz at the jaw and hairline, subsurface scattering reading as semi-translucent biology, real hair rendered strand by strand with fine flyaways and baby hairs at the hairline, real fabric weave at the neckline, never plastic, never waxy, never glass-skin.

Even sharpness edge to edge across the entire frame. No depth-of-field falloff, no bokeh, no background blur, no vignette, no lens distortion, no flare, no bloom, no atmosphere. Photographed on a 50mm prime. Photographed not generated.
```

| Variable | Qué va |
|---|---|
| `{{BUILD_AND_HERITAGE}}` | Complexión, origen, sexo y edad aparente adulta en rango (`an adult woman, apparent age around thirty`) |
| `{{SKIN}}` | Tono, subtono y acabado |
| `{{FACE_STRUCTURE}}` | Forma de la cabeza, estructura ósea, mandíbula, barbilla y pómulos |
| `{{EYES}}` | Forma, profundidad, separación, inclinación, pliegue del párpado, color del iris y sus variaciones, anillo exterior del iris, zona bajo el ojo |
| `{{BROWS}}`, `{{LASHES}}`, `{{NOSE}}`, `{{EARS}}` | Forma de cada uno |
| `{{LIPS}}` | Volumen, arco de Cupido, surco del labio superior, anchura, comisuras, color y textura |
| `{{HAIR}}` | Color de raíz a puntas, largo, textura, raya, caída, línea del pelo y pelillos. Vello facial si lo hay |
| `{{MAKEUP}}` | Maquillaje por defecto, si lo hay |
| `{{IDENTITY_MARKERS}}` | Lunares, pecas, cicatrices, piercings y tatuajes, situados respecto a un punto fijo de la cara |
| `{{BASELINE_WARDROBE}}` | `She wears a plain black thin-strap camisole` / `He wears a plain black ribbed tank` |

Todo sale de la sección 2 de `LEEME.md` ("Quién es"). Lo que el usuario no haya dado no se inventa: se pregunta.

---

## 2. Hoja de rostro 3x3

Referencias: todas las del rostro. `i2i`, 16:9, 2K. Unos 4.600 caracteres **[C]**.

Versión de una referencia. Con varias: "reference image" pasa a "reference images" en Task, en "Use the provided" y en Preservation, y "visible in the reference" pasa a "visible in the references".

```text
Task: Edit the character sheet generation to strictly integrate specific facial expressions across the grid portraits based on the reference image.

Use the provided reference image as the absolute and ONLY source of truth for the character's facial identity, structure, skin tone, hair, and unique features.

Generate a professional 3×3 character sheet showing the exact same person from multiple angles and expressions on a flat 18% neutral gray field:

The identity must remain absolutely identical to the reference: same facial structure, eye shape and spacing, nose, lips, jawline, hairstyle and hairline, skin tone, proportions, age, ethnicity, and facial asymmetries.
Every skin detail is part of the identity: every mole, freckle, beauty mark, scar, pore, fine line, and skin mark visible in the reference appears in the same position, size, shape, and color in every portrait where that area is visible. Nothing is removed, softened, faded, moved, or added.
Do NOT beautify, stylize, or reinterpret the person in any way.
Include nine evenly spaced portraits covering a mix of angles and expressions.
Mandatory expressions to include across the grid:
At least one portrait must show an angry expression with a distinctly furrowed brow and tight jaw.
At least one portrait must show a subtle, friendly smile where the teeth are softly and naturally visible.
Hair, clothing, makeup, and accessories must remain identical in every portrait.
Camera distance, focal length, and framing should stay consistent throughout.

The background of every panel is a single flat 18% neutral gray field, one uniform value at every pixel corner to corner, identical directly beside the subject and in the far corners, with no gradient, no hotspot, no vignette, and no falloff to lighter or darker anywhere in the panel. It is a flat color field, not a photographed backdrop: no surface, no wall, no corner, no horizon.

Relight from scratch overriding any reference lighting: completely flat shadowless illumination, one enormous soft frontal source at camera position wrapping the subject evenly, matched equal fill from camera-left and camera-right at identical intensity, matched fill from above and below, so both sides of the face read at exactly the same brightness. No key-and-fill ratio, no modelling, no shadow side, no cheek triangle, no nose shadow, no under-chin shadow, no rim light, no hair light, no specular hotspot. Extremely low contrast, even, catalogue-flat. Form is described by bone structure, hair strands, and skin texture alone, not by light and shadow. The lighting is identical in all nine panels.

Absolutely zero shadow anywhere outside the subject. No cast shadow, no drop shadow, no soft darkening behind the shoulders or the head, no halo, no edge darkening, and no rim separating the figure from the field. Absolutely zero light bleed outside the subject: no spill, no glow, no reflected color cast from the skin or the clothing onto the background.

Skin reads matte, zero shine on forehead, nose bridge, cheekbones, temples, and chin, no oily T-zone. Skin renders at its true natural tone, warmth preserved against the neutral gray, never pale, washed-out, or cool-shifted by the background. Real pore texture exactly as in the reference, real peach fuzz at the jaw and hairline, subsurface scattering reading as semi-translucent biology, real hair rendered strand by strand with fine flyaways at the hairline, never plastic, never waxy, never glass-skin.

Even sharpness edge to edge across every panel. No depth-of-field falloff, no bokeh, no background blur, no vignette, no lens distortion, no flare, no bloom, no atmosphere. Photographed on a 50mm prime. Photographed not generated.

Preservation:

Strictly preserve identity consistency, facial realism, every skin mark, and accurate anatomical proportions from the reference image.
Maintain the flat 18% neutral gray field and the same flat shadowless lighting across all nine panels.
Restrictions:

No artistic interpretation.
No beauty filters.
No skin smoothing, no retouching, no blemish removal.
No extra accessories or background variation.
No text, labels, or numbering anywhere in the image.
Do not alter the core identity or facial features.
Final result:

A real high-end photorealistic 3×3 facial identity reference sheet used by professional VFX, AAA game studios, or film character departments, featuring precise identity consistency, every skin mark preserved exactly, flat shadowless lighting on a neutral gray field, an angry expression with a furrowed brow, and a subtle, friendly smile with visible teeth.
```

La 3x3 se mantiene aunque luego exista el clip de referencia: el clip es opcional y, si existe, sustituye a la 3x3 en las escenas.

---

## 3. Hoja de 3 paneles (una por outfit)

Paneles: izquierda, cuerpo entero de frente **sin cabeza** · centro, cuerpo entero de espaldas **con cabeza** · derecha, primer plano **con cabeza**. `i2i`, 16:9, 2K. El outfit se reproduce tal cual, gafas de sol y accesorios incluidos. El primer plano existe para enseñar todo lo que va del cuello para arriba.

### Antes de generar

1. **Recorta la foto del outfit por debajo de la barbilla [C].** Si la foto del outfit enseña la cara de otra persona, esa cara se mezcla con la del personaje en el primer plano aunque el prompt diga que no se use. En el ejemplo, la v1 salió con los ojos marrones y el bigote del modelo de la foto. La v2, con la foto recortada, salió bien.

```bash
ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$F/foto-<outfit>.png"
# Mira dónde acaba la barbilla (y) y recorta desde ahí hasta abajo:
ffmpeg -i "$F/foto-<outfit>.png" -vf "crop=iw:ih-<y>:0:<y>" \
  "$F/foto-<outfit>_sin-cara.png"
```

   Se enseña el recorte antes de usarlo. Debe quedar el cuello de la prenda entero y nada de la cara.
2. **Accesorios del cuello para arriba** (gafas, gorra, pendientes): al recortar se pierden de la foto. Se describen en `{{NECK_UP_ACCESSORIES}}` y, si el usuario quiere fidelidad total, se hace primero su hoja de producto (sección 6) y se adjunta como Image C **[H]**.
3. **Elige la variante del panel izquierdo** según el cuello de la prenda (A o B, abajo).
4. Pide al usuario la **altura en cm**, la **complexión** y si tiene **marcas en el cuerpo**. No se inventan.

### Plantilla (versión compacta, cabe en 5.000 caracteres)

Con las variables rellenas, el ejemplo midió 4.960 caracteres **[C]**. Hay poco margen: `{{WARDROBE}}` no debería pasar de unos 750 caracteres ni `{{IDENTITY}}` de unos 350.

```text
A three-panel character reference sheet in one horizontal frame, three equal vertical panels with thin clean separation, the same figure and outfit identical across all three. No text, labels, or numbering anywhere.

{{REFERENCE_ROLES}}

{{IDENTITY}}

{{WARDROBE}}

{{LEFT_PANEL}}

CENTER PANEL: full body rear, head attached, from above the crown to {{SHOES_OR_HEM}}, dead-on from directly behind, shoulders and hips square and level, spine centered, arms at the sides, feet parallel. No turn, no twist, no glance back. {{BACK_DETAILS}}

RIGHT PANEL: tight chest-up face lock from just above the crown to the collarbones, the face filling the panel. Head dead-on and level, both ears equally visible, eyes into the lens, neutral expression, lips closed and relaxed. No turn, no tilt, no chin lifted or dropped. {{NECK_UP_ACCESSORIES}} {{BOTTOM_OF_FRAME}} The face is exactly the frontal portrait of Image A, never a new face: {{FACE_LOCK}}. Maximum detail.

Every mole, freckle, scar, pore, and skin mark from Image A appears in the same position, size, shape, and color in every panel where that area is visible. Nothing removed, softened, moved, or added. Skin tone identical across face, neck, arms, and hands.

Background of every panel: one flat 18% neutral gray field, a single uniform value corner to corner and identical in all three panels, no seam, gradient, hotspot, or vignette. A flat color field, not a backdrop: no floor, wall, corner, horizon, or plane to stand on.

Relight from scratch overriding the references: completely flat shadowless light, one enormous soft frontal source at camera with equal fill from left, right, above, and below, both sides of the face equally bright. No modelling, no shadow side, no nose or under-chin shadow, no rim, hair, or kicker light, no specular hotspot. Extremely low contrast, catalogue-flat.

Zero shadow outside the subject: no cast, contact, floor, or drop shadow, no occlusion or darkening behind the body or beneath the hem, no halo or edge darkening. Zero light bleed, spill, glow, or color cast onto the background.

Matte skin, zero shine, true natural tone and true wardrobe color, never pale or cool-shifted. Real pores as in Image A, hair strand by strand, {{MATERIAL_DETAIL}}, never plastic, waxy, smoothed, or retouched. Even sharpness edge to edge, no depth of field, bokeh, distortion, flare, bloom, or atmosphere. Photographed on a 50mm prime. Photographed not generated.
```

### `{{REFERENCE_ROLES}}`

Con foto del outfit (lo normal):

```text
Image A, the first attached image, is a 3×3 facial identity sheet: the only source of truth for the face, bone structure, skin tone, every skin mark, and the hair. Its grid, background, and clothing are never reproduced. Image B, the second attached image, is the outfit reference, cropped below the chin: the only source of truth for the garments, footwear, and accessories, reproduced exactly, nothing removed, changed, or added. Its body, pose, background, and lighting are never used.
```

Sin foto del outfit: solo la primera parte (Image A) más `The outfit comes only from the description below.`

Con hoja de un accesorio del cuello para arriba, se añade: `Image C, the third attached image, is the product sheet for the {{ACCESSORY}}: the only source of truth for its shape, color, and detail.`

Línea de material (opcional, si la foto engaña con el tejido): `The {{GARMENT}} reference resolves cut and construction only; its {{WRONG_MATERIAL}} is not used.`

### Variante A · maniquí invisible (la prenda tiene cuello)

Cuello alto, vuelto, redondo, de polo, de camisa o de chaqueta, capucha, tirantes de canalé, cremallera cerrada hasta la garganta. Funcionó a la primera en el ejemplo **[C]**.

```text
LEFT PANEL: full body front view, no head, no neck, no hair, from the shoulders down to {{SHOES_OR_HEM}}. Dead-on to camera: shoulders and hips square and level, arms relaxed at the sides, hands open and loose, feet parallel pointing at camera, weight even. No turn, no twist, no contrapposto, no dropped shoulder, no foot turned out. Nothing rises above the shoulder line. The {{COLLAR}} holds its own three-dimensional shape and its opening is an empty dark hollow looking into the garment, the inner back fabric faintly visible. The {{TOP}} reads as worn by an invisible body with full volume, natural drape, and real tension across chest and shoulders, nothing emerging from the neckline. No stump, skin, cut edge, or anatomy; not blurred, faded, or ghosted. Generous empty headroom above the shoulders, normal full-body scale.
```

Con collar o gargantilla: `{{NECKLACE}} still sits around the empty collar opening, resting on the fabric.`

### Variante B · corte limpio (escote u hombros al aire)

Palabra de honor, tubo, halter, tirantes finos, escote amplio o cuadrado, V bajo la clavícula, bralette. Sin probar todavía con Seedream 5.5 **[?]**.

```text
LEFT PANEL: full body front view, headless, no hair, from the shoulders down to {{SHOES_OR_HEM}}. Dead-on to camera: shoulders and hips square and level, arms relaxed at the sides, hands open and loose, feet parallel pointing at camera, weight even. No turn, no twist, no contrapposto, no dropped shoulder, no foot turned out. No hair falls across the chest or shoulders. The neck rises a short way and ends in a clean, flat, sharply defined horizontal edge at the base of the throat, like a headless dress-form mannequin: a crisp sculptural cut, not blurred, faded, or ghosted, no blood, no anatomy at the cut, only empty field above it. Generous empty headroom above the shoulders, normal full-body scale.
```

Con collar o gargantilla: `{{NECKLACE}} still sits around the base of the throat below that edge, resting against the skin.`

### Variables

| Variable | Qué va | Ejemplo (de `ejemplo-luis.md`) |
|---|---|---|
| `{{IDENTITY}}` | Sexo, altura en cm, complexión, tono de piel igual a Image A, marcas del cuerpo, uñas. La cara no se describe aquí | `The figure is a man 183cm tall, slim build with lean defined muscle: broad straight shoulders, toned chest and arms, narrow waist, long legs, nothing bulky. Neck, arm, and hand skin match the face tone in Image A exactly. No tattoos, no body marks. Short clean natural nails.` |
| `{{WARDROBE}}` | Cada prenda de arriba abajo, calzado y joyas, con lo que se ve en la foto. Termina diciendo lo que **no** lleva | ver el ejemplo |
| `{{LEFT_PANEL}}` | Variante A o B | |
| `{{SHOES_OR_HEM}}` | `the soles of the shoes` / `the hem` | |
| `{{COLLAR}}` y `{{TOP}}` | Solo variante A: el cuello concreto y la prenda | `johnny collar` · `polo` |
| `{{BACK_DETAILS}}` | Pelo por detrás, espalda de la prenda, cintura, bajo y calzado por detrás | `Short dark hair at the nape, the polo collar folded down at the back of the neck, hem tucked into the black waistband, wide legs falling straight to the loafers.` |
| `{{NECK_UP_ACCESSORIES}}` | Todo lo del outfit del cuello para arriba, tal cual. Vacía si no hay | `The black sunglasses sit on the bridge of the nose exactly as in Image C.` |
| `{{BOTTOM_OF_FRAME}}` | Qué asoma abajo en el primer plano | `The open johnny collar and the top of the V placket show at the bottom.` |
| `{{FACE_LOCK}}` | Los rasgos de Image A que más se desvían: color de ojos, vello facial, anchura de cara | `the same hazel-green eyes, brows, nose, ears, jaw, and face width, the same full stubble beard, and the same moustache shape and thickness` |
| `{{MATERIAL_DETAIL}}` | Texturas reales del outfit | `real knit rib texture, real metal on the ring` |

`{{FACE_LOCK}}` arregló la deriva de la cara junto con el recorte de la foto **[C]**. Se escribe mirando la 3x3 aprobada, no la foto del outfit.

---

## 4. Cambio permanente

Referencia: retrato base aprobado o foto principal de frente. `i2i`, 3:4, 2K. Tras este bloque va el mismo bloque de piel, fondo, luz y nitidez del retrato base, desde "The skin carries real visible pores..." hasta el final.

```text
A clean character reference headshot of the same character as the attached reference, in a vertical frame from the forehead down to the upper chest with the face filling most of the frame.

{{CHANGE}}

Everything about the character other than {{CHANGE_SHORT}} is identical to the attached reference and unchanged: the same head shape, the same bone structure, the same jaw and chin, the same cheekbones, the same eye shape and spacing and tilt, the same iris color, the same brow shape, the same nose, the same lips and mouth width, the same ears, the same skin tone and texture, the same build and proportions, and every existing mole, freckle, scar, and identity marker in the same position, size, shape, and color. Only {{CHANGE_SHORT}} is different.

The same clothing as in the attached reference, no logos, no graphics. Body squared to camera, head level, neutral relaxed expression, eyes directly to camera, lips closed and relaxed.
```

| Cambio | ¿Retrato con el cambio? | Qué se regenera |
|---|---|---|
| Pelo, piercing facial, cicatriz facial, maquillaje permanente | Sí | 3x3, todas las hojas de 3 paneles, las de escala y el clip si existe |
| Cambio de cuerpo | Sí | Lo mismo |
| Tatuaje o marca en cuerpo o manos, piercing de oreja tapado | No | Hojas de 3 paneles y de escala donde se vea |
| Envejecer o rejuvenecer | No | Personaje nuevo desde cero |
| Personalidad, gestos, forma de moverse | No | Ficha, y clip si existe |
| Voz | No | Voz, vídeo negro y clip si existe |

---

## 5. Reparación de prenda (solo si una prenda sale genérica)

No hay estación de cambio de outfit: cada outfit tiene su hoja de 3 paneles. Esta pieza solo se usa cuando una prenda concreta sale mal. Referencia: foto del outfit. `i2i`, 3:4.

```text
A garment reference of a single {{GARMENT_TYPE}} worn on an invisible body, holding its full three-dimensional worn shape.

{{GARMENT_DETAIL}}

There is no head, no neck, no hands, and no body anywhere in the frame: the garment reads as worn by an invisible figure with full volume, natural drape, and real fabric tension across the chest and shoulders, every opening an empty dark hollow looking into the inside of the garment with the inner back faintly visible. No stump, no skin, no cut edge, no anatomy, no mannequin form, no hanger, no stand, not blurred, not faded, no ghosting, no transparency.

The background is a single flat 18% neutral gray field, one uniform value corner to corner, not a photographed backdrop: no surface, no floor, no wall. Completely flat shadowless illumination, one enormous soft frontal source with matched fill on both sides, no shadow side, no rim light. Absolutely zero shadow and zero light bleed outside the garment. Real fabric weave, stitching, and hardware detail at maximum sharpness, true natural color. Even sharpness edge to edge, no depth of field, no vignette. Photographed not generated.
```

Después se rehace la hoja de 3 paneles añadiendo la prenda reparada como siguiente imagen y esta línea en `{{REFERENCE_ROLES}}`:

```text
Image C, the third attached image, is a garment reference for the {{GARMENT_TYPE}}: it is the only source of truth for that garment's construction, fabric, color, and detail, and it overrides Image B for that garment only.
```

---

## 6. Hoja de producto (una por objeto)

Cada objeto que el personaje sostiene, lleva puesto o carga tiene hoja de producto. Referencias: todas las fotos del producto, aunque sean de aficionado. `i2i`, 16:9, 2K. Una versión larga medía 5.318 caracteres y no cabe en Seedream: esta es la versión compacta, con las mismas instrucciones, fondo gris al 18 % y sombra cero **[H]**. Sin probar todavía **[?]**.

```text
Task: a professional product reference sheet in a structured grid, using the attached amateur photos of the product as the single source of truth for its identity, correcting amateur photography defects and physical imperfections to produce a commercial-grade documentation sheet.

References: treat all attached images as informal photos of the same physical product (uneven light, handheld angles, cluttered backgrounds, blur, reflections, framing errors). Extract its true identity: exact shape, proportions, logo, label design, typography, color palette, material, and construction. This identity stays 100% consistent across every view and crop.

Layout, on a single flat 18% neutral gray field, one uniform value corner to corner, not a photographed surface, with generous even spacing and a clear hierarchy:
- Top row, largest cell: one three-quarter hero view of the full product, its clearest angle.
- Second row: four full-body views at equal size: front, left profile, right profile, back. The same product in all four, upright, centered, isolated.
- Bottom rows: close-up detail cells, exactly ONE physical element per cell (main logo or label, closure, cap, zipper or button, a material texture, a secondary mark or seam). Never split one element across cells, never combine two in one cell.

Every cell is sharply focused, evenly and softly lit, with the same flat gray field and no cast shadow.

Corrections, applied only where relevant:
- Fabric: remove creases and bunching that are not part of the design; smooth, shaped, natural volume, as if steamed on an invisible form.
- Liquid containers: refill to a realistic commercial fill level; caps, lids, pumps, and corks closed and seated.
- Rigid packaging: remove dents, crushed corners, and warping; labels flush and level.
- Any surface: remove dust, fingerprints, smudges, scratches, condensation, and lint that are accidental, not intended texture.
- Photography: remove color casts, harsh shadows, blur, noise, clutter, and reflections; straighten tilt, lens distortion, and skew so the product reads level and centered.

Consistency in every cell: identical proportions, scale, shape, finish, logo placement and size, label hierarchy, and typography. Do not redesign, restyle, or change silhouette, size, color, branding, or materials beyond the corrections above. Any side not visible in the references is inferred from the visible construction logic (seams, symmetry, material continuity), never invented. All text, logos, and labels are reproduced exactly: spelling, wording, font style, weight, alignment. No new text, claims, logos, or details.

Hard restrictions: no hands, no mannequins unless needed to hold shape, no props, no scene, no extra products, no added background elements. No cartoon or illustration: a real photographed object with accurate material behavior (fabric grain, glass refraction, metal specularity, plastic sheen, paper grain). No full-body view is cropped: the hero and the four main views show the entire product.

Absolutely zero shadow anywhere outside the product: no cast shadow, no contact shadow, no floor shadow, no reflection of the product on the field. Light on the product stays soft and even, with only the reflections its real material needs to read true. Even sharpness edge to edge, no depth of field, no vignette.

Final output: one hyperrealistic product reference sheet, hero view on top, four full-body views in a row, single-element close-ups below, the product corrected and fully consistent in every cell while keeping its true identity.
```

---

## 7. Hoja de escala (obligatoria por cada objeto antes de cualquier vídeo)

Vale para objetos sostenidos (libreta en la mano), puestos (gorra) o cargados (ordenador bajo el brazo). Ninguna escena de vídeo con un objeto se prepara sin su hoja de escala aprobada. Referencias: A = hoja de 3 paneles del outfit · B = hoja de producto. `i2i`, 16:9, 2K. Archivo: `Escala_<objeto>.png`. Sin probar todavía **[?]**.

```text
A two-panel scale reference composed as one horizontal frame, divided into two equal vertical panels side by side with thin clean separation. No text, no labels, no numbering anywhere in the image.

Image A, the first attached image, is the character sheet: it is the only source of truth for the face, body, proportions, skin, every skin mark, hair, and outfit. Its panel layout and the headless front view are never reproduced; the figure here always has its head. Image B, the second attached image, is the product sheet: it is the only source of truth for the product's shape, proportions, materials, colors, logo, and printed text, reproduced exactly. Its grid layout is never reproduced.

THE SCALE: the figure stands {{HEIGHT_CM}}cm tall. {{PRODUCT}} measures {{SIZE_CM}}cm {{DIMENSION}}, {{BODY_COMPARISON}}. The product keeps this exact size against the body in both panels, never enlarged, never shrunk.

LEFT PANEL: full body front view, head attached, from above the crown to the soles of the shoes, with clear gray margin above and below. The figure faces the camera dead-on, shoulders and hips square to the lens and level, weight even across both feet, with {{PRODUCT}} {{HOW_CARRIED}}. The whole figure and the whole product stay inside the panel so the proportion reads.

RIGHT PANEL: close-up of {{CONTACT_ZONE}}, where {{PRODUCT}} meets the body, the product's front face turned to the lens and fully visible, its logo and text sharp and readable, held, worn, or carried the way a real object of this size and weight would be.

Every mole, freckle, scar, tattoo, and skin mark from Image A appears in the same position, size, shape, and color wherever that area is visible. Nothing is removed, softened, moved, or added. Real pore texture, never smoothed, never retouched.

The background of both panels is a single flat 18% neutral gray field, one uniform value corner to corner, not a photographed backdrop: no surface, no floor, no wall. Completely flat shadowless illumination on the figure from a soft frontal source with matched fill on both sides, no shadow side, no rim light. Absolutely zero shadow and zero light bleed outside the figure and the product. The product keeps only the reflections its real material needs. Even sharpness edge to edge, no depth of field, no vignette. Photographed on a 50mm prime. Photographed not generated.
```

| Variable | Ejemplo |
|---|---|
| `{{HEIGHT_CM}}` | `183` (de la ficha) |
| `{{PRODUCT}}` | `the frosted glass perfume bottle` |
| `{{SIZE_CM}}` + `{{DIMENSION}}` | `12` + `tall` (lo da el usuario, no se inventa) |
| `{{BODY_COMPARISON}}` | `about the length of his hand from wrist to fingertip` (lo propone la skill y lo aprueba el usuario) |
| `{{HOW_CARRIED}}` | `in his right hand at chest height` / `worn on his head, the brim facing forward` / `tucked under his left arm, pressed against his ribs` |
| `{{CONTACT_ZONE}}` | `the hand and torso` / `the head and forehead` / `the arm and side of the ribs` |

Si es un arma: `held at rest and presented to the lens, never aimed at anyone, no firing, no strikes`.

---

## Revisión de cada imagen

Se revisa antes de enseñarla y se dice lo que se ve, sin suavizar un fallo.

### Comparar la cara con la 3x3 (obligatorio en 3 paneles y escala)

Se recorta la cara del resultado y la frontal de la 3x3 y se ponen lado a lado. A ojo no basta: la deriva de la v1 del ejemplo solo se vio clara así **[C]**.

```bash
TMP="<carpeta temporal>"
ffmpeg -y -i "$D/<outfit>-3paneles_vN.png" -vf "crop=<w>:<h>:<x>:<y>" "$TMP/cara-hoja.png"
ffmpeg -y -i "$H/Image1_cara-3x3.png" -vf "crop=<w>:<h>:<x>:<y>" "$TMP/cara-3x3.png"
ffmpeg -y -i "$TMP/cara-3x3.png" -i "$TMP/cara-hoja.png" -filter_complex "[0]scale=-1:560[a];[1]scale=-1:560[b];[a][b]hstack" "$TMP/comparar.png"
```

Se mira, rasgo por rasgo: color de ojos, cejas, nariz, anchura de cara, vello facial (forma y densidad), lunares y marcas, pelo. Si un rasgo cambia, **la hoja no se aprueba**: es un fallo grave de identidad.

### Medir el fondo

```bash
for c in "60:60:20:20" "60:60:<x>:20" "60:60:20:<y>"; do
  ffmpeg -hide_banner -i "<imagen>" -vf "crop=$c,signalstats,metadata=print" -f null - 2>&1 | grep -m1 -o "YAVG=[0-9.]*"
done
```

El 18 % de gris son unos 118 sobre 255. Seedream 5.5 lo saca algo más claro (de 125 a 158 en las dos hojas del ejemplo) y a veces se aclara hacia abajo, como si insinuara un suelo **[C]**. Se informa del valor. Es un fallo menor: no justifica regenerar salvo que el usuario quiera el gris exacto.

### Lista por pieza

| Pieza | Qué se comprueba |
|---|---|
| 3x3 | Identidad en los nueve retratos, cada marca de piel en su sitio, un retrato enfadado con ceño y mandíbula tensa, una sonrisa con dientes, misma ropa, sin texto, encuadre parecido |
| 3 paneles | Cara igual a la 3x3 (comparación lado a lado), panel izquierdo sin cabeza y con la variante correcta, espalda de frente y con cabeza, cada prenda y cada detalle del outfit (botones, anillas, costuras), calzado, accesorios del cuello para arriba, marcas de piel |
| Producto | Vista héroe, cuatro vistas completas, un solo elemento por celda de detalle, logotipo y texto exactos, sin texto inventado |
| Escala | Cara igual a la 3x3, proporción producto y cuerpo según los cm, forma de llevarlo, logotipo legible |
| Todas | Fondo gris (medido), luz casi plana, sin sombra fuera del sujeto, sin texto ni números |

Fallos menores vistos en el ejemplo y aceptados **[C]**: queda algo de modelado suave bajo la nariz y la barbilla aunque el prompt pida luz plana; el gris cambia un poco de un panel a otro; en la espalda, unos mocasines marrón oscuro se ven casi negros.
