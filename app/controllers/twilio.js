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

exports.sms = function(request, response) {
  console.log('twilio.sms called from ' + request.host + ' with body ' + request.body);
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

        console.log('Recieved sms from: ' + from);

        var respondWithError = function(err){
          console.error('Error processing sms. Errors: ' + JSON.stringify(err));
          return response.send('<Response><Sms>Sorry. There was a problem.</Sms></Response>');
        };

        var createNewPrayer = function(user){
          var article = new Article(body);
          article.user = user;

          article.save(function(err) {
              if (err) {
                  return respondWithError(err);
              } 
              else {
                response.send('<Response><Sms>Got it.  Pray on..</Sms></Response>');
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
              var newUser = new User({name: from, email: from, phone: from, password: from});

              user.provider = 'local';
              user.save(function(err) {
                  if (err) {
                      return respondWithError(err);
                  }
                  createNewPrayer(user);
              });
            }else{
              createNewPrayer(user);
            }

        });

    }
    else {
        response.statusCode = 403;
        response.render('forbidden');
    }
    next();
};