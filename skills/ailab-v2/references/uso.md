# Uso de AILAB

1. `models [--tipo imagen|video|audio] [--buscar texto]` lista lo que tu cuenta puede usar.
2. `info <modelo>` enseña sus campos. Cambian en el servidor: no los recuerdes de otra sesión.
3. `prepare <modelo> --campo valor` valida, sube las referencias, pide el precio y no gasta.
4. La persona confirma el proyecto y el precio.
5. `submit <preparación> --confirmado <créditos>` envía justo lo preparado.
6. `status <generación> --wait 180` espera y descarga.

## Campos

- Una lista repite la opción: `--image_urls a.png --image_urls b.png`.
- Una lista de objetos repite la opción con un objeto JSON cada vez.
- Un valor que empieza por guiones va con `=`: `--prompt=--texto`.
- `--entrada archivo.json` lleva la entrada entera como objeto JSON. Es lo seguro para textos
  con comillas o saltos de línea. Las opciones sueltas mandan sobre el archivo.

## Archivos

- Imagen (JPEG, PNG, WebP) hasta 30 MB, vídeo (MP4, MOV, WebM) hasta 200 MB y audio (MP3,
  WAV, FLAC, OGG, M4A, AAC) hasta 150 MB. El contenido tiene que ser del tipo de su extensión.
- `generacion:<id>:<posición>` usa un resultado tuyo como referencia.
- Los enlaces no valen. Descarga el archivo solo si la persona lo pide.

## Resultados

Se guardan en `~/Downloads/AILAB/<generación>/` o en `--output <carpeta>`. Nunca se
sobrescribe un archivo. Repetir `status` no genera ni cobra.

## Precio

Lo da el servidor en `prepare` y caduca a las 24 horas. Si enseña un máximo, es lo que se
autoriza. No calcules precios a mano.
