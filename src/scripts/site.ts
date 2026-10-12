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
