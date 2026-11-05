#!/usr/bin/env python3
"""Construye el visor web 3D a partir de escena.json (exportado desde Blender).

Uso:
  python3 -I construir_visor.py --escena escena.json --salida visor.html \
      --titulo "Sala de espera vintage" --subtitulo "Versión v3 · medidas reales en metros" \
      [--etiquetas etiquetas.json] [--colecciones colecciones.json] [--clave mi-espacio]

etiquetas.json:   {"Cam_A1_frontal_6_0m": ["A1 · Frontal 6 m", "35 mm"], ...}
colecciones.json: {"Galeria_A": "Galería pared A", ...}
Sin esos archivos, el visor usa los nombres de Blender tal cual.
"""
import argparse, html, json, os

aqui = os.path.dirname(os.path.abspath(__file__))
p = argparse.ArgumentParser()
p.add_argument("--escena", required=True)
p.add_argument("--salida", required=True)
p.add_argument("--titulo", required=True)
p.add_argument("--subtitulo", default="Medidas reales en metros")
p.add_argument("--plantilla", default=os.path.join(aqui, "..", "assets", "visor-template.html"))
p.add_argument("--etiquetas")
p.add_argument("--colecciones")
p.add_argument("--clave", help="nombre para guardar las correcciones en el navegador")
p.add_argument("--techo", default="Techo", help="colección que se oculta con el botón Techo")
p.add_argument("--estructura", default="Estructura", help="colección cuyas piezas altas frenan el paseo")
a = p.parse_args()

escena = json.load(open(a.escena, encoding="utf-8"))
if a.etiquetas: escena["labels"] = json.load(open(a.etiquetas))
if a.colecciones: escena["collections"] = json.load(open(a.colecciones))
escena["storageKey"] = (a.clave or "entorno") + "-correcciones-v1"
escena["ceiling"], escena["structure"] = a.techo, a.estructura

t = open(a.plantilla, encoding="utf-8").read()
logo = os.path.join(aqui, "..", "assets", "marca", "ailendra-labs-logo-blanco.svg")
svg = open(logo, encoding="utf-8").read() if os.path.exists(logo) else ""
svg = svg[svg.find("<svg"):] if "<svg" in svg else ""          # sin cabecera XML ni DOCTYPE
t = t.replace("__LOGO__", svg)
t = t.replace("__TITLE__", html.escape(a.titulo)).replace("__SUBTITLE__", html.escape(a.subtitulo))
t = t.replace("__DATA__", json.dumps(escena, ensure_ascii=False))
open(a.salida, "w", encoding="utf-8").write(t)
print("Visor:", a.salida, "·", len(escena["objects"]), "objetos ·", len(escena["cameras"]), "cámaras")
