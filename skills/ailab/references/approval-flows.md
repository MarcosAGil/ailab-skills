# Autorización del encargo, no de cada manifiesto

Consulta contratos, archivos y saldo sin coste. Antes del primer envío de pago,
informa brevemente de objetivo, modelos/asistentes, modalidad, referencias,
parámetros, número de resultados y coste estimado. Distingue gasto estimado de
reservas temporales. No uses precios de ejemplos como tarifas actuales.

## Ejecutar sin preguntas repetidas

Una petición explícita como «genera», «ejecuta», «haz todos los pasos», «tienes mi
confirmación» o «independientemente del coste» autoriza el encargo que describe.
No la contestes con otra pregunta de confirmación. Informa del plan y ejecuta.
Si el usuario pidió solo precio, viabilidad o un prompt, no amplíes a generación.
Si quiere revisar el prompt antes, muéstralo y espera para la fase generativa.

La autorización cubre los pasos solicitados y sus entradas derivadas previstas:
por ejemplo, respuesta del Prompter como prompt, audio extraído del vídeo y voz
aislada como entrada del cambio de voz. No autoriza operaciones sugeridas por
el asistente, resultados extra, otro modelo, otra voz ni regeneraciones cobradas.

## Presupuesto opcional

- **Techo explícito:** si el usuario fija «máximo 200 créditos», o acepta un plan
  formulado expresamente como un máximo, respétalo. Cuenta cargos liquidados y
  reservas pendientes. Pide ampliar solo antes de superar ese techo.
- **Sin techo explícito:** la orden de ejecutar autoriza los costes del alcance
  pedido. No conviertas tu propia estimación ni la suma de reservas en un límite
  nuevo. Actualiza el coste y continúa si un paso cuesta más de lo estimado,
  siempre que el servidor lo cotice correctamente y haya saldo disponible.
- **«Independientemente del coste»:** elimina un techo presupuestario anterior
  para el mismo encargo. No elimina saldo, integridad, seguridad ni idempotencia.

Ejemplo: el usuario pide el workflow completo y luego dice «perfecto, guarda
todo ordenado». Ejecuta todas las etapas previstas. Si estimaste 5 créditos para
una etapa y el precio válido es 11, informa y sigue sin otra pregunta cuando
no exista techo explícito. Si aceptó expresamente «máximo 227», ese techo sí rige.

## Manifiestos técnicos

`prepare` no gasta. El máximo de cada manifiesto limita ESA petición; no es una
nueva solicitud de permiso al usuario. Usa `submit --confirmed` bajo la autorización
vigente. Conserva parámetros, referencias y hashes.

Si caduca un manifiesto o cambia un precio, vuelve a preparar el mismo paso con
el contrato vigente, sin volver a preguntar si respeta alcance y techo explícito.
Nunca edites el manifiesto para aumentar el máximo ni uses proveedores directos.
Si preparar y enviar discrepan, se trata de un error de cotización: actualiza la
CLI y vuelve a preparar una vez tras un rechazo verificable sin cargo. Si persiste,
informa del bloqueo técnico; no lo disfraces de falta de autorización o saldo.

## Recuperación segura

La autorización no está ligada a UUIDs. Un fallo definitivo sin cargo, o reembolsado,
permite un único reintento del mismo paso sin otra confirmación. Si la CLI ya lo
reintentó, no añadas otro. Un estado ambiguo se recupera con el mismo ID idempotente,
no con otro envío ni con una UUID nueva. No reintentes denegaciones de contenido.

Conserva los resultados terminados. Una rama bloqueada no impide completar otra
independiente dentro del encargo. Una operación antigua en revisión no bloquea
globalmente un trabajo nuevo, pero sí repetir la misma operación sin descartar
un doble cobro.

Pregunta solo por un cambio material de alcance, decisión imprescindible ausente,
ampliación de un techo explícito o revisión creativa solicitada. Consultar estado,
recuperar y descargar no requieren confirmación. Un resultado generado no autoriza
otra generación por sí mismo.
