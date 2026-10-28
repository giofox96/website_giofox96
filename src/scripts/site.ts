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

// Side index: show it once the header is out of view, mark the section on screen,
// and fold it open or shut on narrow screens.
const side = document.getElementById('side');
const toggle = document.getElementById('side-toggle');
if (side && toggle) {
  const header = document.querySelector('.top');
  const links = [...side.querySelectorAll<HTMLAnchorElement>('a[data-sec]')];
  const setOpen = (open: boolean) => {
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!side.classList.contains('is-open')));
  side.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', (e) => { if (!side.contains(e.target as Node)) setOpen(false); });

  if (header) {
    new IntersectionObserver(([e]) => {
      side.classList.toggle('is-on', !e.isIntersecting);
      if (e.isIntersecting) setOpen(false);
    }).observe(header);
  }

  // The section crossing the middle of the viewport is the current one.
  const sections = links.map((a) => document.getElementById(a.dataset.sec!)).filter((s): s is HTMLElement => !!s);
  const mark = (id: string) => links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.sec === id)));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) mark(e.target.id); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
  // The last sections are short and may never reach the middle: at the bottom of the page, mark the last one.
  addEventListener('scroll', () => {
    if (sections.length && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) mark(sections[sections.length - 1].id);
  }, { passive: true });
}
