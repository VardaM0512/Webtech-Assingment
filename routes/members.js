const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  if (req.session.user.role !== 'admin') return res.status(403).render('404', { title: 'Admins only' });
  next();
}

// sign up
router.get('/signup', (req, res) => res.render('signup', { title: 'Join', error: null, values: {} }));

router.post('/signup', async (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const fail = (error) => res.status(400).render('signup', { title: 'Join', error, values: { name, email } });

  if (name.length < 2) return fail('Name must be at least 2 characters.');
  if (!EMAIL_RE.test(email)) return fail('Enter a valid email address.');
  if (password.length < 6) return fail('Password must be at least 6 characters.');

  const { data: existing } = await supabase.from('users').select('id').eq('email', email);
  if (existing && existing.length) return fail('An account with that email already exists.');

  const password_hash = await bcrypt.hash(password, 10);
  const { data: user, error } = await supabase
    .from('users').insert({ name, email, password_hash }).select('id, name, email, role').single();
  if (error) return fail(error.message);

  req.session.user = user;
  res.redirect('/profile');
});

// log in / out
router.get('/login', (req, res) =>
  res.render('login', { title: 'Log in', error: null, email: '', next: req.query.next || '/profile' }));

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const next = req.body.next && req.body.next.startsWith('/') ? req.body.next : '/profile';

  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).render('login', { title: 'Log in', error: 'Wrong email or password.', email, next });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect(next);
});

router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

// profile + watchlist
router.get('/profile', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  const { data: saved } = await supabase
    .from('watchlist').select('added_at, entries(*)')
    .eq('user_id', userId).order('added_at', { ascending: false });

  const { data: reviews } = await supabase
    .from('reviews').select('id, rating, body, created_at, entries(id, title)')
    .eq('user_id', userId).order('created_at', { ascending: false });

  const { data: submitted } = await supabase
    .from('entries').select('id, title, kind, creator, year, color, status').eq('submitted_by', userId);

  res.render('profile', {
    title: 'My shelf',
    saved: (saved || []).map(s => s.entries),
    reviews: reviews || [],
    submitted: submitted || [],
    tab: req.query.tab || 'saved',
    flash: req.query.saved ? 'Settings saved.' : null,
    error: req.query.error || null
  });
});

router.post('/api/watchlist/:entryId', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Log in to save entries.' });
  const user_id = req.session.user.id;
  const entry_id = Number(req.params.entryId);

  const { data: existing } = await supabase.from('watchlist').select('entry_id').eq('user_id', user_id).eq('entry_id', entry_id);

  if (existing && existing.length) {
    await supabase.from('watchlist').delete().eq('user_id', user_id).eq('entry_id', entry_id);
    return res.json({ saved: false });
  }
  const { error } = await supabase.from('watchlist').insert({ user_id, entry_id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved: true });
});

// account settings
router.post('/profile/settings', requireLogin, async (req, res) => {
  const user = req.session.user;
  const name = (req.body.name || '').trim();
  const current = req.body.current || '';
  const next = req.body.password || '';
  const fail = (error) => res.redirect('/profile?tab=settings&error=' + encodeURIComponent(error));

  if (name.length < 2) return fail('Name must be at least 2 characters.');
  const changes = { name };

  if (next) {
    if (next.length < 6) return fail('New password must be at least 6 characters.');
    const { data: row } = await supabase.from('users').select('password_hash').eq('id', user.id).single();
    if (!(await bcrypt.compare(current, row.password_hash))) return fail('Current password is wrong.');
    changes.password_hash = await bcrypt.hash(next, 10);
  }

  const { error } = await supabase.from('users').update(changes).eq('id', user.id);
  if (error) return fail(error.message);
  req.session.user.name = name;
  res.redirect('/profile?tab=settings&saved=1');
});

// submit an entry
const KINDS = ['film', 'song'];
const COLORS = ['red', 'blue', 'yellow', 'ink'];

async function filmList() {
  const { data } = await supabase.from('entries').select('id, title, year')
    .eq('kind', 'film').eq('status', 'approved').order('title');
  return data || [];
}

router.get('/submit', requireLogin, async (req, res) =>
  res.render('submit', { title: 'Submit', error: null, films: await filmList(), values: { kind: 'film', color: 'red' } }));

router.post('/submit', requireLogin, async (req, res) => {
  const values = {
    title: (req.body.title || '').trim(),
    kind: req.body.kind,
    creator: (req.body.creator || '').trim(),
    year: Number(req.body.year),
    genre: (req.body.genre || '').trim(),
    synopsis: (req.body.synopsis || '').trim(),
    color: req.body.color,
    film_id: req.body.kind === 'song' && req.body.film_id ? Number(req.body.film_id) : null
  };
  const fail = async (error) => res.status(400).render('submit', { title: 'Submit', error, values, films: await filmList() });
  const thisYear = new Date().getFullYear();

  if (values.title.length < 2 || values.title.length > 80) return fail('Title must be 2–80 characters.');
  if (!KINDS.includes(values.kind)) return fail('Choose film or song.');
  if (values.creator.length < 2) return fail('Who made it?');
  if (!Number.isInteger(values.year) || values.year < 1900 || values.year > thisYear) return fail(`Year must be between 1900 and ${thisYear}.`);
  if (values.genre.length < 2) return fail('Add a genre.');
  if (values.synopsis.length < 20 || values.synopsis.length > 400) return fail('Synopsis must be 20–400 characters.');
  if (!COLORS.includes(values.color)) return fail('Pick a poster colour.');

  const status = req.session.user.role === 'admin' ? 'approved' : 'pending';
  const { data, error } = await supabase
    .from('entries').insert({ ...values, status, submitted_by: req.session.user.id }).select('id').single();
  if (error) return fail(error.message);

  res.redirect('/entry/' + data.id);
});

// admin dashboard
router.get('/admin', requireAdmin, async (req, res) => {
  const count = (table) => supabase.from(table).select('*', { count: 'exact', head: true });

  const [users, entries, reviews, pending, recent] = await Promise.all([
    count('users'),
    count('entries').eq('status', 'approved'),
    count('reviews'),
    supabase.from('entries').select('id, title, kind, creator, year, genre, synopsis, color, created_at, users!entries_submitted_by_fkey(name)')
      .eq('status', 'pending').order('created_at'),
    supabase.from('reviews').select('id, rating, body, created_at, users(name), entries(id, title)')
      .order('created_at', { ascending: false }).limit(8)
  ]);

  res.render('admin', {
    title: 'Admin',
    totals: { users: users.count || 0, entries: entries.count || 0, reviews: reviews.count || 0, pending: (pending.data || []).length },
    pending: pending.data || [],
    recent: recent.data || []
  });
});

router.post('/api/admin/entries/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
  const status = req.body.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  const { error } = await supabase.from('entries').update({ status }).eq('id', Number(req.params.id));
  if (error) return res.status(500).json({ error: error.message });
  res.json({ status });
});

module.exports = router;
