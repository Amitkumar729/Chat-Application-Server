const User = require("../models/user");
const filterObj = require("./utils/filterObj");
const FriendRequest = require("../models/friendRequest");

exports.updateMe = async (req, res, next) => {
  const { user } = req;

  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avatar"
  );

  const updated_user = await User.findByIdAndUpdate(user._id, filterBody, {
    new: true,
    validateModifyOnly: true,
  });

  res.status(200).json({
    status: "Success",
    data: updated_user,
    message: "Profile Updated Successfully",
  });
};

exports.getUsers = async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user;

  const remaining_users = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "User found Successfully!",
  });
};

exports.getRequest = async (req, res, next) => {
  const requests = await FriendRequest.find({
    recipent: req.user._id,
  }).populate("sender", "_id firstName lastName");

  req.status(200).json({
    status: "success",
    data: requests,
    message: "Friends Request Found Successfully!",
  });
};

exports.getFriends = async (req, res, next) => {
  const friends = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );

  req.status(200).json({
    status: "success",
    data: friends,
    message: "Friends Found Successfully!",
  });
};
