/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    config = require('../../config/config'),
    _ = require('underscore'),
    Schema = mongoose.Schema;


/**
 * Article Schema
 */
var ArticleSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        default: '',
        trim: true
    },
    content: {
        type: String,
        default: '',
        trim: true
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    recordingUrl: {
        type: String
    },
    source: {
        type: String
    },
    status: {
        type: String,
        default: 'active' // [active, answered, unnswered, removed]
    },
    tags: {
        type: [String],
        index: true
    }
});

/**
 * Validations
 */
ArticleSchema.path('title').validate(function(title) {
    return title.length;
}, 'Title cannot be blank');

/**
 * Setters
 */
ArticleSchema.path('title').set(function(title){
    // auto-set tags
    if(title){
        var hashtagPattern = /(^|\s)#([^ ]*)/g;
        // get array of tags
        var tagList = title.match(hashtagPattern);
        // combine trimmed, '#' removed tags with existing list
        _.union(this.tags, _.map(tagList, function(s){ return s.trim().substring(1); }));
    }
    return title;
});

/**
 * Statics
 */
ArticleSchema.statics = {
    load: function(id, cb) {
        this.findOne({
            _id: id
        }).populate('user').exec(cb);
    },
    findByTag: function(tag, cb){
        this.find({tags: tag}).populate('user').exec(cb);
    }
};

mongoose.model('Article', ArticleSchema);