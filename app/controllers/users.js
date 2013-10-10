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
        title: 'Sign in',
        message: req.flash('error')
    });
};

/**
 * Show forgot password form
 */
exports.forgot = function(req, res) {
    res.render('users/forgot', {
        title: 'Forget your password?',
        message: req.flash('error')
    });
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
    var phone = req.query.phone;
    var email = req.query.email;

    var renderSignup = function(user){
        res.render('users/signup', {
            title: 'Join Yookhomai',
            user: user
        });
    };

    var renderError = function(err){
        res.render('users/signup', {
            error: err,
            user: new User()
        });
    };
    
    if(email){
        renderSignup(new User({email: email}));
    }
    else if(phone){
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

    var findByEmail = function(){
        User
        .findOne({
            email: formUser.email.toLowerCase()
        })
        .exec(function(err, existingUser) {
            if (err){ return renderError(err); }
            if(existingUser){
                console.log('found existing user via email');
                if(existingUser.status == 'pending'){
                    // update existing user
                    existingUser.name = formUser.name;
                    existingUser.phone = formUser.phone;
                    existingUser.password = formUser.password;
                    saveUser(existingUser);
                }else{
                    return res.render('users/signup', {
                        message: 'You already have an account, please sign in.'
                    });
                }
            }else{
                // worst case just save what was entered
                saveUser(formUser);
            }
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
            console.log('found existing user via phone');

            // check if existing user has already set password
            if(existingUser.status == 'pending'){
                // update existing user
                existingUser.name = formUser.name;
                existingUser.email = formUser.email.toLowerCase();
                existingUser.password = formUser.password;
                saveUser(existingUser);
            }else{
                return res.render('users/signup', {
                    message: 'You already have an account, please sign in.'
                });
            }

        }else{
            // if not found via phone ... try email
            findByEmail();
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