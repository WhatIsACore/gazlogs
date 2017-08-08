'use strict';

// includes
var logger = require('winston');
const config = require('./includes/config');

// rabbitMQ web/worker communication module
var amqp = require('./includes/amqp');
amqp.start(init);

// authentication
var passport = require('./includes/passport');
var session = require('express-session');

// express middleware
var compression = require('compression');
var minify = require('express-minify');
var favicon = require('serve-favicon');
var routing = require('./includes/routing');
var queries = require('./includes/queries');

// database
var mongoose = require('mongoose');
mongoose.connect(config.mongodb_key);
var db_User = require('./models/user');

// server
var express = require('express'),
    app = express(),
    serv;

// configure view engine
app.set('views', __dirname + '/public');
app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

// redirect to https
if(!config.debug){
  app.get('*', routing.forceHTTPS);
  serv = require('http').Server(app);
} else {
  // https server created in this way only on localhost testing (debug mode)
  serv = require('https').createServer({
    key: config.ssl_key,
    cert: config.ssl_cert,
    requestCert: false,
    rejectUnauthorized: false
  }, app);
}

// start receiving requests
function init(){
  app.use(compression());
  if(!config.debug) app.use(minify());
  app.use(favicon(__dirname + '/public/img/favicon.png'))
      .use(session({secret: config.session_secret, resave: true, saveUninitialized: true}))
      .use(passport.initialize())
      .use(passport.session())
      .use('/css', express.static('public/css'))
      .use('/js', express.static('public/js'))
      .use('/img', express.static('public/img'))
      .use('*', routing.addProfileHeaders)
      .get('/', routing.render('index', false, false))
      .get('/statistics', routing.render('statistics', 'HotS Statistics', 'statistics'))
      .get('/leaderboard', routing.render('leaderboard', 'Leaderboard', 'leaderboard'))
      .get('/exchange', routing.render('exchange', 'Doubloon Exchange', 'exchange'))
      .get('/upload', function(req, res){
        routing.render('upload', 'Upload Replays', 'upload', {
          loggedIn: req.isAuthenticated(),
          ultoken: req.auth ? req.auth.battletag : ''
        })(req, res);
      })
      .get('/profile', routing.requireAuth, function(req, res){
        queries.countReplaysWithUser(req.auth, function(n){
          if(n > 0){
            queries.getReplaysByUser(req.auth, null, function(replays){
              routing.render('profile', req.auth.username + '\'s Profile', 'user', {
                replaysUploaded: req.auth.replaysUploaded,
                replaysIn: n,
                replays: replays
              })(req, res);
            });
          } else {
            routing.render('profile', req.auth.username + '\'s Profile', 'user', {
              replaysUploaded: req.auth.replaysUploaded,
              replaysIn: 0,
              replays: []
            })(req, res);
          }
        })
      })
      .get('/replay/*', function(req, res){
        queries.getReplay(req.originalUrl.substring(8), function(replay){
          if(replay){
            routing.render('replay', 'Replay Viewer', 'statistics', replay)(req, res);
          } else {
            routing.render('replayMissing', 'Replay Not Found', 'statistics')(req, res);
          }
        });
      })
      .get('/auth', routing.noAuth, function(req, res){
        res.redirect('/auth/login');
      })
      .get('/auth/login', routing.noAuth, function(req, res){
        routing.render('login', 'Log In', 'user', req.auth)(req, res);
      })
      .get('/auth/callback', routing.authenticate)
      .get('/auth/logout', function(req, res){
        req.logout();
        res.redirect('/auth/login');
      })
      .get('/auth/nydus', routing.noAuth, function(req, res, next){
        if(req.query.callback) req.session.callback = req.query.callback;
        next();
      }, passport.authenticate('bnet'))
      .get('*', function(req, res){
        res.status(404).render('404', {title: '404', nav: false, auth: req.auth});
      });

  // start the server
  serv.listen(config.port, function(){
    logger.log('info', 'starting server on port ' + config.port);
  });
}
