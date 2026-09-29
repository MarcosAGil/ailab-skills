# Voz individual con v4

El runtime 2.3.3 incorpora el contrato de v4. La disponibilidad depende del catálogo
activo y de las puertas del servidor. No fuerces `--version v4` si `info eleven-tts`
no la ofrece. La incorporación del runtime no activa el modelo.

Cuando se publique, la primera entrega admitirá Cristina y hasta 10.000 caracteres
Unicode. Estabilidad y similitud aceptan valores de 0 a 1. Omite estilo y velocidad;
el runtime rechaza su uso explícito y elimina esos valores predeterminados para v4.
No sustituye la versión ni la voz si el proveedor las rechaza.

El precio se calcula por caracteres de entrada y versión, con redondeo del total y
mínimo de un crédito de AILAB. La promoción tiene un cierre anticipado de AILAB el
11 de octubre de 2026, a las 00:00 UTC. Una fecha inválida o una promoción caducada
utilizan la tarifa ordinaria. Nunca traduzcas `character-cost` a caracteres o USD:
es consumo de cuota del proveedor, separado del precio de AILAB.

`prepare` fija parámetros y máximo; el servidor vuelve a comprobar la tarifa y la
voz antes de reservar. Un intento enviado conserva su UUID. Si falta el audio, se
consulta la misma tarea y el historial del proveedor; no se genera otra pieza.
Un `submit` de v4 ya confirmado consulta por UUID incluso después de caducar su
manifiesto. Si no puede encontrarlo, queda en revisión, sin reenviarlo.

La reserva deja de bloquear saldo a las 24 horas. Administración, inicialmente
Marcos, resuelve la revisión. Un audio recuperado después se entrega sin cargo
retroactivo. No describas la revisión como un fallo definitivo ni prometas una
nueva generación gratis. Para recuperar utiliza `status <task_id>` o el mismo
manifiesto confirmado, sin crear un `prepare` nuevo para el resultado pendiente.

Turbo, diálogo con varias voces y conversación en directo pertenecen a otras
entregas y no quedan activados por este contrato.
