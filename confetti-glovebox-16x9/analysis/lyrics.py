"""Parse lyrics.txt into sections and lines with stable ids. Shared by the alignment and timing scripts."""
import re
from pathlib import Path

# header keyword -> (section id, line id prefix). Hooks are numbered in order of appearance.
PREFIX = {"intro": "in", "verse1": "v1", "verse2": "v2", "verse3": "v3", "hook1": "h1", "hook2": "h2", "hook3": "h3",
          "prehook": "ph", "bridge": "br", "outro": "out"}


def norm_word(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'").replace("“", "").replace("”", ""))


def parse(path: Path):
    sections, hooks = [], 0
    cur = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        s = raw.strip()
        if not s:
            continue
        m = re.match(r"\[(.+?)(?:\|(.*))?\]$", s)
        if m:
            name = m.group(1).strip().lower()
            if "hook" in name and "pre" not in name:
                hooks += 1
                sid = f"hook{hooks}"
            elif "pre" in name:
                sid = "prehook"
            else:
                sid = re.sub(r"[^a-z0-9]", "", name)
            cur = {"id": sid, "label": m.group(1).strip(), "direction": (m.group(2) or "").strip(), "lines": []}
            sections.append(cur)
            continue
        idx = len(cur["lines"]) + 1
        cur["lines"].append({"id": f"{PREFIX[cur['id']]}.{idx:02d}", "section": cur["id"], "index": idx - 1, "text": s,
                             "words": [w for w in (norm_word(x) for x in s.replace("-", " ").split()) if w]})
    return sections


if __name__ == "__main__":
    secs = parse(Path(__file__).resolve().parent.parent / "lyrics.txt")
    for s in secs:
        print(s["id"], len(s["lines"]))
    print("total lines", sum(len(s["lines"]) for s in secs))
