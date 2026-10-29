const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();
const PAGE_SIZE = 8;

function average(reviews) {
  if (!reviews.length) return null;
  const sum = reviews.reduce((total, r) => total + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

const approved = () => supabase.from('entries').select('*', { count: 'exact', head: true }).eq('status', 'approved');

// home
router.get('/', async (req, res) => {
  const { data: latest } = await supabase
    .from('entries').select('*').eq('status', 'approved')
    .order('created_at', { ascending: false }).limit(4);

  const films = await approved().eq('kind', 'film');
  const songs = await approved().eq('kind', 'song');
  const reviews = await supabase.from('reviews').select('*', { count: 'exact', head: true });

  res.render('index', {
    title: 'Home',
    latest: latest || [],
    stats: { films: films.count || 0, songs: songs.count || 0, reviews: reviews.count || 0 }
  });
});

// archive page
router.get('/archive', async (req, res) => {
  const { data } = await supabase.from('entries').select('genre').eq('status', 'approved');
  const genres = [...new Set((data || []).map(e => e.genre))].sort();
  res.render('archive', { title: 'Archive', genres });
});

router.get('/api/entries', async (req, res) => {
  const { kind = 'all', genre = 'all', sort = 'new' } = req.query;
  const page = Math.max(Number(req.query.page) || 0, 0);
  const q = String(req.query.q || '').replace(/[,()%*]/g, '').trim();

  let query = supabase.from('entries')
    .select('id, title, kind, creator, year, genre, color', { count: 'exact' })
    .eq('status', 'approved');
  if (q) query = query.or(`title.ilike.%${q}%,creator.ilike.%${q}%`);
  if (kind !== 'all') query = query.eq('kind', kind);
  if (genre !== 'all') query = query.eq('genre', genre);
  if (sort === 'old') query = query.order('year', { ascending: true });
  else if (sort === 'az') query = query.order('title', { ascending: true });
  else query = query.order('year', { ascending: false });

  const from = page * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ items: data, total: count, hasMore: from + data.length < count });
});

// entry detail
router.get('/entry/:id', async (req, res) => {
  const id = Number(req.params.id);
  const user = req.session.user;
  const { data: entry } = await supabase.from('entries').select('*').eq('id', id).single();

  const canSee = entry && (entry.status === 'approved' || (user && (user.role === 'admin' || user.id === entry.submitted_by)));
  if (!canSee) return res.status(404).render('404', { title: 'Not found' });

  const { data: reviews } = await supabase
    .from('reviews').select('id, rating, body, created_at, user_id, users(name)')
    .eq('entry_id', id).order('created_at', { ascending: false });

  let songs = [], film = null;
  if (entry.kind === 'film') {
    const { data } = await supabase.from('entries').select('id, title, creator, year, kind, color')
      .eq('film_id', id).eq('status', 'approved');
    songs = data || [];
  } else if (entry.film_id) {
    const { data } = await supabase.from('entries').select('id, title, year').eq('id', entry.film_id).single();
    film = data;
  }

  let saved = false;
  if (user) {
    const { data } = await supabase.from('watchlist').select('entry_id').eq('user_id', user.id).eq('entry_id', id);
    saved = data && data.length > 0;
  }

  res.render('entry', { title: entry.title, entry, reviews: reviews || [], avg: average(reviews || []), saved, songs, film });
});

function checkReview(body) {
  const rating = Number(body.rating);
  const text = String(body.body || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Pick a rating from 1 to 5.' };
  if (text.length < 10 || text.length > 600) return { error: 'Review must be 10–600 characters.' };
  return { rating, text };
}

router.post('/api/entries/:id/reviews', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Log in to write a review.' });
  const { rating, text, error: invalid } = checkReview(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  const { data, error } = await supabase
    .from('reviews')
    .insert({ entry_id: Number(req.params.id), user_id: req.session.user.id, rating, body: text })
    .select('id, rating, body, created_at, user_id').single();
  if (error) return res.status(500).json({ error: error.message });

  res.json({ ...data, users: { name: req.session.user.name } });
});

router.put('/api/reviews/:id', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Log in first.' });
  const { rating, text, error: invalid } = checkReview(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  const { data, error } = await supabase.from('reviews')
    .update({ rating, body: text })
    .eq('id', Number(req.params.id)).eq('user_id', req.session.user.id)
    .select('id, rating, body');
  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(403).json({ error: 'You can only edit your own reviews.' });
  res.json(data[0]);
});

router.delete('/api/reviews/:id', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ error: 'Log in first.' });

  let query = supabase.from('reviews').delete().eq('id', Number(req.params.id));
  if (user.role !== 'admin') query = query.eq('user_id', user.id);
  const { data, error } = await query.select('id');
  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(403).json({ error: 'Not allowed.' });
  res.json({ deleted: true });
});

// charts
router.get('/charts', async (req, res) => {
  const top = (kind) => supabase.from('entry_scores').select('*')
    .eq('kind', kind).gt('review_count', 0)
    .order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
    .limit(10);

  const [films, songs] = await Promise.all([top('film'), top('song')]);
  res.render('charts', { title: 'Charts', films: films.data || [], songs: songs.data || [] });
});

module.exports = router;
