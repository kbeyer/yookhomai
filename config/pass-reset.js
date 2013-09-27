var mimi = require('madmimi-node'),
    config = require('./config');



module.exports = function(mongoose, passreset, app) {

  var User = mongoose.model('User');
  // used to send email
  var madmimi = new mimi(config.madmimi.user,config.madmimi.key);


  // The unit (second param) can be one of the following (or undefined for milliseconds):
  //   "secs", "mins", "hours", "days", or "weeks"
  passreset.expireTimeout(12, 'hours');

  // get passResetStore module using passReset object passed into this module
  var PassResetStore = require('./passResetStore')(passreset);
  var storeInstance = new PassResetStore();
  storeInstance.init();
    
  // use mongoose to store tokens
  passreset.storage.setStore(storeInstance);

  //
  // Configure the user lookup routine
  //
  passreset.lookupUsers(function(login, callback) {
    User.find({ username: login }, function(err, users) {
      if (err) {return callback(err);}
      if (! users.length) {return callback(null, false);}
      var user = users[0];
      callback(null, {
        email: user.email,
        users: [{
          id: user.id,
          name: user.username
        }]
      });
    });
  });

  //
  // Configure the set password routine
  //
  passreset.setPassword(function(id, password, callback) {
    if (password.length < 5) {
      return callback(null, false, 'Password must be at least 5 characters');
    }
    // find and update user
    User.findOne({ id: id}, function(err, user) {
      if (err) {return callback(err);}
      user.password = password;
      user.save(function(err){
        if (err) {return callback(err);}
        callback(null, true);
      });
    });
  });

  //
  // Configure the send email routine
  //
  passreset.sendEmail(function(email, resets, callback) {
    // send email notification of password reset
    var email_options = {
      promotion_name:"PasswordResetNotification",
      recipient: resets.name + '<' + email + '>',
      subject:"Yookhomai password reset instructions.",
      from:'Yookhomai <no-reply@yookhomai.com>',
      raw_html:'<html><head><title>Password Reset instructions for your Yookhomai account</title></head>' +
                '<body><a href="' + resets.url + '">Initiate password reset</a>' +
                    '[[tracking_beacon]]</body></html>'
    };

    madmimi.sendMail(email_options, function (transaction_id) {
      console.log("Email transaction for password reset is: " + transaction_id);
      // all done...
      callback(null, true);
    });

    /*
    var template = handlebars.compile([
      '<p>You requested a password reset for the following account(s).</p>',
      '<ul>',
      '{{#each resets}}',
        '<li>{{name}}: <a href="{{url}}">{{url}}</a></li>',
      '{{/each}}',
      '</ul>'
    ].join('\n'));
    mailer.send({
      to: email,
      from: 'noreply@example.com',
      subject: 'password reset',
      body: template({ resets: resets })
    });
    callback(null, true);
    */
  });

  // routes for password reset
  app.post('/password/send-reset', function(req, res){
      var handleError = function(req, res, err){
        res.render('users/reset', {
            title: 'Reset your password',
            error: err,
            message: req.flash('error')
        });
      };

      passreset.requestResetToken({
        next: null,
        error: handleError,
        loginParam: 'username',
        callbackURL: '/password/reset/{token}'
      });
    }
  );

  app.get('/password/reset/:token', function(req, res) {
    //
    // Render a form here that takes the token (which should be auto-generated in the form)
    // and a new password/confirmation, something like the following would work:
    //
    //   <form action="/password/reset">
    //     <input type="hidden" name="token" value="{{ token }}" />
    //     <input type="password" name="password" value="" placeholder="Password" />
    //     <input type="password" name="confirm" value="" placeholder="Confirm Password" />
    //   </form>
    //
    // In this example the form would have to be submitted with AJAX because the reset route
    // below takes a PUT. If you want the form to work with HTML only you can use a POST with
    // a different route URI or some kind of method override.
    //
    res.render('users/reset', {
        title: 'Reset your password',
        message: req.flash('error')
    });
  });

  app.post('/password/do-reset',
    passreset.resetPassword()
  );

};