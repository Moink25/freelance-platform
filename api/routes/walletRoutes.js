const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const verifyToken = require("../middleware/Auth");

// Apply token verification middleware to all wallet routes
router.use(verifyToken);

// Wallet balance and transactions routes
router.get("/balance", walletController.getWalletBalance);
router.get("/transactions", walletController.getWalletTransactions);

// Deposit routes
router.post("/createOrder", walletController.createOrder);
router.post("/verifyPayment", walletController.verifyPayment);

// Account management and withdrawal routes
router.post("/updateAccount", walletController.updateAccount);
router.post("/withdraw", walletController.withdrawMoney);

// Order payment
router.post("/payOrder", walletController.processOrderPayment);

module.exports = router;
