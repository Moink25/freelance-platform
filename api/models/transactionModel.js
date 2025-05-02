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
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentId: { type: String, default: null },
    orderId: { type: Schema.Types.ObjectId, default: null },
    description: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("transactions", TransactionModel);
