# Prompts de las hojas de personaje

Los dos prompts los aporta el autor de la skill y se usan tal cual. Solo se han hecho dos cambios, ambos marcados:

- **Hoja de cara:** se ha quitado un "2" sobrante delante de "Using" (venía así al copiarlo).
- **Hoja de cuerpo:** las partes que dependían de un personaje concreto ("sportswear", "her", "She") son variables `{{...}}` para que valga para cualquier persona.

Modelo por defecto para ambas: **GPT Image 2.5** (`gpt-image-2-5`), modo `i2i`, **16:9**. Ver `fase1-imagenes.md` para los comandos.

## Variables de la hoja de cuerpo

| Variable | Qué poner | Por defecto |
|---|---|---|
| `{{CATEGORIA}}` | Tipo de referencia: `sportswear`, `fashion`, `casual`, `streetwear`, `cosmetics`... Sale del brief | `sportswear` (el del prompt original) |
| `{{SHE}}` | `She` / `He` / `They` | `She` |
| `{{HER}}` | `her` / `his` / `their` | `her` |

Si la persona es `They`, revisa los verbos en singular que acompañan a `{{SHE}}` ("She must look" pasa a "They must look").

## Hoja de cara (3x3)

Referencia(s): la(s) foto(s) de identidad de la persona (1 o varias). Nada más.

```text
Using the reference image as the ONLY source of identity, generate a professional 3×3 character sheet showing the exact same person from multiple angles and expressions.
The identity must remain absolutely identical to the reference:
- Same facial structure
- Same eye shape and spacing
- Same nose
- Same lips
- Same jawline
- Same hairstyle and hairline
- Same skin tone
- Same proportions
- Same age
- Same ethnicity
- Same facial asymmetries and unique identifying features
Do NOT beautify, stylize, or reinterpret the person in any way.
Create a clean character sheet with nine evenly spaced portraits on a neutral light gray background.
Include:
• Front view (neutral)
• Left profile (90°)
• Right profile (90°)
• Left three-quarter view
• Right three-quarter view
• Slight downward gaze
• Slight upward gaze
• Serious expression
• Neutral expression
Lighting should be soft and perfectly consistent across every frame, similar to a professional modeling digitization session.
Hair, clothing, makeup and accessories must remain identical in every portrait.
The camera distance, focal length and framing should stay consistent throughout.
Ultra high realism.
Extremely accurate identity preservation.
No artistic interpretation.
No beauty filters.
No skin smoothing.
No extra accessories.
No background variation.
The final result should look like a facial identity reference sheet used by professional VFX, AAA game studios, or film character departments.
```

## Hoja de cuerpo (3 paneles)

Referencia(s): la(s) foto(s) de identidad y, si ya está aprobada, la hoja de cara (en ese orden). La hoja de cara es una **elección de la skill**, no viene en el prompt original: ayuda a fijar la identidad **[H]**.

```text
Task: Photorealistic single-reference character sheet transformation.

Use the attached images as the single and absolute source of truth for identity, facial structure, skin tone, hair, body proportions, clothing details, and overall likeness. If the source images contains multiple photos or angles, treat all of them as one identity reference set. If it contains only one photo, infer the missing views while preserving the same person exactly.

Create a clean three-panel character reference sheet in the same professional casting-sheet style: full-body front view, full-body back view, and a close-up portrait. Preserve the neutral studio backdrop, the vertical divider lines, the balanced spacing, the centered composition, and the high-end reference-sheet presentation.

Replace the subject in the layout with the person from the reference images, preserving {{HER}} exact identity across all three panels. {{SHE}} must look like the same real person in every view, not a reinterpretation.

Wardrobe:
Keep the outfit consistent with the reference images and adapt it naturally to the three-panel layout. Preserve any visible accessories from the source images that belong to {{HER}} identity and styling.

Panel structure:
- Front panel: full-body front view, natural confident stance, arms relaxed at {{HER}} sides, body facing camera.
- Back panel: full-body back view, same outfit, same proportions, accurate rear silhouette, same hairstyle and any source accessories preserved naturally.
- Close-up panel: head-and-shoulders portrait with {{HER}} natural face clearly visible, realistic skin texture, relaxed expression, and crisp photographic detail.

Preservation:
Strictly preserve {{HER}} facial identity, hairstyle, hair color, skin tone, body shape, pose logic, and overall realism. Preserve the clean neutral background, the studio clarity, the panel separation, and the high-end {{CATEGORIA}} reference-sheet look.

Restrictions:
Do not add text, logos, watermarks, extra accessories, clutter, dramatic makeup, or stylized effects. Do not change {{HER}} identity. Do not beautify excessively. Do not turn it into an illustration, CGI render, or fashion campaign.

Final result:
The image must look like a real high-end photorealistic character reference sheet for a {{CATEGORIA}} model, built from source images, with consistent identity across all panels.
```

### Variantes opcionales (solo si el brief lo pide)

**Outfit distinto al de la foto.** Sustituye el párrafo `Wardrobe:` por este, con el outfit real descrito pieza a pieza (prenda, color, tejido, calzado, complementos). No inventes marcas ni logos:

```text
Wardrobe:
{{OUTFIT_DESCRITO_PIEZA_A_PIEZA}}. The same outfit appears in all three panels, with identical fit, colours and fabric. Preserve any visible accessories from the source images that belong to {{HER}} identity and styling.
```

**El resultado no sale en tres paneles.** El prompt original habla de "the same ... style" y de "the layout" porque asume una plantilla visual. Si la hoja sale con otro número de paneles, añade esta línea tras el párrafo `Create a clean three-panel...` **[H]**, y avisa al usuario de que es un añadido:

```text
The image contains exactly three panels of equal height, side by side, separated by thin vertical divider lines: front full-body, back full-body, and close-up portrait.
```

## Qué mirar al revisar las hojas

Ver la lista de comprobación del punto de aprobación 1 en `fase1-imagenes.md`.
