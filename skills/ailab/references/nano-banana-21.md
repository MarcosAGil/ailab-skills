# Nano Banana 2.1

ID público: `nano-banana-2-1`. Runtime mínimo: 2.3.9.

`--mode t2i` utiliza solo prompt. `--mode edit` necesita de 1 a 14 imágenes.
Adjunta cada archivo repitiendo `--image_urls`; el orden se conserva. Usa JPG,
PNG o WebP válidos, de hasta 30 MB por archivo. La CLI inspecciona los archivos
y el servidor verifica propiedad, contenido y peso antes del envío.

Prompt: entre 1 y 20.000 caracteres Unicode. Resolución: `1K`, `2K` o `4K`.
Proporción: `auto`, `21:9`, `16:9`, `3:2`, `4:3`, `5:4`, `1:1`, `4:5`,
`3:4`, `2:3`, `9:16`, `4:1`, `1:4`, `8:1` o `1:8`.

No hay parámetro de lote ni semilla. AILAB fija salida PNG. No envíes campos
de fal ni controles de razonamiento, búsquedas o generación síncrona.

La estimación vigente es 5 cr en 1K, 7 cr en 2K y 10 cr en 4K, con o sin
referencias. El catálogo del servidor prevalece. El máximo aprobado se
respeta al liquidar. La activación requiere un canario y contraste de tarifa.

Ejemplo de preparación:

```bash
node <skill-dir>/scripts/ailab.mjs prepare nano-banana-2-1 \
  --mode edit --prompt "Cambia únicamente el fondo por una playa" \
  --resolution 2K --aspect_ratio auto --image_urls /ruta/referencia.png
```

Si se pierde la respuesta al enviar, recupera la operación existente mediante
`status` y el historial. No generes otra imagen para resolver un timeout.
