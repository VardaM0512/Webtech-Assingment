const form = document.getElementById('filters');
const results = document.getElementById('results');
const count = document.getElementById('count');
const moreBtn = document.getElementById('load-more');
let typingTimer;
let page = 0;

function posterHtml(e) {
  return `
    <a href="/entry/${e.id}" class="poster poster-${e.color} reveal">
      <span class="poster-kind">${e.kind}</span>
      <span class="poster-title">${escapeHtml(e.title)}</span>
      <span class="poster-meta">${escapeHtml(e.creator)} · ${e.year}</span>
      <span class="poster-no">№${String(e.id).padStart(3, '0')}</span>
    </a>`;
}

async function load(append = false) {
  page = append ? page + 1 : 0;
  const params = new URLSearchParams(new FormData(form));
  params.set('page', page);
  results.classList.add('loading');

  try {
    const res = await fetch('/api/entries?' + params);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const html = data.items.map(posterHtml).join('');
    if (append) results.insertAdjacentHTML('beforeend', html);
    else results.innerHTML = html || '<p class="card empty">Nothing matches. Try a different word.</p>';

    count.textContent = data.total === 1 ? '1 result' : `${data.total} results`;
    moreBtn.hidden = !data.hasMore;
    watchReveals();
  } catch (err) {
    count.textContent = 'Could not load the archive.';
  }
  results.classList.remove('loading');
}

form.q.addEventListener('input', () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => load(), 250);
});
form.addEventListener('change', () => load());
moreBtn.addEventListener('click', () => load(true));

load();
