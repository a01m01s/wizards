const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JW_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // NOTE secure:true means that only send the cookie on a secure connection
  // httpOnly:true means that this cookie cann't be accessed or modified by browser
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: false you don't need to implement this cause of below code,
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // TODO for having more securtiy
  // complete the below code
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.password
  // });

  const newUser = await User.create(req.body);
  // the jwt header will created automatically so we just provide the secret and payload (and option:: expire time)
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // const email = req.body.email;
  // const {email} = req.body;
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // const user = User.findOne({email:email})
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 means unauthorised
    return next(new AppError('Incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // normal way::
  // jwt.verify(token,process.env.JWT_SECRET,()=>{})

  // write it with promises
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The token belonging to this user does no longer exist', 401)
    );
  }

  // iat:: issued at
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again', 401)
    );
  }
  // Grant access to protected route

  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // iat:: issued at
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // Grant access to protected route

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// NOTE because we can not pass arguments
// to a middleware function so we need
// a wrapper

// wrapper
exports.restrictTo = (...roles) => {
  // middleware function
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log(req.user.role);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  const resetToken = user.createPasswordResetToken();

  // NOTE because when we set passwordResetExpires
  // we have just modified that and now we must save it
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password submit a PATCH request with your new password and passwordConfirm to ${resetURL}\nIf you didn't forget your password please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(valid for 10 min)',
      message
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again later', 500)
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (await !user.correctPassword(req.body.passwordCurrent, user.password)) {
    return next(new AppError('You current password is wrong', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  createSendToken(user, 200, res);
});
