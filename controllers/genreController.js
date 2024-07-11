const Book = require('../models/book');
const Genre = require('../models/genre');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({name: 1}).exec();

    res.render('genre_list', {
        title: 'Genre List',
        genre_list: allGenres,
    });
});

exports.genre_detail = asyncHandler(async (req, res, next) => {
    const [genre, bookInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').exec(),
    ]);

    if(genre === null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }

    res.render('genre_detail', {
        title: 'Genre Detail',
        genre: genre,
        genre_books: bookInGenre,
    });
});

exports.genre_create_get = (req, res, next) => {
    res.render('genre_form', {title: 'Create Genre'});
};

exports.genre_create_post = [
    body('name', 'Genre name must contain at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const genre = new Genre({name : req.body.name});

        if(!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });

            return;
        } else {
            const genreExists = await Genre.findOne({name: req.body.name})
              .collation({locale: 'en', strength: 2})
              .exec();
            
            if(genreExists) {
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                res.redirect(genre.url);
            }
        }
    }),
];

exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    const [genre, allBooksOfGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({genre: req.params.id}, 'title summary').sort({ title: 1}).exec(),
    ]);

    if(genre === null) {
        res.redirect('/catalog/genres');
    }

    res.render('genre_delete', {
        title: 'Delete Genre',
        genre,
        genre_books: allBooksOfGenre, 
    });
});

exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    const [genre, allBooksOfGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, 'title summary').sort({ title: 1}).exec(),
    ]);

    if(genre === null) {
        res.redirect('/catalog/genres');
    }

    if(allBooksOfGenre.length > 0) {
        res.render('genre_delete', {
            title: 'Delete Genre',
            genre, 
            genre_books: allBooksOfGenre,
        });
    } else {
        await Genre.findByIdAndDelete(req.body.genreid);
        res.redirect('/catalog/genres');
    }
});

exports.genre_update_get = asyncHandler(async (req, res, next) => {
    const genre = Genre.findById(req.params.id).exec();

    if(genre === null) {
        const err = new Error('Genre not found.');
        err.status = 404;
        return next(err);
    }

    res.render('genre_form', {
        title: 'Update Genre',
        genre,
    });
});

exports.genre_update_post = [
    body('name', 'Genre name must contain at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const genre = new Genre({
            name : req.body.name,
            _id: req.params.id,
        });

        if(!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Update Genre',
                genre: genre,
                errors: errors.array(),
            });

            return;
        } else {
            const genreExists = await Genre.findOne({name: req.body.name})
              .collation({locale: 'en', strength: 2})
              .exec();
            
            if(genreExists) {
                // const err = new Error("Can't Update, Genre Already Exists.");
                // err.status = 404;
                // return next(err);
                const message1 = {
                    msg: `ALREADY EXISTS : Can't Update Genre.`,
                };

                const message2 = {
                    msg: ` " Try Something else. " `,
                }

                res.render('genre_form', {
                    title: 'Update Genre',
                    genre,
                    errors: [message1, message2],
                });

                return;
            } else {
                const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
                res.redirect(updatedGenre.url);
            }
        }
    }),
];