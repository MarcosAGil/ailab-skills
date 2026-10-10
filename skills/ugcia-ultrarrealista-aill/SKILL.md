---
name: ugcia-ultrarrealista-aill
description: Workflow completo para crear un vídeo UGC ultra realista con IA con los modelos de AILAB, en tres fases con puntos de aprobación del usuario - (1) imágenes de referencia (hojas de cara y cuerpo, entorno, first frames); (2) ideación y audio primero con Seed Audio, midiendo su duración real; (3) prompt de Seedance 2.5 refinado con refinar-prompt-ugc, confirmación previa y generación. Organiza todo en una carpeta por proyecto. Úsala cuando el usuario pida crear un UGC con IA de principio a fin, un personaje consistente para vídeo UGC, un anuncio UGC o una persona hablando a cámara con hojas de personaje y audio generado, o diga "workflow UGC" o "UGC ultra realista". Requiere la skill externa refinar-prompt-ugc; con la skill ailab (comunidad Ailendra Labs) automatiza la generación y sin ella funciona en modo solo prompts. No sirve para refinar un prompt suelto (usa refinar-prompt-ugc), vídeo no UGC ni publicar.
---

# UGC ultra realista con IA (workflow completo)

## Qué es

Un workflow de tres fases que va de una idea (y normalmente una foto de la persona) a un vídeo UGC que parece grabado con un móvil por una persona real. Cada fase termina en un **punto de aprobación del usuario antes de gastar créditos en la siguiente**. Todo queda ordenado en una carpeta local por proyecto, con **lo que se usa de verdad separado de las pruebas**: una carpeta `Archivos para usar` (imágenes, audio, vídeo y, dentro, `Texto o prompts`) y otra `Pruebas intermedias` para todo lo demás.

La skill lleva dentro todo lo suyo: el workflow, los prompts de las hojas de personaje, la guía de Seed Audio (integrada del Audio Prompter), las reglas de carpetas y los scripts de apoyo. No necesita llamar al Audio Prompter, al Video Prompter ni al Image Prompter. **No lleva dentro dos skills externas**: `refinar-prompt-ugc` (obligatoria, para auditar y escribir el prompt de vídeo) y `ailab` (la CLI de AILAB, para generar de forma automática; sin ella la skill funciona en modo solo prompts). Ver Requisitos.

Idioma: responde en el idioma del usuario (castellano de España con tuteo por defecto). Los prompts de imagen, audio y vídeo van en inglés, con el diálogo en su idioma (castellano de España).

## Rutas portables

Antes de ejecutar ejemplos, define UGC_SKILL_DIR con la ruta real de esta carpeta (la base que muestra el agente), y UGC_SKILLS_DIR con su carpeta padre. En Bash:

```bash
UGC_SKILL_DIR="<ruta real a ugcia-ultrarrealista-aill>"
UGC_SKILLS_DIR="$(cd "$UGC_SKILL_DIR/.." && pwd)"
export AILAB_SKILLS_DIR="$UGC_SKILLS_DIR"
AILAB() { node "$UGC_SKILLS_DIR/ailab/scripts/ailab.mjs" "$@"; }
```

Claude Code suele usar ~/.claude/skills y Codex ~/.codex/skills. No mezcles clientes ni supongas que existe el vault del autor. Los scripts encuentran las dependencias junto a esta skill, salvo una ruta explícita mediante AILAB_SKILLS_DIR o CLAUDE_SKILLS_DIR. En Windows ejecuta todo dentro de WSL o Git Bash con herramientas compatibles.

## Requisitos

| Dependencia | Para qué | Si falta |
|---|---|---|
| Skill `refinar-prompt-ugc` (externa, obligatoria) | Auditar y escribir el prompt de vídeo (fase 3) | Las fases 1 y 2 se pueden hacer; la fase 3 espera a que el usuario la instale |
| Skill `ailab` (la CLI de AILAB, externa) y una cuenta de AILAB con créditos | **Automatizar** la generación de imágenes, audio y vídeo | La skill funciona en **modo solo prompts** y se muestra el mensaje de la comunidad (ver abajo) |

