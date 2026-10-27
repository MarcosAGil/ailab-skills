# Flux 3 en AILAB

`flux-3` utiliza `labs-queue-v1`. Consulta `models`, `info flux-3` y `prepare`: el catálogo servido decide acceso, disponibilidad y tarifa. La fuente local 2.3.7 no acredita una publicación activa; requiere empaquetado, publicación firmada y verificación.

## Modalidades y entradas

- `t2i`: texto a una imagen; ruta AILAB `flux-3-t2i`.
- `edit`: de 1 a 10 imágenes locales en `--image_urls`, en el orden que usarás como imagen 1 a imagen 10; ruta AILAB `flux-3-edit`. La primera referencia determina el aspecto cuando se elige `auto`. La CLI mide cada archivo antes de subirlo: ambos lados deben tener al menos 256 px y el área no puede superar 4.000.000 píxeles.

Se exponen únicamente `mode`, `prompt`, `resolution`, `aspect_ratio` y las imágenes de edición. AILAB expone `768sq`, `1k` (predeterminada), `2k` y `4k`, con tarifa verificada. `512sq` no está habilitada en esta release: su verificación devolvió rechazo HTTP 422 sin consumo, incluso tras el reintento permitido; no la envíes mediante la skill. Aspectos: `auto`, `21:9`, `2:1`, `16:9`, `3:2`, `7:5`, `4:3`, `5:4`, `1:1` (predeterminado en el catálogo AILAB), `4:5`, `3:4`, `5:7`, `2:3`, `9:16`, `1:2`. En edición, pide `--aspect_ratio auto` para seguir la primera referencia.

El límite de 20.000 caracteres del prompt es una política de AILAB. La documentación oficial no publica un máximo del proveedor. No hay seed ni lote en este contrato. La expansión, tolerancia de seguridad, formato, sincronía y versión del proveedor permanecen fijados u omitidos por el servidor: no los envíes como parámetros de la CLI.

## Coste por resolución

Las tarifas de [texto](https://fal.ai/models/blackforestlabs/flux-3/text-to-image) y [edición](https://fal.ai/models/blackforestlabs/flux-3/edit-image) se aplican por una salida. AILAB añade su margen estándar del 2%, convierte a $0.005 USD por crédito y redondea al crédito superior:

| Resolución | USD | Créditos |
|---|---:|---:|
| `768sq` | 0.048 | 10 |
| `1k` | 0.048 | 10 |
| `2k` | 0.192 | 40 |
| `4k` | 0.768 | 157 |

Es la tarifa ordinaria, la única vigente: la promoción de lanzamiento terminó el 8 de octubre de 2026 y el catálogo ya no la lleva. No deduzcas precios de otras resoluciones a partir de megapíxeles ni de `X-Fal-Billable-Units`. No se publica una tarifa AILAB para `512sq` en esta release.

El coste es igual en texto y edición, sin recargo por referencias. Una salida 4K puede tardar varios minutos: conserva el ID y consulta `status`, sin reenviar la generación.

El servidor congela la tarifa al crear la tarea y liquida únicamente un resultado válido. El catálogo servido sigue siendo la autoridad. Preparar la fuente local no publica una release ni acredita por sí solo una verificación de producción.

## Autorización y recuperación

Antes del primer gasto informa de modalidad, resolución, aspecto, referencias y coste total calculado por `prepare`. Una petición directa de generación autoriza ese alcance. No conviertas una respuesta del Prompter en autorización para generar ni añadas otra imagen cobrada por iniciativa propia.

La salida es una sola imagen en `images[].url`. Conserva `fal:<request_id>` y recupera con `status` si falta la respuesta o la descarga. El historial reconoce exactamente `flux-3-t2i` y `flux-3-edit`; consultar y descargar no crea otra solicitud. Un completado sin URL sigue recuperable, no prueba fallo ni ausencia de cargo. No reenviar estados ambiguos ni cambiar su ID.

## Ejemplos sin gasto

```bash
node <skill-dir>/scripts/ailab.mjs info flux-3
node <skill-dir>/scripts/ailab.mjs prepare flux-3 --mode t2i --prompt "A quiet architectural courtyard in morning light" --resolution 1k --aspect_ratio 16:9
node <skill-dir>/scripts/ailab.mjs prepare flux-3 --mode edit --prompt "Keep the composition of image 1 and use the materials from image 2" --image_urls ./base.png --image_urls ./materials.png --resolution 1k --aspect_ratio auto
node <skill-dir>/scripts/ailab.mjs status fal:<request_id_real>
```

Contratos oficiales: [texto a imagen](https://fal.ai/models/blackforestlabs/flux-3/text-to-image/api), [edición](https://fal.ai/models/blackforestlabs/flux-3/edit-image/api). Las rutas del proveedor las selecciona AILAB, no el cliente.
