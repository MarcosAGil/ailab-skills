#!/usr/bin/env python3
"""Mide un audio para sincronizar un prompt de vídeo.

Salida (JSON): duración, silencios, inicio y fin de la voz, cola de silencio al final y,
si hay `whisper` instalado, las palabras con sus tiempos.

Uso:
    python3 medir_audio.py audio.mp3 [--language es] [--noise -35] [--min 0.25] [--out medicion.json]

Solo usa la biblioteca estándar. Necesita ffmpeg y ffprobe en el PATH. whisper es opcional.
Los tiempos de palabra de un transcriptor automático son orientativos (la primera palabra suele
salir con tiempo 0); por eso se corrigen con los silencios medidos.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def need(tool):
    if not shutil.which(tool):
        sys.exit(f"Falta {tool} en el PATH. Instálalo (por ejemplo: brew install ffmpeg).")


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    try:
        return float(r.stdout.strip())
    except ValueError:
        sys.exit("No se pudo leer la duración del audio.")


def silences(path, noise_db, min_d, total):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-af",
             f"silencedetect=noise={noise_db}dB:d={min_d}", "-f", "null", "-"])
    out, start = [], None
    for line in r.stderr.splitlines():
        m = re.search(r"silence_start: (-?[0-9.]+)", line)
        if m:
            start = max(0.0, float(m.group(1)))
            continue
        m = re.search(r"silence_end: ([0-9.]+)", line)
        if m and start is not None:
            end = float(m.group(1))
            out.append({"start": round(start, 3), "end": round(end, 3), "dur": round(end - start, 3)})
            start = None
    if start is not None:  # silencio que llega hasta el final
        out.append({"start": round(start, 3), "end": round(total, 3), "dur": round(total - start, 3)})
    return out


def words(path, language):
    if not shutil.which("whisper"):
        return None
    with tempfile.TemporaryDirectory() as tmp:
        cmd = ["whisper", path, "--model", "small", "--word_timestamps", "True",
               "--output_format", "json", "--output_dir", tmp]
        if language:
            cmd += ["--language", language]
        run(cmd)
        name = os.path.splitext(os.path.basename(path))[0] + ".json"
        p = os.path.join(tmp, name)
        if not os.path.exists(p):
            return None
        data = json.load(open(p, encoding="utf-8"))
    res = []
    for seg in data.get("segments", []):
        for w in seg.get("words", []):
            res.append({"w": w["word"].strip(), "start": round(w["start"], 3), "end": round(w["end"], 3)})
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--language", default="es")
    ap.add_argument("--noise", type=float, default=-35)
    ap.add_argument("--min", type=float, default=0.25, dest="min_d")
    ap.add_argument("--out")
    a = ap.parse_args()
    need("ffprobe"); need("ffmpeg")
    total = duration(a.audio)
    sil = silences(a.audio, a.noise, a.min_d, total)
    voice_start = sil[0]["end"] if sil and sil[0]["start"] <= 0.01 else 0.0
    voice_end = sil[-1]["start"] if sil and abs(sil[-1]["end"] - total) < 0.05 else total
    ws = words(a.audio, a.language)
    if ws:
        for w in ws:  # corrige el arranque con el silencio medido
            if w["start"] < voice_start:
                w["start"] = round(voice_start, 3)
            if w["end"] < w["start"]:
                w["end"] = w["start"]
    res = {
        "file": os.path.basename(a.audio),
        "duration": round(total, 3),
        "voice_start": round(voice_start, 3),
        "voice_end": round(voice_end, 3),
        "tail_silence": round(total - voice_end, 3),
        "silences": sil,
        "words": ws,
        "note": "Tiempos de palabra aproximados; manda el texto literal del usuario. Silencios: ruido < %s dB durante %s s." % (a.noise, a.min_d),
    }
    txt = json.dumps(res, ensure_ascii=False, indent=2)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(txt)
    print(txt)


if __name__ == "__main__":
    main()
