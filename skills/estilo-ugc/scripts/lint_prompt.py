#!/usr/bin/env python3
"""Comprobación mecánica de un prompt de vídeo antes de entregarlo (perfil Seedance 2.5).

Uso:
    python3 lint_prompt.py prompt.txt [--duration 17] [--audio medicion.json]

Devuelve código 1 si hay errores. No sustituye a la revisión de la skill: atrapa lo mecánico
(huecos de plantilla, rejilla de tiempos, límites de tramo sobre palabras, menciones del móvil,
gestos con la mano ocupada, finales imposibles...). Solo biblioteca estándar.
"""
import argparse, difflib, json, re, sys, unicodedata

HEADINGS = re.compile(r"^\[(Generation Goal|Characters|Props|Scene|Audio Reference|Visual Style|Camera|"
                      r"Maintain Consistency|Audio|Stage \d+(?: *\| *[0-9.]+ *[-–] *[0-9.]+ *s)?)\]\s*$")
STAGE = re.compile(r"^\[Stage (\d+)\s*\|\s*([0-9.]+)\s*[-–]\s*([0-9.]+)\s*s\]\s*$", re.M)
NUM = {"0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro", "5": "cinco", "6": "seis",
       "7": "siete", "8": "ocho", "9": "nueve", "10": "diez", "11": "once", "12": "doce",
       "20": "veinte", "30": "treinta", "40": "cuarenta", "50": "cincuenta", "100": "cien"}
TOL = 0.15


def norm(tok):
    tok = unicodedata.normalize("NFD", tok.lower())
    tok = "".join(c for c in tok if unicodedata.category(c) != "Mn")
    tok = re.sub(r"[^a-z0-9]", "", tok)
    return NUM.get(tok, tok)


def tokens(text):
    return [t for t in (norm(x) for x in re.split(r"\s+", text)) if t]


class Report:
    def __init__(self):
        self.items = []

    def add(self, level, msg, line=None):
        self.items.append((level, msg, line))

    def show(self):
        errs = [i for i in self.items if i[0] == "ERROR"]
        warns = [i for i in self.items if i[0] == "AVISO"]
        for lvl, msg, line in self.items:
            loc = f" (línea {line})" if line else ""
            print(f"[{lvl}] {msg}{loc}")
        print(f"\n{len(errs)} errores, {len(warns)} avisos")
        return 1 if errs else 0


def line_of(text, pos):
    return text.count("\n", 0, pos) + 1


