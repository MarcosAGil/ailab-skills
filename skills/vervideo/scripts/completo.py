#!/usr/bin/env python3
"""vervideo completo: envia el video ENTERO a Gemini 3.6 Flash via OpenRouter
y devuelve una descripcion ultra detallada, enfocada segun --focus.

Uso:
    python3 completo.py <fuente> --focus <clave> [--focus-detalle "texto"] [output.md]

<fuente> puede ser una URL (yt-dlp) o una ruta local.
"""
import argparse
import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import load_api_key, make_workdir, resolve_source, get_duration, http_post_json  # noqa: E402

API_URL_PATH = "/chat/completions"
MODEL = "google/gemini-3.6-flash"

TARGET_BASE64_MAX = 19_000_000
RAW_TARGET_BYTES = int(TARGET_BASE64_MAX * 3 / 4)
MIN_VIDEO_BITRATE = 300_000
AUDIO_BITRATE = 128_000

MIME_BY_EXT = {
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "webm": "video/webm",
    "mpeg": "video/mpeg",
    "m4v": "video/mp4",
}

BASE_STRUCTURE = """Devuelve un informe en Markdown con esta estructura:

## 1. Estetica general
El estilo visual global del video: paleta de color, tipo de iluminacion, grano/textura, tratamiento de color (natural, cinematografico, saturado, desaturado...), ritmo de montaje, y la sensacion/mood general que transmite de principio a fin.

## 2. Transcripcion completa
Todo lo que se dice: voz en off, dialogo, texto hablado. Con marca de tiempo aproximada (mm:ss) por cada intervencion. Indica el tono de voz (susurrada, gritada, calmada, quien habla si hay mas de una voz). Si no hay voz, dilo explicitamente.

## 3. Musica y diseno sonoro
- Banda sonora: genero, instrumentacion, energia, evolucion a lo largo del video, y como se relaciona con la accion en pantalla.
- Efectos de sonido: lista cronologica de cada sonido identificable (ambiente, foley, golpes de edicion, silencios) con marca de tiempo.
Si no hay musica o efectos, dilo explicitamente en vez de omitirlo.

## 4. Desglose de escenas / planos (shot by shot)
Divide el video en todos los planos o escenas que identifiques, con marca de tiempo de inicio y fin de cada uno. Para cada plano describe:
- Que ocurre (accion, personajes, objetos, movimiento)
- Personajes: aspecto fisico, vestuario, expresion, actuacion
- Encuadre y composicion (tipo de plano, angulo de camara, regla de tercios, simetria...)
- Movimiento de camara (fijo, paneo, zoom, handheld, dolly...)
- Iluminacion y color de ese plano concreto
- Texto en pantalla, si lo hay (transcribelo literalmente)
- Transicion de entrada y salida hacia el siguiente plano

## 5. Resumen narrativo
Un parrafo final que cuente la historia o el mensaje del video de principio a fin, como si se lo explicaras a alguien que no ha visto absolutamente nada."""

FOCUS_EMPHASIS = {
    "estetica": "PRIORIDAD: la seccion 1 (Estetica general) debe ser la mas extensa y detallada del informe. Profundiza en paleta exacta, temperatura de color, contraste, grano, tratamiento (LUT aparente), composicion y luz de cada plano relevante. Las demas secciones pueden ser mas breves.",
    "personajes": "PRIORIDAD: dentro de la seccion 4 (Desglose de escenas), profundiza al maximo en los personajes de cada plano: fisico, vestuario, expresion facial, lenguaje corporal, actuacion, continuidad entre planos. Las demas secciones pueden ser mas breves.",
    "camara": "PRIORIDAD: dentro de la seccion 4 (Desglose de escenas), profundiza al maximo en la direccion de fotografia: tipo de plano exacto, angulo, altura de camara, lente aparente, movimiento (paneo/tilt/dolly/handheld/gimbal), velocidad del movimiento, y como se conecta cada plano con el siguiente a nivel de raccord. Las demas secciones pueden ser mas breves.",
    "audio": "PRIORIDAD: la seccion 3 (Musica y diseno sonoro) debe ser la mas extensa y detallada del informe, con timestamps precisos de cada elemento sonoro, y la seccion 2 (Transcripcion) debe incluir matices de entonacion y prosodia. Las demas secciones pueden ser mas breves.",
    "general": "",
}


