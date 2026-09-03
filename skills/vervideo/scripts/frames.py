"""Extraccion de frames por cambio de escena + audio, para el modo mini de /vervideo."""
import os
import re
import subprocess
import sys

SCENE_THRESHOLD = 0.3
SHOWINFO_PTS_RE = re.compile(r"pts_time:(\d+\.?\d*)")


def budget_for_duration(duration):
    if duration <= 30:
        return 30
    if duration <= 60:
        return 40
    if duration <= 180:
        return 60
    if duration <= 600:
        return 80
    return 100


def detect_scene_changes(video_path, threshold=SCENE_THRESHOLD):
    """Devuelve una lista de timestamps (segundos) donde ffmpeg detecta cambio de escena."""
    cmd = [
        "ffmpeg", "-i", video_path,
        "-filter:v", f"select='gt(scene,{threshold})',showinfo",
        "-f", "null", "-",
        "-hide_banner",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    timestamps = [float(m) for m in SHOWINFO_PTS_RE.findall(result.stderr)]
    return sorted(set(timestamps))


def downsample(timestamps, max_count):
    if len(timestamps) <= max_count:
        return timestamps
    step = len(timestamps) / max_count
    return [timestamps[int(i * step)] for i in range(max_count)]


def uniform_timestamps(duration, count):
    if count <= 1:
        return [0.0]
    step = duration / count
    return [round(i * step, 2) for i in range(count)]


def extract_frame(video_path, timestamp, out_path, resolution=512):
    subprocess.run(
        [
            "ffmpeg", "-y", "-ss", f"{timestamp:.3f}", "-i", video_path,
            "-frames:v", "1", "-vf", f"scale={resolution}:-1",
            "-q:v", "3", out_path,
            "-hide_banner", "-loglevel", "error",
        ],
        check=True,
    )


def extract_scene_frames(video_path, workdir, duration, resolution=512, max_frames=None):
    """Extrae un frame por cada cambio de escena detectado (limitado a un
    presupuesto segun duracion). Si no se detecta ningun cambio de escena
    (video muy estatico), cae a muestreo uniforme."""
    budget = max_frames or budget_for_duration(duration)
    sparse_warning = duration > 600

    timestamps = detect_scene_changes(video_path)
    if not timestamps:
        frame_count = min(budget, max(4, int(duration)))
        timestamps = uniform_timestamps(duration, frame_count)
    else:
        # el primer frame (t=0) casi nunca se detecta como "cambio de escena"
        if timestamps[0] > 0.5:
            timestamps = [0.0] + timestamps
        timestamps = downsample(timestamps, budget)

    frames_dir = os.path.join(workdir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    frames = []
    for ts in timestamps:
        mm = int(ts // 60)
        ss = ts % 60
        fname = f"frame_{int(ts*1000):08d}.jpg"
        out_path = os.path.join(frames_dir, fname)
        extract_frame(video_path, ts, out_path, resolution)
        frames.append({"t": ts, "path": out_path, "label": f"{mm:02d}:{ss:05.2f}"})

    return frames, sparse_warning


def extract_hook_microscope(video_path, workdir, duration, resolution=512, fps=2.0):
    """Pasada densa de los primeros 10s (o la duracion total si es menor)."""
    hook_end = min(10.0, duration)
    frame_count = max(1, int(hook_end * fps))
    timestamps = uniform_timestamps(hook_end, frame_count)

    frames_dir = os.path.join(workdir, "hook_frames")
    os.makedirs(frames_dir, exist_ok=True)

    frames = []
    for ts in timestamps:
        mm = int(ts // 60)
        ss = ts % 60
        fname = f"hook_{int(ts*1000):08d}.jpg"
        out_path = os.path.join(frames_dir, fname)
        extract_frame(video_path, ts, out_path, resolution)
        frames.append({"t": ts, "path": out_path, "label": f"{mm:02d}:{ss:05.2f}"})

    return frames


def extract_audio(video_path, workdir):
    audio_path = os.path.join(workdir, "audio.wav")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k",
            audio_path,
            "-hide_banner", "-loglevel", "error",
        ],
        check=True,
    )
    return audio_path


def pacing_metrics(scene_timestamps, duration):
    cuts = len(scene_timestamps)
    cuts_per_min = cuts / (duration / 60) if duration > 0 else 0
    if cuts >= 2:
        gaps = [b - a for a, b in zip(scene_timestamps, scene_timestamps[1:])]
        mean_shot_length = sum(gaps) / len(gaps)
    else:
        mean_shot_length = duration
    return {
        "cuts": cuts,
        "cuts_per_min": round(cuts_per_min, 1),
        "mean_shot_length_s": round(mean_shot_length, 2),
    }
