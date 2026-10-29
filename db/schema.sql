create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz default now()
);

create table if not exists entries (
  id           serial primary key,
  title        text not null,
  kind         text not null check (kind in ('film', 'song')),
  creator      text not null,
  year         int  not null,
  genre        text not null,
  synopsis     text not null,
  color        text not null default 'red',
  submitted_by uuid references users(id) on delete set null,
  created_at   timestamptz default now()
);

create table if not exists reviews (
  id         serial primary key,
  entry_id   int  not null references entries(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  body       text not null,
  created_at timestamptz default now()
);

create table if not exists watchlist (
  user_id  uuid not null references users(id) on delete cascade,
  entry_id int  not null references entries(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (user_id, entry_id)
);

insert into entries (title, kind, creator, year, genre, synopsis, color) values
('Sholay', 'film', 'Ramesh Sippy', 1975, 'Action', 'A retired police officer hires two small-time crooks, Jai and Veeru, to capture the dacoit Gabbar Singh.', 'red'),
('Mughal-e-Azam', 'film', 'K. Asif', 1960, 'Romance', 'Prince Salim falls in love with the court dancer Anarkali, defying his father, Emperor Akbar.', 'yellow'),
('Mother India', 'film', 'Mehboob Khan', 1957, 'Drama', 'A poor village woman raises her sons alone while fighting debt and a cruel moneylender.', 'ink'),
('Pyaasa', 'film', 'Guru Dutt', 1957, 'Drama', 'A struggling poet, ignored by the world, becomes famous only after he is believed to be dead.', 'blue'),
('Deewaar', 'film', 'Yash Chopra', 1975, 'Crime', 'Two brothers grow up poor and take opposite paths: one becomes a smuggler, the other a police officer.', 'ink'),
('Guide', 'film', 'Vijay Anand', 1965, 'Drama', 'A charming tour guide helps a dancer chase her dreams, and his life takes a turn he never expected.', 'yellow'),
('Anand', 'film', 'Hrishikesh Mukherjee', 1971, 'Drama', 'A man with a terminal illness spreads joy to everyone he meets, including his serious young doctor.', 'red'),
('Shree 420', 'film', 'Raj Kapoor', 1955, 'Drama', 'An honest young man arrives in Bombay and is pulled into a world of cheats and easy money.', 'blue'),
('Chupke Chupke', 'film', 'Hrishikesh Mukherjee', 1975, 'Comedy', 'A newly married professor poses as a chauffeur to play a prank on his wife''s know-it-all brother-in-law.', 'yellow'),
('Don', 'film', 'Chandra Barot', 1978, 'Thriller', 'When a feared crime boss dies, the police secretly replace him with his lookalike, a simple street performer.', 'red');

insert into entries (title, kind, creator, year, genre, synopsis, color) values
('Mehbooba Mehbooba',            'song', 'R. D. Burman',                      1975, 'Dance',         'The fiery dance number from Sholay, sung and composed by R. D. Burman himself.', 'red'),
('Yeh Dosti',                    'song', 'Kishore Kumar & Manna Dey',         1975, 'Friendship',    'Jai and Veeru ride a motorbike and promise never to break their friendship, in Sholay.', 'yellow'),
('Pyar Kiya To Darna Kya',       'song', 'Lata Mangeshkar',                   1960, 'Romance',       'Anarkali dances in the Sheesh Mahal and openly declares her love before Emperor Akbar, in Mughal-e-Azam.', 'ink'),
('Yeh Duniya Agar Mil Bhi Jaye', 'song', 'Mohammed Rafi',                     1957, 'Philosophical', 'The poet Vijay asks what the world is worth if it has no place for feeling, in Pyaasa.', 'blue'),
('Gata Rahe Mera Dil',           'song', 'Kishore Kumar & Lata Mangeshkar',   1965, 'Romance',       'A gentle love duet from Guide, with music by S. D. Burman.', 'yellow'),
('Aaj Phir Jeene Ki Tamanna Hai','song', 'Lata Mangeshkar',                   1965, 'Romance',       'Rosie breaks free and celebrates a new start in life, in Guide.', 'red'),
('Zindagi Kaisi Hai Paheli',     'song', 'Manna Dey',                         1971, 'Philosophical', 'Anand releases balloons by the sea and wonders at what a puzzle life is, in Anand.', 'blue'),
('Mera Joota Hai Japani',        'song', 'Mukesh',                            1955, 'Fun',           'Raj walks to Bombay singing that his shoes are Japanese but his heart is Indian, in Shree 420.', 'ink'),
('Pyaar Hua Ikraar Hua',         'song', 'Lata Mangeshkar & Manna Dey',       1955, 'Romance',       'Two lovers share an umbrella in the Bombay rain, in Shree 420.', 'blue'),
('Khaike Paan Banaraswala',      'song', 'Kishore Kumar',                     1978, 'Dance',         'The simple Vijay dances after chewing a Banarasi paan, in Don.', 'yellow');
