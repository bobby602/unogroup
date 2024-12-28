var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
// const flash = require('connect-flash')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var quaterRouter = require('./routes/quater');
var quater2Router = require('./routes/quater2');
var priceList = require('./routes/priceList');
// var testRouter = require('./routes/users/test');

// app.use('/css', express.static(path.join('/public/stylesheets', 'bootsrap.min.css')));
app.use(express.static(path.join(__dirname, '/public')));
// app.use('/js', express.static(path.join(_dirname, 'node_modules/bootstrap/dist/js')));

// app.use((req,res,next)=>{
//   res.locals.error = req.flash('error')
//   next()
// })
app.use('/', loginRouter);
app.use('/users', usersRouter);
app.use('/quater', quaterRouter);
app.use('/quater2', quater2Router);
app.use('/priceList', priceList);

// app.get('/test/new',(req,res)=>{
//     res.render('/test/new');
// });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/test-error', (req, res) => {
  throw new Error('Simulated Server Error');
});
app.get('/timeout', (req, res) => {
  setTimeout(() => {
      res.send('Delayed response');
  }, 10000); // 10 seconds delay
});

app.use(function(req, res, next) {
  console.error('Error caught:', err.stack);
  res.status(500).send('Internal Server Error');
  });


  module.exports = app;