# Maniquíes articulados para marcar dónde está cada personaje, su altura y su pose.
# La IA sustituye cada maniquí por el personaje de sus referencias: el maniquí decide DÓNDE
# está y CÓMO está colocado; la hoja de personaje decide QUIÉN es.
#
# Uso dentro de Blender (mcp__blender__execute_blender_code):
#   exec(open("<skill>/scripts/blender/maniquies.py").read())
#   maniqui("Joven", "de_pie_mandos", pos=(6.78, 4.13), mira_a=(7.05, 4.40), altura=1.80)
#   maniqui("Mayor", "sentado_leyendo", pos=(1.98, 5.02), mira_a=(1.98, 3.0), asiento=0.45, cruzar="derecha")
#   maniqui("Joven", "sentado_rodillas_abiertas", pos=(3.05, 5.0), angulo=180)
#
# Poses: de_pie · de_pie_mandos · andando · sentado · sentado_rodillas_abiertas ·
#        sentado_piernas_cruzadas · sentado_leyendo · sentado_suelo · apoyado_pared
# Ejes locales del maniquí: +Y = hacia donde mira, +X = su derecha, Z = arriba (metros, suelo en 0).
# Todas las piezas cuelgan de un Empty "<Nombre>_maniqui": muévelo o gíralo y se mueve todo.
import bpy, math
from mathutils import Vector

COLECCION_PERSONAJES = "Personajes_guia"
COLORES = [(0.78, 0.76, 0.72), (0.45, 0.50, 0.40), (0.55, 0.60, 0.72), (0.72, 0.58, 0.50), (0.60, 0.52, 0.68)]


def _pose_base_de_pie():
    j = {"pelvis": (0, 0, 0.95), "cuello": (0, 0, 1.47), "cabeza": (0, 0.02, 1.67)}
    for s, k in ((1, "d"), (-1, "i")):
        j[f"hombro_{k}"] = (0.19 * s, 0, 1.42); j[f"codo_{k}"] = (0.24 * s, 0, 1.12); j[f"mano_{k}"] = (0.25 * s, 0.03, 0.85)
        j[f"cadera_{k}"] = (0.10 * s, 0, 0.92); j[f"rodilla_{k}"] = (0.11 * s, 0.02, 0.50)
        j[f"tobillo_{k}"] = (0.12 * s, 0, 0.08); j[f"punta_{k}"] = (0.12 * s, 0.18, 0.05)
    return j


def _pose_base_sentado():
    j = {"pelvis": (0, 0, 0.57), "cuello": (0, -0.05, 1.08), "cabeza": (0, -0.02, 1.23)}
    for s, k in ((1, "d"), (-1, "i")):
        j[f"hombro_{k}"] = (0.18 * s, -0.04, 1.00); j[f"codo_{k}"] = (0.22 * s, 0.05, 0.78); j[f"mano_{k}"] = (0.18 * s, 0.30, 0.62)
        j[f"cadera_{k}"] = (0.10 * s, 0.02, 0.55); j[f"rodilla_{k}"] = (0.11 * s, 0.45, 0.53)
        j[f"tobillo_{k}"] = (0.11 * s, 0.50, 0.08); j[f"punta_{k}"] = (0.11 * s, 0.64, 0.05)
    return j


def _cruzar(j, lado):
    """Pierna de `lado` cruzada por encima de la rodilla contraria."""
    s = 1 if lado == "derecha" else -1; k = "d" if lado == "derecha" else "i"
    j[f"cadera_{k}"] = (0.09 * s, 0.02, 0.57); j[f"rodilla_{k}"] = (-0.06 * s, 0.43, 0.66)
    j[f"tobillo_{k}"] = (-0.16 * s, 0.67, 0.33); j[f"punta_{k}"] = (-0.20 * s, 0.80, 0.30)
    return j


