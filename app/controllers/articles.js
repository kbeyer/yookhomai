/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    async = require('async'),
    Article = mongoose.model('Article'),
    _ = require('underscore');


/**
 * Find article by id
 */
exports.article = function(req, res, next, id) {
    Article.load(id, function(err, article) {
        if (err) return next(err);
        if (!article) return next(new Error('Failed to load article ' + id));
        req.article = article;
        next();
    });
};

/**
 * Create a article
 */
exports.create = function(req, res) {            
    var article = new Article(req.body);
    article.user = req.user;

    article.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                article: article
            });
        } 
        else {
            article.user = req.user;
            res.jsonp(article);
        }
    });
};

/**
 * Update a article
 */
exports.update = function(req, res) {
    var article = req.article;

    article = _.extend(article, req.body);

    article.save(function(err) {
        res.jsonp(article);
    });
};

/**
 * Delete an article
 */
exports.destroy = function(req, res) {
    var article = req.article;

    article.remove(function(err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(article);
        }
    });
};

/**
 * Show an article
 */
exports.show = function(req, res) {
    res.jsonp(req.article);
};

/**
 * List of Articles
 */
exports.all = function(req, res) {
    // only show articles for current user

    Article.find({user: req.user}).where('status').ne('removed').sort('-created').populate('user').exec(function(err, articles) {
        if (err) {
            res.jsonp(err);
        } else {
            res.jsonp(articles);
        }
    });
};

/**
 * Show pray mode
 */
exports.pray = function(req, res) {
    // only show articles for current user
    Article.find({user: req.user})
            .or([{status: 'active'}, {status: null}]) // load docs that are active and those that don't have the status field
            .sort('-created')
            .populate('user')
            .exec(function(err, articles) {
        if (err) {
            res.render('500', {
                status: 500
            });
        } else {
            res.render('users/pray', {
                title: 'Pray',
                slides: articles,
                startSlideId: req.query.id
            });
        }
    });
};
