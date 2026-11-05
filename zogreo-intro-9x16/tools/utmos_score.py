"""Score audition takes for naturalness with UTMOS22 (strong learner), a MOS predictor.

Usage: python utmos_score.py <speechmos_dir> <checkpoint.pt> <wav> [<wav> ...]
Prints one JSON line per file: {"file", "mos"}. A predictor, not a listener: it ranks
candidates, it does not certify that a take sounds good.
"""
import json
import sys

import soundfile as sf
import torch

sys.path.insert(0, sys.argv[1])
from speechmos.utmos22.strong.model import UTMOS22Strong  # noqa: E402

model = UTMOS22Strong()
model.load_state_dict(torch.load(sys.argv[2], map_location="cpu"))
model.eval()
for path in sys.argv[3:]:
    wav, sr = sf.read(path, dtype="float32", always_2d=True)
    wave = torch.from_numpy(wav.mean(axis=1)).unsqueeze(0)
    with torch.no_grad():
        mos = float(model(wave, sr).mean())
    print(json.dumps({"file": path, "mos": round(mos, 3)}), flush=True)
