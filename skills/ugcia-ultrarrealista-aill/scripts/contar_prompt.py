#!/usr/bin/env python3
"""Cuenta y valida un prompt de Seed Audio guardado en un archivo de texto.

Uso: contar_prompt.py <archivo.txt> [--max 2048]

El archivo debe contener SOLO el contenido que se enviara en `prompt`
(desde el brief hasta el cierre de [ETIQUETA ...]), sin la etiqueta
"PROMPT:", sin vallas de codigo y sin la linea "Settings:".
Cuenta caracteres Unicode (no bytes); cada salto de linea cuenta como 1.
"""
import re
import sys


def main() -> int:
    args = sys.argv[1:]
    limit = 2048
    if "--max" in args:
        i = args.index("--max")
        limit = int(args[i + 1])
        del args[i : i + 2]
    if len(args) != 1:
        print(__doc__)
        return 2

    with open(args[0], encoding="utf-8") as f:
        text = f.read()
    if text.endswith("\n"):
        text = text[:-1]

    n = len(text)
    problems = []
    if n > limit:
        problems.append(f"SUPERA el limite: {n} > {limit} (sobran {n - limit})")
    for tag in ("[AESTHETIC]", "[EXECUTION]", "[ETIQUETA"):
        if tag not in text:
            problems.append(f"falta {tag}")
    if "«" in text or "»" in text or "“" in text or "”" in text:
        problems.append("hay comillas latinas o tipograficas: el dialogo va con comillas dobles rectas")
    if "[DIAL]" in text or "[DIAL " in text:
        for m in re.finditer(r"\[DIAL\][^\n]*", text):
            if m.group(0).count('"') < 2:
                problems.append("un [DIAL] no tiene su guion entre comillas dobles rectas")
                break
    if re.search(r"\[(Scene|sound|music):", text):
        problems.append("usa [Scene:], [sound:] o [music:], que no estan permitidos")
    if text.startswith("PROMPT") or text.startswith("```") or "Settings:" in text:
        problems.append("incluye 'PROMPT:', vallas de codigo o 'Settings:' dentro del archivo")

    print(f"caracteres: {n} / {limit}  (margen {limit - n})")
    if problems:
        print("PROBLEMAS:")
        for p in problems:
            print(" -", p)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
