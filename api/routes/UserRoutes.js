const express = require("express");
const route = express.Router();
const VerifyToken = require("../middleware/Auth");
const {
  registerUser,
  findUserById,
  updateUser,
  loginUser,
  updateEthereumAddress,
} = require("../controllers/UserController");
const {
  createProfileUploadImage,
  updateProfileUploadImage,
} = require("../middleware/uploadImage");

route.post("/register", createProfileUploadImage, async (req, res) => {
  const image = req.file && req.file.filename;
  const { fullName, age, email, username, password, role, wallet } = req.body;
  try {
    const createdUser = await registerUser(
      fullName,
      age,
      email,
      username,
      password,
      image,
      role,
      wallet
    );
    if (createdUser) {
      return res.json({ msg: "User Created Successfully", status: 200 });
    }
    return res.json({ msg: "Username Or Email Already Exists", status: 403 });
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const authentifiedUser = await loginUser(username, password);
    if (authentifiedUser) {
      if (authentifiedUser == 1) {
        return res.json({ msg: "Wrong Credentials", status: 401 });
      } else {
        return res.json({
          msg: "Logged Successfully",
          token: authentifiedUser.token,
          userInfo: authentifiedUser.user,
          status: 200,
        });
      }
    }
    return res.json({ msg: "User Doesn't Exists", status: 404 });
  } catch (err) {
    return res.json({ msg: "Error Occured: " + err.message, status: 505 });
  }
});

route.put(
  "/update",
  VerifyToken,
  updateProfileUploadImage,
  async (req, res) => {
    const imageFile = req.file && req.file.filename;
    const { fullName, age, username, image, wallet } = req.body;
    const updatedUser = await updateUser(
      req.userId,
      fullName,
      age,
      username,
      image,
      imageFile,
      wallet
    );
    const updatedUserInfo = await findUserById(req.userId);
    try {
      if (updatedUser) {
        return res.json({
          msg: "User Updated Successfully",
          updatedUserInfo,
          status: 200,
        });
      } else {
        return res.json({ msg: "User Doesn't Exists", status: 404 });
      }
    } catch (err) {
      return res.json({ msg: "Error Occured: " + err.message, status: 505 });
    }
  }
);

route.post("/update-ethereum-address", VerifyToken, async (req, res) => {
  try {
    await updateEthereumAddress(req, res);
  } catch (err) {
    return res.status(500).json({ 
      success: false,
      message: "Error updating Ethereum address: " + err.message 
    });
  }
});

module.exports = route;
