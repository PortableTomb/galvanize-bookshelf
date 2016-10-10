'use strict';

const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;

    next();
  });
};

router.get('/favorites/:id', authorize, (req, res, next) => {
  knex('favorites')
    .where('book_id', req.query.bookId)
    .then((favorites) => res.send(favorites.length > 0))
    .catch((err) => next(err));
});

router.get('/favorites', authorize, (req, res, next) => {
  const { userId } = req.token;

  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .where('favorites.user_id', userId)
    .orderBy('books.title', 'ASC')
    .then((rows) => {
      const favorites = camelizeKeys(rows);

      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites', authorize, (req, res, next) => {
  const { bookId } = req.body;
  const { userId } = req.token;
    // const { bookId } = req.body;
    // const { id } = req.body;

  if (Number.isNaN(Number.parseInt(bookId))) {
    return next(boom.create(400, 'Book ID must be an integer'));
  }

    // if (!id ) {
    //   return next(boom.create(400, 'Id must not be blank'));
    // }
    // if (!bookId ) {
    //   return next(boom.create(400, 'BookId must not be blank'));
    // }
    // if (!userId ) {
    //   return next(boom.create(400, 'UserId must not be blank'));
    // }
  // const insertFavorite = { bookId, userId};
  const insertFavorite = { book_id: bookId, user_id: userId };
  knex('favorites')
    .insert(decamelizeKeys(insertFavorite), '*')
    .then((rows) => {
      const favorite = camelizeKeys(rows[0]);
      res.send(favorite);
    })
    .catch((err) => {
      next(err);
  });
 });

router.delete('/favorites', authorize, (req, res, next) => {
  // const id = Number.parseInt(req.params.id);

  let favorite;

  // if (Number.isNaN(id)) {
  //   return next();
  // }

    const { userId } = req.token;
    const { bookId } = req.body;

 if (typeof bookId !== 'number') {
    return next(boom.create(400, 'Id must be an integer'));
  }


  knex('favorites')
    .where({ book_id: bookId, user_id: userId })
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(404, 'Not Found');
      }

      favorite = camelizeKeys(row);
      return knex('favorites')
        .where({ book_id: bookId, user_id: userId })
        .del()
    })
    .then(() => {
      delete favorite.id;
      res.send(favorite);
    })
    .catch((err) => {
      next(err);
    });
});
module.exports = router;
