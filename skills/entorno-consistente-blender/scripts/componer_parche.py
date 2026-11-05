#!/usr/bin/env python3
"""Control absoluto de una corrección: pega SOLO la zona de la máscara de la imagen corregida sobre la
imagen original. Todo lo que queda fuera de la máscara conserva los píxeles originales.

Por qué: cuando se pide a un modelo de edición "cambia solo X", a menudo toca más cosas (quita un
personaje, cambia la exposición, reencuadra). Con este parche el cambio queda limitado a la zona.

Uso:
  python3 -I componer_parche.py <original.png> <corregida.png> <mascara.png> <salida.png>
           [--suavizado 6] [--igualar-color] [--alinear]

--suavizado    radio en píxeles del fundido del borde de la máscara (por defecto 6).
--igualar-color ajusta la ganancia de color del parche midiendo una banda por dentro del borde de la máscara
               en las dos imágenes (útil si el modelo oscureció o aclaró también la zona corregida).
--alinear      si la corregida tiene otro encuadre, busca el desplazamiento y la escala que mejor la
               alinean con la original alrededor de la máscara antes de pegar (búsqueda simple).
Genera además <salida>_comparacion.jpg (original | corregida | resultado) recortado a la zona.
"""
import sys, os
from PIL import Image, ImageFilter, ImageChops, ImageStat

a = [x for x in sys.argv[1:] if not x.startswith("--")]
if len(a) < 4: print(__doc__); sys.exit(2)
opts = sys.argv[1:]
suav = int(opts[opts.index("--suavizado") + 1]) if "--suavizado" in opts else 6
orig = Image.open(a[0]).convert("RGB"); corr = Image.open(a[1]).convert("RGB"); m = Image.open(a[2]).convert("L")
if m.size != orig.size: m = m.resize(orig.size, Image.NEAREST)
if corr.size != orig.size: corr = corr.resize(orig.size, Image.LANCZOS)
bbox = m.getbbox()
if not bbox: raise SystemExit("La máscara está vacía")

if "--alinear" in opts:
    x0, y0, x1, y1 = bbox; pad = 80
    zona = (max(0, x0 - pad), max(0, y0 - pad), min(orig.width, x1 + pad), min(orig.height, y1 + pad))
    ref = orig.crop(zona).convert("L").resize((200, int(200 * (zona[3] - zona[1]) / (zona[2] - zona[0]))))
    mejor = (1e18, 0, 0, 1.0)
    for esc in (0.96, 0.98, 1.0, 1.02, 1.04):
        c2 = corr.resize((int(orig.width * esc), int(orig.height * esc)), Image.LANCZOS)
        ox = (c2.width - orig.width) // 2; oy = (c2.height - orig.height) // 2
        for dx in range(-40, 41, 8):
            for dy in range(-40, 41, 8):
                z = (zona[0] + ox + dx, zona[1] + oy + dy, zona[2] + ox + dx, zona[3] + oy + dy)
                t = c2.crop(z).convert("L").resize(ref.size)
                err = sum(ImageStat.Stat(ImageChops.difference(ref, t)).sum)
                if err < mejor[0]: mejor = (err, dx, dy, esc)
    _, dx, dy, esc = mejor
    c2 = corr.resize((int(orig.width * esc), int(orig.height * esc)), Image.LANCZOS)
    ox = (c2.width - orig.width) // 2 + dx; oy = (c2.height - orig.height) // 2 + dy
    corr = c2.crop((ox, oy, ox + orig.width, oy + orig.height))
    print(f"Alineado: escala {esc}, desplazamiento ({dx}, {dy}) px")

if "--igualar-color" in opts:
    # banda de ~12 px por dentro del borde de la máscara: zona que debe casar con lo que la rodea
    banda = ImageChops.subtract(m, m.filter(ImageFilter.MinFilter(25)))
    so = ImageStat.Stat(orig, banda).mean; sc = ImageStat.Stat(corr, banda).mean
    g = [so[i] / max(sc[i], 1) for i in range(3)]
    corr = Image.merge("RGB", [ch.point(lambda v, k=k: min(255, round(v * k))) for ch, k in zip(corr.split(), g)])
    print("Ganancia de color aplicada:", [round(x, 3) for x in g])

mf = m.filter(ImageFilter.GaussianBlur(suav)) if suav > 0 else m
res = Image.composite(corr, orig, mf)
res.save(a[3])
x0, y0, x1, y1 = bbox; pad = 60
z = (max(0, x0 - pad), max(0, y0 - pad), min(orig.width, x1 + pad), min(orig.height, y1 + pad))
w, h = z[2] - z[0], z[3] - z[1]
cmp = Image.new("RGB", (w * 3 + 20, h), (255, 255, 255))
for i, im in enumerate((orig, corr, res)): cmp.paste(im.crop(z), (i * (w + 10), 0))
cmp.save(os.path.splitext(a[3])[0] + "_comparacion.jpg", quality=88)
print("Resultado:", a[3])
