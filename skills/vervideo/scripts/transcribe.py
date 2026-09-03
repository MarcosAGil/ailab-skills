"""Transcripcion de audio via OpenRouter (openai/whisper-large-v3-turbo)."""
import base64
import os
import sys

from common import http_post_json

STT_PATH = "/audio/transcriptions"
MODEL = "openai/whisper-large-v3-turbo"


def transcribe(audio_path, api_key, language=None):
    with open(audio_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "model": MODEL,
        "input_audio": {"data": b64, "format": "wav"},
        "response_format": "verbose_json",
        "timestamp_granularities": ["segment", "word"],
        "temperature": 0,
    }
    if language:
        payload["language"] = language

    print("Transcribiendo audio via OpenRouter (whisper-large-v3-turbo)...", file=sys.stderr)
    body = http_post_json(STT_PATH, payload, api_key)

    if "error" in body:
        print(f"AVISO: transcripcion fallo: {body['error']}. Se continua solo con frames.", file=sys.stderr)
        return None

    usage = body.get("usage", {})
    cost = usage.get("cost")
    if cost is not None:
        print(f"Transcripcion: coste aprox ${cost:.4f}", file=sys.stderr)

    return {
        "text": body.get("text", ""),
        "segments": body.get("segments", []),
        "words": body.get("words", []),
        "language": body.get("language"),
        "duration": body.get("duration"),
    }
