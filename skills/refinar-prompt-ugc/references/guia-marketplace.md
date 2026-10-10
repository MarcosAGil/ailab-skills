# Refinar prompt UGC

La más reciente y completa para realismo UGC: cámara de móvil, actuación, luz y sonido coherentes.

## Uso y límites

Audita, pregunta y refina. Por defecto 9:16, una toma, imperfección natural y cortes duros solo si se solicitan. Cubre once formatos, incluidos alguien graba, ponencia, trípode y podcast. No escribe guion, ganchos o CTA, no genera vídeos y no sirve para extensiones o ediciones.

## Materiales

- Prompt ya escrito o brief, sin pedirle que escriba el guion
- Referencias ordenadas con su rol y texto hablado literal
- Audio de Seed Audio recomendado; sin audio advierte menor sincronía
- Python 3, FFmpeg y FFprobe para medición; Whisper local opcional

## Instalación y actualización

Instala la carpeta completa con el comando del marketplace o extrae el ZIP en ~/.claude/skills/ o ~/.codex/skills/. Abre una conversación nueva e invoca $refinar-prompt-ugc. No necesita token de AILAB ni API key. Conserva references/ y scripts/.

Desde el repositorio oficial:

```sh
node tools/install.mjs refinar-prompt-ugc --target claude
```

Para Codex cambia claude por codex. Para actualizar, ejecuta git pull --ff-only y repite el instalador. No sobrescribas cambios personales sin revisarlos. La instalación por terminal requiere Git y Node.js 18.17 o posterior. Descarga e instalación no generan contenido ni consumen créditos.

## Diferencias

Refinar actuación y cámara conserva el método personal de Marcos. Refinar prompt es la alternativa universal y no impone estética. Refinar prompt UGC incorpora realismo de móvil y scripts locales; acepta brief y no escribe el texto hablado. UGC ultrarrealista AILAB es el workflow de principio a fin que utiliza esta skill en su fase de vídeo.
