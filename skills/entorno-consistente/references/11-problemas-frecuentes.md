# 11 · Problemas frecuentes y soluciones

| Síntoma | Causa | Solución |
|---|---|---|
| "Could not connect to Blender" o "Connection to Blender lost" | Blender cerrado o colgado | `open -a Blender "<archivo.blend>"`, espera al puerto 9876 y `get_addon_status`. Si había trabajo sin guardar, recarga la última versión |
| No hay herramientas `mcp__blender__*` | MCP sin registrar o sesión iniciada antes | Registrar (01) y reiniciar la sesión |
| `No module named 'blender_mcp'` | Archivo del addon con otro nombre | Renombrar a `blender_mcp.py` y reactivar |
| `claude mcp add` da "Invalid environment variable format" | Los `-e` van antes del nombre | Poner `blender` primero |
| El comando `claude` del terminal no funciona | Instalación de la CLI incompleta | `comprobar_entorno.sh` mira `~/.claude.json` como alternativa; dentro de la sesión, el MCP funciona igual |
| La llamada a Blender se corta en renders largos | Límite de tiempo del MCP | Renderizar por tandas (`CAMS` o `PASES` parciales) o en segundo plano con `blender -b` |
| Cuadros que se solapan | Colocación a ojo | `solapes(objetos, 0.04)` hasta lista vacía |
| La cámara corta parte del espacio | Distancia u objetivo insuficientes | `ancho_cubierto`; quitar la pared de detrás o desplazar la cámara |
| Se ve el techo o una pared que no se quiere | Inclinación o ángulo | Menos inclinación, más de frente o cerrar objetivo; comprobar con `look` |
| Cuadros deformados en la imagen | Contrapicado o gran angular fuerte | Cámara a media altura y casi de frente a la pared |
| Cenital recortada | Escala ortográfica corta | Subir la escala |
| Render quemado, colores lavados | Demasiada luz; AgX desatura altas luces | Bajar luz principal y fondo antes de tocar materiales |
| Madera grisácea o rosada | Luz fría y fuerte sobre un material poco saturado | Luz más neutra, material más saturado y cálido; comparar con `muestrear_colores.py` |
| Veta de madera horizontal en paneles verticales | Textura en su orientación original | Girar la imagen 90° con Pillow |
| A una silueta recortada le queda fondo | La máscara no distingue ese color | Máscara `tono` o `elipse`, o ajustar `fondo` en `recortes.json` |
| Pase de profundidad plano o gris | Transformación de color y fondo encendido | Lo resuelve `render_pases.py` + `normalizar_profundidad.py` |
| Contornos de control llenos de ruido | Sacados del clay | Usar siempre el pase `id` |
| Maniquíes en vistas vacías | Sin estado de vista | `definir_estado(vista, mostrar=["Personajes_guia"])` en las vistas con personajes |
| La IA ignora el render y copia la referencia | Modelo que prioriza la referencia (pasó con Ideogram 4.5) | Nano Banana 2.1 y el render siempre como Image 1 |
| La IA rellena el vacío con paredes | No se describió el fondo | "plain neutral grey studio background; keep it" |
| Todas las vistas repiten un error | Error en la maestra | Corregir o rehacer la maestra antes de seguir |
| El personaje sale más pequeño o más bajo que el maniquí | Tendencia del modelo | Revisar con el control; corregir con edición o exagerar un poco el maniquí |
| Un objeto que lleva el personaje sale mal (cable a la mano) | No se describió por dónde va | Describir el recorrido; corregir con edición |
| Al editar, el modelo quita a alguien, cambia la luz o reencuadra | Edición sin máscara | `mascara.py` + `componer_parche.py` |
| AILAB "limitado temporalmente" (429) | Demasiadas peticiones o envíos en paralelo | Esperar lo indicado y un solo reintento; nunca en paralelo |
| AILAB "generate task timeout" sin imagen | Fallo del proveedor | No cobra (compruébalo con `balance`). Recuperar con `status`; no reenviar en bucle. Plan B en 08 |
| El visor muestra "TodavÃ­a" en vez de "Todavía" | Página sin UTF-8 (versión antigua de la plantilla) | La plantilla actual declara `<meta charset="utf-8">`: reconstruye el visor |
| El visor publicado no se abre en el navegador de Claude | Los artefactos piden sesión | Servir en local con `python3 -m http.server` y abrir en Chrome |
