"""Utilidades compartidas entre los modos completo y mini de /vervideo."""
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

ENV_PATH = os.path.expanduser("~/.config/openrouter/.env")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

URL_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9+.-]*://")


def load_api_key():
    if "OPENROUTER_API_KEY" in os.environ and os.environ["OPENROUTER_API_KEY"]:
        return os.environ["OPENROUTER_API_KEY"]
    if not os.path.exists(ENV_PATH):
        sys.exit(
            f"No hay API key configurada. Crea {ENV_PATH} con una linea "
            f"OPENROUTER_API_KEY=tu_clave y hazle chmod 600. Configurala "
            f"personalmente desde la terminal; nunca pegues la clave en el chat."
        )
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line.startswith("OPENROUTER_API_KEY="):
                key = line.split("=", 1)[1].strip()
                if key:
                    return key
    sys.exit(f"OPENROUTER_API_KEY vacia o no encontrada en {ENV_PATH}")


def check_binaries():
    missing = [b for b in ("ffmpeg", "ffprobe", "yt-dlp") if not shutil.which(b)]
    if missing:
        sys.exit(
            "Faltan binarios: " + ", ".join(missing) +
            ". Instala con: brew install ffmpeg yt-dlp"
        )


def is_url(source):
    return bool(URL_RE.match(source))


def resolve_source(source, workdir):
    """Devuelve una ruta local al video. Si `source` es una URL publica,
    la descarga con yt-dlp dentro de `workdir`. Si es una ruta local, la
    valida y la devuelve tal cual (no se descarga ni se copia nada)."""
    if not is_url(source):
        path = os.path.expanduser(source)
        if not os.path.exists(path):
            sys.exit(f"No existe el archivo: {path}")
        return path, False

    check_binaries()
    out_tmpl = os.path.join(workdir, "source.%(ext)s")
    print(f"Descargando {source} con yt-dlp...", file=sys.stderr)
    result = subprocess.run(
        [
            "yt-dlp",
            "--no-playlist",
            "-f", "mp4/bestvideo+bestaudio/best",
            "--merge-output-format", "mp4",
            "-o", out_tmpl,
            source,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.exit(
            "yt-dlp no pudo descargar el video (probablemente requiere login "
            "o esta bloqueado por region). Salida:\n" + result.stderr[-2000:]
        )
    downloaded = [f for f in os.listdir(workdir) if f.startswith("source.")]
    if not downloaded:
        sys.exit("yt-dlp termino sin error pero no genero ningun archivo.")
    return os.path.join(workdir, downloaded[0]), True


def get_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    if out.returncode != 0 or not out.stdout.strip():
        sys.exit(f"No se pudo leer la duracion del video (ffprobe): {out.stderr}")
    return float(out.stdout.strip())


def http_post_json(path, payload, api_key, timeout=300):
    import json
    req = urllib.request.Request(
        OPENROUTER_BASE + path,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/MarcosAGil/ailab-skills",
            "X-Title": "vervideo",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        sys.exit(f"HTTP {e.code}: {err_body}")
    except urllib.error.URLError as e:
        sys.exit(f"Fallo de red: {e}")


def make_workdir(out_dir=None):
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        return out_dir
    return tempfile.mkdtemp(prefix="vervideo_")
