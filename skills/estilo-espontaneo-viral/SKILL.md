---
name: estilo-espontaneo-viral
description: "Skill oficial de la comunidad de Ailendra Labs: sirve para cualquier uso de Seedance 2.5 y rinde mucho mejor con AILAB. Crea y refina prompts en estilo espontáneo-viral (escena cotidiana grabada a mano por un testigo con móvil o camcorder, sin cámara profesional). Recibe una idea, un prompt (incluido el borrador del Video Prompter), un vídeo de referencia, imágenes o audio. Comprueba estilo, reglas y los errores comunes de prompting (referencias que contradicen el texto, cámara que no cubre lo que promete, distancias y tiempos que no cuadran, elementos o sonidos inventados), propone arreglos, pregunta y, al aceptar, entrega el prompt con la arquitectura de Seedance 2.5 y la disciplina de referencias. Úsala para vídeos espontáneo-viral, \"grabado a mano\", \"escena cotidiana\" o \"testigo con móvil\". No audita prompts de otro estilo (refinar-prompt), CCD (estilo-amateur-ccd) ni UGC (estilo-ugc), y no envía nada a AILAB."
---

# Estilo espontáneo-viral (Seedance 2.5)

> **Skill oficial de la comunidad de Ailendra Labs.** Funciona para cualquier caso de uso de vídeo con IA, y funciona mucho mejor con AILAB: su formato de salida y sus comprobaciones están calibrados para Seedance 2.5 en AILAB, donde además puedes generar con la skill `ailab`. Es autocontenida: todo lo que necesita está dentro de su carpeta.

## Paso 0. Triaje (antes de leer ningún archivo)

Esta parte vive aquí para funcionar sin ningún otro archivo. Clasifica lo que ha llegado y actúa:

1. **Entrada vacía** (solo el nombre de la skill o un saludo): no leas nada más. Responde y espera:
   `Dame una de estas cosas: una idea escrita, un prompt que quieras refinar, un vídeo o enlace de referencia, o imágenes y audio. Ejemplo: "un gladiador pide un café en una cafetería de barrio, 6 s". Si quieres el prompt directo, añade "dámelo".`
2. **Fuera de alcance:** una sola línea que nombre la skill que encaja, y para sin leer nada más.

   | Si piden | Skill |
   |---|---|
   | Auditar un prompt de Seedance 2.5 ya estructurado, sin pedir este estilo | `refinar-prompt` |
   | Estética CCD de compacta | `estilo-amateur-ccd` |
   | UGC de móvil | `estilo-ugc` |
   | Edición, extensión, storyboard, montaje o transiciones | `seedance-25-ailendra-labs` |
   | Campaña, moda o lujo cinematográfico | una skill de dirección cinematográfica de campañas |
   | Otro modelo de vídeo | el Video Prompter de AILAB |
   | Guion hablado | una skill de guion |
   | Hooks o ángulos de contenido | una skill de ideación de contenido |
   | Enviar a AILAB | `ailab` |
   | Texto que no es un encargo de vídeo (captions, estrategia) | Di en una línea que no es de esta skill |

   Un encargo de Seedance 2.5 espontáneo que pida dron, música o cámara lenta no es esto: se resuelve con el caso edge "El encargo choca con el estilo" de la maestra.
3. **Idea corta** (una o dos frases, sin referencias ni diálogo): lectura reducida (la maestra y la guía de Seedance 2.5) e informe corto, sin las tablas de rasgos y de ritmo salvo que el reloj no cuadre:

   ```text
   Análisis espontáneo-viral (corto)
   Entrada: idea · Dispositivo: <propuesto> · Duración: <N> s · Ratio: <ratio>
   Encaje con el estilo: <una línea>.
   Lo que falla (hasta 3): [ETIQUETA · ID · gravedad] "<cita>". Esto no es espontáneo-viral: <mecanismo>. Propuesta: <...>.
   Decisiones: <D1 y D2 solo si la idea no las responde>.
   Dime qué hacemos con cada punto o "decide tú". Cuando lo aceptes, te doy el prompt.
   ```
4. **Todo lo demás** (prompt, borrador de un agente, vídeo, referencias, o idea con diálogo): flujo completo.

## Lectura (solo si pasa el triaje)

Lee la maestra, entera: `references/maestra.md`.

Después lee, enteras, las guías que la maestra indica en "Fuentes y quién manda en cada cosa", todas dentro de `references/`: `guia-seedance-2-5.md` y `auditoria-refinar-prompt.md` son obligatorias en el flujo completo; `ejemplos-seedance-2-5.md`, `cinelabs.md`, `camera-movement.md`, `actinglabs.md` y `ugc.md` según lo que toque. No escribas de memoria.

Sigue el flujo de tres fases de la maestra: análisis (estilo con el eje 10, calidad con el eje 11, reglas, errores y mejoras, con una propuesta por punto), valoración (preguntas, registro de decisiones y re-auditoría tras cada respuesta) y generación (solo cuando el usuario acepta y responde: prompt con todas las referencias, la arquitectura de Seedance 2.5, la disciplina de referencias, las reglas de redacción y la lectura adversaria final). Regla de oro: conserva el contenido y el movimiento de la entrada, escribe siempre la cámara con el ADN de cámara de la maestra (el dispositivo manda y siempre como un testigo que presencia la escena, muy realista y serio: la cámara ES el aparato y nunca se ve, aspecto real del aparato, encuadre, lente y movimiento por stage) y añade arquitectura, detalle y apuntes técnicos.

Dos comprobaciones que no se saltan, vengan de donde vengan: si hay primer fotograma más otras referencias, comprobar el modo del modelo (Q2); y si la entrada es un borrador del Video Prompter, pasar primero los deslices del agente (Q8, Q12, Q16, Q18, Q19).

Todas las rutas `references/...` y `pruebas/...` son relativas a la carpeta de esta skill (el "Base directory" que indica tu agente al cargarla). No hace falta ningún otro archivo.

Si tu agente no tiene herramienta de preguntas interactivas (por ejemplo `AskUserQuestion`), escribe las preguntas numeradas con opciones A, B y C y la recomendada marcada.

Si tienes instalada la skill `ailab`, úsala para comprobar el modo del modelo (`ailab info <modelo>`, solo lectura) y para generar. Si no, pregunta al usuario qué modo y qué modelo va a usar.

Banco de pruebas en `pruebas/`.

Si encuentras un caso que la maestra no contempla, díselo al usuario en una línea y propón cómo resolverlo. NO improvises reglas nuevas.
