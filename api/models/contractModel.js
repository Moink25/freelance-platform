const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ContractModel = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "orders", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "services", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["created", "active", "completed", "cancelled", "disputed"],
      default: "created",
    },
    contractAddress: { type: String, default: null },
    transactionHash: { type: String, default: null },
    clientEthereumAddress: { type: String, default: null },
    freelancerEthereumAddress: { type: String, default: null },
    terms: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    activatedDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },
    cancelledDate: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("contracts", ContractModel);
