"""Build the hero terrain: elevation around Locorotondo as a compact binary grid.

Usage: python3 scripts/terrain.py   (writes public/terrain/locorotondo.bin)

Source: Mapzen Terrain Tiles on AWS (terrarium encoding, zoom 14). Data sources include
SRTM and EU-DEM (produced using Copernicus data).

File layout, little-endian:
  8 x float32 header: width, height, min elevation (m), step (m per unit),
                      metres per cell, centre x, centre y (cells), reserved
  width*height x uint16 elevation = min + value * step
"""
import io
import math
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

LAT, LON = 40.7556, 17.3264      # Locorotondo, historic centre
Z = 14
SPAN_X, SPAN_Y = 900, 400        # crop in zoom-14 pixels (~6.5 x 2.9 km)
DOWNSAMPLE = 2
STEP = 0.05
OUT = Path(__file__).resolve().parent.parent / "public" / "terrain" / "locorotondo.bin"


def tile(x, y):
    url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png"
    with urllib.request.urlopen(url) as r:
        a = np.asarray(Image.open(io.BytesIO(r.read())).convert("RGB")).astype(np.float64)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def main():
    n = 2 ** Z
    px = (LON + 180) / 360 * n * 256
    py = (1 - math.asinh(math.tan(math.radians(LAT))) / math.pi) / 2 * n * 256
    x0, y0 = int(px - SPAN_X / 2), int(py - SPAN_Y / 2)
    tx0, ty0 = x0 // 256, y0 // 256
    tx1, ty1 = (x0 + SPAN_X) // 256, (y0 + SPAN_Y) // 256
    mosaic = np.vstack([np.hstack([tile(x, y) for x in range(tx0, tx1 + 1)]) for y in range(ty0, ty1 + 1)])
    ox, oy = x0 - tx0 * 256, y0 - ty0 * 256
    crop = mosaic[oy:oy + SPAN_Y, ox:ox + SPAN_X]
    h = crop.reshape(SPAN_Y // DOWNSAMPLE, DOWNSAMPLE, SPAN_X // DOWNSAMPLE, DOWNSAMPLE).mean(axis=(1, 3))
    mpp = 156543.03392 * math.cos(math.radians(LAT)) / n * DOWNSAMPLE
    lo = float(np.floor(h.min()))
    q = np.round((h - lo) / STEP).astype(np.uint16)
    cx, cy = (px - x0) / DOWNSAMPLE, (py - y0) / DOWNSAMPLE
    # The round historic centre sits on the hilltop: snap to the highest point within ~450 m.
    r = int(450 / mpp)
    yy, xx = np.mgrid[0:h.shape[0], 0:h.shape[1]]
    near = (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r
    cy, cx = np.unravel_index(np.where(near, h, -1e9).argmax(), h.shape)
    cx, cy = float(cx), float(cy)
    lon = (x0 + cx * DOWNSAMPLE) / (n * 256) * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y0 + cy * DOWNSAMPLE) / (n * 256)))))
    print(f"hilltop at {lat:.4f} N, {lon:.4f} E")
    header = np.array([h.shape[1], h.shape[0], lo, STEP, mpp, cx, cy, 0], dtype="<f4")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(header.tobytes() + q.astype("<u2").tobytes())
    print(f"{OUT.name}: {h.shape[1]}x{h.shape[0]} cells, {mpp:.1f} m/cell, {h.min():.0f}-{h.max():.0f} m, "
          f"centre {cx:.0f},{cy:.0f} at {h[int(cy), int(cx)]:.0f} m, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