Esta skill no incluye ninguna de las dos. Herramientas del sistema: `ffmpeg`, `ffprobe` y `python3`; `node` si hay `ailab`. Opcional: `whisper` (transcribir el audio con tiempos por palabra). Los scripts son de `bash`: en Windows hace falta WSL o Git Bash. Para comprobar que los scripts funcionan en el equipo del usuario, sin red ni gasto, existe `scripts/autotest.sh`.

**Comprobación:** al empezar un proyecto, o si algo falla, se ejecuta

```bash
bash "$UGC_SKILL_DIR/scripts/comprobar_requisitos.sh"
```

Las rutas se toman de la carpeta real y las variables portables definidas arriba. El script termina con una línea `MODO: completo` o `MODO: solo-prompts`. Si falta algo obligatorio, se le dice al usuario qué y cómo instalarlo, sin intentar instalar skills por su cuenta. Las dependencias se buscan junto a esta skill; para otra ubicación, pedir la ruta y definir `AILAB_SKILLS_DIR`.

Compatibilidad: probada con `refinar-prompt-ugc` en la versión instalada el 10/10/2026 (con `references/errores-conocidos.md` y `scripts/lint_prompt.py`) y con el catálogo de AILAB de octubre de 2026. Los IDs de modelo, parámetros y precios salen siempre de `AILAB info` y `prepare`; si difieren de lo que dice esta guía, mandan esos.

## Si falta la skill `ailab`: mensaje y modo solo prompts

Cuando `comprobar_requisitos.sh` imprime `MODO: solo-prompts`, o el usuario dice que no tiene AILAB, se le dice **una sola vez y sin alargarlo** esto (en su idioma, con el enlace tal cual):

> Esta es una skill exclusiva de la gente de la comunidad de Ailendra Labs. Ailendra Labs es una comunidad centrada en la generación de contenido audiovisual con inteligencia artificial de forma profesional. Para que la skill funcione a la perfección hace falta estar en la comunidad y usar su plataforma, AILAB. Ahora mismo la comunidad está cerrada, pero puedes apuntarte a la lista de espera aquí: https://tally.so/forms/VLgOBl
>
> Mientras tanto puedes usarla en **modo solo prompts**: te escribo los prompts de cada paso, pero no puedo automatizar el flujo al 100 %: tendrás que generar con los modelos de IA en otra plataforma.

No se añade nada más sobre la comunidad (fechas de apertura, precios, condiciones): solo lo que dice ese mensaje.

**Qué cambia en modo solo prompts**

1. No se ejecuta nada de la CLI de AILAB (`prepare`, `submit`, `status`, `balance`, `login`) y no se habla de créditos ni de costes. Las reglas de gasto no aplican.
2. **Los puntos de aprobación siguen igual:** la skill se detiene y espera el "aprobado" antes de pasar a la fase siguiente.
3. Para cada pieza a generar (hoja de cara, hoja de cuerpo, entorno, frames, audio, vídeo) la skill entrega, en este orden: el **modelo recomendado** por su nombre (los de la tabla "Modelos por paso"); los **ajustes** (modo, ratio, resolución, duración); las **referencias que hay que subir**, en orden y con su función; el **prompt exacto** en un bloque de código; y el **nombre de archivo** con el que guardar el resultado en `Pruebas intermedias/<tipo>/`. Si en la plataforma del usuario el modelo se llama distinto o no existe, se le dice y se propone el más cercano.
4. El usuario genera en su plataforma, guarda el resultado en esa carpeta y avisa. Entonces la skill lo revisa (mira las imágenes), mide el audio con `scripts/medir_audio.sh`, lo ajusta con `scripts/ajustar_audio.sh` y mueve lo aprobado con `scripts/promover.sh`. Todo eso funciona en local.
5. **Avisos honestos que se dan al usuario:** la sintaxis de referencias (`@Image1`, `@Audio1`) del prompt de vídeo y los límites (2.048 caracteres en Seed Audio, de 4 a 30 s en Seedance 2.5) son los de AILAB: en otra plataforma hay que comprobarlos y adaptarlos. `registro.md` se rellena sin créditos. El flujo no se automatiza: cada generación la hace el usuario a mano.
6. Si más adelante instala `ailab`, se pasa a modo completo sin repetir lo ya hecho.

