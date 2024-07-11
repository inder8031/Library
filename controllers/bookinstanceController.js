const BookInstance = require('../models/bookinstance');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Book = require('../models/book');

exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();

    res.render('bookinstance_list', {
        title: "Book Instance List",
        bookinstance_list: allBookInstances,
    });
});

exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();

    if(bookInstance === null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
    }

    res.render('bookinstance_detail', {
        title: 'Book:',
        bookinstance: bookInstance,
    });
});

exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
    res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
        status_list: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
    });
});

exports.bookinstance_create_post = [
    body('book', 'Book must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),

    body('imprint', 'Imprint must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),

    body('status').escape(),

    body('due_back', 'Invalid date')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),
    
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const bookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,  
        });

        if(!errors.isEmpty()) {
            const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
            res.render('bookinstance_form', {
                title: 'Create BookInstance', 
                book_list: allBooks,
                selected_book: bookInstance.book._id,
                status_list: ['Maintenance', 'Available', 'Loaned', 'Reserved'], 
                errors: errors.array(),
                bookinstance: bookInstance,  
            });
            return;
        } else {
            await bookInstance.save();
            res.redirect(bookInstance.url);
        }
    }),
];

exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookinstance = await BookInstance.findById(req.params.id).exec();

    if(bookinstance === null) {
        res.redirect('/catalog/bookinstances');
    }

    res.render('bookinstance_delete', {
        title: 'Delete BookInstance',
        bookinstance,
    });
})

exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    const bookinstance = BookInstance.findById(req.params.id).exec();

    if(bookinstance === null) {
        res.redirect('/catalog/bookinstances');
        return;
    }

    await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
    res.redirect('/catalog/bookinstances');
});

exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const [bookinstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
        Book.find({}, 'title').sort({ title: 1}).exec(),
    ]);

    if(bookinstance === null) {
        const err = new Error('BookInstance not found.');
        err.status = 404;
        return next(err);
    }

    res.render('bookinstance_form', {
        title: 'Update BookInstance',
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        bookinstance,
        status_list: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
    });
});

exports.bookinstance_update_post = [
    body('book', 'Book must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),

    body('imprint', 'Imprint must be specified')
      .trim()
      .isLength({ min: 1 })
      .escape(),

    body('status').escape(),

    body('due_back', 'Invalid date')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),

    asyncHandler( async (req, res, next) => {
        const errors = validationResult(req);

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id,
        });

        if(!errors.isEmpty()) {
            const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
            res.render('bookinstance_form', {
                title: 'Update BookInstance',
                book_list: allBooks,
                selected_book: bookinstance.book._id,
                bookinstance,
                status_list: ['Maintenance', 'Available', 'Loaned', 'Reserved'],
                errors: errors.array(),
            });
            return;
        } else {
            const updatedBookInstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
            res.redirect(updatedBookInstance.url);
        }
    }),
];

