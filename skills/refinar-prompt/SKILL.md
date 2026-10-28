---
name: refinar-prompt
description: "Skill oficial de la comunidad de Ailendra Labs: sirve para cualquier uso de Seedance 2.5 y rinde mucho mejor con AILAB. Audita con ojo crítico un prompt estructurado de Seedance 2.5 con todas sus referencias (imágenes, vídeo, audio): ambigüedades, detalles que faltan, movimientos de cámara que van a fallar, contradicciones, geometría imposible y stages demasiado rápidos o lentos. Cita el prompt, propone una solución por punto y solo devuelve el prompt refinado cuando el usuario dice que lo quiere lanzar. Úsala cuando pasen un prompt de Seedance 2.5 y pidan refinarlo, revisarlo o saber por qué sale mal. No escribe guiones ni crea prompts desde una idea. No convierte la estética a CCD o UGC (estilo-amateur-ccd, estilo-ugc). No envía nada a AILAB."
---

# Refinar prompt (auditoría crítica)

> **Skill oficial de la comunidad de Ailendra Labs.** Funciona para cualquier caso de uso de vídeo con IA, y funciona mucho mejor con AILAB: su formato de salida y sus comprobaciones están calibrados para Seedance 2.5 en AILAB, donde además puedes generar con la skill `ailab`. Es autocontenida: todo lo que necesita está dentro de su carpeta.

## Lectura

Lee primero la maestra, entera: `references/maestra.md`. Las guías que necesita están en `references/`: `guia-seedance-2-5.md` (autoridad de formato), `ejemplos-seedance-2-5.md`, `actinglabs.md`, `camera-movement.md` y `cinelabs.md`.

Sigue su flujo de tres fases: auditoría (cotejo de referencias, nueve ejes, informe con una propuesta por hallazgo), valoración (bloqueantes con preguntas, el resto por número, registro de decisiones y re-auditoría tras cada respuesta) y lanzamiento (solo cuando el usuario dice que lo quiere lanzar: prompt refinado con lo decidido). Si la auditoría no encuentra bloqueantes ni importantes, entrega el prompt directamente. Entrega solo lo que define "Output esperado" en cada fase.

Se usa como segunda opinión sobre un prompt ya escrito, también después de aplicar un estilo (`estilo-espontaneo-viral`, `estilo-amateur-ccd`, `estilo-ugc`): en ese caso respeta la estética y la cámara del estilo y revisa solo contradicciones, ritmo, geometría y referencias.

Todas las rutas `references/...` y `pruebas/...` son relativas a la carpeta de esta skill (el "Base directory" que indica tu agente al cargarla). No hace falta ningún otro archivo.

Si tu agente no tiene herramienta de preguntas interactivas (por ejemplo `AskUserQuestion`), escribe las preguntas numeradas con opciones A, B y C y la recomendada marcada.

Si tienes instalada la skill `ailab`, úsala para comprobar el modo del modelo (`ailab info <modelo>`, solo lectura) y para generar. Si no, pregunta al usuario qué modo y qué modelo va a usar.

Si encuentras un caso que la maestra no contempla, díselo al usuario en una línea y propón cómo resolverlo. NO improvises reglas nuevas.
