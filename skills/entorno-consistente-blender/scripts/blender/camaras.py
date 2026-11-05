# Cámaras con nombre, objetivo y altura exactos, y recetas de plano reutilizables.
#
# Uso dentro de Blender:
#   exec(open("<skill>/scripts/blender/camaras.py").read())
#   camara("Cam_A1_frontal_6m", pos=(2.47, -0.5, 1.35), mira=(2.47, 5.5, 1.35), lente=35)
#   plano("Cam_H_contrapicado", "contrapicado", sujeto=(1.98, 5.02, 1.05), frente=(0, -1), lado=35)
#   print(ancho_cubierto(5.15, 35))       # metros de pared que entran a 5,15 m con 35 mm
#
# Convenciones: sensor 36 mm de ancho, salida 1920 x 1080. Nombre "Cam_<CLAVE>_<descripcion>".
# `frente` = dirección (x, y) hacia la que mira el sujeto (de donde viene la cámara).
# `lado`   = grados de giro alrededor del sujeto: positivo hacia su izquierda (la derecha del encuadre).
import bpy, math
from mathutils import Vector

RECETAS = {
    # nombre: (distancia m, altura cámara m, altura a la que mira m, objetivo mm, giro por defecto)
    "frontal":            (3.0, 1.35, None, 35, 0),     # mira a la altura del sujeto, de frente
    "tres_cuartos":       (3.0, 1.35, None, 28, 40),
    "perfil":             (2.5, 1.30, None, 35, 90),
    "plano_medio":        (1.6, 1.40, None, 40, 15),
    "primer_plano":       (0.9, None, None, 60, 10),    # altura = la del sujeto (ojos)
    "detalle":            (0.6, None, None, 70, 0),
    "contrapicado":       (1.8, 0.16, None, 30, 35),    # desde el suelo mirando arriba
    "rodilla":            (2.4, 0.50, None, 30, 10),    # a la altura de la rodilla, casi de frente
    "picado":             (2.6, 2.30, None, 30, 25),    # desde arriba mirando abajo
    "gran_angular":       (4.5, 1.35, None, 20, 30),
}


def _coleccion(nombre):
    c = bpy.data.collections.get(nombre) or bpy.data.collections.new(nombre)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


def camara(nombre, pos, mira, lente=35, ortografica=False, escala_orto=10.0, coleccion="Camaras"):
    """Crea o actualiza una cámara en `pos` mirando al punto `mira` (x, y, z)."""
    cam = bpy.data.objects.get(nombre)
    if not cam:
        cam = bpy.data.objects.new(nombre, bpy.data.cameras.new(nombre)); _coleccion(coleccion).objects.link(cam)
    cam.data.sensor_width = 36; cam.data.lens = lente
    cam.data.type = "ORTHO" if ortografica else "PERSP"
    if ortografica: cam.data.ortho_scale = escala_orto
    cam.location = pos
    d = Vector(mira) - Vector(pos); cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam["mira"] = list(mira)
    return cam


def plano(nombre, receta, sujeto, frente, lado=None, distancia=None, altura=None, mira_z=None, lente=None, desplazar=0.0):
    """Coloca una cámara según una receta alrededor de un sujeto (x, y, z de su centro de interés).
    desplazar = metros que se mueve el punto al que mira, en horizontal y hacia la derecha del encuadre:
    sirve para dejar al sujeto a la izquierda (positivo) o a la derecha (negativo)."""
    d0, h0, mz0, l0, g0 = RECETAS[receta]
    d = distancia or d0; g = math.radians(g0 if lado is None else lado)
    f = Vector((frente[0], frente[1], 0)).normalized()
    v = Vector((f.x * math.cos(g) - f.y * math.sin(g), f.x * math.sin(g) + f.y * math.cos(g), 0))
    sx, sy, sz = sujeto
    h = altura if altura is not None else (h0 if h0 is not None else sz)
    pos = (sx + v.x * d, sy + v.y * d, h)
    derecha_encuadre = Vector((v.y, -v.x, 0)) * -1
    mira = Vector((sx, sy, mira_z if mira_z is not None else (mz0 if mz0 is not None else sz))) + derecha_encuadre * desplazar
    return camara(nombre, pos, tuple(mira), lente or l0)


def paralela_a_frontal(nombre, centro_objeto, frente_objeto, fondo_objeto, separacion=0.30, hasta=None, giro=8,
                       altura=1.30, lente=16):
    """Cámara pegada a una pared lateral mirando en paralelo al frontal de un objeto (máquina, mostrador,
    estantería): el objeto sale de perfil en un lado del encuadre y quien lo usa en el otro.
    hasta = (eje, valor) límite de la cámara, p. ej. ("x", 7.95) para quedarse a 20 cm de una pared."""
    c = Vector((centro_objeto[0], centro_objeto[1], 0)); F = Vector((frente_objeto[0], frente_objeto[1], 0)).normalized()
    L = Vector((-F.y, F.x, 0)) * -1
    p = c + F * (fondo_objeto / 2 + separacion)
    t = 1.8
    if hasta:
        eje, val = hasta; comp = 0 if eje == "x" else 1
        if abs(L[comp]) > 1e-6: t = (val - p[comp]) / L[comp]
    pos = p + L * t
    # mira de vuelta hacia el objeto, girada `giro` grados hacia su cuerpo para que se vea la cara frontal
    dirv = ((p - pos).normalized() + (-F) * math.tan(math.radians(giro))).normalized()
    mira = pos + dirv * 3; mira.z = altura - 0.1
    return camara(nombre, (pos.x, pos.y, altura), tuple(mira), lente)


def ancho_cubierto(distancia, lente):
    """Metros de ancho que entran en cuadro a esa distancia (sensor 36 mm)."""
    return distancia * 36 / lente


def distancia_para_ancho(ancho, lente):
    return ancho * lente / 36


def en_cuadro(nombre_cam, punto):
    """(x, y) normalizados del punto en el encuadre (0..1, origen abajo a la izquierda) y profundidad."""
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(bpy.context.scene, bpy.data.objects[nombre_cam], Vector(punto))
    return round(v.x, 3), round(v.y, 3), round(v.z, 2)
