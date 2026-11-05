# Renderiza, para cada cámara, cuatro pases en //renders/fase1/:
#   <K>_color.png        render con materiales y luz (la "imagen 1" que se manda a la IA)
#   <K>_clay.png         todo en gris (forma y volumen)
#   <K>_profundidad.png  blanco cerca, negro lejos (normalizar después con normalizar_profundidad.py)
#   <K>_id.png           un color plano por objeto (de aquí salen los contornos del control de calidad)
# Se ejecuta DENTRO de Blender (mcp__blender__execute_blender_code). Restaura los materiales aunque falle.
# Si tarda más que el límite del MCP, ejecútalo por tandas cambiando PASES o CAMS.
# Aplica los estados por vista definidos con estado_vista.py (maniquíes visibles, objetos movidos)
# solo mientras renderiza esa vista, y deja la escena base intacta al terminar.
import bpy, os, random, colorsys, json
from mathutils import Vector

# --- Configuración -------------------------------------------------------------
# CAMS: lista de (clave corta, nombre de la cámara en Blender). Vacía = todas las cámaras, clave = nombre.
CAMS = []
PASES = ["color", "clay", "profundidad", "id"]
TECHO = "Techo"              # objeto o colección que se oculta en vistas cenitales
CENITALES = []               # claves de cámaras cenitales (se renderizan sin techo)
ESTRUCTURA = "Estructura"    # colección de paredes y suelo (marca el fondo para la profundidad)
# -------------------------------------------------------------------------------

sc = bpy.context.scene; vs = sc.view_settings
if not CAMS:
    CAMS = [(o.name, o.name) for o in sorted(bpy.data.objects, key=lambda o: o.name) if o.type == "CAMERA"]
D = bpy.path.abspath("//renders/fase1/"); os.makedirs(D, exist_ok=True)
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
sc.render.image_settings.file_format = "PNG"

ESTADOS = json.loads(sc.get("estados_vista", "{}"))

def _objetos(n):
    o = bpy.data.objects.get(n)
    if o: return [o] + list(o.children_recursive)
    c = bpy.data.collections.get(n)
    return list(c.all_objects) if c else []

def _en_estados(o):
    return any(o in _objetos(n) for v in ESTADOS.values() for n in v.get("mostrar", []))

def aplicar_estado(k):
    est = ESTADOS.get(k, {"mover": {}, "mostrar": [], "ocultar": []})
    tok = {"loc": {}, "hr": {}}
    def ocultar(o, h):
        tok["hr"].setdefault(o.name, o.hide_render); o.hide_render = h
    for n in {n for v in ESTADOS.values() for n in v.get("mostrar", [])} - set(est["mostrar"]):
        for o in _objetos(n): ocultar(o, True)
    for n in est["mostrar"]:
        for o in _objetos(n): ocultar(o, False)
    for n in est["ocultar"]:
        for o in _objetos(n): ocultar(o, True)
    for n, p in est["mover"].items():
        o = bpy.data.objects.get(n)
        if o: tok["loc"][n] = tuple(o.location); o.location = p
    return tok

def restaurar(tok):
    for n, p in tok["loc"].items(): bpy.data.objects[n].location = p
    for n, h in tok["hr"].items(): bpy.data.objects[n].hide_render = h

techo_objs = [o for o in sc.objects if o.name == TECHO or any(c.name == TECHO for c in o.users_collection)]
lights = [o for o in sc.objects if o.type == "LIGHT"]
bg = next(n for n in sc.world.node_tree.nodes if n.type == "BACKGROUND")
meshes = [o for o in bpy.context.view_layer.objects if o.type == "MESH" and not (o.hide_render and o.hide_viewport and not _en_estados(o))]
orig = {o.name: [s.material for s in o.material_slots] for o in meshes}

def imagen_con_alpha(o):
    """Devuelve la imagen si el material del objeto usa su canal alfa (recortes con silueta)."""
    m = orig[o.name][0] if orig[o.name] else None
    if not (m and m.use_nodes): return None
    for l in m.node_tree.links:
        if l.from_node.type == "TEX_IMAGE" and l.from_socket.name == "Alpha":
            return l.from_node.image
    return None
imgs = {o.name: i for o in meshes if (i := imagen_con_alpha(o))}
saved = (vs.view_transform, vs.look, vs.exposure, sc.render.filter_size, bg.inputs[1].default_value)
made = []

def nuevo():
    m = bpy.data.materials.new("_pase"); made.append(m); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    return m, nt, nt.nodes.new("ShaderNodeOutputMaterial")

