const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is Required"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is Required"],
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `Email (${props.value}) is invalid!`,
    },
  },
  password: {
    // unselect
    type: String,
  },
  passwordConfirm: {
    // unselect
    type: String,
  },
  passwordChangedAt: {
    // unselect
    type: Date,
  },
  passwordResetToken: {
    // unselect
    type: String,
  },
  passwordResetExpires: {
    // unselect
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    // unselect
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: Number,
  },
  otp_expiry_time: {
    type: Date,
  },
});

//OTP encryption...
userSchema.pre("save", async function (next) {
  // Only run this function if otp is modified....
  if(!this.isModified("otp")){
    return next();
  }

  // Hash the otp with the cost of 12...
  this.otp = await bcryptjs.hash(this.otp, 12);
  next();
});

//Password encryption...
userSchema.pre("save", async function (next) {
  // Only run this function if password is modified....
  if(!this.isModified("password")){
    return next();
  }

  // Hash the password with the cost of 12...
  this.password = await bcryptjs.hash(this.password, 12);
  next();
});

//For checking the correct password...
userSchema.methods(correctPassword) = async function(
    candidatePassword, // user input
    userpassword,     // saved password
) {
    return await bcrypt.compare(candidatePassword, userpassword);
};

//For checking the correct otp...
userSchema.methods(correctOTP) = async function(
    candidateOTP, // user input
    userOTP,     // saved password
) {
    return await bcrypt.compare(candidateOTP, userOTP);
};

userSchema.methods.createPasswordResetToken = function () {

  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToekn;
};

userSchema.methods.changedPasswordAfter = function (timestamp) {

  return timestamp < this.passwordChangedAt;

};




const User = new mongoose.model("User", userSchema);

module.exports = User;
