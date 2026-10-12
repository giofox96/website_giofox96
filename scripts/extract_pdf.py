"""Extract project images from the portfolio PDF into src/content/projects/<slug>/.

Usage: python3 scripts/extract_pdf.py source/portfolio-2025.pdf

Each entry renders a region of a page (the bounding box of an embedded image,
or an explicit rectangle) so vector labels drawn on top stay in the picture.
Spreads split across two facing pages are stitched back together.
Workflow steps are cut from the raw raster without the PDF's label boxes;
the step names live in each project's index.md.
"""
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "src" / "content" / "projects"
MAX_PX = 2000      # long side of saved images
MAX_DPI = 330
PAGE_W = 595.276


def bbox(page, xref):
    for info in page.get_image_info(xrefs=True):
        if info["xref"] == xref:
            return pymupdf.Rect(info["bbox"]) & page.rect
    raise KeyError(f"xref {xref} not on page {page.number + 1}")


def render(page, rect, long_px=MAX_PX):
    dpi = min(MAX_DPI, long_px / (max(rect.width, rect.height) / 72))
    pix = page.get_pixmap(clip=rect, matrix=pymupdf.Matrix(dpi / 72, dpi / 72), alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def region(doc, pno, area):
    page = doc[pno - 1]
    if isinstance(area, int):
        rect = bbox(page, area) + (1, 1, -1, -1)  # drop the hairline at the image edge
    else:
        rect = pymupdf.Rect(area) & page.rect
    return render(page, rect)


def spread(doc, left, right):
    """left/right: (page, xref) or (page, rect) for the two halves of a spread."""
    a, b = (doc[p - 1] for p in (left[0], right[0]))
    # Trim the page edges where the halves meet so the seam does not show.
    ra = bbox(a, left[1]) + (1, 1, -2, -1) if isinstance(left[1], int) else pymupdf.Rect(left[1])
    rb = bbox(b, right[1]) + (2, 1, -1, -1) if isinstance(right[1], int) else pymupdf.Rect(right[1])
    width_pt = ra.width + rb.width
    dpi = min(MAX_DPI, MAX_PX / (width_pt / 72))
    ims = []
    for page, rect in ((a, ra), (b, rb)):
        pix = page.get_pixmap(clip=rect, matrix=pymupdf.Matrix(dpi / 72, dpi / 72), alpha=False)
        ims.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    h = min(i.height for i in ims)
    out = Image.new("RGB", (sum(i.width for i in ims), h), "white")
    x = 0
    for i in ims:
        out.paste(i.crop((0, 0, i.width, h)), (x, 0))
        x += i.width
    return out


def raw(doc, xref):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.alpha or pix.colorspace.n != 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def trim(im, pad=24, thresh=242):
    grey = im.convert("L").point(lambda v: 255 if v < thresh else 0)
    box = grey.getbbox()
    if not box:
        return im
    l, t, r, b = box
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def erase_rules(im, min_run=40, thresh=242):
    """Whiten straight horizontal/vertical hairlines (diagram arrows) with blank space on both sides."""
    im = im.copy()
    g = im.convert("L")
    w, h = g.size
    src = g.load()
    dst = im.load()
    ink = lambda x, y: 0 <= x < w and 0 <= y < h and src[x, y] < thresh
    for horizontal in (True, False):
        outer, inner = (h, w) if horizontal else (w, h)
        for o in range(outer):
            run = 0
            for i in range(inner + 1):
                x, y = (i, o) if horizontal else (o, i)
                thin = i < inner and ink(x, y) and not (
                    (ink(x, y - 3) or ink(x, y + 3)) if horizontal else (ink(x - 3, y) or ink(x + 3, y)))
                if thin:
                    run += 1
                    continue
                if run >= min_run:
                    for j in range(i - run, i):
                        for k in (-1, 0, 1):
                            xx, yy = (j, o + k) if horizontal else (o + k, j)
                            if 0 <= xx < w and 0 <= yy < h:
                                dst[xx, yy] = (255, 255, 255)
                run = 0
    return im


def bands(im, axis, min_gap=20, thresh=242):
    """Split an image into content bands separated by blank rows (axis=1) or columns (axis=0)."""
    grey = im.convert("L")
    w, h = grey.size
    px = grey.load()
    n = h if axis == 1 else w
    filled = []
    for i in range(n):
        if axis == 1:
            row = any(px[x, i] < thresh for x in range(0, w, 2))
        else:
            row = any(px[i, y] < thresh for y in range(0, h, 2))
        filled.append(row)
    out, start, gap = [], None, 0
    for i, f in enumerate(filled + [False] * (min_gap + 1)):
        if f:
            if start is None:
                start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                out.append((start, i - gap + 1))
                start, gap = None, 0
    return [im.crop((0, a, w, b)) if axis == 1 else im.crop((a, 0, b, h)) for a, b in out]


def save(im, slug, name):
    d = ROOT / slug
    d.mkdir(parents=True, exist_ok=True)
    im = im.copy()
    im.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
    im.save(d / f"{name}.jpg", quality=84, optimize=True, progressive=True)
    print(f"{slug}/{name}.jpg {im.width}x{im.height}")


def main(pdf):
    doc = pymupdf.open(pdf)

    # 1 South Bronx, pages 4-9
    s = "south-bronx"
    save(region(doc, 5, 35), s, "cover")
    save(region(doc, 4, 29), s, "site-plan")
    save(region(doc, 4, 27), s, "waterfront")
    save(region(doc, 5, (20, 240, 580, 440)), s, "programme")
    save(region(doc, 6, 57), s, "aerial")
    save(region(doc, 6, 53), s, "park")
    save(region(doc, 6, 55), s, "market-hall")
    save(region(doc, 7, 60), s, "structure")
    save(region(doc, 8, 66), s, "interior")
    save(spread(doc, (8, 64), (9, 72)), s, "section")
    save(region(doc, 9, (20, 40, 575, 420)), s, "joint")
    strip = render(doc[4], pymupdf.Rect(20, 92, 580, 158), long_px=2400)
    for i, im in enumerate(bands(strip, axis=0, min_gap=30), 1):
        save(trim(im, pad=10), s, f"step-{i}")

    # 2 The Sh-Rooms, pages 10-13
    s = "the-sh-rooms"
    save(spread(doc, (12, 97), (13, 102)), s, "cover")
    save(region(doc, 10, 79), s, "exterior")
    save(region(doc, 10, 81), s, "interior")
    save(region(doc, 11, 88), s, "roof-plan")
    save(region(doc, 11, 90), s, "elevation")
    save(region(doc, 11, 92), s, "elevation-blocks")
    grid = raw(doc, 86)
    gx, gy = grid.width / 900, grid.height / 567
    d = ImageDraw.Draw(grid)
    for l, t, r, b in [(5, 0, 135, 80), (5, 188, 135, 266), (5, 370, 140, 442),
                       (318, 15, 440, 75), (318, 190, 440, 266), (318, 372, 448, 445),
                       (624, 0, 750, 78), (624, 190, 750, 260)]:
        d.rectangle((l * gx, t * gy, r * gx, b * gy), fill="white")
    cells = {1: (0, 0), 2: (0, 1), 3: (0, 2), 4: (1, 2), 5: (1, 1), 6: (1, 0), 7: (2, 0), 8: (2, 1)}
    cols, rows = [0, 305, 612, 900], [0, 185, 365, 567]
    for n, (c, r) in cells.items():
        im = grid.crop((cols[c] * gx, rows[r] * gy, cols[c + 1] * gx, rows[r + 1] * gy))
        save(trim(erase_rules(im), pad=16), s, f"step-{n}")

    # 3 Green Patchwork, pages 14-17
    s = "green-patchwork"
    save(region(doc, 14, 107), s, "cover")
    save(region(doc, 14, 108), s, "site-plan")
    save(region(doc, 15, 112), s, "masterplan")
    save(region(doc, 16, (60, 35, 560, 807)), s, "layers")
    save(region(doc, 17, (30, 28, 565, 812)), s, "seasons")

    # 4 Bercy Social Housing, pages 18-23
    s = "bercy-social-housing"
    save(region(doc, 18, 133), s, "cover")
    save(region(doc, 18, 131), s, "site-plan")
    save(region(doc, 19, (30, 30, 565, 370)), s, "analysis")
    save(region(doc, 19, 138), s, "strategy")
    save(spread(doc, (20, 157), (21, 164)), s, "elevation")
    save(spread(doc, (20, 155), (21, 162)), s, "sections")
    save(region(doc, 22, (30, 40, 560, 530)), s, "units-base")
    save(region(doc, 23, (36, 40, 560, 530)), s, "units-variants")
    save(region(doc, 22, (36, 540, 560, 815)), s, "distribution-base")
    save(region(doc, 23, (36, 540, 560, 815)), s, "distribution-variants")

    # 5 Magna Garden, pages 24-27
    s = "magna-garden"
    save(region(doc, 24, 211), s, "cover")
    save(region(doc, 24, 209), s, "site-plan")
    save(region(doc, 25, 216), s, "plan")
    save(spread(doc, (26, 224), (27, 235)), s, "pavilion")
    save(region(doc, 26, (30, 35, 596, 400)), s, "views-1")
    save(region(doc, 27, (0, 35, 560, 400)), s, "views-2")

    # 6 Taranto Tamburi, pages 28-33
    s = "taranto-tamburi"
    save(region(doc, 31, 279), s, "cover")
    save(region(doc, 28, 239), s, "site-plan")
    save(region(doc, 29, (30, 50, 565, 790)), s, "analysis")
    save(region(doc, 30, 275), s, "plan-detail")
    save(region(doc, 30, 273), s, "colonnade")
    save(region(doc, 31, 281), s, "axonometric")
    save(spread(doc, (32, 285), (33, 293)), s, "elevation-1")
    save(spread(doc, (32, 287), (33, 295)), s, "plans")
    save(spread(doc, (32, 289), (33, (0, 611, 560, 810))), s, "elevation-2")

    # 7 MuBi, pages 34-41
    s = "mubi"
    save(spread(doc, (40, 357), (41, 361)), s, "cover")
    save(region(doc, 34, 301), s, "site-plan")
    save(region(doc, 34, 303), s, "dusk")
    save(region(doc, 35, (228, 94, 548, 452)), s, "uses")
    save(region(doc, 35, (34, 492, 294, 638)), s, "facade-1")
    save(region(doc, 35, (301, 492, 560, 638)), s, "facade-2")
    save(region(doc, 35, (35, 662, 294, 807)), s, "section-1")
    save(region(doc, 35, (301, 662, 560, 807)), s, "section-2")
    save(region(doc, 36, 330), s, "terrace")
    save(region(doc, 36, 328), s, "lake")
    save(region(doc, 36, 332), s, "canopy")
    save(region(doc, 37, (35, 52, 560, 807)), s, "building-system")
    save(region(doc, 38, 344), s, "hall")
    save(region(doc, 38, 342), s, "exhibition-1")
    save(region(doc, 38, 340), s, "exhibition-2")
    save(region(doc, 39, 350), s, "reception")
    save(region(doc, 39, 352), s, "exhibition-3")
    save(region(doc, 39, 348), s, "gallery")
    for i, im in enumerate(bands(raw(doc, 315), axis=1, min_gap=25), 1):
        save(trim(im, pad=16), s, f"step-{i}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "source/portfolio-2025.pdf")
