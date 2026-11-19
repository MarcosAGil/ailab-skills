---
name: personaje-consistente
description: >-
  Crea y mantiene un personaje de IA consistente entre vídeos. Guarda todo en una carpeta con su
  nombre, con su ficha y guía de uso (LEEME.md), y genera con AILAB y Seedream 5.5 sus hojas: rostro
  3x3, 3 paneles por outfit, producto y escala por objeto. Crea su voz con un pangrama (ElevenLabs v4
  o Seed Audio), monta el vídeo negro y, si se pide, el clip de referencia con Seedance 2.5. Dos
  métodos de voz: pangrama en vídeo, o Seed Audio en vídeo, que a partir del prompt de vídeo de una
  escena ya escrito hace su pista sonora completa con la voz clonada y la monta en un vídeo negro de
  segundos enteros. Úsala cuando pidan crear un personaje consistente, una hoja de personaje
  (character sheet), un outfit nuevo, la voz, el vídeo negro, el clip, la pista de Seed Audio de una
  escena, actualizar la ficha o usar el personaje en una escena. No escribe guiones ni prompts de
  vídeo de escenas y no publica. Sin la skill ailab funciona en modo solo prompts.
---

# Personaje consistente

> **Skill oficial de la comunidad de Ailendra Labs.** Funciona para cualquier caso de uso de vídeo con IA, y funciona mucho mejor con AILAB, donde puedes generar con la skill `ailab`. Es autocontenida: todo lo que necesita está dentro de su carpeta.

Versión 0.6. Hecha para el sistema de AILAB y probada con un personaje completo (`references/ejemplo-luis.md`).

## Qué es

Una skill para crear un personaje con IA y mantener su **aspecto, su voz y su forma de actuar** entre vídeos. Cinco pilares:

1. **Ficha:** la sección "Quién es" de `LEEME.md`, con su aspecto, altura, personalidad, gestos y voz, escrito como conducta visible.
2. **Hojas de imagen** con Seedream 5.5: rostro 3x3, una hoja de 3 paneles por outfit, y producto y escala por cada objeto.
3. **Voz:** el pangrama dicho por el personaje, a −24 LUFS y en segundos enteros, montado en un **vídeo negro**.
4. **Clip de referencia (opcional):** un vídeo de dos paneles con Seedance 2.5 donde el personaje habla con su voz, gira la cabeza y enseña el outfit.
5. **Pista de escena (método 2, opcional):** la capa sonora completa de una escena ya escrita, hecha con Seed Audio a partir de su prompt de vídeo y con la voz clonada del pangrama, en un vídeo negro de segundos enteros.

Y una pieza que lo une todo: **`LEEME.md`**, la ficha y guía de uso que va en la raíz de la carpeta de cada personaje. Quien escriba o revise el prompt de una escena (un agente de prompts de vídeo, una skill que refina prompts o una persona) recibe la carpeta, lee `LEEME.md` y sabe qué referencias hay, qué aporta cada una y qué no se hereda de ella, sin conocer esta skill. `LEEME.md` **no es un prompt** ni está escrito para un modelo concreto. Ver `references/usar-en-escena.md`.

## Dos métodos para la voz

La primera parte es la misma: hojas y voz con el pangrama. Cambia cómo llega la voz a la escena.

| | **1 · Pangrama en vídeo** | **2 · Seed Audio en vídeo** |
|---|---|---|
| Qué llega al modelo de vídeo | El vídeo negro del pangrama (o el clip) como guía de voz | Las hojas y la pista sonora completa de la escena como audio exacto |
| Qué hace la skill | Hojas, voz, vídeo negro y, si se pide, el clip | Lo mismo y, por escena, el prompt de Seed Audio, la pista y su vídeo negro |
| Qué no hace | El prompt de vídeo de la escena | El prompt de vídeo de la escena, ni el cambio que mete la pista en él |

