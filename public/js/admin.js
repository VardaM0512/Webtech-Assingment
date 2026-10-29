document.querySelectorAll('.queue-item').forEach(item => {
  item.addEventListener('click', async (e) => {
    const status = e.target.dataset.status;
    if (!status) return;

    const res = await fetch('/api/admin/entries/' + item.dataset.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) return toast((await res.json()).error);

    item.classList.add(status === 'approved' ? 'approved' : 'gone');
    setTimeout(() => {
      item.remove();
      if (!document.querySelector('.queue-item')) document.getElementById('queue-empty').hidden = false;
    }, 400);
    const counter = document.getElementById('pending-count');
    counter.textContent = Number(counter.textContent) - 1;
    toast(status === 'approved' ? 'Published to the archive' : 'Submission rejected');
  });
});

document.getElementById('review-list').addEventListener('click', async (e) => {
  if (e.target.dataset.action !== 'delete' || !confirm('Delete this review?')) return;
  const li = e.target.closest('.review');
  const res = await fetch('/api/reviews/' + li.dataset.id, { method: 'DELETE' });
  if (!res.ok) return toast('Could not delete');
  li.classList.add('gone');
  setTimeout(() => li.remove(), 300);
  toast('Review deleted');
});
