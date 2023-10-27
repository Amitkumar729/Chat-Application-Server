const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const filterObj = require("./utils/filterObj");
const crypto = require("crypto");
const { promisify } = require("util");
const mailService = require("../services/mailer");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);
//Signup - register - Send OTP - Verify OTP...

//Register
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "email",
    "password"
  );

  // check if the verfied user with the given email exist...
  const existing_user = await User.findOne({ email: email });

  if (existing_user && existing_user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already in use, please login",
    });
  } else if (existing_user) {
    // user is not verified, then update the previous one...
    await User.findOneAndUpdate({ email: email }, filterBody, {
      new: true,
      validateModifiedOnly: true,
    });

    //Generate OTP & send the Email...
    req.userId = existing_user._id;
    next();
  } else {
    // user record is not found, then create a new one...
    const new_user = await User.create(filterBody);

    //Generate OTP & send the Email...
    req.userId = new_user._id;
    next();
  }
};

//Send the OTP
exports.sendOtp = async (req, res, next) => {
  const { userId } = req;

  const new_otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  //otpo is valid for the 10 mins only...
  const otp_expiry_time = Date.now() + 10 * 60 * 1000;

  const user = await User.findByIdAndUpdate(userId, {
    otp_expiry_time: otp_expiry_time,
  });

  user.otp = new_otp.toString();

  await user.save({ new: true, validateModifiedOnly: true });
  console.log(new_otp);

  // TODO...  Send OTP to Email using the SendGrid
  // mailService.sendEmail({
  //   from: "demo@gmail.com",
  //   to: user.email,
  //   subject: "Verification OTP!",
  //   text: `Your OTp is ${new_otp}, This is valid for 10 mins.`,
  //   attachments: [],
  // });

  res.status(200).json({
    status: "Success",
    message: "OTP Sent Successfully!",
  });
};

// Verify the OTP and upadate the record accordingly....
exports.verifyOTP = async (req, res, next) => {
  // verify otp and update user accordingly
  const { email, otp } = req.body;
  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP expired",
    });
  }

  //If user is already verified...
  if (user.verified) {
    return res.status(400).json({
      status: "error",
      message: "Email is already verified",
    });
  }

  //otp is incorrect...
  if (!(await user.correctOTP(otp, user.otp))) {
    res.status(400).json({
      status: "error",
      message: "OTP is incorrect",
    });
    return;
  }

  // OTP is correct
  user.verified = true;
  user.otp = undefined;
  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "OTP verified Successfully!",
    token,
    user_id: user._id,
  });
};

//Login...
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both Email & password is required",
    });
    return;
  }

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !user.password) {
    res.status(404).json({
      status: "error",
      message: "Incorrect password",
    });

    return;
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(404).json({
      status: "error",
      message: "Email or Password is incorrect",
    });
    return;
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "Success",
    message: "Logged in Successfully",
    token,
  });
};

exports.protect = async (req, res, next) => {
  //1- getting token (JWT) and checking if it's there...

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    req.status(400).json({
      status: "error",
      message: "Your are not Logged in Please log in to get the access",
    });
    return;
  }

  //2- Verification of the token...
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3- Check if the user still exist...
  const this_user = await User.findById(decoded.userId);

  if (!this_user) {
    res.status(400).json({
      status: "error",
      message: "The user doesn't exist",
    });
  }

  //4- check if user changed their password after token wa issued....
  if (this_user.changedPasswordAfter(decoded.iat)) {
    res.status(400).json({
      status: "error",
      message: "User recently updated the password, Please login again",
    });
  }

  req.user = this_user;

  next();
};

//Forgot password
exports.forgotPassword = async (req, res, next) => {
  //1st step- get the users email...
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "There is no user with the given email Address",
    });
  }

  //Generate the random reset token...
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `https://tawk.com/auth/new-password?code=${resetToken}`;
     
   console.log(resetToken);

    // TODO Send Email with the reset URL later using the sendGrid....
    {
      /*
        mailService.sendEmail({
      from: "shreyanshshah242@gmail.com",
      to: user.email,
      subject: "Reset Password",
      html: resetPassword(user.firstName, resetURL),
      attachments: [],
    });
   */
    }

    

    res.status(200).json({
      status: "Success",
      message: "Reset Password Link sent to the Email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "error",
      message: "There was an error sending the email, Please try again later.",
    });
  }
};

//Reset password
exports.resetPassword = async (req, res, next) => {
  //1... Get the user based on the token...
  const hashedToken = crypto
  .createHash("sha256")
  .update(req.body.token)
  .digest("hex");

const user = await User.findOne({
  passwordResetToken: hashedToken,
  passwordResetExpires: { $gt: Date.now() },
});

  //2... If token has expired or submission is out of time window...
  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Token is invalid or expired",
    });
  }

  //3... update the password and set the reset token & expiry to undefined...
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4... Login the user and send the new JWT...

  //TODO Send an email to the user informing about the password reset...

  const token = signToken(user._id);

  res.status(200).json({
    status: "Success",
    message: "Password has been Reset Successfully",
    token,
  });
};
