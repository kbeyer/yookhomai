if(process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Yookhomai' // optional
  });
}

/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs'),
    passport = require('passport'),
    logger = require('mean-logger');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

//Load configurations
//if test env, load example file
var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config'),
    auth = require('./config/middlewares/authorization'),
    mongoose = require('mongoose');

// load twilio
var twilioClient = require('./config/twilio');

//Bootstrap db connection
var db = mongoose.connect(config.db);

//Bootstrap models
var models_path = __dirname + '/app/models';
fs.readdirSync(models_path).forEach(function(file) {
    require(models_path + '/' + file);
});


// load imap listener
// NOTE: this should happen after models are registered
var imapClient = require('./config/imap')();

//bootstrap passport config
require('./config/passport')(passport);

var app = express();

//express settings
require('./config/express')(app, passport);

//Bootstrap routes
require('./config/routes')(app, passport, auth);

//Start the app by listening on <port>
var port = config.port;
app.listen(port);
console.log('Express app started on port ' + port);

//Initializing logger 
logger.init(app, passport, mongoose);

//expose app
exports = module.exports = app;