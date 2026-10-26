# Rotación de la clave de firma del runtime

El arranque de la skill (`scripts/ailab.mjs` y `scripts/lib/updater.mjs`) descarga el runtime de AILAB
solo si su `stable.json` está firmado con una clave Ed25519 de confianza. Hoy hay una única clave
pública, `UPDATE_PUBLIC_KEY_PEM`. Desde el arranque 1.1.0 la lista de claves de confianza es
`UPDATE_PUBLIC_KEYS_PEM` (un array con esa misma clave), preparada para una rotación futura.

## Lo que no se puede cambiar

Todo arranque ya instalado valida `stable.json` con claves exactas (`validateReleaseEnvelope` y
`exactKeys`): el sobre solo puede tener `signed` y `signature`, y `signed` solo los campos de siempre.
Añadir un campo, una segunda firma o un identificador de clave rompería la actualización de todos los
usuarios actuales. Por eso `stable.json` no cambia de forma y lleva una sola firma.

## Cómo se añade una clave de reserva

1. Genera el par de claves **fuera del repositorio**. La clave privada nueva queda en
   `~/.config/ailab/release-signing/` (o donde decidas) y no se sube ni se pega en ningún sitio.
2. Añade **solo la clave pública nueva** al array `UPDATE_PUBLIC_KEYS_PEM` de
   `skills/ailab/scripts/lib/updater.mjs` y sube `BOOTSTRAP_VERSION` (por ejemplo a 1.2.0). Añádela
   también a `EXPECTED_PUBLIC_KEY` de `tools/publish-skill-release.mjs` en AILAB cuando vayas a firmar con ella.
3. Publica una release normal firmada con la clave **actual**. Cuando el plugin se actualice, los
   usuarios tendrán un arranque que confía en las dos claves.
4. Sube `MINIMUM_BOOTSTRAP_VERSION` en `skills/ailab/scripts/lib/environment.mjs` a la versión del paso 2:
   la CLI avisará a los arranques anteriores de que actualicen el plugin.
5. Mientras queden arranques sin la clave nueva, sigue firmando con la actual. Cuando ya no queden (o
   aceptes que se queden sin actualizaciones y deban reinstalar el plugin), firma con la nueva y
   retira la antigua en una versión posterior del arranque.

El mecanismo está probado en `tests/bootstrap-compat.test.mjs`: con varias claves, una firma válida de
cualquiera de ellas pasa; con claves ajenas, no; y un campo nuevo en `signed` se rechaza aunque esté bien firmado.

## Qué no existe todavía

No hay una segunda clave privada: no se ha generado ninguna y este repositorio no contiene ninguna.
Hasta que se haga el paso 1, `UPDATE_PUBLIC_KEYS_PEM` tiene una sola entrada y el comportamiento es
idéntico al del arranque 1.0.0.
