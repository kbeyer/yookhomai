//require the imap module
var Imap = require('imap'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Article = mongoose.model('Article'),
    config = require('./config'),
    MailParser = require("mailparser").MailParser,
    os = require('os'),
    fs = require('fs'),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    inspect = require('util').inspect;


module.exports = function(){

  var imap = new Imap({
    user: config.imap.username,
    password: config.imap.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.secure,
    tlsOptions: { rejectUnauthorized: false }
  });


  var handleError = function(via, err){
    console.error(via + ' ' + err);
    return false;
  };

  var openInbox = function(cb) {
    imap.openBox('INBOX', false, cb);
  };

  var newAccountEmail = function(user, article){
    console.log('New account auto-created for ' + user.name + ' from email: ' + article.title);
    // TODO : send email notification of new account with setup link
  };
  var savedNotificationEmail = function(user, article){
    console.log('New article created via email for ' + user.name + ' with title: ' + article.title);
    // TODO : send email notification of saved prayer
  };
  var errorNotificationEmail = function(mail, user, err){
    console.error('Error creating new article from email. Subject: ' + mail.subject + ' User: ' + user.name + ' err: ' + err);
    // TODO : send email notification of error saving prayer
  };

  var createNewPrayer = function(mail, user, next){
    var article = new Article({
      title: mail.subject,
      content: mail.html, // TODO: html or text here?
      user: user,
      source: 'email'
    });

    article.save(function(err) {
        if (err) {
            errorNotificationEmail(mail, user, err);
            return handleError(err);
        } 
        else {
          if(next){
            return next(user, article);
          }
        }
    });

  };

  var createFromMail = function(mail){
    var fromEmail = mail.from[0].address;
    var fromName = mail.from[0].name;
    // try to find user by email
    User
    .findOne({
        email: fromEmail.toLowerCase()
    })
    .exec(function(err, user) {
        if (err){ return handleError(err); }
        if (!user){
          // NOTE: auto-creating new user for this email
          var newUser = new User({name: fromName ? fromName : fromEmail,
                                  email: fromEmail,
                                  phone: fromEmail,
                                  password: 'asdfasdfasdf'});

          newUser.provider = 'local';
          newUser.save(function(err) {
              if (err) {
                  return handleError(err);
              }
              createNewPrayer(mail, newUser, newAccountEmail);
          });
        }else{

          // check if this is a new user who sent email
          createNewPrayer(mail, user, savedNotificationEmail);
        }

    });
  };

  var processAllMessages = function(){
    var f = imap.seq.fetch('1:*', {
      bodies: '',
      struct: true
    });

    f.on('message', function(msg, seqno) {
      console.log('Message #%d', seqno);
      var prefix = '(#' + seqno + ') ';

      var parser = new MailParser({ streamAttachments: true });

      /* TODO: implement full attachment support
      parser.on('attachment', function(attachment){
        console.log(prefix + ' Attachment:  ' + attachment.generatedFileName);
        var output = fs.createWriteStream(attachment.generatedFileName);
        attachment.stream.pipe(output);
      });
      */

      parser.on("end", function(mail_object){
        console.log("+++ DONE PARSING +++");
        //console.log("References:", mail_object.references);
        console.log("From:", mail_object.from); //[{address:'sender@example.com',name:'Sender Name'}]
        console.log("Subject:", mail_object.subject); // Hello world!
        //console.log("Html body:", mail_object.html); // How are you today?
        //console.log("Attachment:", mail_object.attachments);

        // try to save new article
        createFromMail(mail_object);
      });

      msg.on('body', function(stream, info) {
        console.log(prefix + ' message body');
        // send full body text to mailparser
        stream.pipe(parser);
      });

      msg.once('end', function() {
        console.log(prefix + 'Finished');
      });

    });

    f.once('error', function(err) {
      return handleError('Fetch error' + err);
    });

    f.once('end', function() {
      console.log('Done fetching all messages!');
      // mark all processed
      imap.move('1:*', 'processed', function(err){
        if(err){ return handleError('imap.move', err); }
      });
    });
  };

  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err){ return handleError('openInbox', err); }

      // NOTE: new mail event will be fired on mailbox open ...
      // that will kick off processing of messages
    });
  });

  imap.on('mail', function(newMessages) {
    console.log('NEW MAIL! (' + newMessages + ')');
    processAllMessages();
  });

  imap.once('error', function(err) {
    return handleError('imap.once.error', err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });


  // now initiate connection
  imap.connect();

};