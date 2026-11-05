# 04 · Estética dentro de Blender

Todo lo que se resuelve aquí sale idéntico en todas las vistas: es la fase que más consistencia compra. Funciones en `scripts/blender/utilidades.py`.

## 1. Formas finales

- Tapizados (sofás, pufs, cojines): `bevel(o, 0.04 a 0.05, 5)` y sombreado suave.
- Zócalos y muebles de madera: `bevel(o, 0.004, 2)`.
- Objetos pequeños con su forma real (pila de libros con tamaños y giros distintos, tocadiscos con plato y tapa, lámpara con pantalla). Son baratos y evitan que la IA invente formas.
- Detalles de objetos protagonistas como hijos del objeto (`parent` con `matrix_parent_inverse.identity()`), para colocarlos en coordenadas locales.
- Cuidado con piezas opcionales (tapas, puertas abiertas/cerradas, cajones): lo que exista en Blender aparecerá en la imagen. Si un objeto no debe llevarlo, no lo modeles o escóndelo (en el caso real, una tapa de tocadiscos acabó en una imagen y hubo que quitarla después).

## 2. Materiales repetibles (Poly Haven, CC0)

Para madera, tela, suelo, pared, metal: texturas CC0 de Poly Haven, recoloreadas con colores medidos en la referencia. No recortes estas superficies de la imagen IA: saldrían a baja resolución, deformadas y con la luz de esa foto metida en la textura.

Buscar en la API (sin clave) y descargar 2K en JPG (difuso y rugosidad bastan; el relieve se saca del difuso):

```bash
curl -s "https://api.polyhaven.com/assets?t=textures" | python3 -I -c "
import json,sys; d=json.load(sys.stdin)
for k,v in d.items():
    n=(k+' '+' '.join(v.get('tags',[]))).lower()
    if any(w in n for w in ['walnut','velvet','carpet','oak','marble','tile','concrete','plaster']): print(k, v.get('categories'))"
a=black_walnut_veneer_01; for m in diff rough; do curl -s -o texturas/${a}_${m}_2k.jpg "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/$a/${a}_${m}_2k.jpg"; done
```

Miniaturas para elegir: `https://cdn.polyhaven.com/asset_img/thumbs/<id>.png?width=256&height=256`. Web: https://polyhaven.com/textures

Recetas que funcionaron:

- **Madera en paneles verticales:** gira la textura 90° con Pillow (`im.rotate(90, expand=True)`) y úsala con proyección en caja (`projection = "BOX"`, coordenadas Object, escala 0,75). Oscurece y calienta con Hue/Saturation y un Multiply hacia el color medido. Juntas de panel: `fract((x + y) / 0.6) < 0.006` multiplicado por 0,35. Barniz suave con Coat 0,25.
- **Terciopelo / moqueta:** de una textura de terciopelo de cualquier color, toma la luminancia (RGB to BW), pásala por Map Range y una rampa entre dos tonos del color objetivo. Sheen 0,6 para terciopelo, 0,3 para moqueta; relieve con la misma luminancia. Moqueta a escala menor (0,5) y rugosidad 0,95.
- **Telas lisas:** color base + ruido muy fino (escala 400) como relieve.
- Mide los colores objetivo en zonas limpias de la referencia con `scripts/muestrear_colores.py` y compáralos después con el render.

Rutas de imagen relativas al `.blend`: `bpy.ops.file.make_paths_relative()`.

## 3. Objetos protagonistas con arte propio

Máquinas, rótulos, mostradores, cajas: dibuja sus caras con Pillow (formas, franjas, colores medidos) a 1000 px por metro y recorta de la referencia solo lo irrepetible (una pantalla, un logo del propio usuario). Asigna material por cara con UV calculadas desde las coordenadas locales (laterales: `u = (y + fondo/2) / fondo`, `v = z / alto`; frontales: `u = (x - xmin) / ancho`). Ejemplo completo: `scripts/ejemplos/arte_maquina_arcade.py`.

No copies arte, logotipos ni personajes de marcas o juegos reales salvo que estén en la referencia del propio usuario.

## 4. Luz de estudio

Configuración que funcionó (sala de 8 × 5,5 m, techo 2,7 m):

| Luz | Ajuste |
|---|---|
| Principal | Área rectangular 8 × 2,4 m, 520 W, color (1,00; 0,98; 0,95), 1,5 m por detrás del borde abierto de la sala, a 1,9 m de altura, girada 82° en X, `visible_camera = False` |
| Relleno | Área 4 × 3 m, 60 W, bajo el techo mirando abajo |
| Fondo | World gris claro (0,86; 0,85; 0,83) a intensidad 0,3 |
| Render | EEVEE, 64 muestras, raytracing; AgX con look "AgX - Punchy", exposición 0 |

Escala la potencia con el tamaño de la sala. Si la pared principal sale grisácea o lavada, baja la luz principal antes de tocar el material (AgX desatura las altas luces).

Para otros ambientes: noche (luz principal cálida 2700 K desde lámparas reales del espacio, fondo casi negro), exterior (Sky Texture del world + sol), neón (emisores en los propios objetos). La IA copia la luz de las vistas aprobadas: decide la luz en la maestra y no la cambies después.

Enseña un render de prueba de la vista más parecida a la referencia antes de seguir.
