-- One-time change: replace 'zine' with 'song' and add the sample songs.
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> Run
alter table entries drop constraint if exists entries_kind_check;
alter table entries add constraint entries_kind_check check (kind in ('film', 'song'));

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
