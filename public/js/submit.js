const form = document.getElementById('submit-form');
const preview = document.getElementById('preview');
const synCount = document.getElementById('syn-count');

function updatePreview() {
  preview.className = 'poster poster-' + form.color.value;
  preview.querySelector('.poster-kind').textContent = form.kind.value;
  preview.querySelector('.poster-title').textContent = form.elements.title.value || 'Your title';
  preview.querySelector('.poster-meta').textContent = `${form.creator.value || 'Maker'} · ${form.year.value || 'Year'}`;
  document.getElementById('film-field').hidden = form.kind.value !== 'song';
  document.getElementById('creator-label').textContent = form.kind.value === 'song' ? 'Singer / composer' : 'Director';
  synCount.textContent = `${form.synopsis.value.length} / 400`;
}

form.addEventListener('input', updatePreview);
updatePreview();
