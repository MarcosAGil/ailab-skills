# Estados por vista: cambios que solo valen para una cámara (mover un puf para que quepa un personaje,
# mostrar los maniquíes de una escena, ocultar el techo...). El .blend guarda la escena "base" y cada
# vista recuerda sus propios cambios. render_pases.py los aplica solo al renderizar esa vista.
#
# Uso dentro de Blender:
#   exec(open("<skill>/scripts/blender/estado_vista.py").read())
#   definir_estado("G", mover={"Puf_azul": (6.07, 3.89, 0.22)}, mostrar=["Personajes_guia"])
#   definir_estado("H", mostrar=["Personajes_guia"], ocultar=["Techo"])
#   tok = aplicar_estado("G")   # para revisarlo con mcp__blender__look
#   restaurar(tok)              # vuelve a la base
#
# Todo lo que aparece en el "mostrar" de alguna vista se oculta en las vistas que no lo piden:
# así los maniquíes nunca se cuelan en las vistas vacías del espacio.
import bpy, json


def _estados():
    return json.loads(bpy.context.scene.get("estados_vista", "{}"))


def definir_estado(vista, mover=None, mostrar=None, ocultar=None):
    e = _estados()
    e[vista] = {"mover": {k: list(v) for k, v in (mover or {}).items()}, "mostrar": mostrar or [], "ocultar": ocultar or []}
    bpy.context.scene["estados_vista"] = json.dumps(e)
    print("Estados:", list(e))


def _objetos(nombre):
    o = bpy.data.objects.get(nombre)
    if o: return [o] + list(o.children_recursive)
    c = bpy.data.collections.get(nombre)
    return list(c.all_objects) if c else []


def aplicar_estado(vista):
    """Aplica el estado de `vista` y devuelve lo necesario para restaurar la base."""
    e = _estados(); est = e.get(vista, {"mover": {}, "mostrar": [], "ocultar": []})
    todos_mostrar = {n for v in e.values() for n in v.get("mostrar", [])}
    tok = {"loc": {}, "hr": {}, "hv": {}}
    def ocultar(o, h):
        tok["hr"].setdefault(o.name, o.hide_render); tok["hv"].setdefault(o.name, o.hide_viewport)
        o.hide_render = h; o.hide_viewport = h
    for n in todos_mostrar - set(est["mostrar"]):
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
    for n, h in tok["hv"].items(): bpy.data.objects[n].hide_viewport = h


def base():
    """Deja la escena en su estado base: oculta todo lo que solo aparece en alguna vista."""
    return aplicar_estado("__base__")
