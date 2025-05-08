const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const TransactionModel = new Schema(
  {
    userId: Schema.Types.ObjectId,
    amount: Number,
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "payment", "earnings"],
    },
    method: {
      type: String,
      enum: ["bank", "upi", "card", "razorpay", null], // Allow null value in enum
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentId: { type: String, default: null },
    orderId: { type: Schema.Types.ObjectId, default: null },
    description: String,
    details: {
      type: Schema.Types.Mixed, // Flexible schema to store different withdrawal method details
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transactions", TransactionModel);