def pose(nombre, cruzar="derecha"):
    if nombre == "de_pie":
        return _pose_base_de_pie()
    if nombre == "de_pie_mandos":          # de pie con las manos delante (máquina, mostrador, teclado)
        j = _pose_base_de_pie(); j["cuello"] = (0, 0.07, 1.46); j["cabeza"] = (0, 0.10, 1.66)
        for s, k in ((1, "d"), (-1, "i")):
            j[f"codo_{k}"] = (0.22 * s, 0.22, 1.13); j[f"mano_{k}"] = (0.14 * s, 0.44, 1.02)
        return j
    if nombre == "andando":
        j = _pose_base_de_pie()
        j["rodilla_d"] = (0.11, 0.15, 0.50); j["tobillo_d"] = (0.12, 0.28, 0.10); j["punta_d"] = (0.12, 0.44, 0.06)
        j["rodilla_i"] = (-0.11, -0.08, 0.50); j["tobillo_i"] = (-0.12, -0.25, 0.14); j["punta_i"] = (-0.12, -0.12, 0.05)
        j["mano_d"] = (0.24, -0.15, 0.86); j["mano_i"] = (-0.24, 0.18, 0.86)
        return j
    if nombre == "sentado":
        return _pose_base_sentado()
    if nombre == "sentado_rodillas_abiertas":   # erguido, rodillas separadas, manos en los muslos, mirada abajo
        j = _pose_base_sentado(); j["pelvis"] = (0, 0.05, 0.57); j["cuello"] = (0, 0.10, 1.08); j["cabeza"] = (0, 0.16, 1.20)
        for s, k in ((1, "d"), (-1, "i")):
            j[f"hombro_{k}"] = (0.19 * s, 0.08, 1.00)
            j[f"cadera_{k}"] = (0.11 * s, 0.05, 0.55); j[f"rodilla_{k}"] = (0.25 * s, 0.45, 0.53)
            j[f"tobillo_{k}"] = (0.26 * s, 0.55, 0.08); j[f"punta_{k}"] = (0.28 * s, 0.68, 0.05)
            j[f"codo_{k}"] = (0.24 * s, 0.20, 0.80); j[f"mano_{k}"] = (0.20 * s, 0.38, 0.58)
        return j
    if nombre == "sentado_piernas_cruzadas":
        return _cruzar(_pose_base_sentado(), cruzar)
    if nombre == "sentado_leyendo":          # piernas cruzadas y algo abierto entre las manos (periódico, libro)
        j = _cruzar(_pose_base_sentado(), cruzar); j["cabeza"] = (0, 0.0, 1.20)
        for s, k in ((1, "d"), (-1, "i")):
            j[f"codo_{k}"] = (0.24 * s, 0.10, 0.75); j[f"mano_{k}"] = (0.26 * s, 0.30, 0.86)
        return j
    if nombre == "sentado_suelo":
        j = {"pelvis": (0, 0, 0.14), "cuello": (0, -0.04, 0.66), "cabeza": (0, 0.0, 0.82)}
        for s, k in ((1, "d"), (-1, "i")):
            j[f"hombro_{k}"] = (0.18 * s, -0.03, 0.60); j[f"codo_{k}"] = (0.25 * s, 0.15, 0.40); j[f"mano_{k}"] = (0.15 * s, 0.40, 0.42)
            j[f"cadera_{k}"] = (0.10 * s, 0.02, 0.12); j[f"rodilla_{k}"] = (0.16 * s, 0.38, 0.42)
            j[f"tobillo_{k}"] = (0.12 * s, 0.55, 0.07); j[f"punta_{k}"] = (0.12 * s, 0.70, 0.04)
        return j
    if nombre == "apoyado_pared":            # de pie, espalda en la pared (la pared queda en -Y local)
        j = _pose_base_de_pie(); j["pelvis"] = (0, -0.02, 0.95); j["cuello"] = (0, -0.06, 1.47); j["cabeza"] = (0, -0.04, 1.67)
        j["rodilla_d"] = (0.14, 0.12, 0.50); j["tobillo_d"] = (0.16, 0.22, 0.08); j["punta_d"] = (0.18, 0.38, 0.05)
        j["mano_d"] = (0.20, 0.08, 0.95); j["mano_i"] = (-0.20, 0.08, 0.95)
        return j
    raise ValueError(f"Pose desconocida: {nombre}")


HUESOS = [("pelvis", "cuello", 0.15), ("hombro_d", "codo_d", 0.045), ("codo_d", "mano_d", 0.04),
          ("hombro_i", "codo_i", 0.045), ("codo_i", "mano_i", 0.04),
          ("cadera_d", "rodilla_d", 0.075), ("rodilla_d", "tobillo_d", 0.055), ("tobillo_d", "punta_d", 0.045),
          ("cadera_i", "rodilla_i", 0.075), ("rodilla_i", "tobillo_i", 0.055), ("tobillo_i", "punta_i", 0.045)]


def _coleccion(nombre):
    c = bpy.data.collections.get(nombre) or bpy.data.collections.new(nombre)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


def _material(nombre, rgb):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre); m.use_nodes = True
    bs = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Base Color"].default_value = (*rgb, 1); bs.inputs["Roughness"].default_value = 0.7
    m.diffuse_color = (*rgb, 1); return m


