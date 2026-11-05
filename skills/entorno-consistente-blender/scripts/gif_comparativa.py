#!/usr/bin/env python3
"""GIFs para enseñar el trabajo (documentación, clases, entregas). Necesita ffmpeg.

Uso:
  # secuencia de imágenes con fundido y etiqueta (vistas del espacio, pases de una vista...)
  python3 -I gif_comparativa.py secuencia <salida.gif> img1.png=ETIQUETA img2.png=ETIQUETA ...
  # antes / después de una corrección o render -> IA (mismo encuadre)
  python3 -I gif_comparativa.py antes-despues <salida.gif> antes.png despues.png [--recorte x0 y0 x1 y1]
Opciones: --ancho 800 (px) · --fps 10 · --pausa 12 (fotogramas quietos por imagen) · --fundido 4
"""
import os, sys, shutil, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont

def opt(n, d):
    return type(d)(sys.argv[sys.argv.index(n) + 1]) if n in sys.argv else d

if len(sys.argv) < 4: print(__doc__); sys.exit(2)
modo, salida = sys.argv[1], sys.argv[2]
ANCHO, FPS, PAUSA, FUNDIDO = opt("--ancho", 800), opt("--fps", 10), opt("--pausa", 12), opt("--fundido", 4)
args = []; i = 3
while i < len(sys.argv):
    if sys.argv[i] in ("--ancho", "--fps", "--pausa", "--fundido"): i += 2; continue
    if sys.argv[i] == "--recorte": i += 5; continue
    args.append(sys.argv[i]); i += 1

def fuente(t):
    for f in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        try: return ImageFont.truetype(f, t)
        except Exception: pass
    return ImageFont.load_default()
F = fuente(max(14, ANCHO // 40))

def etiqueta(im, t):
    if not t: return im
    im = im.copy(); d = ImageDraw.Draw(im); x0, y0, x1, y1 = d.textbbox((0, 0), t, font=F)
    d.rectangle((14, 14, 34 + x1, 28 + y1), fill=(20, 20, 20)); d.text((24, 20), t, font=F, fill=(255, 255, 255)); return im

def cargar(p, rec=None):
    im = Image.open(p).convert("RGB")
    if rec: im = im.crop(rec)
    return im.resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS)

if modo == "secuencia":
    ims = []
    for a in args:
        p, _, t = a.partition("="); ims.append(etiqueta(cargar(p), t.replace("_", " ")))
    h = min(im.height for im in ims); ims = [im.crop((0, 0, ANCHO, h)) for im in ims]
elif modo == "antes-despues":
    rec = None
    if "--recorte" in sys.argv:
        k = sys.argv.index("--recorte"); rec = tuple(int(v) for v in sys.argv[k + 1:k + 5])
    ims = [etiqueta(cargar(args[0], rec), "ANTES"), etiqueta(cargar(args[1], rec), "DESPUÉS")]
else:
    raise SystemExit("Modo: secuencia | antes-despues")

fr = []
for j, im in enumerate(ims):
    sig = ims[(j + 1) % len(ims)]
    fr += [im] * PAUSA + [Image.blend(im, sig, (k + 1) / (FUNDIDO + 1)) for k in range(FUNDIDO)]
d = tempfile.mkdtemp()
for j, f in enumerate(fr): f.save(f"{d}/{j:04d}.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", f"{d}/%04d.png", "-vf",
                "split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle",
                "-loop", "0", salida], check=True)
shutil.rmtree(d)
print(salida, round(os.path.getsize(salida) / 1e6, 2), "MB ·", len(fr), "fotogramas")
