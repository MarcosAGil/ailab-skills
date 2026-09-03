"""Genera el report.md (modo mini) con marcadores pendientes para que el agente
los rellene tras leer los frames y la transcripcion."""
import datetime
import os


PENDING = "<!-- pending agent fill: {hint} -->"


def format_transcript(transcript):
    if not transcript:
        return "_Sin transcripcion disponible (sin captions y sin transcripcion por Whisper)._"
    segments = transcript.get("segments") or []
    if not segments:
        text = transcript.get("text", "").strip()
        return text or "_Sin transcripcion disponible._"
    lines = []
    for seg in segments:
        start = seg.get("start", 0)
        mm, ss = int(start // 60), start % 60
        lines.append(f"- `{mm:02d}:{ss:05.2f}` {seg.get('text', '').strip()}")
    return "\n".join(lines)


def format_frame_list(frames, label):
    lines = [f"### {label}"]
    for fr in frames:
        lines.append(f"- `t={fr['label']}` {fr['path']}")
    return "\n".join(lines)


def write_report(out_path, *, title, source, intent, duration, scene_frames,
                  hook_frames, transcript, pacing, sparse_warning):
    fm = [
        "---",
        f"title: \"{title}\"",
        f"source: \"{source}\"",
        "mode: mini",
        f"intent: \"{intent or 'resumen general'}\"",
        f"duration_s: {round(duration, 1)}",
        f"generated: {datetime.datetime.now().isoformat(timespec='seconds')}",
        f"cuts: {pacing['cuts']}",
        f"cuts_per_min: {pacing['cuts_per_min']}",
        f"mean_shot_length_s: {pacing['mean_shot_length_s']}",
        f"sparse_scan: {'true' if sparse_warning else 'false'}",
        "---",
        "",
        f"# {title}",
        "",
        "## TL;DR",
        PENDING.format(hint="3-5 bullets a traves de la lente del intent de arriba"),
        "",
        "## Momentos clave",
        PENDING.format(hint="5-10 bullets con timestamp (t=mm:ss)"),
        "",
        "## Hook microscope (0-10s)",
        PENDING.format(hint="analisis frame a frame de los primeros 10s: cambio visual x lo que se dice; identifica el patron de hook (pregunta, afirmacion contraria, in-medias-res, demo-first...)"),
        "",
        "## Perfil editorial",
        PENDING.format(hint="resumen de estilo en una linea, inferido de los numeros de pacing + frames"),
        "",
        f"Cortes: {pacing['cuts']} | Cortes/min: {pacing['cuts_per_min']} | Duracion media de plano: {pacing['mean_shot_length_s']}s",
        "",
        "## Momentos citables",
        PENDING.format(hint="top 3-5 frases contundentes de la transcripcion"),
        "",
        "## Entidades mencionadas",
        PENDING.format(hint="personas, marcas, herramientas, lugares"),
        "",
        "## Conceptos",
        PENDING.format(hint="frameworks, ideas o patrones nombrados"),
        "",
        "## Transcripcion",
        format_transcript(transcript),
        "",
        "## Frames analizados",
        format_frame_list(scene_frames, "Frames por cambio de escena"),
        "",
        format_frame_list(hook_frames, "Hook microscope (0-10s, densidad alta)"),
        "",
    ]
    if sparse_warning:
        fm.insert(fm.index("") + 1, "> AVISO: video largo, escaneo disperso. Considera re-ejecutar con --start/--end sobre el tramo relevante.")

    with open(out_path, "w") as f:
        f.write("\n".join(fm))
