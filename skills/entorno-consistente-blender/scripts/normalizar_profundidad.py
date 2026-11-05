# Da contraste a los pases de profundidad que salen de Blender.
# Uso: python3 -I normalizar_profundidad.py "<carpeta renders/fase1>"
import sys, glob, os
from PIL import Image, ImageOps

carpeta = sys.argv[1]
for f in sorted(glob.glob(os.path.join(carpeta, "*_profundidad.png"))):
    im = Image.open(f).convert("L")
    lin = im.point(lambda v: int(255 * ((v / 255) ** 2.2)))
    mask = im.point(lambda v: 255 if v > 3 else 0)          # el fondo vacío queda negro
    ac = ImageOps.autocontrast(lin, cutoff=(0, 0.5), mask=mask)
    Image.composite(ac, Image.new("L", im.size, 0), mask).save(f)
    print("ok", os.path.basename(f))
