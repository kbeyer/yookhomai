/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    async = require('async'),
    _ = require('underscore'),
    twiliosig = require('twiliosig');

exports.sms = function(request, response) {
  if (twiliosig.valid(request, config.twilio.authToken) || config.twilio.disableTwilioSigCheck) {
        response.header('Content-Type', 'text/xml');
        var body = request.param('Body').trim();
        
        // the number the vote it being sent to (this should match an Event)
        var to = request.param('To');
        
        // the voter, use this to keep people from voting more than once
        var from = request.param('From');

        console.log('Accepting vote: ' + event.name + ', ' + from);
        response.send('<Response><Sms>Got it.  Pray on..</Sms></Response>');

    }
    else {
        response.statusCode = 403;
        response.render('forbidden');
    }
};