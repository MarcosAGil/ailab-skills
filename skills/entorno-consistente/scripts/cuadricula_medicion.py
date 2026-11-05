#!/usr/bin/env python3
"""Genera recortes ampliados con cuadrícula de una imagen de referencia, para leer
a ojo las esquinas de cada cuadro u objeto (en píxeles de la imagen original).

Uso:
  python3 -I cuadricula_medicion.py <referencia.jpg> <carpeta_salida> x0,y0,x1,y1[:zoom] [x0,y0,x1,y1[:zoom] ...]

Ejemplo:
  python3 -I cuadricula_medicion.py ref.jpg crops 0,40,380,440:2 360,110,700,480:2 1180,180,1440,500:3

Líneas cada 10 px (cian cada 50 px, con su valor en amarillo). Las etiquetas son coordenadas
de la imagen ORIGINAL, así que lo que leas va directo al JSON de recortar_y_enderezar.py.
"""
import sys, os
from PIL import Image, ImageDraw

ref, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = Image.open(ref).convert("RGB")
for i, arg in enumerate(sys.argv[3:], 1):
    caja, _, z = arg.partition(":")
    x0, y0, x1, y1 = map(int, caja.split(",")); z = int(z or 2)
    c = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * z, (y1 - y0) * z), Image.LANCZOS)
    d = ImageDraw.Draw(c)
    for x in range((x0 // 10 + 1) * 10, x1, 10):
        X = (x - x0) * z; big = x % 50 == 0
        d.line([(X, 0), (X, c.height)], fill=(0, 255, 255) if big else (90, 90, 90), width=1)
        if big: d.text((X + 2, 2), str(x), fill=(255, 255, 0))
    for y in range((y0 // 10 + 1) * 10, y1, 10):
        Y = (y - y0) * z; big = y % 50 == 0
        d.line([(0, Y), (c.width, Y)], fill=(0, 255, 255) if big else (90, 90, 90), width=1)
        if big: d.text((2, Y + 2), str(y), fill=(255, 255, 0))
    p = os.path.join(out, f"cuadricula_{i:02d}_{x0}_{y0}.png"); c.save(p); print(p)
