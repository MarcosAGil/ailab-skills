#!/usr/bin/env python3
"""Control de calidad y hoja de entorno.

Para cada vista pinta en cian, sobre la imagen generada por la IA, los contornos de su pase
<K>_id.png de Blender. Si un objeto se sale de su línea, se ha movido o ha cambiado de tamaño.
Monta además una hoja de control (generada | con contornos) y una hoja de entorno, las dos con el
logo de Ailendra Labs.

Uso:
  python3 -I control_contornos.py --pases <renders/fase1> --salida <carpeta> \\
      --titulo "Sala de espera · hoja de entorno" \\
      C=ruta/vista-C.png A1=ruta/vista-A1.png G=ruta/vista-G.png=Con_personajes ...

Cada argumento CLAVE=imagen usa <pases>/<CLAVE>_id.png. Opcional: CLAVE=imagen=Etiqueta.
Si una vista no tiene pase id (imagen corregida a mano, plano sin render), se usa CLAVE=imagen=Etiqueta=-
y entra en la hoja de entorno sin control. --sin-logo quita la marca.
Salida: control_<CLAVE>.jpg, control_todas.jpg y hoja_entorno.jpg en --salida.
"""
import argparse, os
from PIL import Image, ImageFilter, ImageDraw, ImageChops, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(AQUI, "..", "assets", "marca", "ailendra-labs-logo-negro.png")

p = argparse.ArgumentParser()
p.add_argument("--pases", required=True)
p.add_argument("--salida", required=True)
p.add_argument("--titulo", default="Hoja de entorno")
p.add_argument("--sin-logo", action="store_true")
p.add_argument("vistas", nargs="+")
a = p.parse_args()
os.makedirs(a.salida, exist_ok=True)


def fuente(tam, negrita=False):
    for f in (["/System/Library/Fonts/Supplemental/Arial Bold.ttf"] if negrita else []) + [
              "/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf"]:
        try: return ImageFont.truetype(f, tam)
        except Exception: pass
    return ImageFont.load_default()


def poner_logo(lienzo, alto):
    if a.sin_logo or not os.path.exists(LOGO): return
    lg = Image.open(LOGO).convert("RGBA"); lg = lg.resize((int(lg.width * alto / lg.height), alto), Image.LANCZOS)
    lienzo.paste(lg, (lienzo.width - lg.width - 24, 14), lg)


def contornos(idp, size):
    idm = Image.open(idp).convert("RGB").resize(size, Image.NEAREST)
    dif = ImageChops.lighter(ImageChops.difference(idm, ImageChops.offset(idm, 1, 0)),
                             ImageChops.difference(idm, ImageChops.offset(idm, 0, 1)))
    return dif.convert("L").point(lambda v: 255 if v > 12 else 0).filter(ImageFilter.MaxFilter(3))


ok = []
for arg in a.vistas:
    partes = arg.split("=")
    k, ruta = partes[0], partes[1]; lab = (partes[2] if len(partes) > 2 else "").replace("_", " ")
    sin_control = len(partes) > 3 and partes[3] == "-"
    idp = os.path.join(a.pases, f"{k}_id.png")
    if not sin_control and os.path.exists(idp):
        W, H = Image.open(idp).size
        im = Image.open(ruta).convert("RGB").resize((W, H), Image.LANCZOS)
        ov = im.copy(); ov.paste(Image.new("RGB", (W, H), (0, 255, 255)), (0, 0), contornos(idp, (W, H)))
        ov.save(os.path.join(a.salida, f"control_{k}.jpg"), quality=90)
    else:
        im = Image.open(ruta).convert("RGB").resize((1920, 1080), Image.LANCZOS); ov = None
    ok.append((k, lab, im, ov))

F, Fb, Ft = fuente(18), fuente(18, True), fuente(30, True)
con = [x for x in ok if x[3] is not None]
if con:
    w, h = 640, 360
    s = Image.new("RGB", (2 * w + 20, 70 + len(con) * (h + 36)), (245, 243, 239)); d = ImageDraw.Draw(s)
    d.text((16, 20), a.titulo + " · control de contornos", font=Ft, fill=(25, 25, 25)); poner_logo(s, 40)
    for i, (k, lab, im, ov) in enumerate(con):
        y = 70 + i * (h + 36)
        d.text((6, y + 8), f"Vista {k}{(' · ' + lab) if lab else ''}   ·   izquierda: generada · derecha: con contornos del render", font=F, fill=(40, 40, 40))
        s.paste(im.resize((w, h), Image.LANCZOS), (0, y + 32)); s.paste(ov.resize((w, h), Image.LANCZOS), (w + 20, y + 32))
    s.save(os.path.join(a.salida, "control_todas.jpg"), quality=86)

w, h, cols = 960, 540, 3 if len(ok) > 4 else 2
rows = (len(ok) + cols - 1) // cols
e = Image.new("RGB", (cols * w + (cols + 1) * 14, 96 + rows * (h + 50)), (245, 243, 239)); d = ImageDraw.Draw(e)
d.text((22, 30), a.titulo, font=fuente(40, True), fill=(25, 25, 25)); poner_logo(e, 64)
for i, (k, lab, im, _) in enumerate(ok):
    x = 14 + (i % cols) * (w + 14); y = 96 + (i // cols) * (h + 50)
    e.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 4, y + h + 12), f"{i + 1:02d} · Vista {k}{(' · ' + lab) if lab else ''}", font=fuente(22), fill=(30, 30, 30))
e.save(os.path.join(a.salida, "hoja_entorno.jpg"), quality=90)
print("Controles y hoja de entorno en", a.salida, "·", [k for k, *_ in ok])