Flujo del método 2: personaje (esta skill) → prompt de vídeo de la escena (otro sistema) → prompt de Seed Audio, pista y vídeo negro (esta skill) → el otro sistema mete el vídeo negro en su prompt como pista exacta. Ver `references/seed-audio-en-video.md`.

**El clip no hace falta.** Las hojas más el vídeo negro con el pangrama ya sirven como referencias para cualquier escena. El clip puede mejorar los resultados, porque el modelo ve al personaje hablar y moverse, pero cuesta un vídeo extra. Ver `references/clip-referencia.md`, sección 1.

Todo se genera **paso a paso, con la aprobación del usuario en cada pieza**.

Idioma: responde en el idioma del usuario (castellano de España con tuteo por defecto). Los prompts van en inglés, con el pangrama y los diálogos en su idioma.

## Lo que no hace

- No escribe guiones, escenas completas, ganchos ni llamadas a la acción.
- No escribe ni modifica prompts de vídeo de escenas, para ningún modelo. El único prompt de vídeo que escribe es el de su propio clip de referencia.
- No publica nada.
- No genera ni clona la imagen o la voz de una persona real sin permiso.
- No promete que la voz o la cara sean idénticas entre generaciones: reduce la deriva, no la elimina.

## Requisitos

| Dependencia | Para qué | Si falta |
|---|---|---|
| Skill `ailab` (plugin de Ailendra Labs) y cuenta con créditos | Generar imágenes, voces, el clip y las pistas de escena | Modo **solo prompts** |
| `ffmpeg` y `ffprobe` | Convertir y recortar fotos, medir y ajustar el volumen, montar el vídeo negro, revisar imágenes y vídeos | Se pide al usuario que lo instale (`brew install ffmpeg` en macOS, o el gestor de paquetes de su sistema); sin él no hay vídeo negro |
| `whisper` (opcional) | Tiempos de cada palabra en el mapa de tiempos del método 2 | Se dan solo los tramos con sonido (`silencedetect`) y el usuario confirma qué es cada uno |

Para localizar `ailab`, que se instala como plugin, ver `references/ailab.md`, sección 1. Si no hay sesión, el usuario ejecuta él mismo `login` y `doctor`. Nunca se piden tokens por el chat.

### Si falta `ailab`: modo solo prompts

Se dice **una sola vez y sin alargarlo**, en el idioma del usuario y con el enlace tal cual:

> Esta es una skill exclusiva de la gente de la comunidad de Ailendra Labs. Ailendra Labs es una comunidad centrada en la generación de contenido audiovisual con inteligencia artificial de forma profesional. Para que la skill funcione a la perfección hace falta estar en la comunidad y usar su plataforma, AILAB. Ahora mismo la comunidad está cerrada, pero puedes apuntarte a la lista de espera aquí: https://tally.so/forms/VLgOBl
>
> Mientras tanto puedes usarla en **modo solo prompts**: te escribo los prompts de cada paso, pero no puedo automatizar el flujo al 100 %: tendrás que generar con los modelos de IA en otra plataforma.

En modo solo prompts no se ejecuta ningún comando de AILAB ni se habla de créditos. Por cada pieza se entregan el modelo recomendado, los ajustes, las referencias en orden, el prompt exacto y el nombre de archivo. Los pasos con `ffmpeg` (recorte de la foto, volumen, vídeo negro) sí los hace la skill.

## Reglas duras

