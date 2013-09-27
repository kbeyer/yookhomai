/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    Schema = mongoose.Schema;


// set default token timeout to 24 hours
var expireTimeout = 86400000;
// enable config override
if(config.auth && config.auth.passwordResetTimeout){ expireTimeout = config.auth.passwordResetTimeout; }

// Build the schema/model for token storage
var PasswordResetTokenSchema = new Schema({
  key: String,
  token: String,
  expires: {
    type: Date,
    default: function() {
      return new Date(Date.now() + expireTimeout);
    }
  }
});

passResetToken = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);

// Check for expired tokens periodically and remove them
setInterval(function() {
  var expired = {expires: {'$lte': new Date()}};
  passResetToken.remove(expired).exec();
});

// export schema
module.exports = passResetToken;