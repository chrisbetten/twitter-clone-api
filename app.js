var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db = require('./queries.js');
const jwt = require('jsonwebtoken');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const { secret } = require('./config.js');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);



app.get('/tweets', db.getAllTweets);
app.get('/tweets/:username', db.getAllTweetsFromUser);
app.post('/tweets', db.postTweet);
app.get('/tweets/userinfo/:username', db.getUserInfoByUsername);


app.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await db.getUserByUsername(username);
  
    if (!user) {
      return res
      .status(401)
      .send({ error: 'Invalid username' })
    };
  
    if (password !== user.password) {
      return res
      .status(401)
      .send({ error: 'Wrong password' });
    }
  
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      name: user.name,
    }, Buffer.from(secret, 'base64'));
  
    res.send({ token });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


app.get('/session', async (req, res) => {
  const token = req.headers['x-auth-token'];

  try {
    const payload = jwt.verify(token, Buffer.from(secret, 'base64'));
    res.send({message: `You are authenticated as ${payload.username}`});
  } catch (error) {
    res.status(401).send({ error: 'Invalid token'});
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
