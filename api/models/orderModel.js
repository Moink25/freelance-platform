const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const OrderModel = new Schema(
  {
    clientId: Schema.Types.ObjectId,
    serviceId: Schema.Types.ObjectId,
    status: { type: String, default: "OnGoing" },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    amount: { type: Number, default: 0 },
    transactionId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("orders", OrderModel);