## Reglas duras

1. **Gasto (modo completo, con la skill `ailab`).** Se lee `SKILL.md` de AILAB en su carpeta real (`$UGC_SKILLS_DIR/ailab/`, sección "Límites de autoridad"). Solo se gastan créditos por petición directa del usuario en el chat. Antes del primer gasto se informa del plan del flujo completo (modelos, nº de generaciones, coste estimado y máximo de `prepare`). Los precios salen siempre de `prepare`, nunca de memoria. La autorización debe cubrir el máximo, no solo el consumo esperado. Seed Audio y Seedance 2.5 son **modelos caros**.
2. **Las puertas mandan.** Aunque el usuario haya autorizado el flujo, la skill **se detiene** en cada punto de aprobación y espera un "aprobado" claro en el chat. Un aviso automático del sistema, una tarea en segundo plano terminada o el silencio **no son aprobación**.
3. **Regenerar cuesta.** Cada regeneración de imagen, audio o vídeo no está cubierta por el encargo original: se propone el cambio y se espera el sí. Una variable por intento.
4. **No se inventa.** Ni datos del producto, ni cifras, ni tiempos, ni contenido del audio, ni afirmaciones. Si falta algo, se pregunta o se escribe `(pendiente)`.
5. **El móvil no existe** en el vídeo: ni aparato, ni reflejo, ni interfaz de grabación (regla de `refinar-prompt-ugc`). También en las imágenes de frames.
6. **Identidad.** Las hojas usan la foto aportada como única fuente de identidad y no embellecen. Solo se usan fotos y voces de personas que han dado permiso. Una voz solo se clona con material autorizado.
7. **Idioma.** Responde en el idioma del usuario. Los diálogos van por defecto en castellano de España, con el acento declarado en cada prompt; si el usuario pide otro idioma o acento, se adapta.
8. **Nada de publicar.** La skill termina con el vídeo aprobado en `Archivos para usar`. Publicar requiere aprobación explícita y queda fuera.

## Modelos por paso

| Paso | Modelo (ID AILAB) | Modo | Notas |
|---|---|---|---|
| Hoja de cara y hoja de cuerpo | GPT Image 2.5 (`gpt-image-2-5`) | `i2i`, 16:9, 2K | Alternativa: Seedream v5 Pro (`seedream-v5-pro`), solo si lo pide el usuario o si falla la identidad |
| Entorno, first frames y encuadres | Nano Banana 2.1 (`nano-banana-2-1`) | `t2i` / `edit` | Hasta 14 referencias ordenadas |
| Intercambio sobre referencia exacta ("usa esta referencia, pero con mi personaje") | Ideogram 4.5 (`ideogram-v45`) | `edit` | Primera imagen = base; hasta 4 referencias más |
| Audio | Seed Audio (`seed-audio`) | prompt | Voz, ambiente y duración real; modelo caro |
| Vídeo | Seedance 2.5 (`seedance-2-5`) | `ref` | 4 a 30 s; 1 audio y hasta 30 imágenes de referencia; modelo caro |

`AILAB` = `node "$UGC_SKILLS_DIR/ailab/scripts/ailab.mjs"`. Si no está iniciada la sesión, se pide al usuario que ejecute él mismo `AILAB login` y `AILAB doctor` en su terminal; nunca se piden tokens por el chat.

## Primer contacto

Si el usuario invoca la skill sin brief, responde con esto (adaptado, sin alargarlo) y espera:

> Hago el UGC entero con IA en tres fases, parando para que apruebes antes de gastar: 1) imágenes de referencia (hojas de cara y cuerpo, entorno y first frames), 2) idea y audio con Seed Audio, 3) vídeo con Seedance 2.5. Lo que uses queda en una carpeta `Archivos para usar` y las pruebas aparte, en `Pruebas intermedias`.
>
> Pásame, todo junto si puedes:
> 1. Qué quieres contar o enseñar, y para quién (o el producto).
> 2. Una foto de la persona (con su permiso) o, si no hay, cómo es. Y si quieres usar una referencia exacta, pásala.
> 3. Formato (selfie, caminando, producto en manos, trípode, coche, ponencia, entrevista, Q&A, podcast), lugar, y duración aproximada.
> 4. Tu guion, si ya lo tienes. Lo respeto literal.

