// Build-time layout for the project space on the home page. Each project becomes a vector of
// themes and tags; classical MDS on their cosine distances gives a 2D map, and a short relaxation
// keeps the circles from overlapping. Pure functions, no DOM: runs in the Astro frontmatter.

export type Theme = { id: string; label: string; match: RegExp };

// Broad themes read from tags, type and title, so that projects with different tools still meet.
export const themes: Theme[] = [
  { id: 'param', label: 'Parametric', match: /grasshopper|rhino|parametric|kangaroo|wasp|form-finding|aggregation|space truss|crystallon/i },
  { id: 'struct', label: 'Structure', match: /structur|space truss|kangaroo|alpaca4d|glulam|clt|dlt|timber|pavilion/i },
  { id: 'env', label: 'Environment', match: /solar|utci|radiation|environment|climate|noise|xeriscap|landscape|earth/i },
  { id: 'ai', label: 'AI · ML', match: /xgboost|shap|machine learning|graph ml|hdbscan|k-means|llm|comfyui|flux|generative ai|ai agent|lm studio/i },
  { id: 'fab', label: 'Fabrication', match: /3d.print|raw earth|clay/i },
  { id: 'urban', label: 'Urban', match: /urban|space syntax|isovist|openstreetmap|regeneration|densification|housing|thesis|market|graphs/i },
  { id: 'code', label: 'Code', match: /python|web|compute|app|planfinder|rgraphlib/i },
  { id: 'opt', label: 'Optimisation', match: /optimis|evolutionary|lilypad|layout search/i },
];

export type Item = { id: string; text: string[]; tags: string[]; category: string; year: number };
export type Point = { x: number; y: number };

const W_THEME = 1;
const W_TAG = 0.6;
const W_CATEGORY = 0.8;

export function themesOf(item: Item) {
  const hay = item.text.join(' · ');
  return themes.filter((t) => t.match.test(hay)).map((t) => t.id);
}

function vectors(items: Item[]) {
  const keys = new Map<string, number>();
  const key = (k: string) => keys.get(k) ?? (keys.set(k, keys.size), keys.size - 1);
  const sparse = items.map((it) => {
    const v = new Map<number, number>();
    for (const t of themesOf(it)) v.set(key(`t:${t}`), W_THEME);
    for (const g of it.tags) v.set(key(`g:${g.toLowerCase()}`), W_TAG);
    v.set(key(`c:${it.category}`), W_CATEGORY);
    return v;
  });
  return sparse;
}

function cosine(a: Map<number, number>, b: Map<number, number>) {
  let dot = 0, na = 0, nb = 0;
  for (const [k, x] of a) { na += x * x; dot += x * (b.get(k) ?? 0); }
  for (const x of b.values()) nb += x * x;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** The strongest pairs: each item keeps its k most similar items (cosine) at or above `min`. */
export function links(items: Item[], k = 2, min = 0.35) {
  const vs = vectors(items);
  const out = new Map<string, { a: number; b: number; w: number }>();
  vs.forEach((va, i) => {
    vs.map((vb, j) => ({ j, w: i === j ? -1 : cosine(va, vb) }))
      .sort((p, q) => q.w - p.w)
      .slice(0, k)
      .filter(({ w }) => w >= min)
      .forEach(({ j, w }) => out.set(`${Math.min(i, j)}-${Math.max(i, j)}`, { a: Math.min(i, j), b: Math.max(i, j), w }));
  });
  return [...out.values()];
}

/** Top-k eigenvectors of a symmetric matrix by power iteration with deflation. Deterministic start. */
function eigen(m: number[][], k: number) {
  const n = m.length;
  const out: { value: number; vector: number[] }[] = [];
  const a = m.map((r) => r.slice());
  for (let e = 0; e < k; e++) {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i * 1.7 + e * 0.9 + 1));
    let value = 0;
    for (let it = 0; it < 500; it++) {
      const w = a.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
      const norm = Math.hypot(...w) || 1;
      value = norm;
      v = w.map((x) => x / norm);
    }
    out.push({ value, vector: v });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a[i][j] -= value * v[i] * v[j];
  }
  return out;
}

/** Classical MDS of the items' cosine distances, normalised to [-1, 1] on both axes. */
export function embed(items: Item[]): Point[] {
  const vs = vectors(items);
  const n = items.length;
  const d2 = vs.map((a) => vs.map((b) => (1 - cosine(a, b)) ** 2));
  // Double centring: B = -1/2 J D² J
  const rowMean = d2.map((r) => r.reduce((s, x) => s + x, 0) / n);
  const all = rowMean.reduce((s, x) => s + x, 0) / n;
  const b = d2.map((r, i) => r.map((x, j) => -0.5 * (x - rowMean[i] - rowMean[j] + all)));
  const [e1, e2] = eigen(b, 2);
  const pts = items.map((_, i) => ({
    x: e1.vector[i] * Math.sqrt(Math.max(e1.value, 0)),
    y: e2.vector[i] * Math.sqrt(Math.max(e2.value, 0)),
  }));
  const span = (k: 'x' | 'y') => {
    const vals = pts.map((p) => p[k]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return (v: number) => (hi - lo ? ((v - lo) / (hi - lo)) * 2 - 1 : 0);
  };
  // Blend each axis with its rank order: the neighbours stay the same, but a dense cluster opens up.
  const rank = (k: 'x' | 'y') => {
    const sorted = pts.map((p, i) => [p[k], i]).sort((a, b) => a[0] - b[0]);
    const r: number[] = [];
    sorted.forEach(([, i], k2) => { r[i] = n > 1 ? (k2 / (n - 1)) * 2 - 1 : 0; });
    return r;
  };
  const sx = span('x'), sy = span('y');
  const rx = rank('x'), ry = rank('y');
  return pts.map((p, i) => ({ x: 0.5 * sx(p.x) + 0.5 * rx[i], y: 0.5 * sy(p.y) + 0.5 * ry[i] }));
}

/**
 * Push overlapping circles apart while pulling each one toward its target.
 * `pin` > 0 also holds x close to the target, for the timeline where x is the year.
 */
export function relax(targets: Point[], radii: number[], box: { w: number; h: number; pad: number }, pin = 0) {
  const p = targets.map((t) => ({ ...t }));
  const gap = 6;
  const iters = 500;
  for (let it = 0; it < iters; it++) {
    // The pull toward the target fades out at the end, so the last passes only separate.
    const pull = it < iters - 120 ? 1 : 0;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].x - p[i].x, dy = p[j].y - p[i].y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = radii[i] + radii[j] + gap;
        if (dist < min) {
          const push = (min - dist) / 2;
          const ux = dx / dist, uy = dy / dist;
          const fx = pin ? 0.25 : 1;
          p[i].x -= ux * push * fx; p[i].y -= uy * push;
          p[j].x += ux * push * fx; p[j].y += uy * push;
        }
      }
    }
    for (let i = 0; i < p.length; i++) {
      p[i].x += (targets[i].x - p[i].x) * (0.02 + pin) * pull;
      p[i].y += (targets[i].y - p[i].y) * 0.02 * pull;
      p[i].x = Math.min(box.w - box.pad - radii[i], Math.max(box.pad + radii[i], p[i].x));
      p[i].y = Math.min(box.h - box.pad - radii[i], Math.max(box.pad + radii[i], p[i].y));
    }
  }
  return p.map((q) => ({ x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10 }));
}
