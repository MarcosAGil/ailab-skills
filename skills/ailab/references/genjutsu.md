# Genjutsu y Genjutsu Light (Higgsfield)

Dos modelos con el mismo flujo y los mismos dos modos. Los sirve `api/skill/higgsfield.php`: la CLI sube el vídeo y las
imágenes, el servidor los mide, cotiza (`prepare`) y reserva lo cotizado (`submit`). El servidor repite todas las reglas
y es siempre la autoridad.

| | Genjutsu (`genjutsu`) | Genjutsu Light (`higgsfield-genjutsu-light`) |
|---|---|---|
| Resoluciones | 480p y 720p | 480p, 720p y 1080p |
| Vídeo de entrada | de 1 a 30 s | de 1 a 15 s |
| Se factura | segundos de vídeo de entrada | salida más vídeo de entrada |
| Skill mínima | 2.3.0 | 2.3.14 |

Modos (`--mode`): `character_swap` transfiere el movimiento del vídeo a tus imágenes (Motion Transfer) y `object_swap`
cambia un objeto (Cambio de objeto). Prompt opcional (hasta 5.000 bytes), `--video_url` obligatorio y de 1 a 8
`--image_urls` (repetible). El modo lo decide AILAB y no viaja dentro del `input`.

```bash
node <skill-dir>/scripts/ailab.mjs prepare higgsfield-genjutsu-light --mode character_swap \
  --video_url movimiento.mp4 --image_urls personaje.png --resolution 720p
```

## Precio de Light

La salida dura lo mismo que el vídeo, así que se facturan `2 x ceil(duración medida)` segundos. Equivale a 10,2 / 20,4 /
40,8 cr por segundo de vídeo en 480p / 720p / 1080p (10 s a 720p son 204 cr; el máximo, 15 s a 1080p, son 612 cr).

- La CLI mide el vídeo en local (`mvhd` de MP4 y MOV, igual que el servidor) y calcula la misma cifra: la ves en
  `info`, en `validate` y, junto a la cotización, en `prepare`. Un WebM lo mide solo el servidor.
- La cifra que aprueba el usuario es la cotización del servidor, congelada en el manifiesto. Si la local y la del
  servidor difieren, `prepare` lo avisa y manda el servidor.
- Un vídeo de 15,01 s se redondea a 16 s y se rechaza. `Genjutsu Light usa hasta 15 segundos de vídeo. Recórtalo a 15 s o
  usa la versión Normal.` aparece antes de subir nada y no se cobra.
- Light usa solo los primeros 15 s del vídeo y conserva su audio.

## Acceso

Cada modelo Higgsfield respeta el interruptor `HIGGSFIELD_FEATURE_FLAGS` del servidor. Light se abre por fases: con el
interruptor en modo piloto de administrador o cerrado, la ruta de token responde 403 «pendiente de activación» antes de
estimar, reservar o cobrar. Dile al usuario que todavía no está abierto a su cuenta y no reintentes: no se ha cobrado nada.

## Estados finales y recuperación

- `completed` entrega el vídeo. `failed`, `error`, `canceled`, `cancelled`, `nsfw` (bloqueo por moderación) y `rejected`
  terminan la tarea sin resultado y sin cargo. La CLI muestra el motivo que manda el servidor en `ailab_error`; para
  `nsfw` y `rejected`: revisa el vídeo, las imágenes de referencia y el prompt, cambia el material y vuelve a preparar.
- Un 429 o un fallo transitorio (5xx, corte de red) al consultar el estado no es un estado de la tarea: la CLI espera
  con retroceso (respeta `Retry-After`) y vuelve a consultar. Tras varios fallos seguidos, o si se agota el tiempo,
  conserva el ID y se recupera sin generar otra vez con `status <task_id>`.
- Una cotización caduca a los 15 minutos: vuelve a ejecutar `prepare`. Ante un envío ambiguo no reintentes.
- Un vídeo o una imagen subidos caducan (72 h, o 6 h tras un envío): si caducan, vuelve a subirlos con `prepare`.
