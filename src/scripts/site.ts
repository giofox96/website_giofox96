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
});

const copy = document.getElementById('copy');
copy?.addEventListener('click', () => {
  const address = copy.dataset.copy ?? '';
  const done = () => {
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy address'; }, 1600);
  };
  navigator.clipboard?.writeText(address).then(done, () => {});
});
