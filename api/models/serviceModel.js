const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ServiceModel = new Schema(
  {
    title: String,
    description: String,
    price: Number,
    images: String,
    userId: Schema.Types.ObjectId,
    projectId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("services", ServiceModel);
