#!/usr/bin/env python3
"""Crea una máscara blanca sobre negro del tamaño de una imagen, para corregir solo una zona.

Uso:
  python3 -I mascara.py <imagen.png> <salida_mascara.png> rect x0 y0 x1 y1 [rect ...] [elipse x0 y0 x1 y1 ...]
           [--margen 12] [--previa previa.jpg]

Coordenadas en píxeles de <imagen.png>. --previa dibuja el contorno en rojo sobre la imagen para revisar
que la zona es la buena antes de gastar nada. La máscara se usa con componer_parche.py.
"""
import sys
from PIL import Image, ImageDraw

a = sys.argv[1:]
if len(a) < 4: print(__doc__); sys.exit(2)
src, out = a[0], a[1]; rest = a[2:]
margen = 0; previa = None; zonas = []
i = 0
while i < len(rest):
    t = rest[i]
    if t == "--margen": margen = int(rest[i + 1]); i += 2; continue
    if t == "--previa": previa = rest[i + 1]; i += 2; continue
    if t in ("rect", "elipse"):
        zonas.append((t, [float(v) for v in rest[i + 1:i + 5]])); i += 5; continue
    raise SystemExit(f"Argumento no reconocido: {t}")
im = Image.open(src).convert("RGB"); m = Image.new("L", im.size, 0); d = ImageDraw.Draw(m)
for t, (x0, y0, x1, y1) in zonas:
    box = (x0 - margen, y0 - margen, x1 + margen, y1 + margen)
    (d.rectangle if t == "rect" else d.ellipse)(box, fill=255)
m.save(out)
if previa:
    p = im.copy(); dp = ImageDraw.Draw(p)
    for t, (x0, y0, x1, y1) in zonas:
        box = (x0 - margen, y0 - margen, x1 + margen, y1 + margen)
        (dp.rectangle if t == "rect" else dp.ellipse)(box, outline=(255, 0, 0), width=max(3, im.width // 400))
    p.save(previa, quality=88)
print("Máscara", out, "·", len(zonas), "zona(s)", "· previa " + previa if previa else "")
