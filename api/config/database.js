require("dotenv").config();
const mongoose = require("mongoose");

const MongoConnect = () => {
  // Get MongoDB Atlas connection string from .env
  const mongoURI = process.env.MONGODB;

  if (!mongoURI) {
    console.log(
      "MongoDB connection string is missing. Please check your .env file."
    );
    return;
  }

  try {
    mongoose
      .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      })
      .then(() => {
        console.log("Database Connected to MongoDB Atlas");
      })
      .catch((err) => {
        console.log("Database Connection Error: " + err.message);
        console.log(
          "Warning: Running without MongoDB connection. Some features may not work."
        );
      });
  } catch (error) {
    console.log("MongoDB Connection Error: " + error.message);
    console.log(
      "Warning: Running without MongoDB connection. Some features may not work."
    );
  }
};

module.exports = MongoConnect;
