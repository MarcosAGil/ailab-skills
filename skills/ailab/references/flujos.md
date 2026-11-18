# Flujos de cliente

Una cuenta de cliente de AILAB usa sus flujos de producción y la subida de archivos; solo
usa el Playground si AILAB le activa el plugin, y entonces con el precio que AILAB da a su cuenta y, si su
cuenta lo exige, `--proyecto` en cada generación. El gestor crea el token; el usuario lo pega en `login --cliente`, en su propia
terminal. El servidor decide modelo, perfil y precio de cada paso; la CLI nunca los
muestra.

## Comandos

| Comando | Qué hace | Gasta |
|---|---|---|
| `flow status` | Saldo, límite, gasto y vídeos del mes, y si la cuenta está en pausa | No |
| `flow open --case <caso> [--proyecto NN_slug] [--titulo texto] [--request-id <uuid>]` | Abre un vídeo en su proyecto y devuelve su código (`NOV26-07`) | No |
| `flow prepare <flujo> --code <código> [--take N] …` | Cotiza un paso y guarda la cotización 15 min | No |
| `flow submit <cotización> --confirmed [--output carpeta]` | Ejecuta el paso, espera y descarga | Sí |
| `flow job <trabajo> [--wait] [--output carpeta]` | Consulta o recupera un paso sin repetirlo | No |
| `flow close --code <código> --final-seconds S --used toma:versión…` | Cierra el vídeo con la duración final y las tomas usadas | No |

Todos admiten `--json` (una línea JSON al final, con `ok`; en un error, `error` y el `code` de AILAB).

## Datos de cada flujo

- `guion`: `--idea` o `--texto` (o `--idea-file`, `--texto-file`) y, para segunda mano,
  `--dato modelo=…` repetible. Devuelve un Markdown con `## Toma N` y `> broll:`.
- `toma`: `--take N --text "texto exacto"` y, si hace falta, `--prompt` (o `--prompt-file`)
  con un prompt propio y `--duration 4|6|8|10` en segundos; sin ellos, AILAB usa los del
  perfil. Cada confirmación sobre el mismo número crea una versión nueva (v1, v2…).
  Devuelve el MP4 y su duración.
- `separar`: `--take N --audio <ruta> [--version V] [--attempt N]`. Devuelve voz y
  ambiente, si quedan intentos y los umbrales del control de calidad.
- `aislar`: `--take N --audio <ruta> [--version V]`. Devuelve la voz.
- `voz`: `--take N --audio <ruta> [--version V]`. Devuelve la voz final y el nivel del
  ambiente en dB para la mezcla.

El audio local se sube con la misma subida de la skill; también se admite la dirección
que devolvió una subida anterior de la cuenta.

## Reglas

- La autorización del usuario cubre el encargo: con ella, `flow submit --confirmed` se
  ejecuta sin volver a preguntar por cada paso.
- `flow submit` guarda la petición antes de enviarla. Si la respuesta se pierde, repetir el
  mismo comando reutiliza la misma petición y nunca cobra dos veces. No prepares otra
  cotización para recuperar un paso: usa `flow job`.
- Un paso fallido no se cobra. Un paso en revisión no se repite: se consulta más tarde.
- `models`, `prepare`, `submit` y el resto de comandos de miembro no están disponibles
  para estas cuentas.
