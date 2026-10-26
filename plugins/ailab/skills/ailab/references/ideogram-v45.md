# Ideogram 4.5 en AILAB

El catálogo del servidor es la fuente de verdad de disponibilidad, modalidades, límites y precios. Consulta `models`, `info ideogram-v45` y `prepare` antes de enviar.

La fuente local 2.3.7 requiere construir el paquete, publicarlo mediante el flujo firmado y verificar el catálogo servido. No equivale por sí sola a una release activa.

## Modalidades

- `t2i`: texto a imagen mediante `ideogram/v4.5`. No adjuntes archivos de imagen. Admite calidades `low`, `medium`, `high`, tamaños predefinidos y entre 1 y 8 salidas. La expansión del prompt está disponible.
- `edit`: edición mediante `ideogram/v4.5/edit`. Adjunta primero la imagen base y después, opcionalmente, hasta cuatro referencias. Admite `very_low`, `low`, `medium`, `high`, precisión `regular` o `high` y entre 1 y 8 salidas. La precisión `high` exige tamaño `auto`; la expansión no se admite en esta ruta.

`--seed` sigue siendo opcional en la CLI (0 a 2147483647), aunque no aparezca en el Playground. No añadas máscaras ni tamaños personalizados fuera del contrato de AILAB. La CLI rechaza referencias, precisión de edición, calidad `very_low` y tamaño `auto` en `t2i`. En `edit` omite la expansión y rechaza que se active expresamente.

## Coste

Tarifa publicada por fal por cada salida: texto a imagen $0.03 / $0.06 / $0.22 para calidad baja / media / alta; edición $0.008 / $0.03 / $0.06 / $0.22 para muy baja / baja / media / alta. La conversión AILAB vigente es 1 crédito = $0.005 USD. Se calcula la suma del lote y se redondea una sola vez al crédito superior: ocho ediciones de calidad muy baja son 13 créditos, no 16. La duración o tamaño de la imagen no añade coste.

La reserva se calcula server-side con los parámetros de la solicitud. Solo se liquida tras recibir salidas válidas; el cargo usa la tarifa congelada al enviar y el número de imágenes devueltas, sin superar el máximo autorizado. Una solicitud ambigua se recupera por su mismo ID, nunca se reenvía automáticamente.

Informa de modalidad, calidad, archivos, número de imágenes y coste total antes del primer gasto. Una petición directa de generación autoriza ese alcance, no resultados adicionales. `status fal:<request_id>` recupera todas las salidas del historial o del gateway sin crear otra generación. Un estado completado sin URL o una descarga parcial conserva la tarea recuperable, no demuestra fallo ni ausencia de cargo.

## Ejemplos

```bash
node <skill-dir>/scripts/ailab.mjs info ideogram-v45
node <skill-dir>/scripts/ailab.mjs prepare ideogram-v45 --mode t2i --prompt "Editorial still life, exact legible title: SUMMER" --quality medium --image_size landscape_16_9 --num_images 2
node <skill-dir>/scripts/ailab.mjs prepare ideogram-v45 --mode edit --prompt "Replace only the background with a pale-blue studio wall" --image_urls ./base.png --image_urls ./reference.png --quality medium --edit_precision regular --image_size auto
```

No se exponen máscaras de edición en esta primera integración. No uses campos fuera del catálogo activo ni inventes capacidades del proveedor.

Contratos oficiales: [texto a imagen](https://fal.ai/models/ideogram/v4.5/api), [edición](https://fal.ai/models/ideogram/v4.5/edit/api). Los límites de AILAB pueden ser más estrechos que los del proveedor.
