var async = require('async');

module.exports = function(app, passport, auth) {
    //User Routes
    var users = require('../app/controllers/users');
    app.get('/signin', users.signin);
    app.get('/signup', users.signup);
    app.get('/signout', users.signout);
    app.get('/e/:verificationKey', users.emailSignup);
    app.get('/t/:verificationKey', users.textSignup);
    // setup param to get user by verification key
    app.param('verificationKey', users.getByVerificationKey);

    var passwords = require('../app/controllers/passwords');
    app.get('/forgot', passwords.forgot);
    app.post('/forgot', passwords.sendReset);
    app.get('/reset/:token', passwords.resetForm);
    app.post('/reset', passwords.doReset);

    //Setting up the users api
    app.post('/users', users.create);
    
    app.post('/users/session', passport.authenticate('local', {
        failureRedirect: '/signin',
        failureFlash: 'Invalid email or password.'
    }), users.session);

    app.get('/users/me', users.me);
    app.get('/users/:userId', users.show);

    //Setting the facebook oauth routes
    app.get('/auth/facebook', auth.authWithQueryAsState, users.signin);

    /*
    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: ['email', 'user_about_me'],
        failureRedirect: '/signin'
    }), users.signin);*/

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the github oauth routes
    app.get('/auth/github', passport.authenticate('github', {
        failureRedirect: '/signin'
    }), users.signin);

    app.get('/auth/github/callback', passport.authenticate('github', {
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the twitter oauth routes
    app.get('/auth/twitter', passport.authenticate('twitter', {
        failureRedirect: '/signin'
    }), users.signin);

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        failureRedirect: '/signin'
    }), users.authCallback);

    //Setting the google oauth routes
    app.get('/auth/google', passport.authenticate('google', {
        failureRedirect: '/signin',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    }), users.signin);

    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/signin'
    }), users.authCallback);

    //Finish with setting up the userId param
    app.param('userId', users.user);

    //Article Routes
    var articles = require('../app/controllers/articles');
    app.get('/articles', auth.requiresLogin, articles.all);
    app.post('/articles', auth.requiresLogin, articles.create);
    app.get('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.show);
    app.put('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.update);
    app.del('/articles/:articleId', auth.requiresLogin, auth.article.hasAuthorization, articles.destroy);
    // pray mode
    app.get('/pray', auth.requiresLogin, articles.pray);

    //Finish with setting up the articleId param
    app.param('articleId', articles.article);

    // Twilio routes
    var twilioController = require('../app/controllers/twilio');
    app.get('/twilio/text', twilioController.sms);
    app.post('/twilio/text', twilioController.sms);
    app.post('/twilio/voice', twilioController.voice);
    app.post('/twilio/handle-recording', twilioController.handleRecording);
    app.post('/twilio/handle-transcription', twilioController.handleTranscription);

    //Home route
    var index = require('../app/controllers/index');
    app.get('/', index.render);

};