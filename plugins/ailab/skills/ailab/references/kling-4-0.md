# Kling 4.0 (`kling-4-0`)

Vídeo de 3 a 30 s con audio nativo, 720p o 1080p. Contrato del servidor: `gateway_kling4_input` y
`gateway_kling4_subjects` en AILAB. La CLI valida lo mismo en local antes de subir nada, pero el servidor
repite todo, mide él mismo los vídeos y es la autoridad.

## Modalidades

- `--mode ref` (por defecto): Referencias. Solo texto, o hasta 10 imágenes, 5 vídeos, 7 sujetos y 3 voces
  (15 materiales en total).
- `--mode keyframe`: Fotogramas clave. `--first_frame_url` obligatorio, hasta 8 `--keyframe_urls`
  intermedios en orden y `--last_frame_url` opcional. Caben 4 fotogramas con 3 s y hasta 10 desde 9 s.
  No admite `--aspect_ratio` (lo marca el primer fotograma), imágenes, vídeos, sujetos ni voces.

## Menciones en el prompt

Cada `@` debe corresponder a un material de la petición; si no, se rechaza antes de cobrar.

- Referencias: `@image_1`, `@image_2`, `@video_1`... por orden de los archivos, y `@nombre` de un sujeto o voz.
- Fotogramas clave: `@first_frame`, `@keyframe_1`... y `@last_frame`.

## Sujetos y voces (solo `ref`)

La CLI usa parámetros planos en ranuras numeradas; el orden de las ranuras es el de las listas.

```bash
node <skill-dir>/scripts/ailab.mjs prepare kling-4-0 --prompt "@ana saluda y dice con @voz: hola" \
  --subject_1_name ana --subject_1_images ana1.jpg --subject_1_images ana2.jpg \
  --subject_1_tag character --subject_1_description "chaqueta roja" \
  --voice_1_name voz --voice_1_audio voz.wav
```

- Sujetos `subject_1` a `subject_7`: nombre (1 a 20 letras sin tildes, números o guion bajo; no puede ser
  `image_N`, `video_N`, `first_frame`...), de 2 a 4 imágenes, categoría y descripción (100 caracteres) opcionales.
- Voces `voice_1` a `voice_3`: nombre y un audio MP3 o WAV de 1 a 60 s. Los nombres no se repiten entre sujetos y voces.
- Los sujetos y las voces no suman segundos facturables.

## Archivos

Imágenes JPG, PNG o WebP de hasta 10 MB, cada lado de 300 a 65.536 px y proporción de 0,4 a 2,5 (los fotogramas
solo exigen formato y peso). Vídeos MP4 o MOV de hasta 10 MB, de 2 a 30 s cada uno y 30 s en total (la CLI no
mide WebM).

## Precio

`ceil(tarifa Kie x 1,02)` sobre los segundos facturables. Sin vídeos de entrada se factura la salida y el precio es
exacto (5 s a 720p son 146 cr). Con vídeos, cada uno se redondea al segundo superior: si la entrada total no
supera la salida se facturan 2 x salida, y si la supera, entrada + salida, a la tarifa con vídeo. `prepare`
autoriza ese máximo y el cargo final es el consumo confirmado. El servidor rechaza con 402 si el máximo autorizado
fuera menor, por eso la CLI nunca presupuesta por debajo.

Si el servidor devuelve 403 («en piloto» o «sujetos en prueba»), el modelo o los sujetos están cerrados en esa
instalación: no hay forma de saltarlo desde la CLI.
