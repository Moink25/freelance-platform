const UserModel = require("../models/UserModel");
const TransactionModel = require("../models/transactionModel");
const OrderModel = require("../models/orderModel");
const ServiceModel = require("../models/serviceModel");
const { default: mongoose } = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay with your key and secret
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_yourKeyHere";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "yourSecretHere";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.status(200).json({
      balance: user.wallet,
      razorpayAccount: user.razorpayAccount,
      razorpayKeyId: RAZORPAY_KEY_ID, // Include the key ID for the frontend
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const transactions = await TransactionModel.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      transactions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Create Razorpay order for wallet deposit
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    console.log("Creating order with amount:", amount); // Debug log

    // Create a shorter receipt string (max 40 chars)
    const shortUserId = req.userId.toString().slice(-6); // Take last 6 chars of userId
    const timestamp = Date.now().toString().slice(-10); // Take last 10 digits of timestamp
    const receipt = `rcpt_${shortUserId}_${timestamp}`;

    const options = {
      amount: parseInt(amount), // Ensure it's an integer
      currency: "INR",
      receipt: receipt,
      payment_capture: 1,
    };

    console.log("Razorpay options:", options); // Debug log

    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order); // Debug log

    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error); // Debug log
    return res
      .status(500)
      .json({ msg: "Error creating payment order", error: error.message });
  }
};

// Verify and process Razorpay payment for wallet deposit
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    console.log("Verifying payment:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    // Verify the payment signature
    const generated_signature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    console.log("Generated signature:", generated_signature);
    console.log("Received signature:", razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ msg: "Invalid payment signature" });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amountInRupees = payment.amount / 100; // Convert from paise to rupees

    // Update user's wallet balance
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.wallet += amountInRupees;
    await user.save();

    // Create transaction record
    const transaction = new TransactionModel({
      userId: req.userId,
      amount: amountInRupees,
      type: "deposit",
      method: "razorpay", // Add method to avoid validation error
      status: "completed",
      paymentId: razorpay_payment_id,
      description: `Wallet deposit of ₹${amountInRupees}`,
    });
    await transaction.save();

    return res.status(200).json({
      msg: "Payment successful and wallet updated",
      balance: user.wallet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error processing payment" });
  }
};

