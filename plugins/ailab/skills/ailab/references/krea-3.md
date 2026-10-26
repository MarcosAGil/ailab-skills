# Krea 3

Usa `info krea-3` y el catálogo vigente. Modalidades `t2i` y `edit`.
Berry prioriza calidad y admite `negative_prompt`; Jam prioriza velocidad y no
lo utiliza. Prompt de hasta 5.000 caracteres; negativo de hasta 1.024.

Parámetros: `variant berry|jam`, `reasoning_level low|medium|high`,
`resolution 1k|2k|custom|auto`, `aspect_ratio`, `width`, `height`,
`output_format png|jpeg`. No hay semilla pública. Alto solo en edición,
con tamaño explícito. Personalizado acepta 256–3.200 px por lado y redondea
al múltiplo superior de 16; el resultado no puede superar 4.220.160 píxeles.

En edición, repite `--image_urls /ruta/imagen.png` de una a ocho veces.
Conserva el orden: `<image-1>`, `<image-2>`, etc. Las referencias se
suben mediante AILAB y el servidor verifica propiedad, tamaño y dimensiones.
El límite de AILAB es de 30 MiB por imagen. Si una URL no se puede verificar,
descarga la imagen y adjunta su archivo local.

`prepare` consulta el presupuesto del servidor sin generar. Cuenta salida,
referencias y razonamiento. Automático autoriza un máximo y liquida según
el resultado; Alto tiene suplemento. El total se redondea una sola vez.
Una cotización caducada o con referencias cambiadas exige volver a preparar.
El precio se confirma antes del gasto y la reserva no permite cobrar más.

Recupera tareas mediante `status` sobre el mismo ID. Un resultado sin
dimensiones suficientes para liquidar pasa a revisión, no a otra generación.
La publicación firmada y la disponibilidad del servidor determinan si el modelo
puede usarse. Las pruebas locales no acreditan su factura real.
