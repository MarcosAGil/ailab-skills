# Funciones auxiliares para construir el espacio en Blender (blockout, materiales, recortes pegados).
# Pégalas o cárgalas al principio de cada ejecución: el espacio de nombres del MCP no siempre persiste.
#   exec(open("<skill>/scripts/blender/utilidades.py").read())
# Ejes: X a lo ancho, Y hacia el fondo, Z arriba. Metros reales. Suelo en z = 0.
import bpy, bmesh, math
from mathutils import Vector


def col(nombre):
    """Colección (la crea y la cuelga de la escena si no existe)."""
    c = bpy.data.collections.get(nombre) or bpy.data.collections.new(nombre)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


def mat(nombre, rgb, alpha=1.0, rough=0.6):
    """Material liso. Pone también diffuse_color, que es el color que ve el visor web."""
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre); m.use_nodes = True
    bs = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bs.inputs["Base Color"].default_value = (*rgb, 1); bs.inputs["Roughness"].default_value = rough
    if alpha < 1: bs.inputs["Alpha"].default_value = alpha
    m.diffuse_color = (*rgb, alpha)
    return m


def _obj(nombre, bm, loc, m, c):
    old = bpy.data.objects.get(nombre)
    if old: bpy.data.objects.remove(old)
    me = bpy.data.meshes.new(nombre); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(nombre, me); ob.location = loc
    me.materials.append(m); c.objects.link(ob); return ob


def caja(nombre, centro, tam, m, c):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=tam, verts=bm.verts); return _obj(nombre, bm, centro, m, c)


def cilindro(nombre, centro, r, h, m, c, seg=48):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h)
    return _obj(nombre, bm, centro, m, c)


def perfil_extruido(nombre, puntos_yz, ancho, loc, m, c):
    """Perfil lateral (y, z) extruido a lo ancho en X: máquinas, mostradores, escaleras, sillas."""
    bm = bmesh.new()
    vs = [bm.verts.new((-ancho / 2, y, z)) for y, z in puntos_yz]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(ancho, 0, 0), verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _obj(nombre, bm, loc, m, c)


def bevel(o, ancho, seg=4):
    """Bisel suave: tapizados 0,04 a 0,05 m; madera 0,004 m."""
    for x in [x for x in o.modifiers if x.type == "BEVEL"]: o.modifiers.remove(x)
    b = o.modifiers.new("Bevel", "BEVEL"); b.width = ancho; b.segments = seg; b.limit_method = "ANGLE"
    for p in o.data.polygons: p.use_smooth = True


def bbox(o):
    bpy.context.view_layer.update()
    cs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return (Vector((min(c.x for c in cs), min(c.y for c in cs), min(c.z for c in cs))),
            Vector((max(c.x for c in cs), max(c.y for c in cs), max(c.z for c in cs))))


def mat_imagen(nombre, ruta, alpha=False, rough=0.45):
    """Material con una imagen (recortes de la referencia, arte propio). alpha=True para siluetas."""
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bs.outputs[0], out.inputs[0])
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(ruta, check_existing=True)
    nt.links.new(t.outputs["Color"], bs.inputs["Base Color"]); bs.inputs["Roughness"].default_value = rough
    if alpha: nt.links.new(t.outputs["Alpha"], bs.inputs["Alpha"])
    m.diffuse_color = (0.6, 0.6, 0.6, 1); return m


def plano(nombre, esquinas, m, c):
    """Plano con UV a toda la cara. Esquinas: abajo-izq, abajo-der, arriba-der, arriba-izq, vistas DESDE DELANTE."""
    old = bpy.data.objects.get(nombre)
    if old: bpy.data.objects.remove(old)
    me = bpy.data.meshes.new(nombre); me.from_pydata([tuple(p) for p in esquinas], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name="UVMap"); UV = [(0, 0), (1, 0), (1, 1), (0, 1)]
    for li, lp in enumerate(me.loops): uv.data[li].uv = UV[lp.vertex_index]
    me.materials.append(m); ob = bpy.data.objects.new(nombre, me); c.objects.link(ob); return ob


def pegar_en_frente(obj, m, c, pared="-Y", sep=0.0006):
    """Pega un plano con material de imagen delante de la cara visible de un objeto colgado en una pared.
    pared = hacia dónde mira la cara visible: "-Y" (pared del fondo) o "-X" / "+X" (paredes laterales)."""
    mn, mx = bbox(obj)
    if pared == "-Y":
        y = mn.y - sep; e = [(mn.x, y, mn.z), (mx.x, y, mn.z), (mx.x, y, mx.z), (mn.x, y, mx.z)]
    elif pared == "-X":
        x = mn.x - sep; e = [(x, mx.y, mn.z), (x, mn.y, mn.z), (x, mn.y, mx.z), (x, mx.y, mx.z)]
    else:
        x = mx.x + sep; e = [(x, mn.y, mn.z), (x, mx.y, mn.z), (x, mx.y, mx.z), (x, mn.y, mx.z)]
    return plano(obj.name + "_imagen", e, m, c)


def solapes(objetos, margen=0.04, eje=("x", "z")):
    """Parejas de objetos de una pared cuyos rectángulos se tocan (con margen). Lista vacía = bien colocado."""
    bpy.context.view_layer.update()          # matrices al día tras crear o mover objetos
    i0, i1 = "xyz".index(eje[0]), "xyz".index(eje[1]); r = []
    cajas = [(o.name, bbox(o)) for o in objetos]
    for a in range(len(cajas)):
        for b in range(a + 1, len(cajas)):
            (na, (a0, a1)), (nb, (b0, b1)) = cajas[a], cajas[b]
            if a0[i0] - margen < b1[i0] and b0[i0] - margen < a1[i0] and a0[i1] - margen < b1[i1] and b0[i1] - margen < a1[i1]:
                r.append((na, nb))
    return r


def en_esquina_45(centro_esquina, bisectriz, separacion, fondo, ancho):
    """Centro de un objeto girado 45° en una esquina, a `separacion` de las dos paredes."""
    t = separacion * math.sqrt(2) + fondo / 2 + ancho / 2
    b = Vector(bisectriz).normalized()
    return Vector(centro_esquina) + b * t
