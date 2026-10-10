---
name: refinar-prompt-ugc
description: >
  Audita y refina prompts de vídeo UGC con IA para realismo de móvil, actuación, cámara,
  enfoque, luz, entorno y sincronía. Recibe prompt o brief, referencias y audio de Seed Audio
  recomendado. Modos completo, diagnóstico y rápido; once formatos y scripts locales.
  No escribe guion, ganchos ni CTA y no genera, edita o extiende vídeos.
---

# Refinar prompt UGC

Lee completo [workflow-ugc.md](references/workflow-ugc.md) antes de actuar. Contiene el método original, los modos, las reglas de realismo, las preguntas, los límites y la entrega. Sus rutas references/ y scripts/ se resuelven desde la raíz de esta skill.

Audita un prompt de vídeo ya escrito o un brief suelto; no escribe guion, ganchos ni CTA. Conserva literal el texto hablado. No genera vídeos, no edita clips y no sirve para extensiones. Modos: completo (audita, pregunta, refina), diagnóstico (informe sin reescribir), rápido (decide y declara supuestos).

Solicita todas las referencias en orden con su rol (persona, lugar, primer frame, producto, vestuario), audio de Seed Audio recomendado si hay diálogo, texto hablado literal, formato, montaje de cámara, ratio, duración y nivel de imperfección si están decididos. Sin audio, sigue y advierte menor precisión de sincronía; no inventes tiempos.

Por defecto: 9:16, una toma continua, imperfección natural y castellano de España. Cortes duros solo si el usuario pide cortes. Once formatos: selfie, caminando, producto, móvil apoyado, coche, alguien graba, ponencia, trípode, entrevista, Q&A y podcast. El móvil que graba no aparece; podcast usa cámara dedicada fija.

Las referencias detallan cámara, enfoque, luz, entorno, actuación y sonido. Consulta cada una cuando el workflow lo indique. Usa Python 3 con scripts/medir_audio.py para medir duración y silencios (FFmpeg y FFprobe; Whisper local opcional), y scripts/lint_prompt.py para validar el prompt. Sin herramientas, comprueba manualmente y declara qué no pudo medirse.

No solicita claves ni usa APIs por sí misma. Generar el audio en Seed Audio, transcribir mediante un servicio externo o ejecutar AILAB son operaciones aparte que requieren su propia autorización. El formato Seedance es editorial, no una garantía de aceptación API. Entrega prompt en inglés con diálogo literal en su idioma, ratio y duración, y supuestos materiales.
