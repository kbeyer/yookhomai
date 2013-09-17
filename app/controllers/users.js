/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User');

/**
 * Auth callback
 */
exports.authCallback = function(req, res, next) {
    res.redirect('/');
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
    var phone = req.query.phone;

    var renderSignup = function(user){
        res.render('users/signup', {
            title: 'Sign up',
            user: user
        });
    };

    var renderError = function(err){
        res.render('users/signup', {
            error: err,
            user: new User()
        });
    };
    
    if(phone){
        console.log('trying to autopopulate phone on signup page with: ' + phone);
        // try to lookup user to associate new one with
        User
        .findOne({
            phone: phone
        })
        .exec(function(err, user) {
            if (err){ return renderError(err); }
            if(user){
                console.log('found existing user');
                // render signup form with auto-populated phone
                renderSignup(new User({phone: user.phone}));
            }else{
                renderError({message: 'problem finding user with phone: ' + phone});
            }
        });
    }else{
        renderSignup(new User());
    }
};

/**
 * Logout
 */
exports.signout = function(req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function(req, res) {
    res.redirect('/');
};

/**
 * Create user
 */
exports.create = function(req, res) {
    var formUser = new User(req.body);

    var saveUser = function(user){
        // update status and set provider
        user.status = 'joined';
        user.provider = 'local';
        user.save(function(err) {
            if (err) {
                return res.render('users/signup', {
                    errors: err.errors,
                    user: user
                });
            }

            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.redirect('/');
            });
        });
    };

    // try to lookup user to associate new one with
    User
    .findOne({
        phone: formUser.phone
    })
    .exec(function(err, existingUser) {
        if (err){ return renderError(err); }
        if(existingUser){
            console.log('found existing user');
            // update existing user
            existingUser.name = formUser.name;
            existingUser.email = formUser.email;
            existingUser.password = formUser.password;
            saveUser(existingUser);

        }else{
            saveUser(formUser);
        }
    });

};

/**
 *  Show profile
 */
exports.show = function(req, res) {
    var user = req.profile;

    res.render('users/show', {
        title: user.name,
        user: user
    });
};

/**
 * Send User
 */
exports.me = function(req, res) {
    res.jsonp(req.user || null);
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};