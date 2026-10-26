# AILAB Skills: instrucciones para agentes

Repositorio público de las skills de AILAB para Claude Code y Codex. Español de España con tuteo, sin rayas
largas. No hay secretos aquí: no leas ni copies `~/.config/ailab` ni `~/.config/ailendra`, ni la clave privada
de firma (`~/.config/ailab/release-signing/`). No hagas push, no firmes releases ni gastes créditos sin que el
usuario lo pida para ese alcance.

El servidor es la autoridad de acceso, saldo, precio y contrato; este repositorio es solo el cliente. El proceso
completo de alta de un modelo (precios, interfaz, anuncios, skill, publicación) vive en la checklist de AILAB:
`docs/operations/model-release-checklist.md`, sección «Skill y plugin», en el repositorio `MarcosAGil/ailab`.
Esta guía resume solo lo que ocurre dentro de este repositorio.

## Estructura

- `skills/ailab/`: la skill y su runtime. `SKILL.md`, `references/`, `catalog/catalog.json`, `package.json`.
  - Arranque (no se actualiza solo): `scripts/ailab.mjs`, `scripts/lib/updater.mjs`, `config.mjs`, `environment.mjs`.
  - Runtime (se publica firmado y se actualiza solo): `scripts/pg.mjs`, `scripts/lib/*.mjs`, `scripts/adapters/*.mjs`.
- `plugins/ailab/`: GENERADO por `tools/build-plugin.mjs`. No se edita a mano (`--check` falla si difiere).
- `registry.json` y `marketplace.json`: índice de skills y fichas de la web. `.claude-plugin/` y `.agents/plugins/`: marketplaces.
- `tools/`: `validate.mjs`, `test.mjs`, `build-plugin.mjs`, `package.mjs`, `install.mjs`, `migrate-to-plugin.mjs`.
- `tests/`: pruebas `*.test.mjs` (se ejecutan en serie). `tests/helpers/` tiene generadores de archivos reales y el
  ejecutor de PHP. `tests/fixtures/` congela el arranque 1.0.0 y los hashes del catálogo 2.3.5: no se editan.
- `docs/`: guía de instalación del plugin y rotación de claves.

## Cómo llega un cambio a los usuarios

Nada de este repositorio llega a nadie por sí solo. El runtime y el catálogo se publican desde AILAB:
`tools/publish-skill-release.mjs` firma una release (`app/api/v1/skill/releases/<versión>/`, `stable.json`) y
`catalog-v2.json` sirve el catálogo. El plugin y la skill manual solo cambian cuando el usuario los actualiza.
Orden: 1) fusionar aquí en `main` sin aplastar (los enlaces «fuente» de la web apuntan a la revisión), 2) en AILAB,
firmar y sincronizar (`scripts/sync-skills-marketplace.mjs <ruta> --check`), 3) desplegar AILAB. Nunca se edita una
release publicada ni el `catalog.json` legacy de AILAB; `stable.json` conserva exactamente su forma.

## Añadir un modelo a la skill

1. Lee el contrato real en AILAB (gateway PHP, adaptador web y su informe en `docs/operations/`), no un mock.
   Comprueba que el modelo acepta un token de dispositivo (`wallet_require_scope('generate')`) y qué interruptor de
   configuración lo abre en producción. Si el servidor no lo admite desde la terminal, no cambies su política desde
   aquí: entrégalo con `enabled: false` y deja la petición al servidor documentada.
   Los modelos de Higgsfield (SOUL 2, SOUL Cinema, Marketing Studio Image y Genjutsu) los sirve
   `api/skill/higgsfield.php` con su propia tabla; cada uno respeta `HIGGSFIELD_FEATURE_FLAGS` igual que la web, así
   que con el interruptor cerrado la skill recibe un 403 claro («pendiente de activación») y nada se cobra.
2. ¿Basta el catálogo? Solo para un modelo NUEVO (que no figure en el catálogo de la release firmada vigente) que
   use un driver de `DRIVER_WHITELIST` y un flujo que los runtimes instalados ya sepan ejecutar (mismas claves y
   tipos que validan las CLI 2.3.7 a 2.3.12). Entonces se edita `catalog/catalog.json` y AILAB lo publica en
   `catalog-v2.json` sin release nueva. Cualquier cambio de precio, parámetro o disponibilidad de un modelo que ya
   está firmado exige una release nueva: `tools/validate-skill-release.mjs` de AILAB exige que cada modelo firmado
   sea idéntico en `catalog-v2.json`.
