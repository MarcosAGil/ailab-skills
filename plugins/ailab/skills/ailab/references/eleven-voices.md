# ElevenLabs: biblioteca y Mis voces

Esta ampliación requiere el backend compatible y la release firmada 2.3.8.
El catálogo activo decide su disponibilidad. No evites un rechazo de
permisos utilizando cookies, el API del proveedor o un identificador privado ajeno.

## Permisos y elección

`voices eleven` muestra voces curadas, incorporadas de la comunidad y referencias
privadas de tu cuenta. No revela el identificador ElevenLabs de las voces privadas.
`voices eleven --language es --search narrador --page 0` busca una página de la
biblioteca; usa `--language en` para inglés. No recorre todas las páginas sin pedirlo.
Los filtros y límites son los mismos que en la web. Solo selecciona entradas con
`usable: true`; AILAB no admite recargos desconocidos ni voces de famosos.

La incorporación explícita se hace con `voice-select <voice_id> --owner <public_owner_id>
--name <nombre> --confirmed`. No genera audio ni cobra alta privada. La respuesta
devuelve el ID incorporado que debes usar en `prepare eleven-tts --voice_id`.

Para seleccionar, crear, conservar o borrar voces necesitas crear personalmente un
nuevo token en Cuenta, marcando **Permitir gestionar voces**, y ejecutar `login`
en tu terminal. No pegues el token en el chat. Los tokens anteriores conservan sus
permisos y no adquieren `voices_manage` automáticamente. La generación de audio
solo requiere los permisos existentes de lectura/generación.

## Costes y disponibilidad

- Alta: 100 cr cuando la voz queda disponible, con 48 horas incluidas.
- Diseño: lote de hasta tres muestras, cobrado al entregarlas, aunque no guardes
  ninguna. `voice-prepare design` consulta el precio actual: 100, 500 y 1.000
  caracteres de prueba corresponden actualmente a 7, 31 y 62 cr. No hay límite
  comercial diario; siguen los controles técnicos, la capacidad y los casos en revisión.
- Conservación: opcional, 15 cr por periodo de 24 horas, con fecha y presupuesto
  máximo elegidos por el usuario. No se activa durante el alta.
- Generar audio se cobra por separado. Usa el flujo `prepare` / `submit` del modelo.
- Una voz por miembro, con plazas compartidas y reserva del proveedor. Una plaza
  ocupada no autoriza a borrar otra voz o crear otra cuenta para superar el límite.

Consulta `voice-options` y `voice-list` antes de crear. Si el mantenimiento está
atrasado, abre Mis voces en la web; la CLI no ejecuta tareas administrativas.

## Diseñar mediante descripción

```text
voice-prepare design --description "Descripción de la voz, de 20 a 1.000 caracteres" --text-file /ruta/texto-de-prueba.txt
voice-submit <manifest_id> --confirmed
voice-status <manifest_id>
voice-samples <manifest_id> --output /ruta/muestras
voice-prepare create --name "Mi voz" --sample <sample_id> --request <manifest_id_de_muestras>
voice-submit <manifest_id_de_alta> --confirmed
```

El texto de prueba debe tener entre 100 y 1.000 caracteres Unicode. Puedes usar
`--text` y `--description-file` en lugar de sus alternativas. Muestra el precio
del lote antes de enviarlo. El usuario elige la muestra después de escucharla:
no elijas ni guardes una automáticamente salvo instrucción explícita.
El plan de alta vuelve a mostrar sus 100 cr. La autorización de pedir muestras
por sí sola no autoriza el alta. Las muestras/plazas caducan: no prometas
recuperación de audio que el proveedor no identificó o que ya se eliminó.

## Clonar una grabación autorizada

```text
voice-prepare clone --name "Mi voz" --audio /ruta/voz.mp3 --evidence /ruta/autorizacion.pdf --rights-confirmed
voice-submit <manifest_id> --confirmed
voice-status <manifest_id>
```

MP3 o WAV, hasta 20 MB y 120 segundos, con duración legible. El documento de
autorización PDF o texto es obligatorio también para voz propia. Pide consentimiento
expreso del titular y no infieras derechos por disponer del archivo. No publiques
ese documento ni su contenido. AILAB recibe la grabación solo al confirmar el alta
y elimina su copia temporal al terminar o fallar; el archivo original del usuario
no se borra. ElevenLabs puede conservar las muestras necesarias para prestar el servicio.

## Usar y gestionar

`voice-list` muestra `services`, estado y vigencia. Para TTS utiliza
`prepare eleven-tts --version v4 --text "Texto" --private_voice_id <id_ailab>`.
No uses el ID privado como `voice_id` ni lo conviertas en un ID del proveedor.
Los servicios no incluidos en `services` no están autorizados.

```text
voice-prepare renew --id <id_ailab> --until 2026-10-20 --max-credits 150
voice-submit <manifest_id> --confirmed
voice-prepare renew --id <id_ailab>
voice-submit <manifest_id_para_desactivar> --confirmed
voice-prepare resume --id <id_ailab> --max-credits 15
voice-submit <manifest_id> --confirmed
voice-prepare delete --id <id_ailab>
voice-submit <manifest_id> --confirmed
```

La fecha y el coste se verifican en servidor; el horizonte vigente es de hasta 30
días. Desactivar conservación no borra inmediatamente. El borrado es irreversible:
requiere una orden explícita del usuario para esa voz exacta. Los audios ya
generados y movimientos se conservan.

Una respuesta perdida NO demuestra fallo ni ausencia de cargo. `voice-submit`
persiste la referencia antes del POST; si vuelves a usar el mismo manifiesto,
consulta su estado sin repetir la operación. Usa `voice-status` incluso desde
otra sesión (los diseños aceptan su UUID y las voces su referencia AILAB).
Si el alta no devuelve ID, conserva el manifiesto y consulta soporte: nunca
vuelvas a clonar/diseñar para recuperar una petición incierta.
