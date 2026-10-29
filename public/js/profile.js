document.querySelectorAll('.remove').forEach(btn => {
  btn.addEventListener('click', async () => {
    const res = await fetch('/api/watchlist/' + btn.dataset.id, { method: 'POST' });
    if (!res.ok) return toast('Something went wrong');

    const item = btn.closest('.shelf-item');
    item.classList.add('gone');
    setTimeout(() => item.remove(), 350);

    const badge = document.querySelector('[data-tab="saved"] sup');
    badge.textContent = Number(badge.textContent) - 1;
    toast('Removed from your shelf');
  });
});
