const crypto = require('crypto');
const { promisify } = require('util');
const User = require(`./../models/userModel`);
const jwt = require('jsonwebtoken');
const catchAsyncErrors = require('./../utls/catchAsyncError');
const AppError = require('./../utls/appError');
const sendEmail = require('./../utls/sendEmail');
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signUp = catchAsyncErrors(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createSendToken(newUser, 201, res);
});
exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if there is email and pass
  if (!email || !password) {
    return next(new AppError('pleas enter email and password'), 400);
    // return to stop function working
  }

  //2)check if email and pass exists &&pass correct
  const currentUser = await User.findOne({ email }).select('+password');
  if (
    !currentUser ||
    !(await currentUser.correctPassword(password, currentUser.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //3) if everything is okay return jwt token
  createSendToken(currentUser, 200, res);

  next();
});
exports.protectRoutes = catchAsyncErrors(async (req, res, next) => {
  //1)Getting token if there is token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(new AppError('your are not logged in! please login '), 401);
  //2) Validation for token
  const decodedData = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // Advanced PRODUCTION AND SECURITY
  //3) Check if user still exist
  const currentUser = await User.findById(decodedData.id);
  if (!currentUser)
    return next(new AppError('user not exist please try again ', 404));
  //4) Check if user change password after token was issued
  if (currentUser.changePasswordAfter(decodedData.iat)) {
    return new AppError('user changed password , login with new one ', 401);
  }
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you are not allowed to do that operation'),
        403
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  //1) find user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return new AppError('no user found with this email', 404);
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new sendEmail(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3)update passwordChangedAt at property

  //4)login user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  //1) get user
  //!!!!!!!!Do not use findIyiIdAndUpdate with pass or token
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return new AppError('no user found', 404);
  }
  // 2) check if password okay or no
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('currentPassword is not correct'), 401);
  }
  //3) if okay changePassword

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4)login send token
  createSendToken(user, 200, res);

  next();
});
