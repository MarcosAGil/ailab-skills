# 05 · Recortes de la referencia (cuadros, fotos, objetos únicos)

Para lo que es único del espacio (cuadros, fotos, pósters, objetos colgados, un logo): se recorta de la imagen de referencia, se le quita la perspectiva y se pega en su sitio en Blender. Así la IA ve exactamente qué hay en cada cuadro y no lo reinventa.

## Paso a paso

1. **Medir esquinas.** `python3 -I scripts/cuadricula_medicion.py <referencia> <carpeta_salida> x0,y0,x1,y1:zoom [...]` genera ampliaciones con cuadrícula cuyas etiquetas son píxeles de la imagen original (zoom 2 para paredes cercanas, 3 para lejanas). Léelas tú y anota las cuatro esquinas de cada cuadro.
2. **Escribir `recortes.json`** (formato en la cabecera de `scripts/recortar_y_enderezar.py`) con el tamaño real en metros que tiene cada objeto en Blender:
   - `"planos"`: cuadros y objetos rectangulares. Esquinas en orden arriba-izquierda, arriba-derecha, abajo-derecha, abajo-izquierda.
   - `"siluetas"`: objetos irregulares con transparencia. Máscaras: `no_madera` (quita el color de fondo definido en `"fondo"`), `elipse` (objetos redondos), `tono` (conserva un rango de tono HSV).
3. **Ejecutar:** `python3 -I scripts/recortar_y_enderezar.py <referencia> recortes.json texturas/galeria/`. Revisa `_control.jpg`: si a una silueta le queda fondo, cambia su máscara.
4. **Pegar en Blender** con `mat_imagen()` y `pegar_en_frente(obj, mat, col, pared="-Y")`: plano 0,6 mm delante de la cara visible con UV a toda la cara. Objetos irregulares: plano a 1,2 cm de la pared, alto igual al objeto y ancho según la proporción del recorte, con `alpha=True`.
5. **Comprobar solapes:** `solapes(objetos_de_la_pared)` debe devolver una lista vacía.

## Orden de esquinas al pegar (vistas DESDE DELANTE)

- Pared que mira a −Y (se ve con +X a la derecha): `(mn.x, y, mn.z), (mx.x, y, mn.z), (mx.x, y, mx.z), (mn.x, y, mx.z)` con `y = mn.y − 0,0006`.
- Pared que mira a −X (se ve con +Y a la izquierda): `(x, mx.y, mn.z), (x, mn.y, mn.z), (x, mn.y, mx.z), (x, mx.y, mx.z)` con `x = mn.x − 0,0006`.
- Criterio general: "abajo-izquierda del espectador primero". `pegar_en_frente` ya lo resuelve para −Y, −X y +X.

## Cuándo NO recortar

Superficies repetibles (paredes, suelos, telas): textura CC0 (`04-estetica-materiales-luz.md`). Objetos con forma 3D clara (sofás, máquinas): se modelan. Solo se recorta lo plano o casi plano y único.