1. **Gasto.** Solo se gastan créditos por petición directa del usuario en el chat, con las reglas de `ailab`. Antes del primer gasto se informa del plan y del coste de `prepare`. `prepare` no gasta; `submit` sí.
2. **Una pieza cada vez, con su aprobación.** Se para al final de cada pieza y se espera el "aprobado". Si el usuario ya aprobó un plan, sus piezas se envían sin volver a preguntar, pero cada regeneración se propone y espera el sí.
3. **Regenerar cuesta.** Se cambia **una sola cosa** por intento.
4. **Prompts de `references/`.** Se usan los de `prompts-imagen.md`, `voz-*.md`, `clip-referencia.md` y `seed-audio-en-video.md`, rellenando sus variables. Cualquier otro cambio se propone antes. Si el usuario cambia una plantilla, la antigua no se guarda.
5. **Seedream 5.5 admite 5.000 caracteres** por prompt. Se cuenta antes de cada `prepare`.
6. **Ninguna cara ajena en las referencias.** La foto del outfit se recorta por debajo de la barbilla antes de usarla. Una cara ajena se mezcla con la del personaje.
7. **La cara se compara lado a lado** con la 3x3 antes de aprobar una hoja de 3 paneles, una de escala o el clip. Si cambia un rasgo, no se aprueba.
8. **El outfit se deja tal cual**, gafas de sol y accesorios incluidos. El primer plano de la hoja de 3 paneles existe para enseñar todo lo que va del cuello para arriba.
9. **Realismo máximo.** Poros, lunares, pecas, cicatrices y marcas son parte de la identidad: se conservan. No se embellece.
10. **Cada objeto tiene hoja de producto y hoja de escala.** Ninguna escena con un objeto se prepara sin su hoja de escala aprobada.
11. **Voz a volumen medido.** El pangrama va a −24 LUFS integrados, pico por debajo de −1 dBFS, ganancia lineal, valores antes y después a la vista. La pista de escena del método 2 no se toca: solo se ajusta su duración.
12. **Segundos enteros.** La voz, el vídeo negro, el clip y la pista de escena duran N,000 s exactos. Se recorta hacia abajo solo si lo recortado es silencio; si hay voz, se redondea hacia arriba con silencio.
13. **Seed Audio: un nombre propio solo junto a su audio de referencia** (`Voice (Luis / @Audio1)`). Sin referencia, `Man`, `Woman` o un rol (`Wife`).
14. **No se inventa.** Ni rasgos, ni altura, ni medidas, ni datos del producto. Lo que falte se pregunta o se deja `(pendiente)`.
15. **Identidad y permisos.** Solo fotos y voces de personas que han dado permiso. Una voz solo se clona con grabación autorizada.
16. **Honestidad.** La skill no puede escuchar: mide el audio y el usuario lo escucha. Los cierres de labios del clip no se pueden asegurar a baja frecuencia de fotogramas: se le pide al usuario que los mire.
17. **Seguridad.** No se leen ni se copian `~/.config/ailendra/` ni `~/.config/ailab/`. No se llama a proveedores directamente.
18. **Sin em dashes** en la ficha ni en los textos que entrega.
19. **`LEEME.md` siempre al día y sin prompting de vídeo.** Se completa al cerrar el personaje y se actualiza con cada pieza nueva o cambio de ficha. Cada ruta que cita existe. Describe referencias, no escribe bloques para un modelo.
20. **Carpeta limpia.** Cada archivo en un solo sitio, sin duplicados. Lo no aprobado y lo que solo sirve para el futuro va a `backup/`.

## Primer contacto

Si la skill se invoca sin más contexto, responde con esto (adaptado, sin alargarlo) y espera:

> Soy una skill para crear un personaje con IA y mantenerlo igual entre vídeos: su ficha, sus hojas de referencia (rostro, cuerpo por outfit, objetos), su voz con un pangrama y su vídeo negro, y si quieres un clip de referencia. Todo en una carpeta local que luego recupero para tus escenas.
>
> Para empezar dime:
> 1. Cómo se llama y cómo es, o pásame foto(s) de una persona que haya dado permiso.
> 2. Su altura en cm y su complexión, y la foto del outfit.
> 3. Si va a usar objetos (libreta, gorra, ordenador...), con su tamaño aproximado en cm.
> 4. Cómo quieres la voz: ElevenLabs v4 o Seed Audio (la probada en el ejemplo, y la que permite clonar la voz para las pistas de escena), con qué idioma y acento, y si natural o con rango emocional.
> 
> Creo su carpeta, con su nombre, en la carpeta donde estás trabajando.

