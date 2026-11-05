"""Make a brochure's fonts available to a HyperFrames project as local @font-face files.

    python fonts.py --from-fonts-json brand/fonts.json [--out-assets assets/fonts] [--css src/fonts.css]
    python fonts.py --family "Cormorant Garamond:300,300i,500" --family "Inter:400,500,600,700"
    python fonts.py ... --subsets latin,latin-ext,arabic     # extra scripts, e.g. Arabic or Greek text on screen

Why local files: HyperFrames resolves only a few bundled families by name (Inter at 400/700/900 only), and
the Google Fonts / jsDelivr CDNs are often blocked in sandboxes. The npm registry is reachable, and
@fontsource packages carry the same open-licence fonts as .woff2 with their unicode-range splits.

Every family is re-declared under an alias ("Inter PV") so the local files always win over a bundled or
system font of the same name. build/fonts-map.json records family -> alias; use the alias in CSS.
Fonts that are not on fontsource (a commercial brand face) are reported, not guessed: pick the nearest
open font deliberately and tell the user.
"""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


def parse_family_arg(s):
    fam, _, spec = s.partition(":")
    out = set()
    for tok in (spec or "400").split(","):
        tok = tok.strip()
        if tok:
            out.add((int(tok.rstrip("i")), tok.endswith("i")))
    return fam.strip(), out


def fetch_package(slug, tmp):
    r = subprocess.run(["npm", "pack", f"@fontsource/{slug}", "--silent", "--pack-destination", str(tmp)], capture_output=True, text=True)
    tgz = next(iter(Path(tmp).glob(f"fontsource-{slug}-*.tgz")), None)
    if r.returncode != 0 or tgz is None:
        return None
    dest = Path(tmp) / slug
    dest.mkdir(exist_ok=True)
    subprocess.run(["tar", "xzf", str(tgz), "-C", str(dest)], check=True)
    return dest / "package"


def faces(pkg, slug, weight, italic):
    css = pkg / f"{weight}{'-italic' if italic else ''}.css"
    if not css.exists():
        return None
    out = []
    for blk in re.findall(r"@font-face\s*\{[^}]*\}", css.read_text()):
        m = re.search(r"url\(\./files/([^)]+?\.woff2)\)", blk)
        ur = re.search(r"unicode-range:\s*([^;]+);", blk)
        if m:
            # file names are <family-slug>-<subset>-<weight>-<style>.woff2; the slug itself may contain hyphens
            sub = re.fullmatch(rf"{re.escape(slug)}-(.+)-\d{{3}}-(?:normal|italic)\.woff2", m.group(1))
            out.append({"file": m.group(1), "range": ur.group(1).strip() if ur else None, "subset": sub.group(1) if sub else "latin"})
    return out


def nearest(avail, want):
    return min(avail, key=lambda w: abs(w - want))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--family", action="append", default=[])
    ap.add_argument("--from-fonts-json")
    ap.add_argument("--out-assets", default="assets/fonts")
    ap.add_argument("--css", default="src/fonts.css")
    ap.add_argument("--map", default="build/fonts-map.json")
    ap.add_argument("--subsets", default="latin,latin-ext")
    ap.add_argument("--alias-suffix", default="PV")
    a = ap.parse_args()
    want_sub = {s.strip() for s in a.subsets.split(",")}

    req = {}
    for f in a.family:
        fam, s = parse_family_arg(f)
        req.setdefault(fam, set()).update(s)
    if a.from_fonts_json:
        for f in json.load(open(a.from_fonts_json)):
            req.setdefault(f["family"], set()).add((f["weight"], f["italic"]))
    if not req:
        ap.error("give --family or --from-fonts-json")

    out_assets, rules, fmap, missing = Path(a.out_assets), [], {}, []
    out_assets.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for fam, styles in sorted(req.items()):
            slug = re.sub(r"[^a-z0-9]+", "-", fam.lower()).strip("-")
            pkg = fetch_package(slug, tmp)
            if pkg is None:
                missing.append(fam)
                continue
            alias = f"{fam} {a.alias_suffix}"
            fmap[fam] = alias
            avail = sorted({int(m.group(1)) for p in pkg.glob("*.css") if (m := re.fullmatch(r"(\d{3})(?:-italic)?\.css", p.name))})
            for weight, italic in sorted(styles):
                w = weight if weight in avail else nearest(avail, weight)
                if w != weight:
                    print(f"  {fam}: weight {weight} not published, using {w}")
                fs = faces(pkg, slug, w, italic) or faces(pkg, slug, w, False)
                if fs is None:
                    print(f"  {fam}: no {w}{' italic' if italic else ''} files, skipped")
                    continue
                kept = [f for f in fs if f["subset"] in want_sub]
                if not kept:
                    print(f"  WARNING {fam} {w}{' italic' if italic else ''}: files exist but none in subsets {sorted(want_sub)} "
                          f"(found {sorted({f['subset'] for f in fs})}); pass --subsets to include them")
                for f in kept:
                    shutil.copy(pkg / "files" / f["file"], out_assets / f["file"])
                    rng = f' unicode-range: {f["range"]};' if f["range"] else ""
                    rules.append(f'@font-face {{ font-family: "{alias}"; font-style: {"italic" if italic else "normal"}; font-weight: {weight}; '
                                 f'src: url("assets/fonts/{f["file"]}") format("woff2");{rng} }}')
    Path(a.css).parent.mkdir(parents=True, exist_ok=True)
    Path(a.css).write_text("\n".join(rules) + ("\n" if rules else ""))
    Path(a.map).parent.mkdir(parents=True, exist_ok=True)
    Path(a.map).write_text(json.dumps(fmap, indent=2))
    print(f"{len(rules)} @font-face rules -> {a.css}; {len(list(out_assets.glob('*.woff2')))} files in {a.out_assets}")
    for fam, alias in fmap.items():
        print(f"  use font-family: \"{alias}\"   (for {fam})")
    for fam in missing:
        print(f"  NOT ON FONTSOURCE: {fam}. Choose the nearest open font on purpose (and tell the user), or get the font files from them.")


if __name__ == "__main__":
    main()
