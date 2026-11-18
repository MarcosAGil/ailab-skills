# Nano Banana 2.1

> El precio lo da siempre AILAB para tu cuenta: `info` y `prepare` lo muestran.

ID: `nano-banana-2-1`. Runtime mínimo: 2.3.9.

`--mode t2i`: sin referencias. `--mode edit`: 1 a 14 referencias ordenadas,
repitiendo `--image_urls`. JPG, PNG o WebP, hasta 30 MB cada una. CLI y servidor
verifican archivos, peso y propiedad antes de enviar.

Prompt: entre 1 y 20.000 caracteres Unicode. Resolución: `1K`, `2K` o `4K`.
Proporción: `auto`, `21:9`, `16:9`, `3:2`, `4:3`, `5:4`, `1:1`, `4:5`,
`3:4`, `2:3`, `9:16`, `4:1`, `1:4`, `8:1` o `1:8`.

Salida PNG fija. Sin lote, semilla, razonamiento ni búsquedas.

El precio depende solo de la resolución, con o sin referencias, y nunca se
supera el máximo autorizado.

Ante un timeout o resultado ausente: conserva el ID y recupera con `status`
y el historial; no vuelvas a generar.