3. Si hace falta código (cuerpo con listas de objetos, precio que depende de archivos medidos, validación propia):
   un módulo en `scripts/lib/<modelo>.mjs` (validación local, estimación, entrada exacta), una rama por `model.id`
   en el adaptador (`adapters/jobs-v1.mjs`) y un enlace en `validateParams` y `estimateCredits` de `lib/catalog.mjs`.
   Eso exige release firmada nueva y `min_cli_version` igual a la versión del runtime que lo introduce.
4. Entrada de catálogo: solo claves de `MODEL_KEYS`, `PARAM_KEYS`, `ESTIMATE_KEYS` y `ESTIMATE_KINDS`; un driver ya
   conocido; tipos y límites idénticos a los del servidor; `estimate` con una forma que las CLI anteriores entiendan.
   No cambies entradas existentes (`tests/release-baseline.test.mjs` lo comprueba por hash). No pongas slugs ni
   endpoints del proveedor. El máximo autorizado (`estimate.credits`) nunca puede ser menor que la reserva del
   servidor: con vídeos o archivos de entrada, presupuesta el mismo cálculo y mide igual que el servidor (mp4/mov
   por `mvhd`, imágenes por cabecera). Si el servidor rechaza con 402, la CLI se equivocó.
5. Pruebas obligatorias: paridad con el PHP real (`AILAB_CANONICAL_REPO=<AILAB> node tools/test.mjs`; el servidor
   acepta lo que construye la CLI y lo devuelve igual, reserva lo mismo, rechaza lo mismo), prueba de acceso por
   token y del interruptor que lo abre, CLI real contra un servidor simulado (`prepare` y `submit`), y que los
   parsers 2.3.7 a 2.3.12 aceptan el catálogo y no ofrecen el modelo. Plantillas: `tests/kling-4-0.test.mjs` y
   `tests/seedance-lite.test.mjs`.
6. Documentación mínima: unas líneas en `SKILL.md` (el presupuesto de la guía es estricto, ver abajo), el detalle en
   `references/<modelo>.md` si hace falta y en la ayuda de los parámetros del catálogo, y `lib/guide.mjs`.
7. Regenera el plugin: `node tools/build-plugin.mjs`.

## Versiones

- Versión de la skill: `skills/ailab/package.json`, `registry.json`, `CLI_VERSION` (`scripts/lib/config.mjs`) y
  `BUNDLED_RUNTIME_VERSION` (`scripts/lib/updater.mjs`) van juntas. La del plugin sale de `package.json`.
- Un runtime ya publicado no se toca: un cambio de runtime es una versión nueva, firmada una vez.
- El arranque (`BOOTSTRAP_VERSION`) solo cambia si cambia el arranque; debe seguir aceptando el `stable.json` actual
  con claves exactas (`tests/fixtures/` congela el arranque 1.0.0). El plugin solo sube de versión si cambia el
  arranque o el `SKILL.md`: así lo ven los usuarios que ya lo tienen instalado.
- Un modelo nuevo con `min_cli_version` mayor que el de una CLI instalada se lista como no disponible en ella, no falla.

## Presupuesto de la guía de la web

AILAB publica `README.md`, el `SKILL.md` de cada skill y sus `guide_references` como `guide-knowledge.json`, con un
tope de 131.072 bytes. `tests/guide-budget.test.mjs` exige menos de 118.000. Los archivos de la raíz como este
`AGENTS.md` no entran en ese cálculo; `SKILL.md`, `README.md` y las referencias listadas en `registry.json` sí.
Mantén `SKILL.md` breve y pon el detalle de un modelo en `references/<modelo>.md` (no listado en `guide_references`),
en la ayuda del catálogo o en `lib/guide.mjs`.

## Comprobaciones antes de entregar

```bash
node tools/validate.mjs
AILAB_CANONICAL_REPO=/ruta/a/AILAB node tools/test.mjs      # sin la variable, las pruebas de paridad se omiten
node tools/build-plugin.mjs --check
claude plugin validate --strict ./plugins/ailab
claude plugin validate --strict .
```

CI ejecuta `npm run check` con Node 18.17.0, 20 y 24: no uses sintaxis ni APIs posteriores a Node 18.17. Commits con
preparación explícita de archivos; sin push sin autorización.
