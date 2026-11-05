#!/usr/bin/env python3
"""Recorta de la imagen de referencia cada cuadro u objeto de pared, le quita la perspectiva
y lo guarda como textura PNG al tamaño real que tendrá en Blender.

Uso:
  python3 -I recortar_y_enderezar.py <referencia.jpg> <recortes.json> <carpeta_salida>

recortes.json:
{
  "px_por_metro": 1200,
  "planos": {
    "A01_foto_dorada": {"esquinas": [[27.5,71],[136,87.5],[135,212.5],[26,199]], "tamano_m": [0.42,0.52]}
  },
  "siluetas": {
    "A11_bolso": {"caja": [195,233,336,412], "mascara": "no_madera"},
    "A04_reloj": {"caja": [510,149,610,258], "mascara": "elipse"},
    "A13_ceramica": {"caja": [469,259,523,320], "mascara": "tono", "tono": [0.45,0.72], "sat_min": 0.12, "claros": true}
  },
  "fondo": {"tono": [0.0,0.11], "sat": [0.28,0.85], "val": [0.08,0.62]}
}

- "planos": cuadros, fotos y objetos rectangulares. Esquinas en orden: arriba-izquierda,
  arriba-derecha, abajo-derecha, abajo-izquierda (píxeles de la referencia, léelas con
  cuadricula_medicion.py). tamano_m = ancho y alto reales en Blender.
- "siluetas": objetos irregulares; se guardan con transparencia. Máscaras:
  "no_madera" (quita los píxeles que parecen el fondo definido en "fondo", por defecto nogal),
  "elipse" (objetos redondos), "tono" (conserva un rango de tono HSV, 0 a 1).
Genera también _info.json (tamaño en px de cada recorte) y _control.jpg (hoja para revisar).
"""
import sys, os, json, colorsys
from PIL import Image, ImageFilter, ImageDraw, ImageChops

ref, spec_path, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
im = Image.open(ref).convert("RGB")
spec = json.load(open(spec_path))
PPM = spec.get("px_por_metro", 1200)
F = spec.get("fondo", {"tono": [0.0, 0.11], "sat": [0.28, 0.85], "val": [0.08, 0.62]})
info = {}

for n, d in spec.get("planos", {}).items():
    (tl, tr, br, bl), (w, h) = d["esquinas"], d["tamano_m"]
    W, H = int(w * PPM), int(h * PPM)
    r = im.transform((W, H), Image.QUAD, (*tl, *bl, *br, *tr), resample=Image.BICUBIC)
    r.save(os.path.join(out, n + ".png")); info[n] = [W, H]

def es_fondo(h, s, v):
    t0, t1 = F["tono"]
    en_tono = (t0 <= h <= t1) or (t0 < 0.05 and h >= 0.97)
    return en_tono and F["sat"][0] <= s <= F["sat"][1] and F["val"][0] <= v <= F["val"][1]

for n, d in spec.get("siluetas", {}).items():
    c = im.crop(tuple(d["caja"])); tipo = d.get("mascara", "no_madera")
    m = Image.new("L", c.size, 0)
    if tipo == "elipse":
        ImageDraw.Draw(m).ellipse((1, 1, c.width - 2, c.height - 2), fill=255)
    else:
        px, mp = c.load(), m.load()
        for y in range(c.height):
            for x in range(c.width):
                h, s, v = colorsys.rgb_to_hsv(*[q / 255 for q in px[x, y]])
                if tipo == "tono":
                    t0, t1 = d["tono"]
                    keep = (t0 <= h <= t1 and s >= d.get("sat_min", 0.1)) or (d.get("claros") and s < 0.22 and v > 0.5)
                else:
                    keep = not es_fondo(h, s, v)
                mp[x, y] = 255 if keep else 0
        if d.get("elipse_extra"):
            e = Image.new("L", c.size, 0); ImageDraw.Draw(e).ellipse(tuple(d["elipse_extra"]), fill=255)
            m = ImageChops.multiply(m, e)
        m = m.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    m = m.filter(ImageFilter.GaussianBlur(0.8))
    c = c.resize((c.width * 8, c.height * 8), Image.BICUBIC); m = m.resize(c.size, Image.BICUBIC)
    c.putalpha(m); c.save(os.path.join(out, n + ".png")); info[n] = list(c.size)

json.dump(info, open(os.path.join(out, "_info.json"), "w"), indent=1)
items = sorted(info); th = 180
sheet = Image.new("RGB", (8 * 200, max(1, (len(items) + 7) // 8) * 220), (128, 128, 128)); dr = ImageDraw.Draw(sheet)
for i, n in enumerate(items):
    t = Image.open(os.path.join(out, n + ".png")).convert("RGBA"); t.thumbnail((190, th))
    x, y = (i % 8) * 200, (i // 8) * 220
    sheet.paste(t, (x + 5, y + 5), t); dr.text((x + 5, y + th + 12), n[:24], fill=(255, 255, 255))
sheet.save(os.path.join(out, "_control.jpg"), quality=85)
print(len(info), "recortes en", out, "· revisa _control.jpg (las siluetas deben verse sin fondo)")
