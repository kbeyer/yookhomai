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

exports.renderSignup = function(req, res, user, err){
    if(err){
        res.render('users/signup', {
            title: 'Join Yookhomai',
            error: err,
            user: user
        });
    }else{
        res.render('users/signup', {
            title: 'Join Yookhomai',
            user: user
        });
    }
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
    exports.renderSignup(req, res, new User({verificationKey: null}));
};

/* Validate verification key, and render form with email auto-populated */
exports.emailSignup = function(req, res){
    // verify user was found with verification key
    if(req.profile){
        exports.renderSignup(req, res, new User({verificationKey: req.profile.verificationKey, email: req.profile.email}));
    }else{
        exports.renderSignup(req, res, new User({verificationKey: null}), new Error('Invalid verification key'));
    }
};

/* Validate verification key, and render form with phone auto-populated */
exports.textSignup = function(req, res){
    // verify user was found with verification key
    if(req.profile){
        exports.renderSignup(req, res, new User({verificationKey: req.profile.verificationKey, phone: req.profile.phone}));
    }else{
        exports.renderSignup(req, res, new User({verificationKey: null}), new Error('Invalid verification key'));
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
    formUser.email = formUser.email.toLowerCase();
    
    var module = exports;

    var renderError = function(err){
        module.renderSignup(req, res, formUser, err);
    };

    var saveUser = function(user){
        // update status and set provider
        user.status = 'joined';
        user.provider = 'local';
        user.save(function(err) {
            if (err) { return renderError( req, res, formUser, err); }

            req.logIn(user, function(err) {
                if (err){ return renderError(req, res, user, err); }
                return res.redirect('/');
            });
        });
    };

    var findByEmail = function(){
        User
        .findOne({
            email: formUser.email.toLowerCase(),
            verificationKey: formUser.verificationKey
        })
        .exec(function(err, existingUser) {
            if (err){ return renderError(err); }
            if(existingUser){
                console.log('found existing user via email');
                if(existingUser.status === 'pending'){
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

    var findByPhone = function(){
        // try to lookup user to associate new one with
        User
        .findOne({
            phone: formUser.phone,
            verificationKey: formUser.verificationKey
        })
        .exec(function(err, existingUser) {
            if (err){ return renderError(err); }
            if(existingUser){
                console.log('found existing user via phone');

                // check if existing user has already set password
                if(existingUser.status === 'pending'){
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

    // if there is a verificationKey ... then validate and allow account link
    if(formUser.verificationKey){
        User.findOne({
            verificationKey: formUser.verificationKey,
            status: 'pending'
        })
        .exec(function(err, verifiedUser) {
            if(err) {
                renderError(err);
            } else if(!verifiedUser ||
                      (verifiedUser.email !== formUser.email && verifiedUser.phone !== formUser.phone)) {
                renderError(new Error('Invalid verifcation key'));
            } else {
                findByPhone();
            }
        });
    } else {
        // don't allow accout linking if no verification KEY
        // treat as new signup
        // TODO: check for unique email / phone?
        saveUser(formUser);
    }

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
 * Find user by verificationKey
 */
exports.getByVerificationKey = function(req, res, next, key){
    // save as verification key
    req.query.verificationKey = key;
    // lookup pending users with current key
    User
        .findOne({
            status: 'pending',
            verificationKey: key
        })
        .exec(function(err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Invalid key'));
            req.profile = user;
            next();
        });
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