const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const filterObj = require("./utils/filterObj");

const signToken = (userId = jwt.sign({ userId }, process.env.JWT_SECRET));

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
    res.status(400).json({
      status: "error",
      message: "Email is already in use please login",
    });
  } else if (existing_user) {
    // user is not verified
    await User.findOneAndUpdate({ email: email }, filterBody, {
      new: true,
      validateModifiedOnly: true,
    });

    req.userId = existing_user._id;
    next();
  } else {
    // user record is not found...
    const new_user = await User.create(filterBody);

    //Generate OTP & send the Email...
    req.userId = new_user._id;
    next();
  }
};

//Send the OTP
exports.sendOtp = async (req, res, next) => {
  const { userId } = req;
  const new_otp = otpGenerator(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  //otpo is valid for the 10 mins only...
  const otp_expiry_time = Date.now() + 10 * 60 * 1000;

  await User.findByidAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  });
  //TODO Send mail...

  res.status(200).json({
    status: "Success",
    message: "OTP Sent Successfully!",
  });
};

// Verify the OTP and upadate the record accordingly....
exports.verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    otp_expiry_time,
  });

  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Email is invalid or OTP Expired",
    });
  }

  if (!(await user.correctOTP(otp, user.otp))) {
    res.status(400).json({
      status: "error",
      message: "OTP is invalid",
    });
  }

  user.verified = true;
  user.top = undefined;

  await user.save({ new: true, validateModifiedOnly: true });

  const token = signToken(user._id);

  res.status(200).json({
    status: "Success",
    message: "OTP Verified Successfully",
    token,
  });
};

//Login...
exports.login = async (req, res, next) => {
  const { email, Password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both Email & password is required",
    });
  }

  const userDoc = await User.findOne({ email: email }).select("+password");

  if (
    !userDoc ||
    !(await userDoc.correctPassword(password, userDoc.password))
  ) {
    res.status(400).json({
      status: "error",
      message: "Email or Password is incorrect",
    });
  }

  const token = signToken(userDoc._id);

  res.status(200).json({
    status: "Success",
    message: "Logged in Successfully",
    token,
  });
};

exports.forgotPassword = async (req, res, next) => {

}

exports.resetPassword = async (req, res, next) => {
  
}
