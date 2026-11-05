# 06 · Pases de render

Cada vista se renderiza en cuatro pases a 1920 × 1080 en `//renders/fase1/` (junto al `.blend`):

| Pase | Archivo | Para qué |
|---|---|---|
| Color | `<K>_color.png` | La "Image 1" que se manda a la IA: composición + pista de materiales y luz |
| Clay | `<K>_clay.png` | Todo en gris: forma y volumen (revisión, documentación, alternativa de Image 1 si el color confunde a la IA) |
| Profundidad | `<K>_profundidad.png` | Blanco cerca, negro lejos (documentación; posible control de profundidad en otros modelos) |
| Contornos (id) | `<K>_id.png` | Un color plano por objeto: de aquí salen los contornos del control de calidad |

## Ejecutar

Dentro de Blender, con la configuración al principio del script:

```python
src = open("<skill>/scripts/blender/render_pases.py").read()
src = src.replace('CAMS = []', 'CAMS = [("G", "Cam_G_perfil_arcade"), ("H", "Cam_H_contrapicado")]')
exec(src)
```

- `CAMS` vacía = todas las cámaras de la escena (clave = nombre).
- `PASES`: si el MCP corta por tiempo, renderiza por tandas (`["color"]`, luego `["id"]`...).
- `TECHO` y `CENITALES`: el techo se oculta en las vistas cenitales.
- `ESTRUCTURA`: colección de paredes y suelo, marca el fondo en la profundidad.
- **Estados por vista** (`estado_vista.py`): si una vista tiene maniquíes visibles u objetos movidos, el script los aplica solo mientras renderiza esa vista y deja la escena base intacta. Lo que aparece en el "mostrar" de alguna vista se oculta en las demás: los maniquíes nunca se cuelan en las vistas vacías.
- Detecta solo los objetos recortados con transparencia y les mantiene la silueta en clay, profundidad e id.
- Restaura materiales, luces y ajustes al terminar aunque falle.

Después, fuera de Blender:

```bash
python3 -I <skill>/scripts/normalizar_profundidad.py <carpeta>/renders/fase1
```

Monta una hoja con las vistas y pases y enséñasela al usuario antes de pasar a la IA.

## Avisos

- Volver a renderizar una vista sobrescribe sus pases. Si una imagen ya aprobada se generó con pases antiguos, guarda antes los pases viejos o renderiza con otra clave (`G2`).
- El render tarda: en una sala con texturas, unos 10 a 30 s por pase y vista en un Mac con Apple Silicon.
