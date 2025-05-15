const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const ProjectModel = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: {
      amount: { type: Number, required: true },
      currency: { type: String, default: "INR" },
    },
    deadline: { type: Date },
    skills: [String],
    clientId: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    status: {
      type: String,
      enum: ["open", "assigned", "completed", "cancelled"],
      default: "open",
    },
    assignedFreelancer: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    proposals: [
      {
        freelancerId: { type: Schema.Types.ObjectId, ref: "users" },
        proposal: String,
        bidAmount: {
          amount: { type: Number, required: true },
          currency: { type: String, default: "INR" },
        },
        estimatedTime: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    contractId: { type: String, default: null },
    contractStatus: {
      type: String,
      enum: ["pending", "created", "active", "completed", "disputed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("projects", ProjectModel);
