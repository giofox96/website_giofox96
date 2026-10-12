// Parametric vector field: segments rotate around moving attractors; the pointer adds one more.
const TAU = Math.PI * 2;

export function mountField(cv: HTMLCanvasElement) {
  const cx = cv.getContext('2d');
  if (!cx) return;
  const root = document.documentElement;
  const P = { cell: 26, amp: 1, wave: 110 };
  const ptr = { x: 0, y: 0, on: false };
  const countEl = document.getElementById('count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, lastN = -1, raf = 0, visible = true;

  const colours = () => {
    const cs = getComputedStyle(root);
    return { ink: cs.getPropertyValue('--ink').trim(), acc: cs.getPropertyValue('--accent').trim() };
  };

  function fit() {
    const r = cv.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    cx!.setTransform(d, 0, 0, d, 0, 0);
  }

  function frame(t: number) {
    const c = colours();
    cx!.clearRect(0, 0, W, H);
    const A = [
      { x: W * .24 + Math.cos(t * .0003) * W * .08, y: H * .55 + Math.sin(t * .0004) * H * .2 },
      { x: W * .76, y: H * .38 + Math.sin(t * .00025) * H * .18 },
    ];
    if (ptr.on) A.push({ x: ptr.x, y: ptr.y });
    const k = TAU / P.wave, ph = t * .0018, cell = P.cell;
    const ink = new Path2D(), acc = new Path2D();
    let n = 0;
    for (let y = cell / 2; y < H; y += cell) {
      for (let x = cell / 2; x < W; x += cell) {
        let v = 0;
        for (const a of A) v += Math.sin(Math.hypot(x - a.x, y - a.y) * k - ph);
        v /= A.length;
        const ang = v * Math.PI * P.amp * .5 + Math.PI * .25;
        const len = cell * .46 * (.45 + Math.abs(v) * .9);
        const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
        const p = Math.abs(v) > .7 ? acc : ink;
        p.moveTo(x - dx, y - dy); p.lineTo(x + dx, y + dy); n++;
      }
    }
    cx!.lineCap = 'round';
    cx!.globalAlpha = .55; cx!.strokeStyle = c.ink; cx!.lineWidth = 1.2; cx!.stroke(ink);
    cx!.globalAlpha = 1; cx!.strokeStyle = c.acc; cx!.lineWidth = 2; cx!.stroke(acc);
    if (countEl && n !== lastN) { countEl.textContent = n.toLocaleString('en'); lastN = n; }
  }

  const loop = (t: number) => { frame(t); raf = visible ? requestAnimationFrame(loop) : 0; };
  const redraw = () => { if (reduce) frame(4000); };
  const start = () => { if (reduce) frame(4000); else if (!raf) raf = requestAnimationFrame(loop); };

  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }).observe(cv);
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; redraw();
  });
  cv.addEventListener('pointerleave', () => { ptr.on = false; redraw(); });

  const bind = (id: keyof typeof P, fmt: (v: number) => string) => {
    const el = document.getElementById(`p-${id}`) as HTMLInputElement | null;
    const out = document.getElementById(`o-${id}`);
    el?.addEventListener('input', () => {
      P[id] = parseFloat(el.value);
      if (out) out.textContent = fmt(P[id]);
      redraw();
    });
  };
  bind('cell', (v) => `${v} px`);
  bind('amp', (v) => v.toFixed(1));
  bind('wave', (v) => `${v} px`);

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => { fit(); redraw(); }, 120);
  });
  new MutationObserver(redraw).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
  fit(); start();
}
