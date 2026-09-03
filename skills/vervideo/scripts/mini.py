#!/usr/bin/env python3
"""vervideo mini: frames por cambio de escena + hook microscope (0-10s) +
transcripcion via OpenRouter (whisper-large-v3-turbo). Genera report.md con
marcadores pendientes para que el agente los rellene tras leer los frames.

Uso:
    python3 mini.py <fuente> [--intent "texto"] [--out-dir DIR] [--max-frames N]
                     [--resolution W] [--language es] [--no-whisper]
"""
import argparse
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import load_api_key, check_binaries, make_workdir, resolve_source, get_duration  # noqa: E402
import frames as frames_mod  # noqa: E402
import transcribe as transcribe_mod  # noqa: E402
import report as report_mod  # noqa: E402


def slugify(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "video"


def main():
    parser = argparse.ArgumentParser(description="Modo mini de /vervideo: frames + transcripcion via OpenRouter")
    parser.add_argument("source", help="URL o ruta local del video")
    parser.add_argument("--intent", default="", help="Por que se ve este video / que pregunta responde")
    parser.add_argument("--out-dir", default=None)
    parser.add_argument("--max-frames", type=int, default=None)
    parser.add_argument("--resolution", type=int, default=512)
    parser.add_argument("--language", default=None, help="Codigo ISO-639-1 para forzar idioma de transcripcion")
    parser.add_argument("--no-whisper", action="store_true", help="No transcribir, solo frames")
    args = parser.parse_args()

    check_binaries()
    workdir = make_workdir(args.out_dir)
    video_path, downloaded = resolve_source(args.source, workdir)
    duration = get_duration(video_path)

    if duration > 600:
        print(f"AVISO: video de {duration/60:.1f} min, escaneo disperso. "
              f"Considera pedir un tramo concreto.", file=sys.stderr)

    print("Detectando cambios de escena y extrayendo frames...", file=sys.stderr)
    scene_frames, sparse_warning = frames_mod.extract_scene_frames(
        video_path, workdir, duration, resolution=args.resolution, max_frames=args.max_frames,
    )
    print(f"{len(scene_frames)} frames extraidos.", file=sys.stderr)

    print("Microscopeando los primeros 10s...", file=sys.stderr)
    hook_frames = frames_mod.extract_hook_microscope(video_path, workdir, duration, resolution=args.resolution)

    scene_timestamps = [f["t"] for f in scene_frames]
    pacing = frames_mod.pacing_metrics(scene_timestamps, duration)

    transcript = None
    if not args.no_whisper:
        api_key = load_api_key()
        audio_path = frames_mod.extract_audio(video_path, workdir)
        transcript = transcribe_mod.transcribe(audio_path, api_key, language=args.language)
    else:
        print("Transcripcion desactivada (--no-whisper). Solo frames.", file=sys.stderr)

    title_source = args.source if downloaded else os.path.basename(video_path)
    title = os.path.splitext(os.path.basename(title_source))[0] or "video"

    report_path = os.path.join(workdir, "report.md")
    report_mod.write_report(
        report_path,
        title=title,
        source=args.source,
        intent=args.intent,
        duration=duration,
        scene_frames=scene_frames,
        hook_frames=hook_frames,
        transcript=transcript,
        pacing=pacing,
        sparse_warning=sparse_warning,
    )

    result = {
        "workdir": workdir,
        "report_path": report_path,
        "duration_s": duration,
        "scene_frames": scene_frames,
        "hook_frames": hook_frames,
        "pacing": pacing,
        "sparse_warning": sparse_warning,
        "has_transcript": transcript is not None,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
