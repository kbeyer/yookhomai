/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    mimi = require('madmimi-node'),
    User = mongoose.model('User'),
    PasswordResetToken = mongoose.model('PasswordResetToken'),
    uuid       = require('uuid-v4'),
    twilio = require('twilio'),
    config = require('../../config/config');


var madmimi = new mimi(config.madmimi.user,config.madmimi.key);
var twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * Show forgot password form
 */
exports.forgot = function(req, res) {
    res.render('users/forgot', {
        title: 'Forget your password?',
        message: req.flash('error')
    });
};

// sendReset
exports.sendReset = function(req, res){

  // get phone or email from form
  var phone = req.body.phone;
  var email = req.body.email;

  var renderError = function(err){
    res.render('users/forgot', {
        error: err
    });
  };

  // render success message
  var renderSuccess = function(email, phone){
    if(phone){
      // show instructions for sms reset
      req.flash('success', 'Success!  An text message was sent to your phone with password reset instructions.');
      res.render('users/forgot');
    }else{
      // show instructions for email reset
      req.flash('success', 'Success!  An email was sent with password reset instructions.');
      res.render('users/forgot');
    }
  };

  // send email
  var sendResetEmail = function(user, tokenModel){
    var resetUrl = 'http://app.yookhomai.com/reset/' + tokenModel.token;
    // send email notification of password reset
    var email_options = {
      promotion_name:"PasswordResetNotification",
      recipient: user.name + '<' + user.email + '>',
      subject:"Yookhomai password reset instructions.",
      from:'Yookhomai <no-reply@yookhomai.com>',
      raw_html:'<html><head><title>Password Reset instructions for your Yookhomai account</title></head>' +
                '<body><a href="' + resetUrl + '">Initiate password reset</a>' +
                    '[[tracking_beacon]]</body></html>'
    };

    madmimi.sendMail(email_options, function (transaction_id) {
      console.log("Email transaction for password reset is: " + transaction_id);
      // all done... render success message for email
      renderSuccess(user.email, false);
    });
  };

  var sendResetSms = function(user, tokenModel){
    var resetUrl = 'http://app.yookhomai.com/reset/' + tokenModel.token;
     //Send an SMS text message when loaded
    twilioClient.sendSms({
        to: user.phone, // Any number Twilio can deliver to
        from: config.twilio.defaultFrom, // A number you bought from Twilio and can use for outbound communication
        body: 'Reset your Yookhomai password by visiting ' + resetUrl // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio
        if (!err) { // "err" is an error received during the request, if any
          console.log('Sent password reset. from: ' + responseData.from + ' body: ' + responseData.body ); // outputs "+14506667788"
          renderSuccess(false, user.phone);
        }else{
           renderError(err);
        }
    });
  };

  // create token for user
  var createToken = function(user, viaEmail){
    var guid = uuid();
    var resetToken = new PasswordResetToken({key: user.id, token: guid});
    resetToken.save(function(err, newToken){
      if (err){ return renderError(err); }
      if(viaEmail){
        // send email with token
        sendResetEmail(user, newToken);
      }else{
        // send sms with token
        sendResetSms(user, newToken);
      }
    });
  };

  // enables user lookup by email
  var findByEmail = function(email){
      User
      .findOne({
          email: email.toLowerCase()
      })
      .exec(function(err, existingUser) {
          if (err){ return renderError(err); }
          if(existingUser){
              console.log('found existing user via email');
              if(existingUser.status == 'pending'){
                  renderError('Account status is pending.');
              }else{
                  // YAY ... found user ... now create token
                  createToken(existingUser, true);
              }
          }else{
              // worst case just save what was entered
              renderError('No user with this email.');
          }
      });
  };

  // enables lookup of user by phone
  var findByPhone = function(phone){
    User
    .findOne({
        phone: phone
    })
    .exec(function(err, existingUser) {
        if (err){ return renderError(err); }
        if(existingUser){
            console.log('found existing user via phone');

            // check if existing user has already set password
            if(existingUser.status == 'pending'){
                renderError('Account status is pending.');
            }else{
                // YAY ... found user ... now create token
                createToken(existingUser, false);
            }

        }else{
            // if not found via phone ... 
            renderError('No user with this phone number.');
        }
    });
  };

  // prefer to find by email
  if(email){ findByEmail(email); }
  else if(phone){ findByPhone(phone); }
  else{ renderError('Either email or phone is required.'); }

};

// resetForm
exports.resetForm = function(req, res){
  // TODO: implement token validation
  res.render('users/reset', {
      title: 'Reset password',
      token: req.params.token
  });
};

// doReset
exports.doReset = function(req, res){

  // define common way to handle errors
  var renderError = function(err){
    console.log('rendering error: ' + JSON.stringify(err));
    res.render('users/reset', {
        title: 'Reset password',
        token: params.token,
        errors: [err]
    });
  };

  var params = req.body ? {
    token: req.body.token,
    password: req.body.password,
    confirm: req.body.confirm
  } : { };
  if (! params.token || ! params.password || ! params.confirm) {
    return renderError(new Error('Both passwords are required.'));
  }

  if(params.password != params.confirm){
    return renderError(new Error('Passwords did not match.'));
  }

  // TODO: use passport module password requirements config
  if (params.password.length < 4) {
    return renderError(new Error('Password must be at least 4 characters'));
  }

  // TODO: implement success message
  var renderSuccess = function(user, success){
    req.flash('success', 'Thanks!  Your password has been reset.  Please sign in below.');
    // auto-login?
    res.redirect('/signin');
  };


  var findUser = function(tokenModel){
    // find and update user
    User.findOne({_id: tokenModel.key}, function(err, user) {
      if (err) {return renderError(err);}
      if (!user) { return renderError(new Error('Invalid token.')); }
      // set new password
      user.password = params.password;
      user.save(function(err){
        if (err) {return renderError(err);}

        // destroy token
        tokenModel.remove();

        // show success
        renderSuccess(user, true);
      });
    });
  };

  // find reset token
  PasswordResetToken.findOne({token: params.token}, function(err, tokenModel) {
    if (err){ return renderError(err); }
    if (!tokenModel){ return renderError(new Error('Your reset token has expired.  For security purposes, please request another password reset.')); }
    // check expiration
    if (Date.now() > tokenModel.expired) {
      tokenModel.remove();
      return renderError(new Error('Your reset token has expired.  For security purposes, please request another password reset.'));
    }
    console.log('Found valid reset token: ' + JSON.stringify(tokenModel));
    // otherwise continue validation by finding user
    findUser(tokenModel);
  });

};
