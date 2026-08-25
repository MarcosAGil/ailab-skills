#!/usr/bin/env python3
"""Analiza un vídeo local con Gemini vía OpenRouter y genera un informe Markdown.

Uso:
    python3 vervideo.py <ruta_video> [ruta_salida.md]
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from shutil import which

VERSION = "1.0.0"
ENV_PATH = os.path.expanduser("~/.config/openrouter/.env")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-3.6-flash"

TARGET_BASE64_MAX = 19_000_000
RAW_TARGET_BYTES = int(TARGET_BASE64_MAX * 3 / 4)
MIN_VIDEO_BITRATE = 300_000
AUDIO_BITRATE = 128_000

MIME_BY_EXT = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".mpeg": "video/mpeg",
    ".m4v": "video/mp4",
}

PROMPT = """Vas a analizar este vídeo como si fueras los ojos y los oídos de alguien que no puede verlo. Tu descripción es el único acceso que esa persona va a tener al vídeo: si te dejas algo fuera, para ella no existe. Por eso necesito el máximo nivel de detalle posible, sin resumir ni generalizar.

Devuelve un informe en Markdown con esta estructura:

## 1. Estética general
El estilo visual global del vídeo: paleta de color, tipo de iluminación, grano/textura, tratamiento de color (natural, cinematográfico, saturado, desaturado...), ritmo de montaje y la sensación o mood general que transmite de principio a fin.

## 2. Transcripción completa
Todo lo que se dice: voz en off, diálogo y texto hablado. Incluye una marca de tiempo aproximada (mm:ss) por cada intervención. Indica el tono de voz (susurrada, gritada, calmada) y quién habla si hay más de una voz. Si no hay voz, dilo explícitamente.

## 3. Música y diseño sonoro
- Banda sonora: género, instrumentación, energía, evolución a lo largo del vídeo y cómo se relaciona con la acción en pantalla.
- Efectos de sonido: lista cronológica de cada sonido identificable (ambiente, foley, golpes de edición y silencios) con marca de tiempo.
Si no hay música o efectos, dilo explícitamente en vez de omitirlo.

## 4. Desglose de escenas / planos (shot by shot)
Divide el vídeo en todos los planos o escenas que identifiques, con marca de tiempo de inicio y fin de cada uno. Para cada plano describe:
- Qué ocurre (acción, personajes, objetos y movimiento).
- Personajes: aspecto físico, vestuario, expresión y actuación.
- Encuadre y composición (tipo de plano, ángulo de cámara, regla de tercios, simetría...).
- Movimiento de cámara (fijo, paneo, zoom, handheld, dolly...).
- Iluminación y color de ese plano concreto.
- Texto en pantalla, si lo hay (transcríbelo literalmente).
- Transición de entrada y salida hacia el siguiente plano.

## 5. Resumen narrativo
Un párrafo final que cuente la historia o el mensaje del vídeo de principio a fin, como si se lo explicaras a alguien que no ha visto absolutamente nada.

