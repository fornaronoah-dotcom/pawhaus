#!/usr/bin/env python3
"""
Stap 2 — Download originelen (backup) en genereer per product:
  - white/<handle>/<i>.jpg : product uitgeknipt op zuiver wit, vierkant 1200, watermerkvrij
  - tiles/<handle>.jpg     : hoofdproduct op zachte kleurtegel (blauw/geel/oranje, afwisselend)
Schrijft data/manifest.json met de nieuwe mediavolgorde + variant-herkoppeling.

Draaien (vanuit projectroot):
  scripts/photos/.venv/bin/python scripts/photos/2-process.py [--handles a,b,c] [--only-active]
"""
import argparse, json, os, sys, urllib.request
from pathlib import Path
from rembg import remove, new_session
from PIL import Image

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
ORIG = DATA / "originals"
WHITE = DATA / "white"
TILES = DATA / "tiles"
for d in (ORIG, WHITE, TILES):
    d.mkdir(parents=True, exist_ok=True)

CANVAS = 1200
# Zachte merk-tinten, afwisselend per (actief) product: blauw, geel, oranje
COLORS = ["#CFE6E9", "#FFE6A6", "#FFD6C2"]
COLOR_NAMES = ["blauw", "geel", "oranje"]

session = new_session("u2netp")


def fetch(url, dest):
    if dest.exists() and dest.stat().st_size > 0:
        return
    req = urllib.request.Request(url, headers={"User-Agent": "pawhaus-photo/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())


def cutout(src):
    img = Image.open(src).convert("RGBA")
    cut = remove(img, session=session)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    return cut


def place(cut, bg_color, fill):
    scale = (CANVAS * fill) / max(cut.size)
    nw, nh = max(1, int(cut.width * scale)), max(1, int(cut.height * scale))
    cut = cut.resize((nw, nh), Image.LANCZOS)
    bg = Image.new("RGB", (CANVAS, CANVAS), bg_color)
    bg.paste(cut, ((CANVAS - nw) // 2, (CANVAS - nh) // 2), cut)
    return bg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--handles", default="")
    ap.add_argument("--only-active", action="store_true")
    args = ap.parse_args()

    products = json.loads((DATA / "products.json").read_text())
    if args.only_active:
        products = [p for p in products if p["status"] == "ACTIVE"]
    products.sort(key=lambda p: p["handle"])  # stabiele kleur-afwisseling
    wanted = set(h for h in args.handles.split(",") if h) if args.handles else None

    manifest = []
    color_idx = 0
    for p in products:
        h = p["handle"]
        assign_color = COLORS[color_idx % 3]
        assign_name = COLOR_NAMES[color_idx % 3]
        color_idx += 1
        if wanted and h not in wanted:
            continue
        if not p["media"]:
            print(f"– {h}: geen media, overslaan")
            continue

        (ORIG / h).mkdir(parents=True, exist_ok=True)
        (WHITE / h).mkdir(parents=True, exist_ok=True)

        # mediaId -> index, voor variant-herkoppeling
        id_to_index = {m["id"]: i for i, m in enumerate(p["media"])}
        white_files = []
        for i, m in enumerate(p["media"]):
            ext = ".png" if m["url"].split("?")[0].lower().endswith(".png") else ".jpg"
            o = ORIG / h / f"{i}{ext}"
            try:
                fetch(m["url"], o)
            except Exception as e:
                print(f"! {h}[{i}] download faalde: {e}")
                white_files.append(None)
                continue
            cut = cutout(o)
            wpath = WHITE / h / f"{i}.jpg"
            place(cut, "#FFFFFF", 0.82).save(wpath, quality=92)
            white_files.append(str(wpath.relative_to(HERE)))

        # Kleurtegel van de hoofdfoto (eerste media)
        main_o = next((ORIG / h / f for f in os.listdir(ORIG / h)
                       if f.startswith("0.")), None)
        tile_rel = None
        if main_o:
            tile = place(cutout(main_o), assign_color, 0.72)
            tpath = TILES / f"{h}.jpg"
            tile.save(tpath, quality=92)
            tile_rel = str(tpath.relative_to(HERE))

        # Variant-herkoppeling: per variant de index van zijn (eerste) media
        variant_reassoc = []
        for v in p["variants"]:
            idxs = [id_to_index[mid] for mid in v["mediaIds"] if mid in id_to_index]
            if idxs:
                variant_reassoc.append({"variantId": v["id"], "mediaIndex": idxs[0]})

        manifest.append({
            "handle": h,
            "numericId": p["numericId"],
            "productId": p["id"],
            "color": assign_color,
            "colorName": assign_name,
            "oldMediaIds": [m["id"] for m in p["media"]],
            "tile": tile_rel,
            "white": white_files,
            "variantReassoc": variant_reassoc,
        })
        print(f"✓ {h}: {len([w for w in white_files if w])} wit + tegel({assign_name})")

    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nManifest: {len(manifest)} producten → {DATA / 'manifest.json'}")


if __name__ == "__main__":
    main()