def salida(nt, shader, out, img=None, duro=False):
    if not img:
        nt.links.new(shader, out.inputs[0]); return
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
    tr = nt.nodes.new("ShaderNodeBsdfTransparent"); mx = nt.nodes.new("ShaderNodeMixShader")
    a = t.outputs["Alpha"]
    if duro:
        g = nt.nodes.new("ShaderNodeMath"); g.operation = "GREATER_THAN"; g.inputs[1].default_value = 0.5
        nt.links.new(a, g.inputs[0]); a = g.outputs[0]
    nt.links.new(a, mx.inputs[0]); nt.links.new(tr.outputs[0], mx.inputs[1])
    nt.links.new(shader, mx.inputs[2]); nt.links.new(mx.outputs[0], out.inputs[0])

def mat_clay(img=None):
    m, nt, out = nuevo(); bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bs.inputs["Base Color"].default_value = (0.55, 0.55, 0.55, 1); bs.inputs["Roughness"].default_value = 0.8
    salida(nt, bs.outputs[0], out, img); return m

def mat_prof(near, far, img=None):
    m, nt, out = nuevo(); cd = nt.nodes.new("ShaderNodeCameraData"); mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs[1].default_value = near; mr.inputs[2].default_value = far
    mr.inputs[3].default_value = 1.0; mr.inputs[4].default_value = 0.03
    nt.links.new(cd.outputs["View Distance"], mr.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission"); nt.links.new(mr.outputs[0], em.inputs[0])
    salida(nt, em.outputs[0], out, img); return m

def mat_id(rgb, img=None):
    m, nt, out = nuevo(); em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = (*rgb, 1)
    salida(nt, em.outputs[0], out, img, True); return m

def asignar(fn):
    for o in meshes:
        m = fn(o)
        for s in o.material_slots: s.material = m

def render(k, cam, pase):
    sc.camera = bpy.data.objects[cam]
    for o in techo_objs: o.hide_render = (k in CENITALES)
    tok = aplicar_estado(k)
    try:
        sc.render.filepath = D + f"{k}_{pase}.png"; bpy.ops.render.render(write_still=True)
    finally:
        restaurar(tok)

try:
    if "color" in PASES:
        for k, c in CAMS: render(k, c, "color")
    if "clay" in PASES:
        base = mat_clay(); cl = {n: mat_clay(i) for n, i in imgs.items()}
        asignar(lambda o: cl.get(o.name, base))
        for k, c in CAMS: render(k, c, "clay")
    # Pases técnicos: sin luces, sin fondo y con transformación Standard para no alterar los valores
    vs.view_transform = "Standard"; vs.look = "None"; vs.exposure = 0; bg.inputs[1].default_value = 0
    for l in lights: l.hide_render = True
    if "profundidad" in PASES:
        for k, c in CAMS:
            cam = bpy.data.objects[c]; p = cam.matrix_world.translation
            dist = lambda objs: [(o.matrix_world @ Vector(b) - p).length for o in objs for b in o.bound_box]
            fondo = [o for o in meshes if o.users_collection[0].name == ESTRUCTURA] or meshes
            resto = [o for o in meshes if o not in fondo] or meshes
            if cam.data.type == "ORTHO":
                near, far = min(dist(meshes)), max(dist(fondo))
            else:
                near, far = max(0.3, min(dist(resto)) * 0.8), max(dist(fondo))
            dm = mat_prof(near, far); dd = {n: mat_prof(near, far, i) for n, i in imgs.items()}
            asignar(lambda o: dd.get(o.name, dm)); render(k, c, "profundidad")
    if "id" in PASES:
        sc.render.filter_size = 0.01; random.seed(3)
        ids = {o.name: mat_id(colorsys.hsv_to_rgb(random.random(), 0.4 + 0.6 * random.random(), 0.3 + 0.7 * random.random()),
                              imgs.get(o.name)) for o in meshes}
        asignar(lambda o: ids[o.name])
        for k, c in CAMS: render(k, c, "id")
finally:
    for o in meshes:
        for s, m in zip(o.material_slots, orig[o.name]): s.material = m
    for l in lights: l.hide_render = False
    for o in techo_objs: o.hide_render = False
    vs.view_transform, vs.look, vs.exposure, sc.render.filter_size, bg.inputs[1].default_value = saved
    for m in made: bpy.data.materials.remove(m)
print("Pases guardados en", D, "·", [k for k, _ in CAMS])
