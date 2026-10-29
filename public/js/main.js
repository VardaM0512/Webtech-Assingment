function toast(message) {
  const el = document.querySelector('.toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el.timer);
  el.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const revealer = new IntersectionObserver((items) => {
  items.forEach((item, i) => {
    if (item.isIntersecting) {
      setTimeout(() => item.target.classList.add('in'), i * 80);
      revealer.unobserve(item.target);
    }
  });
}, { threshold: 0.15 });

function watchReveals() {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => revealer.observe(el));
}
watchReveals();

document.querySelectorAll('.count').forEach(el => {
  const target = Number(el.dataset.to);
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / 1200, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
});

const menuBtn = document.querySelector('.menu-btn');
menuBtn.addEventListener('click', () => {
  const nav = document.getElementById('nav');
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});

document.querySelectorAll('form[data-validate]').forEach(form => {
  form.setAttribute('novalidate', '');
  form.addEventListener('submit', (e) => {
    let firstBad = null;
    form.querySelectorAll('input, textarea').forEach(input => {
      const ok = input.checkValidity();
      input.classList.toggle('invalid', !ok);
      if (!ok && !firstBad) firstBad = input;
    });
    if (firstBad) {
      e.preventDefault();
      firstBad.focus();
      toast(firstBad.validationMessage);
    }
  });
});

const pw = document.getElementById('pw');
if (pw) {
  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) score++;
    const bar = document.getElementById('pw-meter');
    bar.style.width = (score * 25) + '%';
    bar.style.background = score >= 3 ? '#111' : '#ff3b1f';
  });
}

const tabs = document.querySelectorAll('[role="tab"]');
function openTab(tab) {
  tabs.forEach(t => {
    const selected = t === tab;
    t.setAttribute('aria-selected', selected);
    document.getElementById(t.dataset.tab).hidden = !selected;
  });
  watchReveals();
}
tabs.forEach(tab => tab.addEventListener('click', () => openTab(tab)));
const startTab = document.querySelector(`[data-tab="${new URLSearchParams(location.search).get('tab')}"]`);
if (startTab) openTab(startTab);