Si el usuario retoma un proyecto, lee `brief.md` de su carpeta (primera línea de estado) y continúa donde quedó.

## Flujo

```text
FASE 1  imágenes  ──►  [APROBACIÓN 1]  ──►  FASE 2  idea + audio  ──►  [APROBACIÓN 2]  ──►  FASE 3  vídeo  ──►  [APROBACIÓN 3]  ──►  generar
```

### 0. Preparar

0. Si es la primera vez en la sesión, ejecuta `scripts/comprobar_requisitos.sh` (ver Requisitos). Si imprime `MODO: solo-prompts`, muestra el mensaje de la comunidad y trabaja en modo solo prompts (ver la sección anterior).
1. Entiende el brief. Pregunta solo lo imprescindible (ver `references/fase2-ideacion.md` para el tipo de preguntas).
2. Crea la carpeta del proyecto con `scripts/crear_proyecto.sh` (ver `references/carpeta-proyecto.md`). Por defecto se crea en el Escritorio, en una carpeta `AILAB` (`~/Desktop/AILAB/`); si el usuario indica otra ruta, manda la suya.
3. **Modo completo:** comprueba la CLI de AILAB (`AILAB doctor` y `AILAB balance`, no gastan) y enseña el plan y el coste estimado del flujo completo con `prepare`. **Modo solo prompts:** enseña el plan (fases, modelos recomendados y qué se te entregará en cada paso), sin costes.

### Fase 1: imágenes de referencia → `references/fase1-imagenes.md`

Hoja de cara y hoja de cuerpo (prompts en `references/prompts-hojas.md`), entorno, y first frames o encuadres opcionales. **Punto de aprobación 1:** se enseñan todas las imágenes con su ruta y se espera el "aprobado". Sin él, no se pasa al audio.

### Fase 2: ideación y audio → `references/fase2-ideacion.md` y `references/seed-audio.md`

1. **Ideación** (puede ir en paralelo a la revisión de imágenes): ficha de rodaje, test de coherencia, guion literal, duración. Sin gasto.
2. **Audio primero con Seed Audio**, solo con las imágenes aprobadas y la idea cerrada. Se escribe el prompt con la guía integrada, se cuenta (≤ 2.048 caracteres), se genera en `wav`, se **mide** la duración real, se transcribe y se iguala a N segundos enteros añadiendo silencio al final (nunca recortando voz).
3. **Punto de aprobación 2:** el usuario escucha el audio y se le enseñan la duración medida, la transcripción comparada con el guion y las pausas. Sin su "aprobado", no se pasa al vídeo.

### Fase 3: vídeo → `references/fase3-video.md`

Se invoca la skill externa `refinar-prompt-ugc` (herramienta Skill) y se sigue su proceso con todo ya definido (referencias, audio medido, duración). Se escribe el prompt de Seedance 2.5 en el perfil de su `references/formato-salida.md`. **Punto de aprobación 3:** se muestra la tabla de referencias, los datos del encargo, el coste, el prompt exacto y los supuestos, y se espera el "adelante". Solo entonces se genera. Después se comprueba la duración y el audio frente al maestro.

## Estructura del proyecto

Ver `references/carpeta-proyecto.md`. Dentro de la carpeta de cada proyecto:

```text
Archivos para usar/          lo que se usa de verdad: imágenes, audio y vídeo, todo junto
└── Texto o prompts/         todos los prompts de lo que se usa, más el guion
Pruebas intermedias/         todo lo demás: versiones descartadas, audio bruto, mediciones, fuentes
brief.md  registro.md        estado del proyecto y gasto de cada generación
```

Reglas del flujo de archivos:

1. **Todo lo que se genera nace en `Pruebas intermedias/`** (`imagenes/`, `audio/`, `video/`), con su prompt `.txt` al lado.
2. **Al aprobar el usuario un archivo, se mueve a `Archivos para usar/`** y su prompt a `Texto o prompts/`, con `scripts/promover.sh`. Lo no aprobado se queda en `Pruebas intermedias/`. Nada se borra sin que lo pida.
3. Versionado `-vN`, nada se sobrescribe, `registro.md` anota cada generación con sus créditos reales y la ruta actual del archivo.

