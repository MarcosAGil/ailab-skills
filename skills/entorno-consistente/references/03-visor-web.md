# 03 · Visor web (revisar sin abrir Blender)

Blender asusta a la mayoría de usuarios. El usuario nunca lo toca: revisa la escena en un visor 3D web con la marca de Ailendra Labs, apunta correcciones y las pega en el chat.

## Construirlo (en cada vuelta de blockout)

1. En Blender, ejecuta `scripts/blender/exportar_visor.py` (pega su código en `mcp__blender__execute_blender_code` o `exec(open(...).read())`). Genera `visor/escena.json` junto al `.blend`.
2. Construye el HTML:
   ```bash
   python3 -I <skill>/scripts/construir_visor.py --escena <carpeta>/visor/escena.json \
     --salida <carpeta>/visor/<espacio>-visor.html --titulo "<Nombre del espacio>" \
     --subtitulo "Versión vN · medidas reales en metros" --clave <espacio>
   ```
   Opcional: `--etiquetas etiquetas.json` (`{"Cam_A1_frontal_6_0m": ["A1 · Frontal 6 m", "35 mm"]}`) y `--colecciones colecciones.json` (`{"Galeria_A": "Galería pared A"}`).
3. Publícalo como artefacto de claude.ai (mismo archivo = mismo enlace en cada vuelta) y dale el enlace. También funciona abierto en local o en cualquier web: la plantilla declara UTF-8.

## Qué puede hacer el usuario

- Orbitar con el ratón; pasear a 1,6 m de altura con WASD (frena en paredes de la colección de estructura de más de 1,5 m).
- Saltar a cada cámara de la hoja (encuadre aproximado: el visor no recorta a 16:9).
- Ocultar el techo, ver una rejilla de 1 m y las aristas.
- Clicar un objeto para ver su nombre, grupo, medidas y posición.
- Escribir correcciones (sobre un objeto o generales), copiar la lista y pegarla en el chat.

## Limitaciones

- Colores planos (`diffuse_color` de cada material), no texturas: el visor es para medidas y encuadres. El acabado se revisa en los renders.
- Los artefactos de claude.ai piden sesión iniciada: Claude no siempre puede abrirlos en su propio navegador. Para comprobarlo, sírvelo en local (`python3 -m http.server`) y ábrelo en Chrome.
