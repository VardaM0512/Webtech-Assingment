// node db/seed-demo.js
// Demo logins created:
//   admin  -> admin@splice.test  / splice-admin-1
//   member -> meera@splice.test  / splice-demo-1
require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');

const people = [
  { name: 'Admin Desk', email: 'admin@splice.test', password: 'splice-admin-1', role: 'admin' },
  { name: 'Meera Iyer', email: 'meera@splice.test', password: 'splice-demo-1', role: 'user' },
  { name: 'Arjun Rao', email: 'arjun@splice.test', password: 'splice-demo-2', role: 'user' }
];

const reviews = [
  ['Sholay', 1, 5, 'Every dialogue is a classic. Gabbar still gives me chills fifty years later.'],
  ['Sholay', 2, 5, 'The friendship of Jai and Veeru is the heart of Hindi cinema.'],
  ['Mughal-e-Azam', 1, 5, 'The Sheesh Mahal sequence is pure magic, a true spectacle.'],
  ['Pyaasa', 2, 5, 'Guru Dutt at his finest. Poetic, bitter and beautiful.'],
  ['Anand', 1, 5, 'Babumoshai... I cried at the end, every single time.'],
  ['Guide', 2, 4, 'Dev Anand and Waheeda Rehman are wonderful, the second half is bold.'],
  ['Deewaar', 1, 4, 'Mere paas maa hai. Enough said.'],
  ['Don', 2, 4, 'Stylish and fun, the music is unbeatable.'],
  ['Shree 420', 1, 3, 'Charming Raj Kapoor, though a bit long in the middle.'],
  ['Chupke Chupke', 2, 4, 'Light, clever comedy that still works today.'],
  ['Yeh Dosti', 1, 5, 'The ultimate friendship anthem. Bike, sidecar, perfection.'],
  ['Pyar Kiya To Darna Kya', 2, 5, 'Lata ji\'s voice fills the whole palace.'],
  ['Zindagi Kaisi Hai Paheli', 1, 5, 'Manna Dey makes a simple question feel huge.'],
  ['Mehbooba Mehbooba', 2, 4, 'Pancham da\'s voice is unforgettable.'],
  ['Mera Joota Hai Japani', 1, 4, 'Patriotic and playful in the same breath.'],
  ['Khaike Paan Banaraswala', 2, 3, 'Fun dance number, Amitabh is having a blast.']
];

(async () => {
  const users = [];
  for (const p of people) {
    const password_hash = await bcrypt.hash(p.password, 10);
    const { data, error } = await supabase.from('users')
      .upsert({ name: p.name, email: p.email, password_hash, role: p.role }, { onConflict: 'email' })
      .select('id').single();
    if (error) throw error;
    users.push(data.id);
  }

  const { data: entries } = await supabase.from('entries').select('id, title');
  const idOf = (title) => entries.find(e => e.title === title).id;

  await supabase.from('reviews').delete().in('user_id', users);
  await supabase.from('reviews').insert(reviews.map(([title, u, rating, body]) => ({ entry_id: idOf(title), user_id: users[u], rating, body })));

  await supabase.from('watchlist').delete().eq('user_id', users[1]);
  await supabase.from('watchlist').insert(['Sholay', 'Guide', 'Yeh Dosti', 'Anand'].map(t => ({ user_id: users[1], entry_id: idOf(t) })));

  if (!entries.find(e => e.title === 'Padosan')) {
    await supabase.from('entries').insert({
      title: 'Padosan', kind: 'film', creator: 'Jyoti Swaroop', year: 1968, genre: 'Comedy', color: 'yellow', status: 'pending',
      synopsis: 'A shy man falls for his new neighbour and gets help from a theatre troupe to win her over with song.',
      submitted_by: users[1]
    });
  }
  console.log('Demo data ready.');
})();
