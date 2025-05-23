require("dotenv").config();
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { existsSync, unlinkSync } = require("fs");

const userExists = async (email) => {
  const selectedUser = await User.findOne({ email });
  return selectedUser;
};
const findUsers = async () => {
  const allUsers = await User.find();
  return allUsers;
};
const findUserById = async (id) => {
  const selectedUser = await User.findById(id);
  if (selectedUser) return selectedUser;
  else return null;
};
const registerUser = async (
  fullName,
  age,
  email,
  username,
  password,
  image,
  role,
  wallet
) => {
  const allUsers = await findUsers();
  const userExists = allUsers.find(
    (e) => e.email == email || e.username == username
  );
  if (userExists) {
    return null;
  } else {
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);
    let newImage;
    if (image) {
      newImage = image;
    } else {
      newImage = "no-image.png";
    }

    const walletAmount = wallet ? parseFloat(wallet) : 0;

    const createdUser = await User.create({
      fullName,
      age,
      email,
      username,
      password: newPassword,
      role,
      image: newImage,
      wallet: walletAmount,
    });
    return createdUser;
  }
};
const loginUser = async (username, password) => {
  const allUsers = await findUsers();
  const userExists = allUsers.find((e) => e.username == username);
  if (userExists) {
    const result = await bcrypt.compare(password, userExists.password);
    if (result) {
      const token = jwt.sign({ userId: userExists._id }, process.env.SECRET);
      return {
        token,
        user: userExists,
      };
    }
    return 1;
  } else {
    return null;
  }
};

const updateUser = async (
  userId,
  fullName,
  age,
  username,
  image,
  imageFile,
  wallet
) => {
  const selectedUser = await findUserById(userId);
  if (selectedUser) {
    let newImage;
    if (image == undefined && imageFile == undefined) {
      image = selectedUser.image;
    } else if (image == "no-image.png" && imageFile == undefined) {
      if (existsSync(`./uploads/Users_imgs/${selectedUser.image}`)) {
        unlinkSync(`./uploads/Users_imgs/${selectedUser.image}`);
      }
      newImage = "no-image.png";
    } else if (image == null && imageFile != null) {
      if (existsSync(`./uploads/Users_imgs/${selectedUser.image}`)) {
        unlinkSync(`./uploads/Users_imgs/${selectedUser.image}`);
      }
      newImage = imageFile;
    }

    const updateData = {
      fullName,
      age,
      username,
      image: newImage,
    };

    // Only update wallet if provided
    if (wallet !== undefined) {
      updateData.wallet = parseFloat(wallet);
    }

    const updatedUser = User.updateOne({ _id: selectedUser._id }, updateData);
    return updatedUser;
  } else {
    return null;
  }
};

// Update user's Ethereum address
const updateEthereumAddress = async (req, res) => {
  try {
    console.log("updateEthereumAddress called with:", {
      userId: req.userId,
      body: req.body
    });
    
    // Get userId from request
    const userId = req.userId;
    
    if (!userId) {
      console.error("userId is undefined in updateEthereumAddress");
      return res.status(400).json({
        success: false,
        message: "User ID not found in request",
      });
    }
    
    const { ethereumAddress } = req.body;

    if (!ethereumAddress) {
      return res.status(400).json({
        success: false,
        message: "Ethereum address is required",
      });
    }

    console.log(`Updating Ethereum address to ${ethereumAddress} for user ${userId}`);

    // Find the user first to make sure they exist
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(`Found user: ${user.username} (${user._id})`);

    // Update the user's Ethereum address
    user.ethereumAddress = ethereumAddress;
    await user.save();
    
    console.log(`Successfully updated Ethereum address for user ${user.username}`);
    
    return res.status(200).json({
      success: true,
      message: "Ethereum address updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        ethereumAddress: user.ethereumAddress,
      },
    });
  } catch (error) {
    console.error("Error updating Ethereum address:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating Ethereum address: " + error.message,
    });
  }
};

module.exports = {
  userExists,
  findUserById,
  findUsers,
  registerUser,
  loginUser,
  updateUser,
  updateEthereumAddress,
};