def build_prompt(focus_key, focus_detalle):
    emphasis = FOCUS_EMPHASIS.get(focus_key, "")
    if focus_key == "otro" and focus_detalle:
        emphasis = f"PRIORIDAD: el usuario quiere que te centres especialmente en esto: {focus_detalle}. Dale a esa dimension la mayor extension y detalle del informe. Las demas secciones pueden ser mas breves."
    parts = [
        "Vas a analizar este video como si fueras los ojos y los oidos de alguien que no puede verlo. Tu descripcion es el unico acceso que esa persona va a tener al video: si te dejas algo fuera, para ella no existe. Por eso necesito el maximo nivel de detalle posible, sin resumir ni generalizar.",
    ]
    if emphasis:
        parts.append(emphasis)
    parts.append(BASE_STRUCTURE)
    parts.append(
        "Se exhaustivo y literal. No inventes ni asumas nada que no puedas ver u oir "
        "con claridad: si algo es ambiguo o dudoso, dilo como \"posible\" o \"no se "
        "aprecia con claridad\" en vez de rellenar el hueco. Responde en espanol de Espana."
    )
    return "\n\n".join(parts)


def compress_for_upload(path, workdir):
    duration = get_duration(path)
    target_bits = RAW_TARGET_BYTES * 8 * 0.9
    video_bitrate = max(MIN_VIDEO_BITRATE, int(target_bits / duration) - AUDIO_BITRATE)

    if video_bitrate > 900_000:
        scale = "1280:-2"
    elif video_bitrate > 400_000:
        scale = "854:-2"
    else:
        scale = "640:-2"

    out_path = os.path.join(workdir, "vervideo_compressed.mp4")
    for _ in range(2):
        subprocess.run(
            ["ffmpeg", "-y", "-i", path,
             "-vf", f"scale={scale}",
             "-c:v", "libx264", "-b:v", str(video_bitrate),
             "-maxrate", str(int(video_bitrate * 1.2)), "-bufsize", str(video_bitrate * 2),
             "-preset", "medium",
             "-c:a", "aac", "-b:a", str(AUDIO_BITRATE),
             out_path, "-hide_banner", "-loglevel", "error"],
            check=True,
        )
        if os.path.getsize(out_path) <= RAW_TARGET_BYTES * 1.1:
            return out_path
        video_bitrate = max(MIN_VIDEO_BITRATE, int(video_bitrate * 0.6))
        scale = "854:-2" if scale == "1280:-2" else "640:-2"
    return out_path


def video_to_data_url(path):
    ext = os.path.splitext(path)[1].lower().lstrip(".")
    mime = MIME_BY_EXT.get(ext, "video/mp4")
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def main():
    parser = argparse.ArgumentParser(description="Analiza un video completo con Gemini 3.6 Flash via OpenRouter")
    parser.add_argument("source", help="URL o ruta local del video")
    parser.add_argument("--focus", default="general",
                         choices=["estetica", "personajes", "camara", "audio", "general", "otro"])
    parser.add_argument("--focus-detalle", default="", help="Descripcion libre cuando --focus otro")
    parser.add_argument("output_path", nargs="?", default=None)
    args = parser.parse_args()

    api_key = load_api_key()
    workdir = make_workdir()
    video_path, downloaded = resolve_source(args.source, workdir)

    if args.output_path:
        out_path = args.output_path
    else:
        stem = os.path.splitext(os.path.basename(video_path if not downloaded else args.source.rstrip("/").split("/")[-1] or "video"))[0]
        base_dir = os.path.dirname(video_path) if not downloaded else os.getcwd()
        out_path = os.path.join(base_dir or ".", f"{stem}.analisis.md")

    raw_size = os.path.getsize(video_path)
    if raw_size > RAW_TARGET_BYTES:
        print(f"Video pesa {raw_size/1e6:.1f} MB, comprimiendo antes de enviar...", file=sys.stderr)
        send_path = compress_for_upload(video_path, workdir)
        print(f"Comprimido a {os.path.getsize(send_path)/1e6:.1f} MB", file=sys.stderr)
    else:
        send_path = video_path

    print("Codificando video en base64...", file=sys.stderr)
    data_url = video_to_data_url(send_path)

    prompt = build_prompt(args.focus, args.focus_detalle)

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "video_url", "video_url": {"url": data_url}},
                ],
            }
        ],
        "temperature": 0.2,
        "max_tokens": 16000,
    }

    print("Enviando a Gemini 3.6 Flash via OpenRouter (puede tardar 1-3 min)...", file=sys.stderr)
    body = http_post_json(API_URL_PATH, payload, api_key)

    if "error" in body:
        sys.exit(f"Error de la API: {body['error']}")

    text = body["choices"][0]["message"]["content"]
    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    cost = prompt_tokens * 1.5 / 1e6 + completion_tokens * 7.5 / 1e6

    with open(out_path, "w") as f:
        f.write(text)

    print(f"Guardado en {out_path}", file=sys.stderr)
    print(
        f"Tokens: prompt={prompt_tokens} completion={completion_tokens} "
        f"total={usage.get('total_tokens')} (coste aprox ${cost:.4f})",
        file=sys.stderr,
    )
    print(out_path)


if __name__ == "__main__":
    main()
