/*
   - require express : its nodejs framwork
   - at end exports our app.js
*/
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utls/appError');
const app = express();
const tourRouter = require('./route/tourRouter');
const userRouter = require('./route/userRouter');
const reviewRouter = require('./route/reviewRouter');
const bookingRouter = require('./route/bookingRouter');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// know ip user and count number of req
const rateLimit = require('express-rate-limit');
// 1) GlOBAL Middleware
// work in all ROUTES
// set Security http Headers
///!!!!prefer to Be First MiddleWare
app.use(helmet());
// dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limiter n of requests
const limiter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000, // try after one hour
  message: 'to many requests from same ip',
});
//use next fo allllllllllllllllll ('/api)
app.use('/api', limiter);
/*
 this is our middleware : middleware some processes or functions 
 our program do it one after one 
 ** most important key word is next()
*/
//1) read data from body into (req.body)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
//2) Date sanitization against NoSql injection
app.use(mongoSanitize());
//3) Date sanitization against xss
app.use(express.static(path.join(__dirname, 'public')));

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      // whiteList with allow duplicate queries
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'price',
      'ratingsQuantity',
    ],
  })
);
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // when creating headers own self
  //1) name :Authorization
  //2) Value : starts with Bearer space second value
  next();
});

// 3) our routes
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// handle url mistakes like 'api/tours'
app.all('*', (req, res, next) => {
  // const err = new Error(`can't find ${req.originalUrl} try again`);
  // err.status = 'failed';
  // err.statusCode = 404;

  // if we put any argument in next Express know that its an error
  // then its jump to err handler middleware
  // err is an object instance from error class or any child inhert
  next(new AppError(`can't find ${req.originalUrl} try again`), 404);
});

// handler errors middleware
app.use(globalErrorHandler);
module.exports = app;
