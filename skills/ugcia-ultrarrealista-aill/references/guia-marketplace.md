# UGC ultrarrealista AILAB

Workflow de tres fases: imágenes de referencia consistentes, idea y audio de Seed Audio medido, y vídeo Seedance 2.5 refinado con refinar-prompt-ugc. Se detiene para aprobación de imágenes, audio y envío final. Una regeneración requiere nueva autorización. No publica contenido.

## Instalación

El comando del marketplace instala ailab, refinar-prompt-ugc y ugcia-ultrarrealista-aill juntas. El ZIP del workflow no incluye las dependencias: descarga también las otras dos. Requiere Bash, Python 3, FFmpeg y FFprobe, y Node.js para AILAB. Windows necesita WSL o Git Bash; usar terminal y herramientas compatibles entre sí. Claude Code y Codex usan su carpeta de skills correspondiente. Abre una conversación nueva tras instalar.

Para actualizar, git pull --ff-only y repetir el instalador, revisando cambios personales antes. Se incluye scripts/autotest.sh para comprobar scripts con archivos sintéticos, sin red ni créditos. La prueba no verifica los proveedores ni las generaciones reales.

## Qué aportar

Idea o brief, audiencia o producto, foto autorizada de la persona o descripción, guion literal si existe, formato, lugar, duración aproximada y referencias exactas si las hay. Solo personas y voces autorizadas. Fotos y archivos no se suben a proveedores hasta aprobar la operación correspondiente.

## Costes y materiales

Con ailab configurada automatiza GPT Image 2.5, Nano Banana 2.1, Ideogram 4.5, Seed Audio y Seedance 2.5. Info y prepare actuales prevalecen sobre los ejemplos históricos. Explicar coste estimado, máximo autorizado y cargo real; no superar lo aprobado ni reenviar tareas ambiguas. Sin ailab funciona en modo solo prompts, sin llamadas ni cobros; refinar-prompt-ugc sigue siendo necesaria para fase 3.

## Resultados y límites

Guarda Archivos para usar (finales y Texto o prompts), Pruebas intermedias, brief.md y registro.md en un proyecto local. Mide el audio real, mantiene literal el guion y no recorta voz ni sobrescribe archivos. Si un proveedor tarda o responde de forma ambigua, consulta el mismo ID antes de plantear otra generación. No garantiza identidad, acento, sincronía labial ni duración por la mera redacción de un prompt.
