"""Pull everything reusable out of a brochure or one-pager: text, fonts, colours, QR codes, links, images.

    python extract_brochure.py <file> [<file> ...] [--out brand] [--max-pages 12]

Accepts PDF (full extraction), images (palette, QR, copy), .docx/.pptx/.txt/.md (text). Writes to --out:
  text.txt        all copy, with a header per source file
  fonts.json      fonts embedded in the PDF -> family, weight, italic (feed to fonts.py)
  palette.json    dominant colours by share of the page, with a guessed role; confirm by looking at pages/*.png
  qr.json         decoded QR codes (the exact URL a "scan to give/learn" code points to) with page position
  links.json      hyperlinks in the PDF
  pages/ images/  page renders and embedded raster images (logos, photos) for use as real plates in the video
  summary.md      the same, readable

Why this exists: the brochure is the source of truth for words, brand and the call to action. Reading its
real fonts, colours and QR target beats guessing them from a screenshot.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

import cv2
import numpy as np

WEIGHTS = {"thin": 100, "extralight": 200, "ultralight": 200, "light": 300, "regular": 400, "book": 400, "normal": 400,
           "medium": 500, "semibold": 600, "demibold": 600, "bold": 700, "extrabold": 800, "ultrabold": 800,
           "black": 900, "heavy": 900}


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def hex_of(bgr):
    b, g, r = (int(round(v)) for v in bgr)
    return f"#{r:02X}{g:02X}{b:02X}"


# ── text ────────────────────────────────────────────────────────────────────
def office_text(path):
    """Text from .docx / .pptx without extra dependencies."""
    out = []
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if re.match(r"(word/document|ppt/slides/slide\d+)\.xml$", n))
        names.sort(key=lambda n: [int(x) if x.isdigit() else x for x in re.split(r"(\d+)", n)])
        for n in names:
            xml = z.read(n).decode("utf8", "ignore")
            xml = re.sub(r"</(w:p|a:p)>", "\n", xml)
            out.append(re.sub(r"<[^>]+>", "", xml))
    return "\n".join(out)


# ── fonts ───────────────────────────────────────────────────────────────────
def parse_fonts(pdf):
    res = run(["pdffonts", str(pdf)])
    fonts, seen = [], set()
    for line in res.stdout.splitlines()[2:]:
        name = line.split()[0] if line.split() else ""
        if not name:
            continue
        base = re.sub(r"^[A-Z]{6}\+", "", name)
        fam_raw, _, style = base.replace(",", "-").partition("-")
        family = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", fam_raw).replace("MT", "").strip()
        s = style.lower()
        italic = "italic" in s or "oblique" in s
        s_clean = re.sub(r"italic|oblique", "", s)
        weight = next((w for k, w in sorted(WEIGHTS.items(), key=lambda kv: -len(kv[0])) if k in s_clean), 400)
        key = (family, weight, italic)
        if key in seen:
            continue
        seen.add(key)
        fonts.append({"pdf_name": base, "family": family, "weight": weight, "italic": italic,
                      "embedded": line.split()[-5] == "yes"})  # columns from the right: ... emb sub uni object gen
    return fonts


# ── colours ─────────────────────────────────────────────────────────────────
def palette(images, k=8):
    """k-means over downscaled pixels of all page renders; returns clusters by share with a role guess."""
    px = []
    for im in images:
        h, w = im.shape[:2]
        s = 220 / max(h, w)
        px.append(cv2.resize(im, (max(1, int(w * s)), max(1, int(h * s))), interpolation=cv2.INTER_AREA).reshape(-1, 3))
    data = np.concatenate(px).astype(np.float32)
    if len(data) > 200000:
        data = data[np.random.default_rng(1).choice(len(data), 200000, replace=False)]
    _, labels, centers = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5), 3, cv2.KMEANS_PP_CENTERS)
    share = np.bincount(labels.ravel(), minlength=k) / len(labels)
    out = []
    for i in np.argsort(-share):
        b, g, r = centers[i]
        mx, mn = max(r, g, b), min(r, g, b)
        out.append({"hex": hex_of(centers[i]), "share": round(float(share[i]), 4),
                    "luminance": round(float(0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, 3),
                    "saturation": round(float((mx - mn) / mx) if mx else 0.0, 3)})
    roles = {"ground": out[0]["hex"]}
    dark = [c for c in out if c["luminance"] < 0.35]
    light = [c for c in out if c["luminance"] > 0.8]
    sat = [c for c in out if c["saturation"] > 0.35 and c["share"] > 0.003]
    if dark: roles["dark_panel_or_ink"] = dark[0]["hex"]
    if light: roles["light_panel"] = light[0]["hex"]
    if sat: roles["most_saturated"] = max(sat, key=lambda c: c["saturation"] * c["share"] ** 0.3)["hex"]  # not necessarily an accent
    return {"clusters": out, "roles_guess": roles,
            "note": "Cluster centres are averages (a gradient reads as its mean), and roles are a guess from pixel statistics. Look at pages/*.png, sample a flat region for the exact hex, and confirm before using."}


# ── QR codes ────────────────────────────────────────────────────────────────
def find_qr(img):
    """Decode QR codes in a page render: whole page first, then overlapping upscaled tiles."""
    det = cv2.QRCodeDetector()
    found = {}
    h, w = img.shape[:2]

    def add(text, pts, ox=0, oy=0, scale=1.0):
        if text and text not in found:
            p = pts.reshape(-1, 2) / scale + [ox, oy]
            found[text] = {"text": text, "page_pos": {"x": round(float(p[:, 0].mean() / w), 3), "y": round(float(p[:, 1].mean() / h), 3)}}

    ok, texts, pts, _ = det.detectAndDecodeMulti(img)
    if ok:
        for t, p in zip(texts, pts):
            add(t, p)
    if not found:
        n, step = 3, 0.5
        tw, th = int(w / (1 + (n - 1) * step)), int(h / (1 + (n - 1) * step))
        for iy in range(n):
            for ix in range(n):
                ox, oy = int(ix * step * tw), int(iy * step * th)
                tile = img[oy:oy + th, ox:ox + tw]
                for sc in (1.0, 2.0):
                    t = cv2.resize(tile, None, fx=sc, fy=sc, interpolation=cv2.INTER_CUBIC) if sc != 1.0 else tile
                    t = cv2.copyMakeBorder(t, 40, 40, 40, 40, cv2.BORDER_CONSTANT, value=(255, 255, 255))
                    text, p, _ = det.detectAndDecode(t)
                    if text:
                        add(text, p - 40, ox, oy, sc)
    return list(found.values())


# ── links ───────────────────────────────────────────────────────────────────
def pdf_links(pdf):
    links = set()
    try:
        from pypdf import PdfReader
        for page in PdfReader(str(pdf)).pages:
            for a in page.get("/Annots") or []:
                a = a.get_object()
                uri = (a.get("/A") or {}).get("/URI")
                if uri:
                    links.add(str(uri))
    except Exception:
        raw = pdf.read_bytes()
        links.update(m.decode("latin1") for m in re.findall(rb"/URI\s*\(([^)]+)\)", raw))
    return sorted(links)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--out", default="brand")
    ap.add_argument("--max-pages", type=int, default=12)
    ap.add_argument("--dpi", type=int, default=150)
    a = ap.parse_args()
    out = Path(a.out)
    (out / "pages").mkdir(parents=True, exist_ok=True)
    (out / "images").mkdir(exist_ok=True)

    text_parts, fonts, links, qrs, renders = [], [], [], [], []
    for f in map(Path, a.files):
        suf = f.suffix.lower()
        header = f"\n===== {f.name} =====\n"
        if suf == ".pdf":
            text_parts.append(header + run(["pdftotext", "-layout", str(f), "-"]).stdout)
            fonts += parse_fonts(f)
            links += pdf_links(f)
            stem = re.sub(r"[^A-Za-z0-9]+", "-", f.stem).strip("-")
            run(["pdftoppm", "-r", str(a.dpi), "-l", str(a.max_pages), "-png", str(f), str(out / "pages" / stem)])
            run(["pdfimages", "-png", "-l", str(a.max_pages), str(f), str(out / "images" / stem)])
        elif suf in (".png", ".jpg", ".jpeg", ".webp"):
            shutil.copy(f, out / "pages" / f.name)
        elif suf in (".docx", ".pptx"):
            text_parts.append(header + office_text(f))
        elif suf in (".txt", ".md", ".html", ".csv"):
            text_parts.append(header + f.read_text(errors="ignore"))
        else:
            print(f"skipped {f.name}: unsupported type {suf} (convert to PDF or paste the text)", file=sys.stderr)

    for im_path in sorted((out / "pages").glob("*")):
        im = cv2.imread(str(im_path))
        if im is None:
            continue
        renders.append(im)
        for q in find_qr(im):
            q["page"] = im_path.name
            qrs.append(q)
    # drop tiny embedded images (icons, masks, 1-px slices); keep logos and photos
    for im_path in sorted((out / "images").glob("*")):
        im = cv2.imread(str(im_path), cv2.IMREAD_UNCHANGED)
        if im is None or min(im.shape[:2]) < 120:
            im_path.unlink()

    pal = palette(renders) if renders else {}
    (out / "text.txt").write_text("".join(text_parts))
    (out / "fonts.json").write_text(json.dumps(fonts, indent=2))
    (out / "palette.json").write_text(json.dumps(pal, indent=2))
    (out / "qr.json").write_text(json.dumps(qrs, indent=2))
    (out / "links.json").write_text(json.dumps(sorted(set(links)), indent=2))

    words = len(re.findall(r"\w+", "".join(text_parts)))
    s = [f"# Brochure extraction: {', '.join(Path(x).name for x in a.files)}", "",
         f"- Text: {words} words (text.txt)",
         f"- Pages rendered: {len(list((out / 'pages').glob('*')))}; embedded images kept: {len(list((out / 'images').glob('*')))}",
         "- Fonts: " + (", ".join(f"{f['family']} {f['weight']}{' italic' if f['italic'] else ''}" for f in fonts) or "none found (outlined text or images)"),
         "- QR codes: " + (", ".join(f"{q['text']} (page {q['page']}, at {q['page_pos']['x']},{q['page_pos']['y']})" for q in qrs) or "none decoded"),
         "- Links: " + (", ".join(sorted(set(links))) or "none")]
    if pal:
        s += ["- Palette (by share): " + ", ".join(f"{c['hex']} {c['share']:.0%}" for c in pal["clusters"][:6]),
              "- Role guesses (confirm by eye): " + ", ".join(f"{k} {v}" for k, v in pal["roles_guess"].items())]
    (out / "summary.md").write_text("\n".join(s) + "\n")
    print("\n".join(s))


if __name__ == "__main__":
    main()
