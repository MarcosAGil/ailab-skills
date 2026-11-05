# EJEMPLO REAL (sala de espera): arte propio de un objeto protagonista dibujado con Pillow.
# Úsalo como plantilla para cualquier objeto con superficies gráficas (máquina, rótulo, mostrador, caja):
# 1) mide los colores en la referencia con muestrear_colores.py, 2) dibuja cada cara a 1000 px por metro
# con las medidas reales del objeto en Blender, 3) recorta de la referencia SOLO lo irrepetible (pantalla, logo
# del propio usuario) con Image.QUAD, 4) asigna cada PNG a su cara con mat_imagen() y UV por cara.
# No copies arte, logotipos ni personajes de marcas o juegos reales que no sean del usuario.
# Dibuja las texturas de la máquina arcade imitando la referencia y recorta su pantalla.
# Uso: python3 -I dibujar_arcade.py "<imagen de referencia>" "<carpeta texturas/arcade>"
# Escala: 1000 px por metro. El lateral se dibuja en el espacio del perfil (u=0 es el frente).
import sys, os
from PIL import Image, ImageDraw

ref_path, out = sys.argv[1], sys.argv[2].rstrip("/") + "/"
os.makedirs(out, exist_ok=True)
CREAM = (232, 220, 196); RED = (178, 30, 32); MINT = (160, 214, 190); BLACK = (18, 18, 20)
S = 1000

# Lateral: perfil 0,90 m de fondo x 1,95 m de alto
W, H = int(0.9 * S), int(1.95 * S)
im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
P = lambda y, z: ((y + 0.45) * S, (1.95 - z) * S)
front = [(-0.45, 0), (-0.45, 0.92), (-0.25, 1.00), (-0.18, 1.58), (-0.30, 1.65), (-0.30, 1.95)]
off = lambda pts, dy: [(y + dy, z) for y, z in pts]
d.line([P(*p) for p in off([(-0.45, 0.30)] + front[1:], 0.13)], fill=MINT, width=40, joint="curve")
d.line([P(*p) for p in [(-0.10, 0.0), (-0.10, 0.30), (0.05, 0.55), (0.05, 1.30), (0.0, 1.55)]], fill=RED, width=55, joint="curve")
d.line([P(*p) for p in [(0.06, 0.0), (0.06, 0.25), (0.18, 0.45), (0.18, 1.10)]], fill=RED, width=30, joint="curve")
d.polygon([P(-0.45, 0.0), P(-0.25, 0.0), P(-0.25, 0.20), P(-0.45, 0.35)], fill=RED)
d.line([P(*p) for p in front], fill=RED, width=28, joint="curve")
d.line([P(-0.30, 1.95), P(0.45, 1.95)], fill=RED, width=20)
im.save(out + "lateral.png")

def bordes(d, W, H):
    d.rectangle([0, 0, 22, H], fill=RED); d.rectangle([W - 22, 0, W, H], fill=RED)

# Frontal inferior: 0,75 x 0,92 m
W, H = int(0.75 * S), int(0.92 * S); im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
d.polygon([(0, H * 0.55), (0, H * 0.62), (W * 0.40, H * 0.98), (W * 0.40, H * 0.91)], fill=MINT)
d.polygon([(W, H * 0.55), (W, H * 0.62), (W * 0.60, H * 0.98), (W * 0.60, H * 0.91)], fill=MINT)
d.polygon([(0, H * 0.68), (0, H * 0.76), (W * 0.30, H), (W * 0.20, H)], fill=RED)
d.polygon([(W, H * 0.68), (W, H * 0.76), (W * 0.70, H), (W * 0.80, H)], fill=RED)
d.rectangle([0, H - 60, W, H], fill=BLACK); bordes(d, W, H)
im.save(out + "frontal_inferior.png")

# Panel de mandos: 0,75 x 0,215 m
W, H = int(0.75 * S), int(0.215 * S); im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
d.rectangle([0, H - 45, W, H], fill=BLACK)
d.arc([W * 0.05, H * 0.15, W * 0.45, H * 1.4], 200, 330, fill=RED, width=10)
d.arc([W * 0.55, H * 0.15, W * 0.95, H * 1.4], 210, 340, fill=RED, width=10)
bordes(d, W, H); im.save(out + "panel_mandos.png")

# Pantalla: bisel negro + pantalla recortada de la referencia (esquinas en px de la referencia)
ref = Image.open(ref_path).convert("RGB")
W, H = int(0.75 * S), int(0.584 * S); im = Image.new("RGB", (W, H), BLACK); d = ImageDraw.Draw(im)
scr = ref.transform((int(W * 0.62), int(H * 0.62)), Image.QUAD,
                    (1690, 452.5, 1677.5, 515, 1777.5, 517.5, 1779, 452.5), resample=Image.BICUBIC)
im.paste(scr, (int(W * 0.19), int(H * 0.22))); bordes(d, W, H)
im.save(out + "pantalla.png")

# Marquesina: 0,75 x 0,30 m con rayas diagonales
W, H = int(0.75 * S), int(0.30 * S); im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
for x0, c, w in [(-80, MINT, 110), (140, RED, 120), (390, MINT, 110), (620, RED, 60)]:
    d.polygon([(x0, H), (x0 + w, H), (x0 + w + 260, 0), (x0 + 260, 0)], fill=c)
d.rectangle([0, 0, W, 18], fill=RED); d.rectangle([0, H - 14, W, H], fill=BLACK); bordes(d, W, H)
im.save(out + "marquesina.png")
print("Texturas de la arcade en", out)