// Update Razorpay account for withdrawals (freelancers)
const updateAccount = async (req, res) => {
  try {
    const { razorpayAccount } = req.body;

    if (!razorpayAccount) {
      return res.status(400).json({ msg: "Account ID is required" });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.razorpayAccount = razorpayAccount;
    await user.save();

    return res.status(200).json({
      msg: "Account details updated successfully",
      razorpayAccount: user.razorpayAccount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Process withdrawal request
const withdrawMoney = async (req, res) => {
  try {
    const { amount, method, details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    if (!method) {
      return res.status(400).json({ msg: "Withdrawal method is required" });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.wallet < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // Validate details based on the selected withdrawal method
    if (
      method === "bank" &&
      (!details.accountNumber || !details.ifscCode || !details.accountName)
    ) {
      return res
        .status(400)
        .json({ msg: "Complete bank account details are required" });
    } else if (method === "upi" && !details.upiId) {
      return res.status(400).json({ msg: "UPI ID is required" });
    } else if (
      method === "card" &&
      (!details.cardNumber ||
        !details.cardHolderName ||
        !details.expiryMonth ||
        !details.expiryYear)
    ) {
      return res
        .status(400)
        .json({ msg: "Complete card details are required" });
    }

    // Create a withdrawal transaction record (pending status)
    const transaction = new TransactionModel({
      userId: req.userId,
      amount: amount,
      type: "withdrawal",
      method: method,
      status: "pending",
      description: `Withdrawal request of ₹${amount} via ${method}`,
      details: {
        // Store only minimal, necessary information based on method
        ...(method === "bank" && {
          accountName: details.accountName,
          accountNumberLast4: details.accountNumber.slice(-4),
          ifscCode: details.ifscCode,
        }),
        ...(method === "upi" && {
          upiId: details.upiId,
        }),
        ...(method === "card" && {
          cardHolderName: details.cardHolderName,
          cardNumberLast4: details.cardNumber.slice(-4),
          expiryMonth: details.expiryMonth,
          expiryYear: details.expiryYear,
        }),
      },
    });
    await transaction.save();

    // Deduct the amount from user's wallet
    user.wallet -= amount;
    await user.save();

    // In a real implementation, integrate with Razorpay's payout API based on the withdrawal method
    // This would be a multi-step process involving:
    // 1. Fund Account API call to create/validate the destination account
    // 2. Payout API call to transfer the funds

    try {
      // Simulate a Razorpay payout API call
      console.log(
        `Processing withdrawal of ₹${amount} via ${method} for user ${user._id}`
      );

      // For demo purposes, we'll simulate a 2-second payout processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate a successful payout
      const payoutId = `pout_${Math.random().toString(36).substring(2, 10)}`;

      // Update the transaction with payout details
      transaction.status = "completed";
      transaction.paymentId = payoutId;
      await transaction.save();

      console.log(`Withdrawal processed successfully. Payout ID: ${payoutId}`);

      return res.status(200).json({
        msg: "Withdrawal processed successfully",
        balance: user.wallet,
        transaction: {
          id: transaction._id,
          status: transaction.status,
          payoutId: payoutId,
        },
      });
    } catch (payoutError) {
      // If payout fails, refund the money to the user's wallet and mark transaction as failed
      console.error("Payout error:", payoutError);

      user.wallet += amount;
      await user.save();

      transaction.status = "failed";
      transaction.description += ` - Failed: ${
        payoutError.message || "Payout processing error"
      }`;
      await transaction.save();

      return res.status(500).json({
        msg: "Withdrawal failed. Your wallet has been refunded.",
        error: payoutError.message || "Error processing payout",
      });
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    return res.status(500).json({ msg: "Error processing withdrawal" });
  }
};

// Process payment from wallet for an order
const processOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ msg: "Order ID is required" });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.clientId.toString() !== req.userId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (order.paymentStatus === "completed") {
      return res.status(400).json({ msg: "Order already paid" });
    }

    // Get service details for the amount
    const service = await ServiceModel.findById(order.serviceId);
    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    const amount = service.price;

    // Check client's wallet balance
    const client = await UserModel.findById(req.userId);
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    if (client.wallet < amount) {
      return res.status(400).json({ msg: "Insufficient wallet balance" });
    }

    // Find freelancer
    const freelancer = await UserModel.findById(service.userId);
    if (!freelancer) {
      return res.status(404).json({ msg: "Freelancer not found" });
    }

    // Create a transaction record
    const transaction = new TransactionModel({
      userId: req.userId,
      amount: amount,
      type: "payment",
      method: "razorpay", // Specify method
      status: "completed",
      orderId: order._id,
      description: `Payment for order #${order._id}`,
    });
    await transaction.save();

    // Create an earnings transaction for the freelancer
    const freelancerTransaction = new TransactionModel({
      userId: freelancer._id,
      amount: amount,
      type: "earnings",
      method: "razorpay", // Specify method
      status: "completed",
      orderId: order._id,
      description: `Earnings from order #${order._id}`,
    });
    await freelancerTransaction.save();

    // Update order payment status
    order.paymentStatus = "completed";
    order.amount = amount;
    order.transactionId = transaction._id;
    await order.save();

    // Update client's wallet balance
    client.wallet -= amount;
    await client.save();

    // Update freelancer's wallet balance
    freelancer.wallet += amount;
    await freelancer.save();

    return res.status(200).json({
      msg: "Order payment successful",
      balance: client.wallet,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error processing order payment" });
  }
};

module.exports = {
  getWalletBalance,
  getWalletTransactions,
  createOrder,
  verifyPayment,
  updateAccount,
  withdrawMoney,
  processOrderPayment,
};
