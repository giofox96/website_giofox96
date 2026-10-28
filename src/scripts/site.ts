// Theme toggle and copy-to-clipboard. Runs on every page.
const root = document.documentElement;

function store(k: string, v: string) {
  try { localStorage.setItem(k, v); } catch { /* storage blocked */ }
}

function effectiveTheme() {
  return root.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

document.getElementById('theme')?.addEventListener('click', () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  store('pf-theme', next);
  syncThemeColor();
});

// Keep the browser UI colour in step with a theme picked by hand, not only with the OS setting.
function syncThemeColor() {
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
}
if (root.hasAttribute('data-theme')) syncThemeColor();

const copy = document.getElementById('copy');
copy?.addEventListener('click', () => {
  const address = copy.dataset.copy ?? '';
  const done = () => {
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy address'; }, 1600);
  };
  navigator.clipboard?.writeText(address).then(done, () => {});
});

// Pinned top bar: keep its height in --top-h so anchor jumps land below it,
// and underline the link of the section on screen.
const top = document.querySelector<HTMLElement>('.top');
if (top) {
  const setH = () => root.style.setProperty('--top-h', `${top.offsetHeight}px`);
  setH();
  new ResizeObserver(setH).observe(top);

  const links = [...top.querySelectorAll<HTMLAnchorElement>('a[data-sec]')];
  const mark = (id: string) => links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.sec === id)));
  // Every home section counts, so the overview and index clear the mark instead of leaving the last one lit.
  const sections = [...document.querySelectorAll<HTMLElement>('#main .sec[id]')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) mark(e.target.id); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
  // Contact is short and sits at the end: at the bottom of the page, mark it.
  addEventListener('scroll', () => {
    if (scrollY < 10) mark('');
    else if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) mark('contact');
  }, { passive: true });
}
