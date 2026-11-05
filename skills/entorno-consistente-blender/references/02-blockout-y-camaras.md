# 02 · Blockout y cámaras

Objetivo: aprobar medidas, posiciones y encuadres antes de gastar tiempo en estética. En el caso real las cinco vueltas de corrección fueron de proporción y colocación, ninguna de materiales.

## Principios

- **Metros reales.** Pregunta o estima medidas reales: sofá de 3 plazas unos 2 m; puerta 0,8 × 2,1 m; techo 2,5 a 2,8 m; mesa 0,75 m de alto; encimera 0,9 m; silla, asiento a 0,45 m; persona de pie 1,60 a 1,90 m; ojos de una persona sentada a unos 1,20 m.
- **Ejes:** X a lo ancho, Y hacia el fondo, Z arriba. Suelo en z = 0.
- **Paredes con nombre fijo**, confirmado con el usuario (pared A = la de los sofás, pared C = la de enfrente, tabique...). Nunca "la de la derecha", que cambia según la cámara. Casi todas las confusiones vienen de aquí.
- **Una colección por zona:** `Estructura` (paredes y suelo), `Techo`, mobiliario por sala, una por galería, `Camaras`, `Personajes_guia`. El visor y los scripts las usan.
- **Nada de detalle todavía:** cajas, cilindros y perfiles extruidos (`scripts/blender/utilidades.py`). Un color por elemento para distinguirlos en el visor.
- **Versión por vuelta:** `versiones/<espacio>-vN.blend`.

## Funciones (`scripts/blender/utilidades.py`)

`col`, `mat`, `caja`, `cilindro`, `perfil_extruido`, `bevel`, `bbox`, `mat_imagen`, `plano`, `pegar_en_frente`, `solapes`, `en_esquina_45`.

- Paredes: cajas de 0,15 m de grosor. Suelo y techo: cajas de 0,05 m que cubran toda la planta.
- **Solapes en una pared de cuadros:** `solapes(objetos, margen=0.04)` lista las parejas que se tocan. Recoloca hasta que salga vacía.
- **Objeto a 45° en una esquina** a una distancia `g` de las dos paredes: `en_esquina_45(esquina, bisectriz, g, fondo, ancho)` (centro a `g·√2 + fondo/2 + ancho/2` sobre la bisectriz).
- **Final de un tabique:** borde del último cuadro colgado más el margen que pida el usuario.

## Cámaras (`scripts/blender/camaras.py`)

- Sensor 36 mm, salida 1920 × 1080 (16:9). Nombre con clave y descripción: `Cam_A1_frontal_6_0m`, `Cam_G_perfil_arcade`.
- `camara(nombre, pos, mira, lente)`: cámara exacta mirando a un punto.
- `plano(nombre, receta, sujeto, frente, lado, desplazar)`: recetas de plano alrededor de un sujeto (tabla en `10-catalogo-de-vistas.md`).
- `paralela_a_frontal(...)`: cámara pegada a una pared mirando en paralelo al frontal de un objeto (el objeto de perfil a un lado, quien lo usa al otro).
- `ancho_cubierto(d, lente) = d × 36 / lente`. A 35 mm y 5,15 m se cubren 5,30 m de pared. Úsalo para decidir el fondo de la sala si una vista tiene que ver una pared entera.
- `en_cuadro(cam, punto)`: dónde cae un punto en el encuadre (0..1). Sirve para colocar al sujeto en un tercio sin mirar.
- Altura: 1,25 a 1,35 m para vistas de persona; a media altura de la sala para vistas tipo maqueta; 0,15 a 0,20 m para contrapicado desde el suelo; 0,5 m a la altura de la rodilla.
- **Más distancia de la que permite la sala:** quita la pared que queda detrás de la cámara. No la borres: muévela a una colección excluida (`Pared_X_oculta`) por si luego hace falta un contraplano. En el prompt, describe el vacío como fondo gris liso de estudio y pide mantenerlo.
- **Que no se vean el techo ni una pared lateral:** baja la inclinación, cierra el objetivo o mira más de frente a la pared del fondo. Comprueba con `mcp__blender__look(mode="camera")`.
- **Cuadros deformados** en un contrapicado fuerte: la pared del fondo sale en escorzo. Para que los cuadros salgan rectos, cámara a media altura (rodilla o más) y casi de frente a la pared.
- **Cenital:** cámara ortográfica alta mirando abajo, escala que abarque toda la planta y el techo oculto (`CENITALES` en `render_pases.py`).

## Comprobar un encuadre

1. `mcp__blender__look(mode="camera", shading="material")`: lo que verá la cámara.
2. Ajusta en pasos pequeños: posición, `lente`, `desplazar` o `lado`. Vuelve a mirar.
3. Enséñaselo al usuario antes de renderizar los pases si el encuadre es nuevo o tiene personajes.

## Set típico de vistas de un espacio

Una maestra parecida a la referencia (tres cuartos), una frontal de la pared principal, frontales cada vez más lejanas si las quiere, una lateral, una hacia el elemento protagonista y una cenital. Luego, todas las que pida con personajes (`07-personajes-y-poses.md`).
