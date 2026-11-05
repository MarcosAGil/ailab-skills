# 12 · Caso real: sala de espera vintage (noviembre de 2026)

Caso completo con el que se construyó y validó la skill. Sirve de modelo de escala, tiempos y decisiones.

## Punto de partida

Una imagen generada con IA: sala de espera con paredes de nogal, dos sofás de terciopelo azul claro, una galería de unos 23 cuadros y objetos colgados, una pila de libros con tocadiscos y un balón de cuero entre los sofás, un tabique con 9 cuadros más y, al fondo, una sala contigua con una máquina recreativa y dos pufs. Dos personajes con sus hojas (un joven con sudadera oliva y cascos con cable a un MP3; un mayor con sudadera con capucha oliva) y dos objetos (MP3 con cascos, un periódico de Ailendra Labs).

## Decisiones que conviene preguntar siempre

| Pregunta | Lo que se decidió |
|---|---|
| ¿Qué vista principal tiene que verse entera? | La pared de los sofás completa |
| ¿Puertas o huecos? | Ninguno; el paso a la otra sala queda al final del tabique |
| ¿Dónde va cada objeto suelto? | Pufs delante de la arcade; arcade a 45° en la esquina, a 20 cm de las paredes |
| ¿Qué hay en la pared de enfrente? | Se quitó para poder alejar la cámara |
| ¿Centro de la sala? | Vacío (moqueta) |
| ¿Luz? | De estudio, luz de día blanquecina desde detrás de la cámara frontal, sombras suaves |
| ¿Qué vistas? | 5 frontales cada vez más lejanas, tres cuartos, lateral, arcade y cenital; después, 4 con personajes |
| ¿Qué hacer si un mueble choca con un personaje? | Apartar los pufs solo en esa vista |

## Medidas clave

- Sala de 4,95 × 5,5 m, techo 2,7 m; sala arcade de 3 m de ancho al lado.
- Sofás de 2,0 × 0,85 m, asiento a 0,45 m. Tabique de 1,29 m. Arcade de 0,75 × 0,90 × 1,95 m a 45°.
- Vista principal a 35 mm: a 5,15 m cubre 5,30 m de pared.

## Vistas generadas (Nano Banana 2.1)

| Clave | Vista | Cámara | Referencias |
|---|---|---|---|
| C | Tres cuartos (maestra) | 24 mm, esquina | render + referencia original |
| A1 a A5 | Frontales a 6; 7,5; 9,5; 12 y 15,5 m | 35 mm, 1,35 m | render + maestra (+ A1) |
| D, E, F | Lateral, arcade, cenital | 24 a 35 mm / ortográfica | render + maestra + A1 |
| G | Perfil de la arcade con el joven jugando y el mayor al fondo | 16 mm, pegada a la pared, girada 8° | render con maniquíes + E + C + 6 hojas |
| H | Contrapicado del mayor leyendo | 30 mm a 16 cm del suelo | render + G + C + 3 hojas |
| I | El mayor a la altura de la rodilla | 30 mm a 50 cm | render + H + A1 + 3 hojas |
| I con dos | I + el joven sentado con la pose de una foto | edición | I + foto de pose + 3 hojas |

Correcciones: cable de los cascos y pantalla GAME OVER en G (una edición con dos cambios); tapa de tocadiscos que apareció al añadir al joven (edición + parche local).

## Costes y tiempos reales

- Comparativa de 3 modelos en 2 vistas: 60 créditos. 7 vistas más con Nano Banana 2.1 en AILAB: 49 créditos.
- Vistas con personajes: AILAB falló ese día con "generate task timeout" en 5 envíos (sin cobrar); se hicieron en Higgsfield con el mismo modelo a 2 créditos por imagen (G, corrección de G, H, I, I con dos, 2 intentos de la tapa).
- Blockout: 5 vueltas. Cada imagen: 1 a 2 minutos.

## Archivos de ejemplo dentro de la skill

- `assets/ejemplos/hoja-entorno-ejemplo.jpg`: hoja de entorno con vistas vacías y con personajes.
- `assets/ejemplos/maniqui-a-personaje.jpg`: render con maniquí y resultado (vista H).
- `assets/ejemplos/correccion-con-parche.jpg`: original, edición que estropeó el resto y resultado con parche.
- `assets/ejemplos/prompts-reales/`: los prompts exactos de cada tipo de imagen.
- `scripts/ejemplos/arte_maquina_arcade.py`: arte propio de un objeto protagonista.

## Lo que más tiempo ahorró

1. Cerrar el blockout antes de los materiales.
2. Nombrar las paredes desde el principio.
3. Revisar la maestra con contornos antes de generar el resto.
4. Maniquíes con la pose exacta de la imagen anterior antes de pedir un ángulo nuevo del mismo momento.
5. Corregir con edición + parche en vez de regenerar.
