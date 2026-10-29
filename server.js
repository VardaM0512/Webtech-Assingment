require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const archiveRoutes = require('./routes/archive');
const memberRoutes = require('./routes/members');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.path = req.path;
  next();
});

app.use(archiveRoutes);
app.use(memberRoutes);

app.use((req, res) => res.status(404).render('404', { title: 'Not found' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SPLICE running on http://localhost:${PORT}`));
