# Changelog

## 1.1.2 (2026-10-10): copia portable para el marketplace

- Nombre en minúsculas y rutas para Claude Code, Codex e instalación por proyecto.
- Rechazo de sobrescrituras al ajustar audio o sustituir pistas.
- No sustituir audio con duraciones distintas ni recortar voz mediante shortest.
- Promoción con comprobación previa de conflictos y bloqueo de rutas fuera del proyecto.
- Entorno opcional coherente, rutas de imágenes aprobadas y reserva de audio diferenciada de duración creativa.
- Autotest local y pruebas de regresión; proveedores no probados en esta revisión.

## 1.1.1 (2026-10-10)

- Nuevo `scripts/autotest.sh`: prueba local de todos los scripts con datos sintéticos, sin red ni gasto de créditos.
- La descripción de `SKILL.md` baja a 920 caracteres (límite habitual de 1.024) y se valida como YAML.
- `SKILL.md` aclara que los comandos usan la instalación por defecto y que, si la skill está en otro sitio, se usa su "Base directory".
- `comprobar_requisitos.sh` avisa si `refinar-prompt-ugc` es una versión antigua (sin lint ni errores conocidos).
- Guías de la fase 3: los límites de tramo se eligen solo dentro de silencios medidos, el entorno es opcional y el final del clip respeta la cola de silencio medida.
- Guía de Seed Audio: corregida la nota sobre el final del audio (en las pruebas la voz llegó hasta el final del archivo).
- README: aviso para Windows (WSL o Git Bash).

## 1.1.0 (2026-10-10)

- **Modo solo prompts:** si no está la skill `ailab`, la skill ya no falla: muestra un mensaje sobre la comunidad de Ailendra Labs (con el enlace a la lista de espera) y trabaja entregando los prompts de cada paso, con modelo, ajustes, referencias y nombre de archivo, para que el usuario genere en otra plataforma. Los puntos de aprobación y la medición del audio en local siguen igual.
- `comprobar_requisitos.sh` termina con `MODO: completo` o `MODO: solo-prompts`; sin `ailab` ya no es un error y `node` solo se exige si hay `ailab`.
- Carpeta de proyectos por defecto: `~/Desktop/AILAB/` (una carpeta `AILAB` en el Escritorio).
- El paquete ya no incluye una copia de `refinar-prompt-ugc`: se usa la skill externa instalada.

## 1.0.0 (2026-10-10)

Primera versión empaquetada.

- Workflow en tres fases con tres puntos de aprobación: imágenes, audio y confirmación previa del vídeo.
- Hojas de personaje (cara y cuerpo) con GPT Image 2.5; entorno y first frames con Nano Banana 2.1; intercambio sobre referencia exacta con Ideogram 4.5; audio con Seed Audio; vídeo con Seedance 2.5.
- Guía de Seed Audio integrada (estructura del prompt, estética, voz, límite de 2.048 caracteres, estimar, medir y ajustar la duración).
- Estructura de proyecto en dos carpetas: `Archivos para usar` (con `Texto o prompts`) y `Pruebas intermedias`, con `promover.sh` para mover lo aprobado.
- Scripts: instalación, comprobación de requisitos, creación de proyecto, promoción de archivos, conteo del prompt de audio, medición y ajuste de audio, verificación de vídeo.
- Dependencias externas, no incluidas en el paquete: skills `ailab` y `refinar-prompt-ugc`.