def _pieza(nombre, malla_fn, padre, mat, col):
    malla_fn(); o = bpy.context.active_object; o.name = nombre
    for c in list(o.users_collection): c.objects.unlink(o)
    col.objects.link(o); o.data.materials.append(mat)
    o.parent = padre; o.matrix_parent_inverse.identity()
    for p in o.data.polygons: p.use_smooth = True
    return o


def _hueso(nombre, a, b, r, padre, mat, col):
    a, b = Vector(a), Vector(b); d = b - a
    o = _pieza(nombre, lambda: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=max(d.length, 0.01), location=(a + b) / 2, vertices=20), padre, mat, col)
    o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    for k, p in (("a", a), ("b", b)):
        _pieza(f"{nombre}_{k}", lambda p=p: bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=p, segments=16, ring_count=8), padre, mat, col)
    return o


def borrar_maniqui(nombre):
    e = bpy.data.objects.get(f"{nombre}_maniqui")
    if e:
        for o in list(e.children_recursive): bpy.data.objects.remove(o)
        bpy.data.objects.remove(e)


def maniqui(nombre, nombre_pose="de_pie", pos=(0, 0), mira_a=None, angulo=None, altura=1.80, asiento=0.45,
            cruzar="derecha", color=None, objeto=None, coleccion=COLECCION_PERSONAJES):
    """Crea (o rehace) un maniquí. pos = (x, y) en el suelo. Orientación con mira_a=(x, y) o angulo en grados
    (0 = mirando a +Y del mundo, 90 = mirando a -X). altura = estatura de pie. asiento = altura del asiento en
    poses sentadas. objeto = "periodico" | "libro" | "movil" para poner algo entre las manos."""
    borrar_maniqui(nombre)
    col = _coleccion(coleccion)
    if angulo is None:
        if mira_a is None: angulo = 0
        else:
            dx, dy = mira_a[0] - pos[0], mira_a[1] - pos[1]; angulo = math.degrees(math.atan2(-dx, dy))
    e = bpy.data.objects.new(f"{nombre}_maniqui", None); col.objects.link(e)
    e.location = (pos[0], pos[1], 0); e.rotation_euler = (0, 0, math.radians(angulo)); e.empty_display_size = 0.3
    e["pose"] = nombre_pose; e["altura"] = altura
    idx = len([o for o in bpy.data.objects if o.name.endswith("_maniqui")]) - 1
    mat = _material(f"Maniqui_{nombre}", color or COLORES[idx % len(COLORES)])
    k = altura / 1.80; sentado = nombre_pose.startswith("sentado") and nombre_pose != "sentado_suelo"
    def esc(p):
        x, y, z = p[0] * k, p[1] * k, p[2]
        if sentado:
            z = z * asiento / 0.45 if z < 0.45 else (z - 0.45) * k + asiento
        else:
            z = z * k
        return (x, y, z)
    j = {n: esc(p) for n, p in pose(nombre_pose, cruzar).items()}
    for a, b, r in HUESOS:
        o = _hueso(f"{nombre}_{a}", j[a], j[b], r * k, e, mat, col)
        if a == "pelvis": o.scale = (1.25, 0.8, 1)
    cab = _pieza(f"{nombre}_cabeza", lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11 * k, location=j["cabeza"], segments=24, ring_count=12), e, mat, col)
    cab.scale = (0.95, 1, 1.15)
    if objeto:
        mp = _material("Maniqui_objeto", (0.92, 0.90, 0.85))
        cx = (j["mano_d"][0] + j["mano_i"][0]) / 2; cy = (j["mano_d"][1] + j["mano_i"][1]) / 2 + 0.02; cz = (j["mano_d"][2] + j["mano_i"][2]) / 2 + 0.08
        ancho, alto = {"periodico": (0.56, 0.38), "libro": (0.30, 0.22), "movil": (0.08, 0.16)}.get(objeto, (0.3, 0.3))
        for lado, sx in (("i", -1), ("d", 1)):
            def plano(sx=sx):
                bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
                p = bpy.context.active_object
                for v in p.data.vertices:
                    v.co.x = (v.co.x + 0.5 * sx) * ancho / 2; v.co.y *= alto
                return p
            p = _pieza(f"{nombre}_{objeto}_{lado}", plano, e, mp, col)
            p.location = (cx, cy, cz); p.rotation_euler = (math.radians(70), 0, math.radians(sx * 12))
    print(f"Maniquí {nombre}: pose {nombre_pose}, {altura} m, en {tuple(round(v, 2) for v in pos)}, ángulo {round(angulo)}°")
    return e
