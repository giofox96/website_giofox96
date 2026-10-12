// Contour map from real elevation data (public/terrain/contours.json, see scripts/terrain.py).
// The contour under the pointer is traced in the accent colour; when idle, the traced level sweeps the terrain.

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
    const c = colours();
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, cv.width, cv.height);
    ctx!.drawImage(base, 0, 0);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    let level: number;
    if (probe) level = sample(probe.x / s + ox, probe.y / s + oy);
    else if (reduce) level = sample(g.cx, g.cy) - 6; // a ring just below the summit, not a single point
    else {
      const u = .5 - .5 * Math.cos(((t - idleSince) / 16000) * Math.PI * 2 + Math.PI * .35);
      level = vmin + 2 + (vmax - vmin - 4) * u;
    }
    const line = new Path2D();
    trace(S, g.w, g.h, 0, 1, level, (x1, y1, x2, y2) => {
      line.moveTo((x1 - ox) * s, (y1 - oy) * s); line.lineTo((x2 - ox) * s, (y2 - oy) * s);
    });
    ctx!.lineCap = 'round';
    ctx!.strokeStyle = c.accent; ctx!.lineWidth = 2.2; ctx!.stroke(line);

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
  const rebuild = () => { drawBase(); request(); };

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
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebuild);
  await document.fonts?.ready;
  layout(); rebuild();
}
