# Carpeta del proyecto

Todo se organiza **en local**, un proyecto por carpeta, con la misma estructura siempre. La idea es que lo que se usa de verdad esté **separado** de todo lo demás: el usuario abre una sola carpeta y ahí está lo que va a utilizar.

## Raíz

```text
~/Desktop/AILAB/
```

Es decir, una carpeta llamada `AILAB` en el Escritorio, que se crea sola si no existe; cada proyecto va dentro. Es el valor por defecto: se puede cambiar con la variable de entorno `UGC_AILL_ROOT` o si el usuario indica otra ruta (entonces manda la suya).

## Nombre del proyecto

`AAAA-MM-DD-slug` en kebab-case y sin tildes: `2026-10-09-serum-vitamina-c`. La fecha es la de creación. Si el usuario no da nombre, se propone uno corto a partir del brief y se confirma.

## Estructura

```text
<raiz>/<AAAA-MM-DD-slug>/
├── Archivos para usar/              LO QUE SE USA DE VERDAD, todo junto
│   ├── hoja-cara-vN.png             imágenes aprobadas (hojas, entorno, frames)
│   ├── hoja-cuerpo-vN.png
│   ├── first-frame-...-vN.png
│   ├── audio-final-Ns.wav           el audio que entra en el vídeo
│   ├── video-vN.mp4                 el vídeo aprobado
│   └── Texto o prompts/             todos los prompts de lo que se usa, y el guion
│       ├── hoja-cara-vN.txt         prompt de cada imagen aprobada (mismo nombre base)
│       ├── seed-prompt-vN.txt       prompt del audio aprobado
│       ├── seedance-prompt-vN.txt   prompt de vídeo vigente
│       ├── referencias-vN.md        tabla handle, archivo y rol del prompt de vídeo
│       └── guion.md                 texto hablado literal aprobado
├── Pruebas intermedias/             TODO LO DEMÁS (nada de esto se usa en el resultado)
│   ├── fuentes/                     fotos y referencias del usuario, tal como llegaron
│   ├── imagenes/                    versiones descartadas o pendientes, cada una con su .txt
│   ├── audio/                       audio bruto, versiones descartadas, mediciones, transcripciones
│   └── video/                       versiones descartadas o pendientes
├── brief.md                         ficha de rodaje, decisiones, supuestos, estado
└── registro.md                      cada generación: fecha, modelo, parámetros, id, créditos, archivo
```

`Archivos para usar/` es **plana** para imágenes, audio y vídeo (sin subcarpetas) y tiene una única subcarpeta, `Texto o prompts/`. Si el usuario quiere subdividir por tipo, se hace a petición.

## Cómo fluyen los archivos

1. **Todo lo que se genera nace en `Pruebas intermedias/`**, en su subcarpeta (`imagenes/`, `audio/`, `video/`), con su prompt `.txt` al lado (mismo nombre base). Los resultados de AILAB se descargan allí con `submit ... --output "<proyecto>/Pruebas intermedias/<tipo>/"`.
2. **Al aprobar el usuario un archivo, se mueve** a `Archivos para usar/` junto con su prompt, que pasa a `Texto o prompts/`. Se hace con:

   ```bash
   bash "$UGC_SKILL_DIR/scripts/promover.sh" "<proyecto>" imagenes/hoja-cara-v1.png audio/audio-final-17s.wav
   ```

   Mueve (no copia), nunca sobrescribe y lleva el `.txt` del mismo nombre base a `Texto o prompts/`. Después se actualiza la columna "Archivo" de `registro.md` con la ruta nueva.
3. **Lo que no se aprueba se queda** en `Pruebas intermedias/`. No se borra nada sin que el usuario lo pida.
4. **El prompt de vídeo vigente** vive en `Texto o prompts/` desde que se escribe; cuando se crea una versión nueva, la anterior pasa a `Pruebas intermedias/video/`.
5. **El guion** (`guion.md`) vive en `Texto o prompts/` desde que se cierra la idea.
6. **Las referencias de las generaciones siguientes** se toman de donde estén en ese momento (lo aprobado, en `Archivos para usar/`; lo pendiente, en `Pruebas intermedias/`). Siempre con ruta explícita; nunca se asume.

### Qué va dónde, de un vistazo

| Archivo | Carpeta |
|---|---|
| Hoja de cara, hoja de cuerpo, entorno y frames **aprobados** | `Archivos para usar/` |
| Audio final igualado al segundo (`audio-final-Ns.wav`) **aprobado** | `Archivos para usar/` |
| Vídeo **aprobado** | `Archivos para usar/` |
| Prompts de todo lo anterior, `referencias-vN.md`, `guion.md` | `Archivos para usar/Texto o prompts/` |
| Versiones descartadas o sin aprobar (imagen, audio, vídeo) y sus prompts | `Pruebas intermedias/` |
| Audio bruto, `medicion-vN.txt`, `transcripcion-vN.json` | `Pruebas intermedias/audio/` |
| Fotos y referencias que trajo el usuario | `Pruebas intermedias/fuentes/` |
| `brief.md` y `registro.md` | raíz del proyecto |

## Reglas

- **Versionado `-vN`**: cada intento nuevo es una versión nueva. Nunca se sobrescribe un archivo.
- **Cada imagen, audio y vídeo guarda su prompt** (`.txt` con el mismo nombre base).
- **kebab-case** en todos los nombres, sin espacios ni tildes (las dos carpetas principales son la excepción: `Archivos para usar` y `Pruebas intermedias`, con ese nombre exacto).
- **`registro.md`** es una tabla de una fila por generación, con la **ruta desde la raíz del proyecto** en la columna "Archivo" (se actualiza al mover):

  | Fecha | Fase | Modelo | Modo y parámetros clave | Id (manifest/task) | Créditos | Archivo | Estado |
  |---|---|---|---|---|---|---|---|

  Los créditos son los que devuelve AILAB, no estimaciones propias. Estado: `pendiente`, `aprobado`, `descartado`.
- **`brief.md`** lleva al principio una línea de estado: `Fase: 1 | 2 | 3` y qué puntos de aprobación están dados (con fecha), y la lista de archivos aprobados con su rol. Así un proyecto se puede retomar en otra sesión leyendo solo ese archivo.
- La CLI de AILAB crea un `.gitignore` (contiene `*`) en cada carpeta donde descarga. Es inofensivo y solo aparece en `Pruebas intermedias/`.
- No se guardan en el proyecto credenciales ni tokens.

## Crear el proyecto

```bash
bash "$UGC_SKILL_DIR/scripts/crear_proyecto.sh" "<slug>" ["<raiz>"]
```

Crea la estructura vacía (`Archivos para usar/Texto o prompts/`, `Pruebas intermedias/` con sus cuatro subcarpetas), `brief.md`, `registro.md` y un `guion.md` con su esqueleto dentro de `Texto o prompts/`, y escribe la ruta absoluta del proyecto.
