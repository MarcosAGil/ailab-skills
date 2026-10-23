# Wan 3.0 Video y Wan 3.0 Video Prime

Usa `info wan-3-video` y el catálogo vigente. Un único modelo con dos versiones:
`--version normal` (calidad de referencia) y `--version prime` (mismas capacidades,
generación más rápida y tarifa por segundo mayor). Requiere la skill 2.3.12 o
posterior: una CLI anterior no ofrece este modelo y debe actualizarse.

## Modalidades

- `--mode t2v` (por defecto): solo texto. No admite archivos.
- `--mode i2v`: `--first_frame_url` obligatorio y `--last_frame_url` opcional.
  El último fotograma exige el primero. No se mezcla con referencias.
- `--mode ref`: al menos una referencia. Hasta 10 imágenes (`--reference_image_urls`),
  5 vídeos (`--reference_video_urls`), 5 audios (`--reference_audio_urls`), y un
  enlace público (`--reference_link_urls`) o un documento público
  (`--reference_file_urls`), nunca ambos. No se mezcla con fotogramas.

Los archivos de `file[]` se repiten una vez por archivo. En el prompt, los
materiales de referencia se nombran por orden dentro de su tipo: `@Image1`,
`@Video1`, `@Audio1`.

## Límites

- Prompt de 1 a 20.000 caracteres. Salida de 2 a 30 segundos enteros.
- Resolución 480P, 720P o 1080P. Formato `adaptive`, 16:9, 4:3, 1:1, 3:4 o 9:16.
- Audio nativo `--audio true|false`. Semilla opcional (`--seed`, de 0 a 2147483647):
  sin ella la semilla es aleatoria; 0 es una semilla válida y repetible.
- Imágenes y fotogramas: JPG, PNG sin transparencia o WebP, hasta 20 MB, de 240 a
  8.000 px por lado y proporción máxima 8:1.
- Vídeos: MP4 o MOV, hasta 100 MB, cada uno de 1 a 15 s y 15 s en total. La duración
  del vídeo de entrada más la de salida no puede superar 30 s.
- Audios: MP3 o WAV, hasta 15 MB, cada uno de 1 a 15 s y 15 s en total.
- Documento: PDF, Word, Excel, PowerPoint, Keynote, Pages, Numbers, TXT o MD, hasta
  50 páginas. Enlace: una página pública sin inicio de sesión.
- La duración inteligente (`--duration -1`) no está disponible: Kie factura la
  duración que elige el modelo y el coste no se puede acotar antes de enviar.
  Tampoco se ofrece el filtro `nsfw_checker`: AILAB lo mantiene activado.

## Precio

Kie factura, en ambas versiones, `(segundos de vídeos de entrada + segundos de salida)
x tarifa por segundo`. Las imágenes, los audios, el enlace y el documento no suman
segundos. AILAB cobra `ceil(créditos Kie x 1,02)` sobre el total.

| Resolución | Normal (cr/s) | Prime (cr/s) |
| --- | --- | --- |
| 480P | 8,16 | 12,444 |
| 720P | 16,32 | 25,704 |
| 1080P | 32,64 | 51,408 |

Ejemplo: 10 s de salida con un vídeo de 5 s en Prime 1080P son 15 s facturados
(772 cr); sin el vídeo, 515 cr.

`prepare` mide los vídeos locales (cada uno se redondea al segundo superior) y fija
el máximo autorizado. Sin vídeos de entrada el precio es exacto; con ellos es el
máximo reservado y el cargo final es el consumo confirmado, sin superar ese máximo.
El servidor vuelve a medir las subidas. Si calcula más que lo autorizado, rechaza
con un 402 y no cobra: vuelve a ejecutar `prepare`.

Recupera tareas mediante `status` sobre el mismo ID. Un éxito sin vídeo de salida
no se liquida y queda pendiente de revisión; no repitas la generación.
Las pruebas locales no acreditan la factura real de Kie.