## Operaciones

| Operación | Cuándo | Guía |
|---|---|---|
| **Crear** un personaje | Es nuevo | `references/flujo-crear.md` |
| **Añadir** una pieza | Un outfit, un objeto, la voz o el clip a un personaje que ya existe | `references/flujo-crear.md` |
| **Actualizar** la ficha | Cambia un rasgo | `references/flujo-crear.md` y `prompts-imagen.md`, sección 4 |
| **Usar en una escena** | Preparar un vídeo o una imagen con el personaje | `references/usar-en-escena.md` y el `LEEME.md` del personaje |
| **Pista de escena** (método 2) | Ya hay un prompt de vídeo de la escena y se quiere su sonido con Seed Audio | `references/seed-audio-en-video.md` |

## Flujo de crear, en resumen

| Fase | Pieza | Modelo | Puerta |
|---|---|---|---|
| 0 | Brief y carpeta | | Plan y coste aprobados |
| 1 | Ficha (`LEEME.md`, sección 2) | | Ficha aprobada |
| 2 | Rostro: retrato base (solo si es inventado) y hoja 3x3 | Seedream 5.5 | Cada una aprobada |
| 3 | Una hoja de 3 paneles por outfit, con la foto recortada | Seedream 5.5 | Cara comparada y hoja aprobada |
| 4 | Por objeto: hoja de producto y hoja de escala | Seedream 5.5 | Cada una aprobada |
| 5 | Voz con el pangrama, medidor de volumen y duración exacta | ElevenLabs v4 o Seed Audio | El usuario la escucha y la aprueba |
| 6 | Vídeo negro | `ffmpeg` | Duración comprobada |
| 7 | Clip de referencia (**opcional**) | Seedance 2.5 | Revisado, recortado y aprobado |
| 8 | Cierre: `LEEME.md` completo con la guía de referencias | | El usuario revisa `LEEME.md` |

Después de la fase 6 el personaje ya se puede usar en escenas. La pista del método 2 se hace después, por escena.

## Carpeta del personaje

Se crea **en la ruta de trabajo** del usuario y se llama **como el personaje** (`Luis/`). La leen personas y agentes: pocas carpetas, nombres que se explican solos, y al entrar se ve lo que se usa.

```text
<ruta de trabajo>/<Nombre>/
├── LEEME.md                          ficha + guía de uso (lo primero que se lee)
├── Video1_clip-<outfit>.mp4          clip de referencia (opcional, uno por outfit)
├── Escala_<objeto>.png               una por objeto
├── hojas-y-voz/                      Image1_cara-3x3.png · Image2_<outfit>_3paneles.png · Video1_voz-pangrama_<T>s.mp4 · Audio1_voz-pangrama_<T>s.wav
└── backup/                           registro.md · fuentes/ · prompts/ · descartes/  (nunca se adjunta)
```

El prefijo de cada archivo es su handle por defecto. Lo generado empieza en `backup/descartes/` y, al aprobarse, se mueve a su sitio. Detalle y reglas en `references/flujo-crear.md`. El ejemplo real es `ejemplos/Luis/`.

## Entrega al terminar cada pieza

1. El **prompt final exacto** que se envió.
2. La imagen o el archivo, con su ruta local absoluta.
3. `Guardado en:` con la ruta absoluta exacta.
4. La **revisión**: lo que se ha medido y visto (comparación de cara, fondo, cada prenda, duración, volumen), sin suavizar un fallo.
5. La petición de aprobación. No se sigue sin ella.

## Casos límite

