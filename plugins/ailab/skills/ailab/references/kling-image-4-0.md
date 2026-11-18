# Kling Image 4.0 (`kling-image-4-0`)

Imágenes de 2K a 8K con texto legible, sueltas o en series coherentes. Contrato del servidor:
`gateway_kling_image4_input` en AILAB. La CLI valida lo mismo en local antes de subir nada, pero el servidor
repite todo y es la autoridad. Requiere la skill 2.5.0.

## Modalidades y salida

- `--mode t2i` (por defecto): solo texto. No admite referencias ni personajes.
- `--mode i2i`: necesita al menos una referencia (`--image_urls`) o un personaje (`--subject_N_*`).
  Referencias y personajes suman como máximo 10 materiales.
- `--output_mode default` (por defecto): de 1 a 9 imágenes sueltas e independientes.
- `--output_mode series`: de 2 a 10 imágenes coherentes del mismo personaje, estilo y mundo.
- `--count`: número de imágenes. Sin él, 1 suelta o 2 en serie.
- `--resolution 2K` (por defecto), `4K` u `8K`. 8K sale en JPG, tarda más y cada archivo pesa mucho: para
  revisar ideas, empieza en 2K.
- `--aspect_ratio`: `auto`, `9:16`, `2:3`, `3:4`, `1:1`, `4:3`, `3:2`, `16:9` o `21:9`.

## Archivos

Imágenes JPG o PNG de hasta 20 MB. Este modelo no admite WebP: convierte antes a PNG (la web lo hace
sola). El prompt admite hasta 20.000 caracteres.

## Menciones en el prompt

Cada `@` debe corresponder a un material de la petición; si no, se rechaza antes de cobrar.

- Referencias: `@image_1`, `@image_2`... por el orden de los archivos.
- Personajes: `@nombre`.

## Personajes (solo `i2i`)

Como en Kling 4.0, la CLI usa ranuras numeradas (de `subject_1` a `subject_10`); su orden es el de la lista.
Cada personaje lleva de 2 a 4 vistas (la primera es la principal), un nombre de 1 a 20 letras sin tildes,
números o guion bajo (sin `image_N` ni `object_N`, y sin repetir) y, si quieres, categoría y descripción.

```bash
node <skill-dir>/scripts/ailab.mjs prepare kling-image-4-0 --mode i2i --output_mode series --count 3 \
  --prompt "@ana pasea por @image_1, tres momentos del mismo día" --image_urls calle.jpg \
  --subject_1_name ana --subject_1_images ana-frente.png --subject_1_images ana-perfil.png \
  --subject_1_tag character
```

## Precio

El precio lo da AILAB para tu cuenta con `info kling-image-4-0` y `prepare`. Depende de la resolución, del número
de imágenes y de las referencias y vistas de personaje, que cuentan en cada imagen. `prepare` muestra el máximo
reservado; el cargo final es el consumo confirmado, nunca mayor que lo reservado.
