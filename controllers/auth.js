const jwt = require("jsonwebtoken");
const User = require("../models/user");

const signToken = (userId) = jwt.sign({userId}, process.env.JWT_SECRET);


exports.login = async (req, res, next) => {
  const { email, Password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both Email & password is required",
    });
  }

  const userDoc = await User.findOne({ email: email }).select("+password");

  if (!userDoc || !(await userDoc.correctPassword(password, userDoc.password))) {
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