def sentences_with(text, rx):
    for m in re.finditer(r"[^.\n]*(?:%s)[^.\n]*" % rx, text, re.I):
        yield m.group(0).strip(), m.start()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prompt")
    ap.add_argument("--duration", type=float)
    ap.add_argument("--audio")
    a = ap.parse_args()
    text = open(a.prompt, encoding="utf-8").read()
    rep = Report()
    audio = json.load(open(a.audio, encoding="utf-8")) if a.audio else None

    # --- 1. caracteres y huecos de plantilla ---
    for m in re.finditer(chr(0x2014), text):
        rep.add("ERROR", "Hay un em dash (U+2014). Usa dos puntos, comas o paréntesis.", line_of(text, m.start()))
    for i, line in enumerate(text.split("\n"), 1):
        s = line.strip()
        if s.startswith("[") and s.endswith("]") and "] " not in s:
            if not HEADINGS.match(s):
                rep.add("ERROR", f"Encabezado desconocido o hueco de plantilla: {s}", i)
                continue
        body = re.sub(r"\{[^{}]*\}", "", line)
        if HEADINGS.match(s):
            continue
        for m in re.finditer(r"\[[^\]]*\]", body):
            rep.add("ERROR", f"Hueco de plantilla sin rellenar: {m.group(0)}", i)

    # --- 2. tramos y rejilla ---
    stages = [(int(m.group(1)), float(m.group(2)), float(m.group(3)), m.start(), m.end()) for m in STAGE.finditer(text)]
    dur = a.duration
    if dur is None:
        m = re.search(r"(\d+(?:\.\d+)?)-second", text)
        dur = float(m.group(1)) if m else None
    prev_end = None
    for n, s, e, _, _ in stages:
        for t, name in ((s, "inicio"), (e, "fin")):
            if abs(t * 2 - round(t * 2)) > 1e-6:
                rep.add("ERROR", f"Tramo {n}: el {name} {t} no cae en la rejilla .00/.50")
        if e - s < 1.0 - 1e-6:
            rep.add("ERROR", f"Tramo {n}: dura menos de 1,00 s ({e - s:.2f} s)")
        if prev_end is None and s != 0:
            rep.add("ERROR", f"El primer tramo debe empezar en 0.00 (empieza en {s})")
        if prev_end is not None and abs(s - prev_end) > 1e-6:
            rep.add("ERROR", f"Tramo {n}: no es consecutivo (el anterior acaba en {prev_end} y este empieza en {s})")
        prev_end = e
    if stages and dur is not None and abs(stages[-1][2] - dur) > 1e-6:
        rep.add("ERROR", f"El último tramo acaba en {stages[-1][2]} y la duración es {dur}")

    # texto de cada tramo
    stage_text = {}
    for idx, (n, s, e, _, end) in enumerate(stages):
        nxt = re.search(r"^\[(?!Stage)[A-Za-z ]+\]\s*$|^\[Stage", text[end:], re.M)
        stage_text[n] = text[end:end + nxt.start()] if nxt else text[end:]

    # --- 3. sincronía con el audio medido ---
    if audio and stages:
        sil = audio.get("silences", [])
        words = audio.get("words") or []
        for n, s, e, _, _ in stages[:-1]:
            ok = any(x["start"] - TOL <= e <= x["end"] + TOL for x in sil)
            if not ok:
                w = next((w for w in words if w["start"] < e < w["end"]), None)
                extra = f" (cae dentro de la palabra «{w['w']}», {w['start']}-{w['end']} s)" if w else ""
                rep.add("ERROR", f"El límite {e} entre los tramos {n} y {n + 1} no cae en una pausa del audio{extra}.")
        if words:
            tw = [(norm(w["w"]), w) for w in words if norm(w["w"])]
            ptr = 0
            for n, s, e, _, _ in stages:
                for fm in re.finditer(r"\{([^{}]+)\}", stage_text.get(n, "")):
                    ft = tokens(fm.group(1))
                    first = last = None
                    p = ptr
                    for tok in ft:
                        hit = None
                        for j in range(p, min(p + 4, len(tw))):
                            if tw[j][0] == tok or difflib.SequenceMatcher(None, tw[j][0], tok).ratio() >= 0.8:
                                hit = j
                                break
                        if hit is not None:
                            first = tw[hit][1] if first is None else first
                            last = tw[hit][1]
                            p = hit + 1
                    if first is None:
                        rep.add("AVISO", f"No pude alinear con el audio la frase {{{fm.group(1)[:40]}...}}; revísala a mano.")
                        continue
                    ptr = p
                    if first["start"] < s - TOL or last["end"] > e + TOL:
                        rep.add("ERROR", f"La frase {{{fm.group(1)[:45]}}} suena de {first['start']} a {last['end']} s y está en el "
                                         f"tramo {n} ({s}-{e}). Cruza el límite del tramo.")

    # --- 4. el aparato: menciones, verbos y priming ---
    dev = list(re.finditer(r"\b(phone|smartphone|cell ?phone|iphone|m[oó]vil)\b", text, re.I))
    if len(dev) > 2:
        rep.add("AVISO", f"El aparato se nombra {len(dev)} veces. Deja una como look de captura y una sola prohibición.")
    for pat in (r"\b(lifts?|lifting|lifted|raises?|raising|lowers?|lowering|holds?|holding|points?|pointing|opens?|opening|taps?)\b[^.\n]{0,25}\b(phone|smartphone)\b",
                r"\b(phone|smartphone)\b[^.\n]{0,25}\b(held|lifted|raised|lowered|opened|pointed)\b"):
        for m in re.finditer(pat, text, re.I):
            rep.add("ERROR", f"Se narra una acción del aparato: «{m.group(0)}». Describe el encuadre, no el aparato.", line_of(text, m.start()))
    for m in re.finditer(r"\b(nobody|no one) (holds|raises)\b|\bholds? up\b", text, re.I):
        rep.add("AVISO", f"«{m.group(0)}» menciona lo que no debe aparecer y puede invitarlo.", line_of(text, m.start()))

    # --- 5. zoom, palabras vacías, ambigüedad ---
    for sent, pos in sentences_with(text, r"\bopens? the zoom\b|\bzoom(?:s|ing)? (?:in|out)\b|\bpush-?ins?\b|\blift and open\b"):
        if not re.search(r"\b(no|never|not|without)\b", sent, re.I):
            rep.add("ERROR", f"Zoom o subida de cámara pedidos: «{sent[:70]}». Por defecto no hay zoom en movimiento.", line_of(text, pos))
    for word in ("ultra realistic", "ultra-realistic", "8k", "masterpiece", "beautiful", "gorgeous", "stunning", "photorealistic"):
        for m in re.finditer(re.escape(word), text, re.I):
            rep.add("ERROR", f"Palabra vacía o de belleza: «{word}».", line_of(text, m.start()))
    for word in ("cinematic", "hdr", "bokeh"):
        for m in re.finditer(r"\b%s\b" % word, text, re.I):
            before = text[max(0, m.start() - 14):m.start()].lower()
            if not re.search(r"\b(no|not|never|without)\b", before):
                rep.add("AVISO", f"«{word}» aparece sin una negación delante. Revísalo.", line_of(text, m.start()))
    for m in re.finditer(r"\b(maybe|possibly|perhaps|might|could be)\b", re.sub(r"\{[^{}]*\}", "", text), re.I):
        rep.add("AVISO", f"Ambigüedad: «{m.group(0)}». Una instrucción definitiva por cosa.", line_of(text, m.start()))
    if re.search(r"\bno bokeh\b", text, re.I) and re.search(r"out[- ]of[- ]focus|strongly out of focus", text, re.I):
        rep.add("AVISO", "«no bokeh» choca con un primer plano desenfocado. Di que el desenfoque viene solo de la cercanía.")

    # --- 6. diálogo ---
    frags = re.findall(r"\{([^{}]+)\}", text)
    if frags and "Dialogue language" not in text:
        rep.add("AVISO", "Hay diálogo pero no aparece «Dialogue language:» con idioma y variedad.")
    seen = {}
    for f in frags:
        k = " ".join(tokens(f))
        seen[k] = seen.get(k, 0) + 1
    for k, c in seen.items():
        if c > 1:
            rep.add("AVISO", f"La frase «{k[:40]}» aparece {c} veces. Cada fragmento va una sola vez.")
    if "@Audio1" in text:
        for m in re.finditer(r"\b(quieter|louder|faster|slower|softer|more quietly|more loudly)\b", re.sub(r"\{[^{}]*\}", "", text), re.I):
            rep.add("AVISO", f"«{m.group(0)}»: con audio exacto, el tono y el volumen los fija el audio, no el prompt.", line_of(text, m.start()))

    # --- 7. manos ocupadas con gestos de mano abierta ---
    flagged = set()
    for hm in re.finditer(r"\b(left|right) hand (?:holds|holding|keeps|is holding)\b (?:a |an |the )?([a-z\- ]{3,30}?)(?:[.,;]| in | at | near | loosely|\n)", text, re.I):
        hand, obj = hm.group(1).lower(), hm.group(2).strip().lower()
        if "microphone" in obj or (hand, obj) in flagged:
            continue
        flagged.add((hand, obj))
        hits = []
        for sent, pos in sentences_with(text, rf"\b{hand} (?:hand|forearm|wrist)"):
            if re.search(r"\b(palm|opens?|open hand|points?|pointing|hops?|sweeps?|pushes|taps?)\b", sent, re.I) \
               and not re.search(r"\b(forearm|wrist|closed|around the|holding the|clicker in)\b", sent, re.I):
                hits.append((sent, pos))
        if hits:
            ej = hits[0][0][:60]
            rep.add("AVISO", f"La mano {hand} sostiene «{obj}» y hace {len(hits)} gestos de mano abierta (por ejemplo: «{ej}...»). "
                             f"Adapta los gestos (antebrazo y muñeca, mano cerrada) o cambia el objeto de mano.", line_of(text, hits[0][1]))

    # --- 8. final con audio pegado al clip ---
    if stages:
        last = stage_text.get(stages[-1][0], "")
        bad = re.search(r"\b(decay|echo tail|tail fades?|fades? out|trails? off|holds? still|afterwards|after that)\b", last, re.I)
        if bad:
            tail = audio.get("tail_silence") if audio else None
            if tail is not None and tail < 0.5:
                rep.add("ERROR", f"El último tramo habla de «{bad.group(0)}» pero el audio termina pegado al final del clip "
                                 f"(cola de {tail:.2f} s). No hay pausa final ni cola de eco medida.")
            elif tail is None:
                rep.add("AVISO", f"El último tramo habla de «{bad.group(0)}». Comprueba que el audio medido lo permite.")

    # --- 8b. objetos que cumplen la misma función ---
    if re.search(r"\bhandheld microphone\b", text, re.I) and re.search(r"\bheadset microphone\b", text, re.I):
        rep.add("AVISO", "Hay un micrófono de mano y otro de diadema a la vez. Un orador suele usar solo uno: confirma con la imagen del primer frame.")

    # --- 9. tamaño ---
    words_n = len(re.findall(r"\w+", text))
    if words_n > 1800:
        rep.add("AVISO", f"El prompt tiene {words_n} palabras. Valora recortar lo que no cambia el resultado.")
    sys.exit(rep.show())


if __name__ == "__main__":
    main()
