'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About this prototype' });
});

router.get('/accessibility', (req, res) => {
  res.render('accessibility', { title: 'Accessibility' });
});

module.exports = router;
