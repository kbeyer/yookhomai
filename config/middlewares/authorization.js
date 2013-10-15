var passport = require('passport');

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/signin');
    }
    next();
};

exports.authWithQueryAsState = function(req, res, next) {
    passport.authenticate('facebook', {
        scope: ['email', 'user_about_me'],
        failureRedirect: '/signin',
        state: JSON.stringify(req.query)
    })(req, res, next);
};

/**
 * User authorizations routing middleware
 */
exports.user = {
    hasAuthorization: function(req, res, next) {
        if (req.profile.id !== req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};

/**
 * Article authorizations routing middleware
 */
exports.article = {
    hasAuthorization: function(req, res, next) {
        if (req.article.user.id !== req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};