- **Sin foto ni descripción:** se ayuda a describirlo con la sección 2 de la plantilla de `LEEME.md`. No se inventan rasgos.
- **La foto del outfit enseña a otra persona:** se recorta por debajo de la barbilla. Si la foto no deja recortar sin perder el cuello de la prenda, se avisa y se revisa el resultado con más cuidado.
- **El outfit tiene accesorios del cuello para arriba** (gafas, gorra, pendientes): al recortar se pierden de la foto. Se describen en el prompt y, para fidelidad total, se hace su hoja de producto y va como Image C.
- **El prompt pasa de 5.000 caracteres:** se acortan las descripciones, nunca el bloqueo de cara ni los paneles.
- **La cara de una hoja se desvía:** no se aprueba. Se propone una regeneración que cambie solo `{{FACE_LOCK}}` o las referencias.
- **Personaje sin objetos:** se omiten producto y escala.
- **El usuario trae su propio audio** (por ejemplo, un MP3 de la plataforma): se usa como original y se pasa por el medidor.
- **Un vídeo generado dura un poco más de T:** se recorta a T exactos antes de usarlo como referencia.
- **La escena lleva un outfit que no está en la carpeta:** lo decide quien haga el vídeo. La skill recomienda crear antes su hoja de 3 paneles.
- **Piden el prompt de vídeo de la escena:** la skill no lo escribe. Se dice en una línea y se entrega la carpeta del personaje (y, en el método 2, la pista y su mapa de tiempos) para el sistema de prompts de vídeo.
- **Otra voz de la escena tiene pangrama:** en el método 2 se adjunta también, como `@Audio2` o `@Audio3` (hasta 3).
- **La pista de Seed Audio dura más que la escena con sonido al final:** se redondea hacia arriba y se avisa de que el prompt de vídeo tiene que usar esa duración.
- **Otro modelo de vídeo para el clip:** la plantilla del clip es de Seedance 2.5. Con otro modelo no está probada y se avisa.
- **Bloqueo de contenido:** se informa con el mensaje y el ID y se ofrecen ajustes que decide el usuario (`references/ailab.md`). No se reenvía lo mismo por otro modelo.
- **Caso no contemplado:** se dice en una línea y se propone cómo resolverlo.

## Niveles de confianza

Las reglas de las referencias llevan etiqueta: **[D]** documentado o dato de la CLI, **[C]** comprobado generando en el ejemplo, **[H]** decisión razonada, **[?]** hipótesis por validar.

## Mapa de archivos

- `references/flujo-crear.md`: fases, carpeta, comandos y cómo actualizar.
- `references/prompts-imagen.md`: los siete prompts de imagen de Seedream 5.5, sus variables y cómo revisar cada imagen.
- `references/voz-pangrama.md`: el pangrama, los dos modos y las etiquetas.
- `references/voz-elevenlabs.md`: voces de ElevenLabs (ruta por defecto).
- `references/voz-seed-audio.md`: Seed Audio (alternativa), plantillas aprobadas.
- `references/acentos.md`: cómo pedir distintos acentos.
- `references/volumen-y-video-negro.md`: medidor de volumen, segundos enteros, vídeo negro y recorte de vídeos.
- `references/clip-referencia.md`: el clip opcional de Seedance 2.5, plantilla, ajustes y revisión.
- `references/usar-en-escena.md`: cómo generar `LEEME.md`, los dos modos de referencias, los dos métodos de voz y cómo preparar una escena.
- `references/seed-audio-en-video.md`: el método 2, con el flujo completo, el prompt de Seed Audio de la escena, la pista, su vídeo negro y el ejemplo de la corbata.
- `references/ejemplo-luis.md`: el personaje completo de ejemplo, errores, arreglos y aprendizajes.
- `references/ailab.md`: localizar AILAB, modelos, gasto, errores y recuperación.
- `plantillas/LEEME-personaje.md`: plantilla de `LEEME.md`, la ficha y guía de uso de cada personaje.
- `ejemplos/Luis/`: el personaje de ejemplo con la estructura real de carpeta y su `LEEME.md`.
- `README.md`: instalación y uso.
