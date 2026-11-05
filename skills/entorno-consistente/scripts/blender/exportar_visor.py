# Exporta la escena abierta en Blender a escena.json para el visor web.
# Se ejecuta DENTRO de Blender: Claude pasa este código a mcp__blender__execute_blender_code.
# Antes de ejecutarlo, ajusta SALIDA si hace falta. Conversión de ejes Blender -> three.js: (x, y, z) -> (x, z, -y).
import bpy, json, os
from mathutils import Vector

SALIDA = bpy.path.abspath("//visor/escena.json")   # relativo a la carpeta del .blend guardado

sc = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
r = lambda v: round(v, 3)
objs, cams = [], []
for o in sc.objects:
    if not o.visible_get() or o.type != "MESH":
        continue
    oe = o.evaluated_get(dg); me = oe.to_mesh(); me.calc_loop_triangles(); mw = o.matrix_world
    v = []
    for vt in me.vertices:
        w = mw @ vt.co; v += [r(w.x), r(w.z), r(-w.y)]
    t = [i for tri in me.loop_triangles for i in tri.vertices]
    m = o.material_slots[0].material if o.material_slots else None
    c = list(m.diffuse_color) if m else [0.7, 0.7, 0.7, 1]
    objs.append({"name": o.name, "coll": o.users_collection[0].name, "v": v, "t": t,
                 "c": [round(x, 3) for x in c], "dim": [r(x) for x in o.dimensions],
                 "loc": [r(x) for x in o.location]})
    oe.to_mesh_clear()
for o in bpy.data.objects:
    if o.type == "CAMERA":
        mw = o.matrix_world; p = mw.translation; tg = p + (mw.to_quaternion() @ Vector((0, 0, -1))) * 3
        cams.append({"name": o.name, "pos": [p.x, p.z, -p.y], "tgt": [tg.x, tg.z, -tg.y],
                     "lens": o.data.lens, "ortho": o.data.type == "ORTHO", "oscale": o.data.ortho_scale})
cams.sort(key=lambda c: c["name"])
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
json.dump({"objects": objs, "cameras": cams}, open(SALIDA, "w"))
print(len(objs), "objetos ·", len(cams), "cámaras ·", SALIDA)
# Nota: el color que ve el visor es material.diffuse_color (color de viewport).
# Cuando crees materiales, pon también diffuse_color a un color representativo.
