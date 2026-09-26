"""
Genera audio mp3 con Piper (sintesi vocale open source, gira sul computer).
Lo lancia scripts/audio.ts: non serve usarlo a mano.

Requisiti (una volta sola):  pip install piper-tts lameenc

Legge da stdin una riga JSON per frase: {"text": "...", "out": "/percorso/file.mp3"}
e per ognuna scrive su stdout "ok<TAB>percorso" oppure "err<TAB>percorso<TAB>motivo".
"""
import argparse
import io
import json
import re
import sys
import urllib.parse
import urllib.request
import wave
from pathlib import Path

VOICES_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


def ensure_voice(name: str, data_dir: Path) -> Path:
    """Scarica il modello della voce (una volta sola) e ne restituisce il percorso."""
    model = data_dir / f"{name}.onnx"
    config = data_dir / f"{name}.onnx.json"
    if model.exists() and config.exists():
        return model
    # es. pt_PT-tugão-medium → pt/pt_PT/tugão/medium/pt_PT-tugão-medium.onnx
    lang_code, voice, quality = name.split("-", 2)
    family = lang_code.split("_")[0]
    data_dir.mkdir(parents=True, exist_ok=True)
    for target in (model, config):
        rel = f"{family}/{lang_code}/{voice}/{quality}/{target.name}"
        url = f"{VOICES_URL}/{urllib.parse.quote(rel)}?download=true"
        print(f"info\tscarico {target.name}…", flush=True)
        with urllib.request.urlopen(url) as r, open(target, "wb") as f:
            f.write(r.read())
    return model


def to_mp3(wav_bytes: bytes, bitrate: int) -> bytes:
    import lameenc

    with wave.open(io.BytesIO(wav_bytes), "rb") as w:
        rate, channels, pcm = w.getframerate(), w.getnchannels(), w.readframes(w.getnframes())
    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(rate)
    enc.set_channels(channels)
    enc.set_quality(2)  # 2 = alta qualità
    return bytes(enc.encode(pcm) + enc.flush())


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--voice", required=True)
    p.add_argument("--length-scale", type=float, default=1.0)
    p.add_argument("--bitrate", type=int, default=48)
    p.add_argument("--data-dir", default=".piper-voices")
    args = p.parse_args()

    try:
        from piper import PiperVoice, SynthesisConfig
        import lameenc  # noqa: F401
    except ImportError:
        print("fatal\tManca Piper: installa con  pip install piper-tts lameenc", flush=True)
        sys.exit(1)

    voice = PiperVoice.load(ensure_voice(args.voice, Path(args.data_dir)))
    cfg = SynthesisConfig(length_scale=args.length_scale)

    # Le frasi arrivano in UTF-8 anche su Windows (lì la codifica di sistema storpierebbe gli accenti)
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")

    for line in sys.stdin:
        if not line.strip():
            continue
        job = json.loads(line)
        # "Ã" seguito da un altro carattere è il segno tipico di un testo UTF-8 letto male:
        # meglio un errore chiaro che un audio che dice "copyright" al posto di "é"
        if re.search(r"Ã[\u0080-\u00bf]", job["text"]):
            print(f"err\t{job['out']}\ttesto con codifica storpiata, audio non generato", flush=True)
            continue
        try:
            buf = io.BytesIO()
            with wave.open(buf, "wb") as w:
                voice.synthesize_wav(job["text"], w, syn_config=cfg)
            out = Path(job["out"])
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(to_mp3(buf.getvalue(), args.bitrate))
            print(f"ok\t{job['out']}", flush=True)
        except Exception as e:  # una frase che fallisce non ferma le altre
            print(f"err\t{job['out']}\t{e}", flush=True)


if __name__ == "__main__":
    main()
