var mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    GitHubStrategy = require('passport-github').Strategy,
    GoogleStrategy = require('passport-google-oauth').Strategy,
    User = mongoose.model('User'),
    config = require('./config');


module.exports = function(passport) {
    //Serialize sessions
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }, function(err, user) {
            done(err, user);
        });
    });

    //Use local strategy
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function(email, password, done) {
            User.findOne({
                email: email.toLowerCase()
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {
                        message: 'Unknown user'
                    });
                }
                if (!user.authenticate(password)) {
                    return done(null, false, {
                        message: 'Invalid password'
                    });
                }
                return done(null, user);
            });
        }
    ));

    //Use twitter strategy
    passport.use(new TwitterStrategy({
            consumerKey: config.twitter.clientID,
            consumerSecret: config.twitter.clientSecret,
            callbackURL: config.twitter.callbackURL
        },
        function(token, tokenSecret, profile, done) {
            User.findOne({
                'twitter.id_str': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        username: profile.username,
                        provider: 'twitter',
                        twitter: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));

    //Use facebook strategy
    passport.use(new FacebookStrategy({
            clientID: config.facebook.clientID,
            clientSecret: config.facebook.clientSecret,
            callbackURL: config.facebook.callbackURL,
            passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, done) {

            var passThroughParams = JSON.parse( decodeURIComponent( req.query.state) );
            var verificationKey = null;
            var verificationEmail = null;
            var verificationPhone = null;
            if(passThroughParams){
                verificationKey = passThroughParams.k;
                verificationEmail = passThroughParams.email;
                verificationPhone = passThroughParams.phone;
            }


            var checkPhone = function(phone, callback){
                if(phone && verificationPhone === phone) {
                    callback(true);
                } else {
                    callback(false);
                }
            };

            var checkEmail = function(email, callback){
                if(email && verificationEmail === email){
                    callback(true);
                } else {
                    callback(false);
                }
            };

            var checkVerification = function(callback){
                // if there is a verificationKey ... then validate and allow account link
                if(verificationKey){
                    User.findOne({
                        verificationKey: verificationKey,
                        status: 'pending'
                    })
                    .exec(function(err, verifiedUser) {
                        if(err) {
                            return done(err);
                        } else if(!verifiedUser ||
                                  (verifiedUser.email !== verificationEmail && verifiedUser.phone !== verificationPhone)) {
                            return done(new Error('Invalid verification key'));
                        } else {
                            checkPhone(verifiedUser.phone, function(phoneValidated){
                                if(phoneValidated){
                                    // allow link via phone
                                    callback(verifiedUser);
                                }else{
                                    checkEmail(verifiedUser.email, function(emailValidated){
                                        if(emailValidated){
                                            callback(verifiedUser);
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    // don't allow accout linking if no verification KEY
                    // treat as new signup
                    // TODO: show form for phone?
                    if(callback){ return callback(); }
                }
            };

            // FIRST try to find by facebook id
            User.findOne({
                    'facebook.id': profile.id
                }, function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {

                        // shared save user fn
                        var saveUser = function(user){
                            user.name = profile.displayName;
                            user.username = profile.username;
                            user.provider = 'facebook';
                            user.facebook = profile._json;
                            user.status = 'joined';
                            user.save(function(err) {
                                if (err) console.log(err);
                                return done(err, user);
                            });
                        };

                        // if no existing user ... check for verification key to associate existing account
                        if(verificationKey) {
                            checkVerification( function(verifiedUser) {
                                if(verifiedUser) {
                                    saveUser(verifiedUser);
                                } else {
                                    return done( new Error('User verification failed') );
                                }
                            });
                        } else {
                            user = new User({email: profile.emails[0].value.toLowerCase()});
                            saveUser(user);
                        }
                    } else {
                        return done(err, user);
                    }
                });
        }
    ));

    //Use github strategy
    passport.use(new GitHubStrategy({
            clientID: config.github.clientID,
            clientSecret: config.github.clientSecret,
            callbackURL: config.github.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'github.id': profile.id
            }, function(err, user) {
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'github',
                        github: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));

    //Use google strategy
    passport.use(new GoogleStrategy({
            consumerKey: config.google.clientID,
            consumerSecret: config.google.clientSecret,
            callbackURL: config.google.callbackURL
        },
        function(accessToken, refreshToken, profile, done) {
            User.findOne({
                'google.id': profile.id
            }, function(err, user) {
                if (!user) {
                    user = new User({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'google',
                        google: profile._json
                    });
                    user.save(function(err) {
                        if (err) console.log(err);
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }
    ));
};