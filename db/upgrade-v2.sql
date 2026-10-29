-- run after schema.sql

alter table users add column if not exists role text not null default 'user';
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('user', 'admin'));

alter table entries add column if not exists status text not null default 'approved';
alter table entries drop constraint if exists entries_status_check;
alter table entries add constraint entries_status_check check (status in ('pending', 'approved', 'rejected'));

alter table entries add column if not exists film_id int references entries(id) on delete set null;

update entries s set film_id = f.id
from entries f
where s.kind = 'song' and f.kind = 'film' and s.film_id is null
  and (
    (f.title = 'Sholay'        and s.title in ('Mehbooba Mehbooba', 'Yeh Dosti')) or
    (f.title = 'Mughal-e-Azam' and s.title = 'Pyar Kiya To Darna Kya') or
    (f.title = 'Pyaasa'        and s.title = 'Yeh Duniya Agar Mil Bhi Jaye') or
    (f.title = 'Guide'         and s.title in ('Gata Rahe Mera Dil', 'Aaj Phir Jeene Ki Tamanna Hai')) or
    (f.title = 'Anand'         and s.title = 'Zindagi Kaisi Hai Paheli') or
    (f.title = 'Shree 420'     and s.title in ('Mera Joota Hai Japani', 'Pyaar Hua Ikraar Hua')) or
    (f.title = 'Don'           and s.title = 'Khaike Paan Banaraswala')
  );

create or replace view entry_scores as
select e.id, e.title, e.kind, e.creator, e.year, e.color,
       round(avg(r.rating), 1) as avg_rating,
       count(r.id)             as review_count
from entries e
left join reviews r on r.entry_id = e.id
where e.status = 'approved'
group by e.id;

-- make an admin:
-- update users set role = 'admin' where email = 'you@example.com';
