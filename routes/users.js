'use strict';

const bcrypt = require('bcrypt-as-promised');
const boom = require('boom');
const express = require('express');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

const router = express.Router();

router.post('/users', (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !firstName.trim()) {
    return next(boom.create(400, 'First name must not be blank'));
  }

  if (!lastName || !lastName.trim()) {
    return next(boom.create(400, 'Last name must not be blank'));
  }

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }

  if (!password || password.length < 8) {
    return next(boom.create(400, 'Password must be at least 8 characters long'));
  }

  knex('users')
  .where('email', email)
  .then((result) => {
    if (result.length > 0) {
      return next(boom.create(400, 'Email already exists'));
    }
    bcrypt.hash(password, 12)
      .then((hashedPassword) => {
        const insertUser = { firstName, lastName, email, hashedPassword };

        return knex('users').insert(decamelizeKeys(insertUser), '*');
      })
      .then((rows) => {
        const user = camelizeKeys(rows[0]);

        delete user.hashedPassword;
        res.send(user);
      })
      .catch((err) => {
        next(err);
      });
  });
});

module.exports = router;
