var _ = require('underscore');

// Load app configuration

var config = _.extend(
  require(__dirname + '/../config/env/all.js'),
  require(__dirname + '/../config/env/' + process.env.NODE_ENV + '.json') || {}) ;

// override mongoURI based on environment
config.db = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || config.db;

module.exports = config;