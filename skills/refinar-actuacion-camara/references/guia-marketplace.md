# Refinar actuación y cámara

Método personal de Marcos: audita actuación y cámara sin cambiar la estética de tu prompt.

## Uso y límites

Completo: informe, preguntas y prompt refinado. Diagnóstico: solo informe. Rápido: decisiones explícitas y supuestos. No crea prompts desde cero, no edita vídeos y no sirve para extensiones, Genjutsu ni motion graphics.

## Materiales

- Un prompt de vídeo ya escrito
- Referencias ordenadas con su rol
- Audio o transcripción si hay diálogo

## Instalación y actualización

Instala la carpeta completa con el comando del marketplace o extrae el ZIP en ~/.claude/skills/ o ~/.codex/skills/. Abre una conversación nueva e invoca $refinar-actuacion-camara. No necesita token de AILAB ni API key. Conserva references/.

Desde el repositorio oficial:

```sh
node tools/install.mjs refinar-actuacion-camara --target claude
```

Para Codex cambia claude por codex. Para actualizar, ejecuta git pull --ff-only y repite el instalador. No sobrescribas cambios personales sin revisarlos. La instalación por terminal requiere Git y Node.js 18.17 o posterior. Descarga e instalación no generan contenido ni consumen créditos.

## Diferencias

Refinar actuación y cámara conserva el método personal de Marcos. Refinar prompt es la alternativa universal y no impone estética. Refinar prompt UGC incorpora realismo de móvil y scripts locales; acepta brief y no escribe el texto hablado. UGC ultrarrealista AILAB es el workflow de principio a fin que utiliza Refinar prompt UGC en su fase de vídeo.