Sé exhaustivo y literal. No inventes ni asumas nada que no puedas ver u oír con claridad: si algo es ambiguo o dudoso, dilo como "posible" o "no se aprecia con claridad" en vez de rellenar el hueco. Responde en español de España."""


def load_api_key():
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if key:
        return key
    if not os.path.exists(ENV_PATH):
        sys.exit(
            f"No hay API key configurada. Configura personalmente {ENV_PATH} "
            "con OPENROUTER_API_KEY y permisos 600. No pegues la clave en el chat."
        )
    with open(ENV_PATH, encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if line.startswith("OPENROUTER_API_KEY="):
                key = line.split("=", 1)[1].strip()
                if key:
                    return key
    sys.exit(f"OPENROUTER_API_KEY está vacía o no existe en {ENV_PATH}")


def get_duration(video_path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", video_path],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0 or not result.stdout.strip():
        sys.exit(f"No se pudo leer la duración del vídeo con ffprobe: {result.stderr.strip()}")
    return float(result.stdout.strip())


def compress_for_upload(video_path, workdir):
    if not which("ffmpeg") or not which("ffprobe"):
        sys.exit("La compresión requiere ffmpeg y ffprobe. Instálalos antes de continuar.")

    duration = get_duration(video_path)
    target_bits = RAW_TARGET_BYTES * 8 * 0.9
    video_bitrate = max(MIN_VIDEO_BITRATE, int(target_bits / duration) - AUDIO_BITRATE)
    if video_bitrate > 900_000:
        scale = "1280:-2"
    elif video_bitrate > 400_000:
        scale = "854:-2"
    else:
        scale = "640:-2"

    output = os.path.join(workdir, "vervideo_compressed.mp4")
    for _attempt in range(2):
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vf", f"scale={scale}",
             "-c:v", "libx264", "-b:v", str(video_bitrate),
             "-maxrate", str(int(video_bitrate * 1.2)),
             "-bufsize", str(video_bitrate * 2), "-preset", "medium",
             "-c:a", "aac", "-b:a", str(AUDIO_BITRATE), output,
             "-hide_banner", "-loglevel", "error"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            sys.exit(f"No se pudo comprimir el vídeo con ffmpeg: {result.stderr.strip()}")
        if os.path.getsize(output) <= RAW_TARGET_BYTES * 1.1:
            return output
        video_bitrate = max(MIN_VIDEO_BITRATE, int(video_bitrate * 0.6))
        scale = "854:-2" if scale == "1280:-2" else "640:-2"
    return output


def video_to_data_url(video_path):
    extension = os.path.splitext(video_path)[1].lower()
    mime = MIME_BY_EXT.get(extension, "video/mp4")
    with open(video_path, "rb") as video_file:
        encoded = base64.b64encode(video_file.read()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def parse_arguments():
    parser = argparse.ArgumentParser(description="Analiza un vídeo con Gemini vía OpenRouter")
    parser.add_argument("--version", action="version", version=f"vervideo {VERSION}")
    parser.add_argument("video_path", help="Ruta del vídeo local")
    parser.add_argument("output_path", nargs="?", default=None, help="Ruta opcional del informe Markdown")
    return parser.parse_args()


def main():
    args = parse_arguments()
    video_path = os.path.abspath(os.path.expanduser(args.video_path))
    if not os.path.isfile(video_path):
        sys.exit(f"No existe el archivo de vídeo: {video_path}")
    extension = os.path.splitext(video_path)[1].lower()
    if extension not in MIME_BY_EXT:
        supported = ", ".join(sorted(MIME_BY_EXT))
        sys.exit(f"Formato no compatible: {extension or '(sin extensión)'}. Usa: {supported}")

    if args.output_path:
        output_path = os.path.abspath(os.path.expanduser(args.output_path))
    else:
        stem = os.path.splitext(os.path.basename(video_path))[0]
        output_path = os.path.join(os.path.dirname(video_path), f"{stem}.analisis.md")

    api_key = load_api_key()
    raw_size = os.path.getsize(video_path)
    if raw_size > RAW_TARGET_BYTES:
        with tempfile.TemporaryDirectory() as workdir:
            print(f"El vídeo pesa {raw_size / 1e6:.1f} MB; comprimiendo una copia temporal...", file=sys.stderr)
            send_path = compress_for_upload(video_path, workdir)
            print(f"Copia comprimida: {os.path.getsize(send_path) / 1e6:.1f} MB", file=sys.stderr)
            data_url = video_to_data_url(send_path)
    else:
        print(f"Codificando vídeo ({raw_size / 1e6:.2f} MB)...", file=sys.stderr)
        data_url = video_to_data_url(video_path)

    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": PROMPT},
                {"type": "video_url", "video_url": {"url": data_url}},
            ],
        }],
        "temperature": 0.2,
        "max_tokens": 16000,
    }
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/MarcosAGil/ailab-skills",
            "X-Title": "AILAB vervideo",
        },
        method="POST",
    )

    print(f"Enviando a {MODEL} vía OpenRouter...", file=sys.stderr)
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        sys.exit(f"OpenRouter respondió HTTP {error.code}: {detail}")
    except urllib.error.URLError as error:
        sys.exit(f"Fallo de red al contactar con OpenRouter: {error}")
    except json.JSONDecodeError as error:
        sys.exit(f"OpenRouter devolvió una respuesta no válida: {error}")

    if "error" in body:
        sys.exit(f"Error de OpenRouter: {body['error']}")
    try:
        report = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        sys.exit(f"La respuesta de OpenRouter no contiene el informe esperado: {error}")
    if not isinstance(report, str) or not report.strip():
        sys.exit("OpenRouter devolvió un informe vacío.")

    usage = body.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0) or 0
    completion_tokens = usage.get("completion_tokens", 0) or 0
    approximate_cost = prompt_tokens * 1.5 / 1e6 + completion_tokens * 7.5 / 1e6

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as output_file:
        output_file.write(report)

    print(f"Guardado en {output_path}", file=sys.stderr)
    print(
        f"Tokens: prompt={prompt_tokens} completion={completion_tokens} "
        f"total={usage.get('total_tokens')} (coste aproximado ${approximate_cost:.4f})",
        file=sys.stderr,
    )
    print(output_path)


if __name__ == "__main__":
    main()
