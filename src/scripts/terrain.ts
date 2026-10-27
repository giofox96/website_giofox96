// Contour map from real elevation data (public/terrain/contours.json, see scripts/terrain.py).
// The contour under the pointer is traced in the accent colour; when idle, the traced level sweeps the terrain.
// With data-mode="ascii" on the canvas the same terrain is drawn as a grid of monospace characters.

type Grid = { w: number; h: number; z: Float32Array; min: number; max: number; mpp: number; cx: number; cy: number };
type Seg = (x1: number, y1: number, x2: number, y2: number, level: number) => void;

async function load(src: string): Promise<Grid> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`terrain data: ${res.status}`);
  const j = await res.json();
  const { width: w, height: h, min: lo, step, metresPerCell: mpp } = j;
  const [cx, cy] = j.centre;
  const bin = atob(j.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const q = { length: w * h, at: (i: number) => view.getUint16(i * 2, true) };
  const z = new Float32Array(w * h);
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < z.length; i++) {
    const v = lo + q.at(i) * step;
    z[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { w, h, z, min, max, mpp, cx, cy };
}

/** Box blur, two passes per axis (close to a gaussian). r in cells. */
function smooth(src: Float32Array, w: number, h: number, r: number) {
  const out = Float32Array.from(src);
  if (r <= 0) return out;
  const tmp = new Float32Array(src.length);
  const pass = (a: Float32Array, b: Float32Array, horizontal: boolean) => {
    const n = horizontal ? w : h, m = horizontal ? h : w;
    for (let o = 0; o < m; o++) {
      let acc = 0;
      const at = (i: number) => {
        const c = i < 0 ? 0 : i >= n ? n - 1 : i;
        return horizontal ? a[o * w + c] : a[c * w + o];
      };
      for (let i = -r; i <= r; i++) acc += at(i);
      for (let i = 0; i < n; i++) {
        b[horizontal ? o * w + i : i * w + o] = acc / (2 * r + 1);
        acc += at(i + r + 1) - at(i - r);
      }
    }
  };
  for (let k = 0; k < 2; k++) { pass(out, tmp, true); pass(tmp, out, false); }
  return out;
}

/** Marching squares over every level base + k * step that crosses each cell. */
function trace(z: Float32Array, w: number, h: number, base: number, step: number, one: number | null, seg: Seg) {
  for (let j = 0; j < h - 1; j++) {
    for (let i = 0; i < w - 1; i++) {
      const tl = z[j * w + i], tr = z[j * w + i + 1], br = z[(j + 1) * w + i + 1], bl = z[(j + 1) * w + i];
      const lo = Math.min(tl, tr, br, bl), hi = Math.max(tl, tr, br, bl);
      let k0: number, k1: number;
      if (one !== null) {
        if (one < lo || one > hi) continue;
        k0 = k1 = 0;
      } else {
        k0 = Math.ceil((lo - base) / step);
        k1 = Math.floor((hi - base) / step);
      }
      for (let k = k0; k <= k1; k++) {
        const L = one ?? base + k * step;
        const c = (tl >= L ? 8 : 0) | (tr >= L ? 4 : 0) | (br >= L ? 2 : 0) | (bl >= L ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const T = () => [i + (L - tl) / (tr - tl), j] as const;
        const R = () => [i + 1, j + (L - tr) / (br - tr)] as const;
        const B = () => [i + (L - bl) / (br - bl), j + 1] as const;
        const Lf = () => [i, j + (L - tl) / (bl - tl)] as const;
        const s = (a: readonly [number, number], b: readonly [number, number]) => seg(a[0], a[1], b[0], b[1], L);
        const centre = (tl + tr + br + bl) / 4 >= L;
        switch (c) {
          case 1: case 14: s(Lf(), B()); break;
          case 2: case 13: s(B(), R()); break;
          case 3: case 12: s(Lf(), R()); break;
          case 4: case 11: s(T(), R()); break;
          case 6: case 9: s(T(), B()); break;
          case 7: case 8: s(Lf(), T()); break;
          case 5: if (centre) { s(Lf(), T()); s(B(), R()); } else { s(T(), R()); s(Lf(), B()); } break;
          case 10: if (centre) { s(T(), R()); s(Lf(), B()); } else { s(Lf(), T()); s(B(), R()); } break;
        }
      }
    }
  }
}

export async function mountTerrain(cv: HTMLCanvasElement) {
  const ctx = cv.getContext('2d');
  if (!ctx || !cv.dataset.src) return;
  const g = await load(cv.dataset.src);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Contour interval in metres, smoothing radius in cells; terrain above TINT metres gets a light fill.
  const INTERVAL = 2, SMOOTH = 2, TINT = 400;
  const readout = document.getElementById('elev');
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d')!;
  const mask = document.createElement('canvas');
  mask.width = g.w; mask.height = g.h;
  const mctx = mask.getContext('2d')!;

  const S = smooth(g.z, g.w, g.h, SMOOTH);
  let W = 0, H = 0, dpr = 1, s = 1, ox = 0, oy = 0, vmin = g.min, vmax = g.max;
  let probe: { x: number; y: number } | null = null;
  let raf = 0, visible = true, idleSince = 0;
  let ascii = cv.dataset.mode === 'ascii';
  // Character cell in CSS pixels; JetBrains Mono is about 0.6 em wide.
  // A finer grid on wide screens; phones keep 13 px so the characters stay legible.
  let FS = 13, CW = 8.4, CH = 14;
  const font = (weight: number) => `${weight} ${FS}px "JetBrains Mono", ui-monospace, monospace`;

  const colours = () => {
    const cs = getComputedStyle(root);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    return { ink: v('--ink'), muted: v('--muted'), accent: v('--accent'), surface: v('--surface') };
  };

  const sample = (gx: number, gy: number) => {
    const i = Math.max(0, Math.min(g.w - 2, Math.floor(gx))), j = Math.max(0, Math.min(g.h - 2, Math.floor(gy)));
    const fx = Math.min(1, Math.max(0, gx - i)), fy = Math.min(1, Math.max(0, gy - j));
    const a = S[j * g.w + i], b = S[j * g.w + i + 1], c = S[(j + 1) * g.w + i], d = S[(j + 1) * g.w + i + 1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };

  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    FS = W < 640 ? 13 : 9.5; CW = FS * .646; CH = FS * 1.077;
    for (const c of [cv, base]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    // Cover the canvas with the grid, centred on the high ground.
    s = Math.max(W / (g.w - 1), H / (g.h - 1));
    ox = Math.min(Math.max(g.cx - W / s / 2, 0), g.w - 1 - W / s);
    oy = Math.min(Math.max(g.cy - H / s / 2, 0), g.h - 1 - H / s);
    // Elevation range of the visible part, so the idle sweep never traces a level that is off screen.
    vmin = Infinity; vmax = -Infinity;
    const i0 = Math.floor(ox), i1 = Math.min(g.w - 1, Math.ceil(ox + W / s));
    const j0 = Math.floor(oy), j1 = Math.min(g.h - 1, Math.ceil(oy + H / s));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const v = S[j * g.w + i];
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
  }

  function drawBase() {
    const c = colours();
    const b = bctx;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, W, H);

    // Light accent fill on the high ground.
    const img = mctx.createImageData(g.w, g.h);
    for (let k = 0; k < S.length; k++) if (S[k] >= TINT) img.data[k * 4 + 3] = 255;
    mctx.putImageData(img, 0, 0);
    b.save();
    b.globalAlpha = .1;
    b.imageSmoothingEnabled = true;
    // Mask pixel i is centred on grid node i, like the contour vertices.
    b.drawImage(mask, (-ox - .5) * s, (-oy - .5) * s, g.w * s, g.h * s);
    b.globalCompositeOperation = 'source-in';
    b.globalAlpha = 1;
    b.fillStyle = c.accent;
    b.fillRect(0, 0, W, H);
    b.restore();

    const minor = new Path2D(), major = new Path2D();
    const labels = new Map<string, { x: number; y: number; a: number; L: number }>();
    const every = INTERVAL * 5;
    const start = Math.floor(g.min / INTERVAL) * INTERVAL;
    trace(S, g.w, g.h, start, INTERVAL, null, (x1, y1, x2, y2, L) => {
      const X1 = (x1 - ox) * s, Y1 = (y1 - oy) * s, X2 = (x2 - ox) * s, Y2 = (y2 - oy) * s;
      if ((X1 < -2 && X2 < -2) || (Y1 < -2 && Y2 < -2) || (X1 > W + 2 && X2 > W + 2) || (Y1 > H + 2 && Y2 > H + 2)) return;
      const isMajor = Math.abs(L / every - Math.round(L / every)) < 1e-6;
      const p = isMajor ? major : minor;
      p.moveTo(X1, Y1); p.lineTo(X2, Y2);
      if (isMajor) {
        const mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
        if (mx < 30 || my < 18 || mx > W - 30 || my > H - 18 || (mx > W - 70 && my < 70) || (mx < 90 && my > H - 50)) return;
        const key = `${Math.floor(mx / 190)}:${Math.floor(my / 130)}`;
        if (!labels.has(key)) {
          let a = Math.atan2(Y2 - Y1, X2 - X1);
          if (a > Math.PI / 2) a -= Math.PI; else if (a < -Math.PI / 2) a += Math.PI;
          labels.set(key, { x: mx, y: my, a, L });
        }
      }
    });

    b.lineCap = 'round';
    b.strokeStyle = c.muted; b.globalAlpha = .45; b.lineWidth = .8; b.stroke(minor);
    b.strokeStyle = c.ink; b.globalAlpha = .8; b.lineWidth = 1.3; b.stroke(major);
    b.globalAlpha = 1;

    // Elevation labels on the index contours.
    b.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
    b.textAlign = 'center'; b.textBaseline = 'middle';
    for (const l of labels.values()) {
      b.save(); b.translate(l.x, l.y); b.rotate(l.a);
      b.lineWidth = 4; b.strokeStyle = c.surface; b.strokeText(String(Math.round(l.L)), 0, 0);
      b.fillStyle = c.ink; b.fillText(String(Math.round(l.L)), 0, 0);
      b.restore();
    }

    decor(b, c);
  }

  /** Contour direction as a character: the line runs across the gradient. */
  const glyph = (gx: number, gy: number) => {
    const a = ((Math.atan2(gy, gx) + Math.PI / 2) % Math.PI + Math.PI) % Math.PI;
    return a < Math.PI / 8 || a >= Math.PI * 7 / 8 ? '-' : a < Math.PI * 3 / 8 ? '\\' : a < Math.PI * 5 / 8 ? '|' : '/';
  };

  /** Visit every character cell with its elevation range, centre value and gradient. */
  function cells(fn: (x: number, y: number, lo: number, hi: number, z: number, gx: number, gy: number) => void) {
    const cols = Math.ceil(W / CW), rows = Math.ceil(H / CH);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const x = q * CW, y = r * CH;
      const at = (px: number, py: number) => sample(px / s + ox, py / s + oy);
      const a = at(x, y), b = at(x + CW, y), c = at(x, y + CH), d = at(x + CW, y + CH);
      fn(x + CW / 2, y + CH / 2, Math.min(a, b, c, d), Math.max(a, b, c, d), (a + b + c + d) / 4, (b + d - a - c) / 2, (c + d - a - b) / 2);
    }
  }

  // Per-cell data for the ASCII mode, sampled once per layout: x, y, lo, hi, z, gx, gy.
  let grid = new Float32Array(0), relief = 1;
  function cache() {
    const out: number[] = [];
    cells((...v) => out.push(...v));
    grid = Float32Array.from(out);
    // Exaggerate the relief so a typical slope reads clearly in the light, whatever the site.
    const run = (CW / s) * g.mpp, sl: number[] = [];
    for (let k = 0; k < grid.length; k += 7) sl.push(Math.hypot(grid[k + 5], grid[k + 6]) / run);
    sl.sort((a, b) => a - b);
    relief = RELIEF_SLOPE / (sl[sl.length >> 1] || 1);
  }
  const each = (fn: (x: number, y: number, lo: number, hi: number, z: number, gx: number, gy: number) => void) => {
    for (let k = 0; k < grid.length; k += 7) fn(grid[k], grid[k + 1], grid[k + 2], grid[k + 3], grid[k + 4], grid[k + 5], grid[k + 6]);
  };

  // CSS colours read back as RGB through a 1 px canvas, so any colour syntax works.
  const px = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  const rgb = (col: string) => { px.clearRect(0, 0, 1, 1); px.fillStyle = col; px.fillRect(0, 0, 1, 1); return px.getImageData(0, 0, 1, 1).data; };
  const dark = (col: string) => { const [r, gg, b] = rgb(col); return r * .2126 + gg * .7152 + b * .0722 < 90; };
  /** n colours from `a` to `b`. */
  const steps = (a: string, b: string, n: number) => {
    const p = rgb(a), q = rgb(b);
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1), m = (k: number) => Math.round(p[k] + (q[k] - p[k]) * t);
      return `rgb(${m(0)} ${m(1)} ${m(2)})`;
    });
  };

  // Hillshade: a sun circles the terrain, every cell is lit by the dot product of its normal with
  // the sun direction, and the light picks both the character and the colour step.
  const RAMP = ' .,:;-=+*#'; // darkest to brightest
  // Sun elevation, ms per turn, and the slope (rise over run) the median cell is drawn at.
  const SUN_EL = 32 * Math.PI / 180, SUN_PERIOD = 36000, RELIEF_SLOPE = .7;
  const FLICKER = .04; // share of lit cells shown as a random digit
  const STILL_AZ = -0.75 * Math.PI; // reduced motion: the classic north-west light
  let sunDrawn = NaN, sunAz = STILL_AZ, sunT = 0;

  const GLYPHS = RAMP.slice(1) + '0123456789';
  let sheetKey = '', sheetCv: HTMLCanvasElement | null = null;
  /** Every glyph in every colour step, one row per step, at device resolution. Rebuilt only when the palette or cell size changes. */
  function sprites(pal: string[]) {
    const key = `${pal.join()}|${FS}|${dpr}`;
    if (sheetCv && key === sheetKey) return sheetCv;
    const sw = Math.ceil(CW * dpr), sh = Math.ceil(CH * dpr);
    const cvs = sheetCv ?? document.createElement('canvas');
    cvs.width = sw * GLYPHS.length; cvs.height = sh * pal.length;
    const x = cvs.getContext('2d')!;
    x.font = `400 ${FS * dpr}px "JetBrains Mono", ui-monospace, monospace`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    pal.forEach((col, r) => {
      x.fillStyle = col;
      for (let i = 0; i < GLYPHS.length; i++) x.fillText(GLYPHS[i], i * sw + sw / 2, r * sh + sh / 2);
    });
    sheetCv = cvs; sheetKey = key;
    return cvs;
  }

  // What each cell showed last time, so a sun step only repaints the cells that changed.
  let shownCh: string[] = [], shownStep = new Int8Array(0), palette: string[] = [], glowing = false;
  const glowCv = document.createElement('canvas');

  /** Full repaint (layout, theme or mode change), or with `partial` only the cells whose glyph changed. */
  function drawAscii(az = reduce ? STILL_AZ : sunDrawn || STILL_AZ, partial = false) {
    sunDrawn = az;
    const c = colours();
    if (!partial || !palette.length) { palette = steps(c.muted, c.accent, 7); glowing = dark(c.surface); }
    const pal = palette;
    const b = bctx;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.font = font(400);
    b.textAlign = 'center'; b.textBaseline = 'middle';
    const lx = Math.cos(SUN_EL) * Math.cos(az), ly = Math.cos(SUN_EL) * Math.sin(az), lz = Math.sin(SUN_EL);
    const run = (CW / s) * g.mpp; // metres across one character cell
    const every = INTERVAL * 5;
    const n = grid.length / 7;
    const ch: string[] = new Array(n), step = new Int8Array(n).fill(-1);
    let k = 0;
    each((_x, _y, lo, hi, _z, gx, gy) => {
      if (Math.floor(hi / every) === Math.floor(lo / every)) {
        const dx = -gx / run * relief, dy = -gy / run * relief;
        const light = Math.max(0, (dx * lx + dy * ly + lz) / Math.hypot(dx, dy, 1));
        const u = Math.min(1, light / lz * .38); // flat ground stays sparse, so only sunlit slopes stand out
        ch[k] = RAMP[Math.min(RAMP.length - 1, Math.floor(u * RAMP.length))];
        step[k] = Math.min(pal.length - 1, Math.floor(u * pal.length));
        // Matrix-style flicker: a few lit cells show a random digit in the brightest colour, changing every redraw.
        if (!reduce && step[k] >= 2 && Math.random() < FLICKER) { ch[k] = String((Math.random() * 10) | 0); step[k] = pal.length - 1; }
      }
      k++;
    });
    // Lit cells are stamped from a prerendered sprite sheet (character × colour step): far cheaper
    // than fillText for tens of thousands of cells. Then the index contours on top as direction characters.
    const sheet = sprites(pal);
    const sw = Math.ceil(CW * dpr), sh = Math.ceil(CH * dpr);
    const same = partial && shownCh.length === n;
    if (!same) b.clearRect(0, 0, W, H);
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalAlpha = .8;
    k = 0;
    each((x, y) => {
      if (step[k] >= 0 && !(same && ch[k] === shownCh[k] && step[k] === shownStep[k])) {
        const dx = Math.round((x - CW / 2) * dpr), dy = Math.round((y - CH / 2) * dpr);
        if (same) b.clearRect(dx, dy, sw, sh);
        const i = GLYPHS.indexOf(ch[k]);
        if (i >= 0) b.drawImage(sheet, i * sw, step[k] * sh, sw, sh, dx, dy, sw, sh);
      }
      k++;
    });
    shownCh = ch; shownStep = step;
    b.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!same) {
      k = 0;
      b.fillStyle = c.ink; b.globalAlpha = .9;
      each((x, y, _lo, _hi, _z, gx, gy) => { if (step[k++] < 0) b.fillText(glyph(gx, gy), x, y); });
    }
    b.globalAlpha = 1;
    decor(b, c);
    // On a dark theme a blurred copy of the characters, added on top in frame(), makes them glow.
    if (glowing) {
      glowCv.width = base.width; glowCv.height = base.height;
      const gl = glowCv.getContext('2d')!;
      gl.filter = `blur(${2 * dpr}px)`;
      gl.drawImage(base, 0, 0);
    }
  }

  function decor(b: CanvasRenderingContext2D, c: ReturnType<typeof colours>) {
    // North arrow and a 500 m scale bar.
    b.fillStyle = c.ink; b.strokeStyle = c.ink; b.lineWidth = 1.2;
    b.beginPath(); b.moveTo(W - 22, 34); b.lineTo(W - 22, 14); b.stroke();
    b.beginPath(); b.moveTo(W - 26, 20); b.lineTo(W - 22, 12); b.lineTo(W - 18, 20); b.closePath(); b.fill();
    b.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
    b.textAlign = 'center'; b.fillText('N', W - 22, 46);
    const bar = 500 / g.mpp * s;
    b.beginPath(); b.moveTo(14, H - 14); b.lineTo(14 + bar, H - 14);
    b.moveTo(14, H - 18); b.lineTo(14, H - 10); b.moveTo(14 + bar, H - 18); b.lineTo(14 + bar, H - 10); b.stroke();
    b.textAlign = 'left'; b.textBaseline = 'bottom';
    b.lineWidth = 4; b.strokeStyle = c.surface; b.strokeText('500 m', 14, H - 20); b.fillText('500 m', 14, H - 20);
  }

  function frame(t: number) {
    // Move the sun; redraw the lit grid only when it has turned about 1.5 degrees.
    // The sun's own clock only advances while the loop runs, so it resumes where it paused.
    if (ascii && !reduce && !probe) {
      sunAz += (Math.min(t - (sunT || t), 50) / SUN_PERIOD) * Math.PI * 2;
      if (!(Math.abs(sunAz - sunDrawn) < .026)) drawAscii(sunAz, true);
    }
    sunT = t;
    const c = colours();
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, cv.width, cv.height);
    ctx!.drawImage(base, 0, 0);
    if (ascii && glowing) {
      ctx!.globalCompositeOperation = 'lighter'; ctx!.globalAlpha = .6;
      ctx!.drawImage(glowCv, 0, 0);
      ctx!.globalCompositeOperation = 'source-over'; ctx!.globalAlpha = 1;
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    let level: number;
    if (probe) level = sample(probe.x / s + ox, probe.y / s + oy);
    else if (reduce) level = sample(g.cx, g.cy) - 6; // a ring just below the summit, not a single point
    else {
      const u = .5 - .5 * Math.cos(((t - idleSince) / 16000) * Math.PI * 2 + Math.PI * .35);
      level = vmin + 2 + (vmax - vmin - 4) * u;
    }
    if (ascii) {
      // The traced contour as accent characters over a cleared cell.
      ctx!.font = font(600);
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      each((x, y, lo, hi, _z, gx, gy) => {
        if (level < lo || level > hi) return;
        ctx!.clearRect(x - CW / 2, y - CH / 2, CW, CH); // the page shows through, as everywhere else
        ctx!.fillStyle = c.accent; ctx!.fillText(glyph(gx, gy), x, y);
      });
    } else {
      const line = new Path2D();
      trace(S, g.w, g.h, 0, 1, level, (x1, y1, x2, y2) => {
        line.moveTo((x1 - ox) * s, (y1 - oy) * s); line.lineTo((x2 - ox) * s, (y2 - oy) * s);
      });
      ctx!.lineCap = 'round';
      ctx!.strokeStyle = c.accent; ctx!.lineWidth = 2.2; ctx!.stroke(line);
    }

    const text = `${Math.round(level)} m`;
    if (readout) readout.textContent = text;
    if (probe) {
      ctx!.fillStyle = c.accent;
      ctx!.beginPath(); ctx!.arc(probe.x, probe.y, 3.5, 0, Math.PI * 2); ctx!.fill();
      ctx!.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
      ctx!.textBaseline = 'bottom';
      const right = probe.x < W - 80;
      ctx!.textAlign = right ? 'left' : 'right';
      const tx = probe.x + (right ? 10 : -10), ty = probe.y - 8;
      ctx!.lineWidth = 4; ctx!.strokeStyle = c.surface; ctx!.strokeText(text, tx, ty);
      ctx!.fillStyle = c.accent; ctx!.fillText(text, tx, ty);
    }
  }

  const animating = () => !probe && !reduce;
  const loop = (t: number) => { frame(t); raf = visible && animating() ? requestAnimationFrame(loop) : 0; };
  const request = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const rebuild = () => { if (ascii) { cache(); drawAscii(); } else drawBase(); request(); };

  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) request(); }).observe(cv);
  const setProbe = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    probe = { x: e.clientX - r.left, y: e.clientY - r.top };
    request();
  };
  cv.addEventListener('pointermove', setProbe);
  cv.addEventListener('pointerdown', setProbe);
  cv.addEventListener('pointerleave', () => { probe = null; idleSince = performance.now(); request(); });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => { layout(); rebuild(); }, 120);
  });
  new MutationObserver(rebuild).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver(() => { ascii = cv.dataset.mode === 'ascii'; rebuild(); }).observe(cv, { attributes: true, attributeFilter: ['data-mode'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebuild);
  await document.fonts?.ready;
  layout(); rebuild();
}
