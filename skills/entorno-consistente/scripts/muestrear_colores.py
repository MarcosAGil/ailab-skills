#!/usr/bin/env python3
"""Mide el color medio de zonas de una imagen (referencia o render) en sRGB y en lineal,
para ajustar materiales de Blender o comparar un render con la referencia.

Uso:
  python3 -I muestrear_colores.py <imagen> nombre=x0,y0,x1,y1 [nombre=x0,y0,x1,y1 ...]

Ejemplo:
  python3 -I muestrear_colores.py ref.jpg pared=100,450,500,520 moqueta=800,950,1500,1080

El valor lineal es el que se escribe en Base Color de Blender. Elige zonas limpias y
bien iluminadas (sin cuadros, sombras ni brillos) o el color saldrá falseado.
"""
import sys
from PIL import Image

im = Image.open(sys.argv[1]).convert("RGB")
lin = lambda c: round(((c / 255 + 0.055) / 1.055) ** 2.4, 3)
for arg in sys.argv[2:]:
    n, caja = arg.split("=")
    b = tuple(map(int, caja.split(",")))
    c = im.crop(b).resize((1, 1), Image.BOX).getpixel((0, 0))
    print(f"{n}: sRGB {c} · lineal {tuple(lin(x) for x in c)}")
