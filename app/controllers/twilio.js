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

exports.voice = function(request, response){
  var from = request.param('From');
  console.log('Recieved a call from ' + from);

  response.header('Content-Type', 'text/xml');

  var respondWithError = function(err){
    console.error('Error processing voice call. Errors: ' + JSON.stringify(err));
    return response.send('<Response><Say>Sorry. There was a problem.  Try again later.</Say></Response>');
  };

  var recordNewPrayer = function(user){
    var greeting = 'Hi ';
    if(user && user.name && user.name !== user.phone){
      greeting += user.name + '.';
    }else{
      greeting += 'prayer warrior.';
    }
    greeting += '  Welcome to Yookhomai.  Record your prayer note after the tone.';

    response.send('<Response>' +
                    '<Say>' + greeting + '</Say>' +
                    '<Record maxLength="30" timeout="3" transcribeCallback="handle-transcription" action="handle-recording" />' +
                  '</Response>');
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
            recordNewPrayer(newUser);
        });
      }else{

        // check if this is a new user who sent email
        recordNewPrayer(user);
      }

  });

};

exports.handleTranscription = function(request, response){
  var from = request.param('From');
  var transcriptionStatus = request.param('TranscriptionStatus');
  var transcriptionText = request.param('TranscriptionText');
  var recordingUrl = request.param('RecordingUrl');
  console.log('Handling transcription from ' + from + ' with status ' + transcriptionStatus + ' and recording url ' + recordingUrl);

  Article.findOne({recordingUrl: recordingUrl}).exec(function(err, article) {
      if (err){ console.error('Error while finding article by recordingUrl ' + err); }
      if (!article){
        console.log('No article with recordingUrl ' + recordingUrl);
      }else{
        // append text to existing article
        article.title = '(audio) ' + transcriptionText.substring(0, 25) + '..';
        article.content = 'Recording Transcription: ' + transcriptionText;
        article.save(function(err) {
            if (err) {
                console.error('Error saving article with transcriptionText');
            } 
            else {
                console.log('Saved transcriptionText with article');
            }
        });
      }

  });

};

exports.handleRecording = function(request, response){
  var from = request.param('From');
  var recordingUrl = request.param('RecordingUrl');
  console.log('Handling recording from ' + from + ' with url ' + recordingUrl);

  response.header('Content-Type', 'text/xml');

  var respondWithError = function(err){
    console.error('Error processing voice call. Errors: ' + JSON.stringify(err));
    return response.send('<Response><Say>Sorry. There was a problem.  Try again later.</Say></Response>');
  };

  var respondWithSuccess = function(user, article){
    var message = 'Saved! Thanks for using Yookhomai.';
    switch(user.status){
      case "pending":
        message = message + ' Would you like us to text you a link to setup your account?';
        break;
      case "suspended":
        message = 'Sorry, your account is currently suspended.';
        break;
    }
    response.send('<Response><Say>' + message + '</Say></Response>');
  };

  var createNewPrayer = function(user){
    var article = new Article({title: 'Phone recording on ' + (new Date()).toString() });
    article.user = user;
    article.content = 'Audio recording ' + request.param('RecordingDuration') + 's)';
    article.recordingUrl = recordingUrl;
    article.source = "voice";

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

};

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
          article.source = 'sms';

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