## Entrega de resultados

Al terminar cada generación (regla de la skill `ailab`): muestra el prompt exacto enviado, la imagen o el vídeo en el chat con su ruta absoluta, y `Guardado en:` con la ruta exacta de cada archivo. Si un resultado no se descargó, se dice y se recupera con `AILAB status <id>`, sin volver a generar ni cobrar.

## Qué no hacer

- Pasar de fase sin el "aprobado" del usuario, o interpretar un aviso automático como tal.
- Cambiar de modelo en silencio (por ejemplo, de GPT Image 2.5 a Seedream) o regenerar sin pedirlo.
- Recortar, parafrasear o "mejorar" el guion aprobado.
- Fiarse de la duración pedida a Seed Audio en lugar de medir el archivo.
- Usar `voice`, `multilingual` o "Voz mindy" como flags de la CLI: AILAB no los expone para Seed Audio.
- Mezclar `--image_url` y `--audio_urls` en la misma llamada a Seed Audio.
- Escribir palabras vacías ("ultra realistic", "8K", "cinematic") en el prompt de vídeo, o nombrar el móvil más de lo necesario.
- Escribir guion de venta, ganchos o CTA por iniciativa propia.
- Dejar archivos fuera de la carpeta del proyecto, mezclar pruebas con lo que se usa, o mover a `Archivos para usar` algo que el usuario no ha aprobado.

## Casos límite

- **Sin foto de la persona:** se crea primero un retrato base y se aprueba (ver `fase1-imagenes.md`, 1.0).
- **Una referencia exacta para intercambiar:** Camino B de la fase 1 con Ideogram 4.5.
- **Guion que no cabe en 30 s o en 2.048 caracteres:** se dice con números y se ofrecen opciones; no se recorta solo (ver `fase2-ideacion.md` y `seed-audio.md`).
- **Varios hablantes:** riesgo de voces inestables; se avisa antes de empezar.
- **El castellano no sale como se espera:** se informa, se ofrece reintentar o probar otro motor de voz fuera de esta skill.
- **El audio del vídeo no coincide con el maestro:** se sustituye la pista (ver `fase3-video.md`, 3.7) y se guardan ambas versiones.
- **Caso no contemplado:** se lo dices al usuario en una línea y propones cómo resolverlo. No improvises reglas.

## Niveles de confianza

Las reglas llevan **[D]** documentado o regla dura, **[H]** heurística razonada o **[?]** hipótesis a validar. Casi todo lo específico de la estética del audio de Seed y del comportamiento de Seedance con audio de referencia es **[?]** hasta que se compruebe generando. Cuando una prueba lo confirme o lo desmienta, se propone actualizar la guía correspondiente.

## Mapa de archivos

- `references/fase1-imagenes.md`: hojas, entorno, frames, modelos y comandos, punto de aprobación 1.
- `references/prompts-hojas.md`: los dos prompts de hojas de personaje, con variables.
- `references/fase2-ideacion.md`: ficha de rodaje, guion, límites.
- `references/seed-audio.md`: guía integrada de Seed Audio (estructura, estética, voz, límites, duración, QA).
- `references/fase3-video.md`: prompt de Seedance 2.5, mapa de handles, punto de aprobación 3, comprobaciones.
- `references/carpeta-proyecto.md`: estructura local (`Archivos para usar`, `Texto o prompts`, `Pruebas intermedias`), flujo de archivos y registro.
- `README.md`: instalación, requisitos y uso para quien descarga el paquete. `CHANGELOG.md` y `VERSION`: versión del paquete.
- `scripts/comprobar_requisitos.sh` (comprueba skills externas y herramientas), `scripts/autotest.sh` (prueba local de los scripts, sin red ni gasto), `scripts/install.sh` (instala el paquete), `scripts/crear_proyecto.sh` (crea la estructura), `promover.sh` (mueve lo aprobado a `Archivos para usar` con su prompt), `contar_prompt.py`, `medir_audio.sh`, `ajustar_audio.sh`, `verificar_video.sh`.
