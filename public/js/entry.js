const saveBtn = document.getElementById('save-btn');
saveBtn.addEventListener('click', async () => {
  const res = await fetch('/api/watchlist/' + saveBtn.dataset.id, { method: 'POST' });
  if (res.status === 401) return (location.href = '/login?next=' + location.pathname);
  const data = await res.json();
  if (!res.ok) return toast(data.error);

  saveBtn.classList.toggle('is-saved', data.saved);
  saveBtn.setAttribute('aria-pressed', data.saved);
  saveBtn.textContent = data.saved ? '✓ On your shelf' : '+ Save to shelf';
  toast(data.saved ? 'Saved to your shelf' : 'Removed from your shelf');
});

const list = document.getElementById('review-list');

const starsHtml = (n) => `${'★'.repeat(n)}<span>${'★'.repeat(5 - n)}</span>`;

function updateScore() {
  const ratings = [...list.querySelectorAll('.review')].map(li => Number(li.dataset.rating));
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  document.getElementById('avg').textContent = avg ? Math.round(avg * 10) / 10 : '—';
  document.getElementById('review-count').textContent = ratings.length;
}

const form = document.getElementById('review-form');
if (form) {
  const errorEl = document.getElementById('review-error');
  const chars = document.getElementById('chars');
  const submitBtn = document.getElementById('review-submit');
  const cancelBtn = document.getElementById('review-cancel');
  let editing = null;

  form.body.addEventListener('input', () => (chars.textContent = `${form.body.value.length} / 600`));

  function resetForm() {
    editing = null;
    form.reset();
    chars.textContent = '0 / 600';
    submitBtn.textContent = 'Post review';
    cancelBtn.hidden = true;
  }
  cancelBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = form.rating.value;
    const body = form.body.value.trim();

    if (!rating) return (errorEl.textContent = 'Pick a star rating.');
    if (body.length < 10) return (errorEl.textContent = 'Write at least 10 characters.');
    errorEl.textContent = '';

    const url = editing ? `/api/reviews/${editing.dataset.id}` : `/api/entries/${form.dataset.id}/reviews`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: Number(rating), body })
    });
    const review = await res.json();
    if (!res.ok) return (errorEl.textContent = review.error);

    if (editing) {
      editing.dataset.rating = review.rating;
      editing.querySelector('.stars-static').innerHTML = starsHtml(review.rating);
      editing.querySelector('.review-body').textContent = review.body;
      editing.classList.remove('new'); void editing.offsetWidth; editing.classList.add('new');
      toast('Review updated');
    } else {
      const li = document.createElement('li');
      li.className = 'review new';
      li.dataset.id = review.id;
      li.dataset.rating = review.rating;
      li.innerHTML = `
        <div class="review-top">
          <strong>${escapeHtml(review.users.name)}</strong>
          <span class="stars-static">${starsHtml(review.rating)}</span>
        </div>
        <p class="review-body">${escapeHtml(review.body)}</p>
        <time class="mono">Just now</time>
        <span class="review-tools">
          <button class="link mono" data-action="edit">Edit</button>
          <button class="link mono" data-action="delete">Delete</button>
        </span>`;
      list.prepend(li);
      document.getElementById('no-reviews')?.remove();
      toast('Review posted');
    }
    updateScore();
    resetForm();
  });

  list.addEventListener('click', (e) => {
    if (e.target.dataset.action !== 'edit') return;
    editing = e.target.closest('.review');
    form.querySelector(`#star${editing.dataset.rating}`).checked = true;
    form.body.value = editing.querySelector('.review-body').textContent;
    chars.textContent = `${form.body.value.length} / 600`;
    submitBtn.textContent = 'Save changes';
    cancelBtn.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.body.focus();
  });
}

list.addEventListener('click', async (e) => {
  if (e.target.dataset.action !== 'delete') return;
  if (!confirm('Delete this review?')) return;
  const li = e.target.closest('.review');

  const res = await fetch('/api/reviews/' + li.dataset.id, { method: 'DELETE' });
  if (!res.ok) return toast((await res.json()).error);

  li.classList.add('gone');
  setTimeout(() => { li.remove(); updateScore(); }, 300);
  toast('Review deleted');
});
