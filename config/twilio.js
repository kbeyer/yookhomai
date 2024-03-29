//require the Twilio module and create a REST client
var twilio = require('twilio'),
    config = require('./config'),
    client = twilio(config.twilio.accountSid, config.twilio.authToken),
    os = require('os'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var loadedMessage = 'Twilio client loaded for env: ' + env + ', host: ' + os.hostname();
console.log(loadedMessage);

// send text when not on development
if(env != 'development'){
    //Send an SMS text message when loaded
    client.sendSms({

        to: config.twilio.adminTo, // Any number Twilio can deliver to
        from: config.twilio.defaultFrom, // A number you bought from Twilio and can use for outbound communication
        body: loadedMessage // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

            // "responseData" is a JavaScript object containing data received from Twilio.
            // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
            // http://www.twilio.com/docs/api/rest/sending-sms#example-1

            console.log(responseData.from); // outputs "+14506667788"
            console.log(responseData.body); // outputs "word to your mother."

        }else{
            console.error(JSON.stringify(err));
        }
    });
}

module.exports = client;