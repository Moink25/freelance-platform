const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const UserModel = new Schema(
  {
    fullName: String,
    age: Number,
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    password: String,
    role: String,
    image: { type: String, default: null },
    wallet: { type: Number, default: 0 },
    razorpayAccount: { type: String, default: null },
    ethereumAddress: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", UserModel);
