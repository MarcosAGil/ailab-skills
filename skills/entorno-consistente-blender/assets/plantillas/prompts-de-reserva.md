# Prompts de reserva para Nano Banana 2.1

Úsalos si el usuario no quiere gastar en Image Prompter, si el asistente no responde o para revisar que el prompt que devuelve Image Prompter cumple las reglas. Rellena lo que va entre `<>`. Siempre en inglés. Ejemplos reales completos en `assets/ejemplos/prompts-reales/`.

## 1. Vista maestra (la primera, la más parecida a la referencia)

Imágenes: 1 = render de la vista · 2 = referencia original del usuario.

```
Image 1 is a 3D render of a room. Image 2 is a photograph that shows the target look. Turn Image 1 into a photorealistic photograph with the look and materials of Image 2.

Keep from Image 1 exactly: the camera angle, framing and lens; the position, size and proportions of every object; the layout of every frame, photo and object on the walls, and what each picture shows; <elementos clave del espacio>. Do not add, remove, move or resize anything. Do not add doorways, windows, lamps, plants or extra furniture.

Take from Image 2: the materials and the photographic quality. <materiales concretos>. Soft white daylight coming from behind the camera, gentle soft shadows, bright and even exposure, natural photographic detail and fine film grain. No new text, logos or watermarks.
```

## 2. Vista nueva del espacio (sin personajes)

Imágenes: 1 = render de la vista · 2 = maestra · 3 = segunda vista aprobada (opcional, recomendable).

```
Image 1 is a 3D render of a room: <descripción de la vista: desde dónde se mira, primer plano, medio, fondo>. Images 2 and 3 are photographs of the same room from other angles. Turn Image 1 into a photorealistic photograph of this exact room, so that it looks like another photo taken in the same place on the same day.

Composition comes only from Image 1. Keep exactly: the camera angle, framing and lens; the position, size and proportions of every object; the layout of every frame, photo and object on the walls, and what each picture shows. Do not add, remove, move or resize anything. Do not add doorways, windows, lamps, plants or extra furniture.

Appearance comes from Images 2 and 3. Every element must look identical to its version in those photos: <lista de materiales y objetos>, the same lighting and colour grading. Soft white daylight, gentle soft shadows, bright and even exposure, natural photographic detail. No new text, logos or watermarks.
```

Si hay vacío alrededor (pared quitada, maqueta, cenital): añade a la descripción "surrounded by a plain neutral grey studio background; keep it".

## 3. Vista con personajes (maniquíes en el render)

Imágenes: 1 = render con maniquíes · 2 y 3 = vistas aprobadas del espacio · después, por personaje: cara, cuerpo, objetos que lleva.

```
Image 1 is a 3D render of a room: <descripción de la vista>. A <color> mannequin marks <personaje A>: <posición en el encuadre, pose exacta con su lado izquierdo/derecho, hacia dónde mira>. <Igual con cada maniquí.> Images 2 and 3 are photographs of the same room from other angles. Turn Image 1 into a photorealistic photograph of this exact room and this exact moment.

Composition comes only from Image 1. Keep exactly: the camera angle, framing and lens; the position, size and proportions of <muebles y objetos clave>; the position, height and pose of every person as marked by the mannequins. Do not add, remove, move or resize anything. Do not add doorways, windows, lamps, plants or extra furniture.

Appearance of the room comes from Images 2 and 3: <materiales>, the same lighting and colour grading.

<Personaje A> is the person in Images <x> and <y>: same face, <pelo>, same <ropa completa y calzado>. <Accesorios y cómo los lleva>.

Soft white daylight, gentle soft shadows, bright and even exposure, natural photographic detail. No new text, logos or watermarks <apart from ...>.
```

## 4. Añadir un personaje a una imagen ya aprobada, con la pose de una foto

Imágenes: 1 = imagen aprobada · 2 = foto con la pose (solo la pose) · después, hojas del personaje y objetos.

```
Edit Image 1 and keep everything else exactly the same: <todo lo que ya hay>, camera angle, framing and lighting.

Only one change: add the <personaje> from Images <x> and <y> <dónde exactamente, con referencias a objetos de la imagen>.

His/her pose is exactly the pose of the person in Image 2: <descripción de la pose>. Take only the pose from Image 2, not the clothes, accessories or objects.

<Personaje> is the person in Images <x> and <y>: <cara, pelo, ropa, calzado, accesorios>.

Same scale and perspective as <objeto de referencia de tamaño>, same soft white daylight and colour grading. No new text, logos or watermarks.
```

## 5. Corrección de detalles

Imágenes: 1 = imagen que se corrige · después, referencias de lo que tiene que aparecer.

```
Edit Image 1 and keep everything else exactly the same: same people, poses, room, framing and lighting.

Only <one / two> change(s):
1. <qué está mal> -> <cómo debe quedar>, <referencia: "exactly like in Image 2">.
2. <...>
```

Después de generar, si el modelo tocó algo más (quitó un personaje, cambió la luz, reencuadró): `mascara.py` sobre la zona corregida y `componer_parche.py` para pegar solo esa zona sobre la imagen buena.
