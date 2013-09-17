/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Article = mongoose.model('Article'),
    config = require('../../config/config'),
    async = require('async'),
    _ = require('underscore'),
    twiliosig = require('twiliosig');

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

exports.sms = function(request, response) {
  if (twiliosig.valid(request, config.twilio.authToken) || config.twilio.disableTwilioSigCheck) {

        console.log('twilio sig valid');

        response.header('Content-Type', 'text/xml');
        var body = '';
        if(request.param('Body')){
          body = request.param('Body').trim();
        }
        
        // the number the vote it being sent to (this should match an Event)
        var to = request.param('To');
        
        // the voter, use this to keep people from voting more than once
        var from = request.param('From');

        console.log('Recieved sms from: ' + from + ' with body "' + body + '"');

        var respondWithError = function(err){
          console.error('Error processing sms. Errors: ' + JSON.stringify(err));
          return response.send('<Response><Sms>Sorry. There was a problem.</Sms></Response>');
        };

        var respondWithSuccess = function(user, article){
          var message = 'Saved! Thanks for using Yookhomai.';
          switch(user.status){
            case "pending":
              message = message + ' Now you can setup and manage your account at http://app.yookhomai.com/signup?phone=' + encodeURIComponent(from);
              break;
            case "suspended":
              message = 'Sorry, your account is currently suspended.';
              break;
          }
          response.send('<Response><Sms>' + message + '</Sms></Response>');
        };

        var createNewPrayer = function(user){
          var article = new Article({title: body});
          article.user = user;

          article.save(function(err) {
              if (err) {
                  return respondWithError(err);
              } 
              else {
                  return respondWithSuccess(user, article);
              }
          });

        };

        // try to find user
        User
        .findOne({
            phone: from
        })
        .exec(function(err, user) {
            if (err){ return respondWithError(err); }
            if (!user){
              // NOTE: auto-creating new user for this phone number
              var newUser = new User({name: from, 
                                      email: from, 
                                      phone: from, 
                                      password: makeid(), 
                                      verificationKey: makeid()});

              newUser.provider = 'local';
              newUser.save(function(err) {
                  if (err) {
                      return respondWithError(err);
                  }
                  createNewPrayer(newUser);
              });
            }else{

              // check if this is a new user who sent email


              createNewPrayer(user);
            }

        });

    }
    else {
        response.statusCode = 403;
        response.render('forbidden');
    }

};