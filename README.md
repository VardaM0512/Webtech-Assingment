# SPLICE — an archive of classic Hindi films & songs

**Live site:** https://webtech-assingment-1.onrender.com/

Full-stack web technology project (ICT 3131) by Varda Murarka (240911548) and Aadya Chhavi Mishra (240911602), under Dr. Rajashree Krishna. Node.js + Express renders EJS pages on the server and stores everything in a Supabase (PostgreSQL) database.

## Features

| # | Feature |
|---|---------|
| 1 | Sign up / log in / log out, bcrypt passwords, sessions |
| 2 | User + admin roles, protected routes (requireLogin / requireAdmin) |
| 3 | Admin desk: totals, approve / reject submissions, delete reviews |
| 4 | Archive search API: live search, filters, sorting, "Load more" pagination |
| 5 | Charts: top 10 films and songs from the `entry_scores` SQL view |
| 6 | Home page with live stats (count-up) and latest entries |
| 7 | Entry page: ratings + reviews (post / edit / delete without reload) |
| 8 | Songs linked to their film (tracklist on films, "from the film" on songs) |
| 9 | My Shelf: watchlist, my reviews, my submissions, account settings |
| 10 | Submit a film or song with live poster preview (goes to approval) |

## Tech stack

- **Frontend:** HTML5, CSS3 (custom, no framework), vanilla JavaScript (fetch API, IntersectionObserver)
- **Templates:** EJS (server-side rendering)
- **Backend:** Node.js 18+, Express 4, express-session, bcryptjs
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js`

## Run it locally

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard open **SQL Editor**, paste the contents of `db/schema.sql` and click **Run**. Then do the same with `db/upgrade-v2.sql`.
   Optional: `node db/seed-demo.js` adds demo accounts (logins listed at the top of that file), reviews and a pending submission.
3. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (Project Settings → API → `service_role` key).
4. Install and start:

```bash
npm install
npm start
```

5. Open http://localhost:3000

## Project structure

```
server.js            Express app setup, sessions, route mounting
lib/supabase.js      Shared Supabase client
routes/archive.js    Home, archive + search API, entry + reviews, charts
routes/members.js    Signup/login + roles, profile + watchlist, submit, admin
views/               EJS pages + partials (header, footer, poster card)
public/css/style.css The whole visual theme
public/js/           Page scripts (main, archive, entry, profile, submit)
db/schema.sql        Tables + seed data
db/upgrade-v2.sql    Roles, approval status, film links, ratings view
db/seed-demo.js      Demo accounts and reviews
```
